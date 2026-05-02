"""User management routes."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from db import users as users_col
from auth import require_roles, hash_password
from models import CreateUserReq, UpdateUserReq, ChangePasswordReq

router = APIRouter(prefix='/users', tags=['users'])


def _clean(doc):
    if not doc:
        return doc
    doc.pop('_id', None)
    doc.pop('password_hash', None)
    return doc


@router.get('')
async def list_users(user=Depends(require_roles('owner', 'admin', 'manager'))):
    cursor = users_col.find({}, {'_id': 0, 'password_hash': 0}).sort('created_at', -1)
    return [u async for u in cursor]


@router.post('')
async def create_user(payload: CreateUserReq, user=Depends(require_roles('owner', 'admin'))):
    existing = await users_col.find_one({'email': payload.email.lower().strip()})
    if existing:
        raise HTTPException(400, 'User with this email already exists')
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        'user_id': f"user_{uuid.uuid4().hex[:12]}",
        'email': payload.email.lower().strip(),
        'name': payload.name,
        'role': payload.role,
        'team_ids': payload.team_ids,
        'phone': payload.phone,
        'area': payload.area,
        'picture': None,
        'oauth_provider': None,
        'oauth_sub': None,
        'password_hash': hash_password(payload.password) if payload.password else None,
        'created_at': now,
        'updated_at': now,
    }
    await users_col.insert_one(doc)
    return _clean(doc)


@router.patch('/{user_id}')
async def update_user(user_id: str, payload: UpdateUserReq, user=Depends(require_roles('owner', 'admin'))):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None and k != 'password'}
    if payload.password:
        updates['password_hash'] = hash_password(payload.password)
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    res = await users_col.update_one({'user_id': user_id}, {'$set': updates})
    if res.matched_count == 0:
        raise HTTPException(404, 'User not found')
    doc = await users_col.find_one({'user_id': user_id}, {'_id': 0, 'password_hash': 0})
    return doc


@router.delete('/{user_id}')
async def delete_user(user_id: str, user=Depends(require_roles('owner', 'admin'))):
    if user_id == user['user_id']:
        raise HTTPException(400, 'Cannot delete your own account')
    res = await users_col.delete_one({'user_id': user_id})
    if res.deleted_count == 0:
        raise HTTPException(404, 'User not found')
    return {'ok': True}


@router.post('/me/password')
async def change_my_password(payload: ChangePasswordReq, user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    doc = await users_col.find_one({'user_id': user['user_id']})
    if not doc or not doc.get('password_hash'):
        raise HTTPException(400, 'Password login not enabled for this account')
    from auth import verify_password
    if not verify_password(payload.current_password, doc['password_hash']):
        raise HTTPException(401, 'Current password is incorrect')
    await users_col.update_one(
        {'user_id': user['user_id']},
        {'$set': {'password_hash': hash_password(payload.new_password), 'updated_at': datetime.now(timezone.utc).isoformat()}},
    )
    return {'ok': True}
