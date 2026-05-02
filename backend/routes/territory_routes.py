"""Territories (regions) CRUD and geo assignment."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from db import territories, users as users_col, teams
from permissions import require_permission
from models import TerritoryIn
from audit import record as audit_record

router = APIRouter(prefix='/territories', tags=['territories'])


@router.get('')
async def list_territories(user=Depends(require_permission('territories.read'))):
    cursor = territories.find({}, {'_id': 0}).sort('name', 1)
    return [t async for t in cursor]


@router.post('', status_code=201)
async def create_territory(payload: TerritoryIn, user=Depends(require_permission('territories.create'))):
    now = datetime.now(timezone.utc).isoformat()
    tid = f"tty_{uuid.uuid4().hex[:10]}"
    doc = {
        'territory_id': tid,
        **payload.model_dump(),
        'created_at': now,
        'updated_at': now,
    }
    await territories.insert_one(doc)
    doc.pop('_id', None)
    await audit_record(user, 'create', 'territory', tid, payload.name)
    return doc


@router.patch('/{territory_id}')
async def update_territory(territory_id: str, payload: TerritoryIn, user=Depends(require_permission('territories.update'))):
    updates = payload.model_dump()
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    res = await territories.update_one({'territory_id': territory_id}, {'$set': updates})
    if res.matched_count == 0:
        raise HTTPException(404, 'Territory not found')
    doc = await territories.find_one({'territory_id': territory_id}, {'_id': 0})
    await audit_record(user, 'update', 'territory', territory_id, payload.name)
    return doc


@router.delete('/{territory_id}')
async def delete_territory(territory_id: str, user=Depends(require_permission('territories.delete'))):
    existing = await territories.find_one({'territory_id': territory_id}, {'_id': 0, 'name': 1})
    res = await territories.delete_one({'territory_id': territory_id})
    if res.deleted_count == 0:
        raise HTTPException(404, 'Territory not found')
    await audit_record(user, 'delete', 'territory', territory_id, (existing or {}).get('name'))
    return {'ok': True}
