"""Audit log viewer."""
from typing import Optional
from fastapi import APIRouter, Depends, Query

from db import audit_log
from permissions import require_permission

router = APIRouter(prefix='/audit', tags=['audit'])


@router.get('')
async def list_audit(
    entity_type: Optional[str] = Query(None),
    actor_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    user=Depends(require_permission('audit.read')),
):
    q = {}
    if entity_type:
        q['entity_type'] = entity_type
    if actor_id:
        q['actor_id'] = actor_id
    if action:
        q['action'] = action
    cursor = audit_log.find(q, {'_id': 0}).sort('created_at', -1).limit(limit)
    return [a async for a in cursor]
