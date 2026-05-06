"""Admin-configurable permission scopes (feature flags per role).

Admin can toggle extra permissions per role on top of the baseline matrix.
These additive overrides are stored in the `permission_overrides` collection
under scope='global' and merged at runtime (see permissions.py).
"""
from datetime import datetime, timezone
from typing import Dict, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from db import db as mongo_db
from permissions import BASE_PERMISSIONS, ALL_ACTIONS, require_permission, invalidate_cache, _load_overrides
from audit import record as audit_record

router = APIRouter(prefix='/permissions', tags=['permissions'])


class MatrixIn(BaseModel):
    matrix: Dict[str, List[str]]  # role -> list of extra actions


@router.get('/matrix')
async def get_matrix(user=Depends(require_permission('permissions.manage'))):
    overrides = await _load_overrides()
    base = {role: sorted(acts) for role, acts in BASE_PERMISSIONS.items() if role != 'owner'}
    return {
        'roles': ['admin', 'manager', 'sales_rep', 'dealer'],
        'actions': ALL_ACTIONS,
        'base': base,
        'overrides': {role: sorted(list(acts)) for role, acts in overrides.items()},
    }


@router.put('/matrix')
async def set_matrix(payload: MatrixIn, user=Depends(require_permission('permissions.manage'))):
    # Validate & sanitize
    clean = {}
    for role, acts in payload.matrix.items():
        if role not in BASE_PERMISSIONS:
            continue
        if role == 'owner':
            continue  # owner always has all
        extras = []
        base_set = BASE_PERMISSIONS.get(role, set())
        for a in acts or []:
            if a in ALL_ACTIONS and a not in base_set:
                extras.append(a)
        clean[role] = sorted(set(extras))

    await mongo_db['permission_overrides'].update_one(
        {'scope': 'global'},
        {'$set': {
            'scope': 'global',
            'matrix': clean,
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'updated_by': user['user_id'],
        }},
        upsert=True,
    )
    invalidate_cache()
    await audit_record(user, 'update', 'permissions', 'global', 'Role permissions matrix', clean)
    return {'ok': True, 'overrides': clean}
