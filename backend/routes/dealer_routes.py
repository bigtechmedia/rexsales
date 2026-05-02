"""Dealer management routes."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from db import dealers, users as users_col
from auth import hash_password
from permissions import require_permission
from models import DealerIn
from audit import record as audit_record

router = APIRouter(prefix='/dealers', tags=['dealers'])


def _visible_query(user):
    role = user['role']
    if role in ('owner', 'admin'):
        return {}
    if role == 'manager':
        team_ids = user.get('team_ids', [])
        return {'$or': [{'team_id': {'$in': team_ids}}, {'assigned_rep_id': user['user_id']}]}
    if role == 'sales_rep':
        return {'assigned_rep_id': user['user_id']}
    if role == 'dealer':
        return {'user_id': user['user_id']}
    return {'_never_match_': True}


@router.get('')
async def list_dealers(
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    territory_id: Optional[str] = Query(None),
    user=Depends(require_permission('dealers.read')),
):
    query = _visible_query(user)
    if status:
        query['status'] = status
    if territory_id:
        query['territory_id'] = territory_id
    if q:
        query['$or'] = query.get('$or', []) + [
            {'firm_name': {'$regex': q, '$options': 'i'}},
            {'contact_name': {'$regex': q, '$options': 'i'}},
            {'phone': {'$regex': q}},
            {'city': {'$regex': q, '$options': 'i'}},
        ]
    cursor = dealers.find(query, {'_id': 0}).sort('created_at', -1)
    return [d async for d in cursor]


@router.get('/{dealer_id}')
async def get_dealer(dealer_id: str, user=Depends(require_permission('dealers.read'))):
    query = _visible_query(user)
    query['dealer_id'] = dealer_id
    doc = await dealers.find_one(query, {'_id': 0})
    if not doc:
        raise HTTPException(404, 'Dealer not found')
    return doc


@router.post('')
async def create_dealer(payload: DealerIn, user=Depends(require_permission('dealers.create'))):
    now = datetime.now(timezone.utc).isoformat()
    assigned_rep_id = payload.assigned_rep_id
    if user['role'] == 'sales_rep':
        assigned_rep_id = user['user_id']
    dealer_id = f"dlr_{uuid.uuid4().hex[:10]}"
    linked_user_id = None
    if payload.create_login and payload.email:
        existing = await users_col.find_one({'email': payload.email.lower().strip()})
        if existing:
            linked_user_id = existing['user_id']
        else:
            linked_user_id = f"user_{uuid.uuid4().hex[:12]}"
            await users_col.insert_one({
                'user_id': linked_user_id,
                'email': payload.email.lower().strip(),
                'name': payload.contact_name,
                'role': 'dealer',
                'team_ids': [payload.team_id] if payload.team_id else [],
                'phone': payload.phone,
                'area': payload.city,
                'picture': None,
                'oauth_provider': None,
                'oauth_sub': None,
                'password_hash': hash_password('Passw0rd!'),
                'created_at': now,
                'updated_at': now,
            })
    doc = {
        'dealer_id': dealer_id,
        **payload.model_dump(exclude={'create_login'}),
        'assigned_rep_id': assigned_rep_id,
        'user_id': linked_user_id,
        'created_at': now,
        'updated_at': now,
    }
    await dealers.insert_one(doc)
    doc.pop('_id', None)
    await audit_record(user, 'create', 'dealer', dealer_id, payload.firm_name)
    return doc


@router.patch('/{dealer_id}')
async def update_dealer(dealer_id: str, payload: DealerIn, user=Depends(require_permission('dealers.update'))):
    query = _visible_query(user)
    query['dealer_id'] = dealer_id
    existing = await dealers.find_one(query, {'_id': 0})
    if not existing:
        raise HTTPException(404, 'Dealer not found or not accessible')
    updates = payload.model_dump(exclude={'create_login'})
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await dealers.update_one({'dealer_id': dealer_id}, {'$set': updates})
    await audit_record(user, 'update', 'dealer', dealer_id, payload.firm_name)
    return await dealers.find_one({'dealer_id': dealer_id}, {'_id': 0})


@router.delete('/{dealer_id}')
async def delete_dealer(dealer_id: str, user=Depends(require_permission('dealers.delete'))):
    existing = await dealers.find_one({'dealer_id': dealer_id}, {'_id': 0, 'firm_name': 1})
    res = await dealers.delete_one({'dealer_id': dealer_id})
    if res.deleted_count == 0:
        raise HTTPException(404, 'Dealer not found')
    await audit_record(user, 'delete', 'dealer', dealer_id, (existing or {}).get('firm_name'))
    return {'ok': True}
