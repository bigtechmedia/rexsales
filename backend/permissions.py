"""Granular permissions matrix + configurable per-role overrides.

Admins can toggle extra permissions per role via /api/permissions endpoint;
these are OR-ed with the baseline matrix. A simple TTL cache avoids hitting
Mongo on every dependency check.
"""
import time
from typing import Dict, Set
from fastapi import Depends, HTTPException
from auth import get_current_user

BASE_PERMISSIONS: Dict[str, Set[str]] = {
    'owner': {'*'},
    'admin': {
        'users.create', 'users.read', 'users.update', 'users.delete',
        'teams.create', 'teams.read', 'teams.update', 'teams.delete',
        'products.create', 'products.read', 'products.update', 'products.delete',
        'territories.create', 'territories.read', 'territories.update', 'territories.delete',
        'dealers.create', 'dealers.read', 'dealers.update', 'dealers.delete',
        'reports.create', 'reports.read', 'reports.delete',
        'requests.approve',
        'audit.read',
        'exports.reports', 'exports.requests', 'exports.dashboard',
        'notifications.read.all',
        'permissions.manage',
    },
    'manager': {
        'users.read',
        'teams.read',
        'products.read',
        'territories.read',
        'dealers.create', 'dealers.read', 'dealers.update',
        'reports.create', 'reports.read',
        'requests.approve',
        'exports.reports', 'exports.requests',
    },
    'sales_rep': {
        'products.read',
        'territories.read',
        'dealers.create', 'dealers.read', 'dealers.update',
        'reports.create', 'reports.read',
        'exports.reports',
    },
    'dealer': {
        'products.read',
        'territories.read',
        'dealers.read',
        'reports.create', 'reports.read',
    },
}

# All known granular actions (used by the admin UI to present toggles).
ALL_ACTIONS = sorted({
    'users.create', 'users.read', 'users.update', 'users.delete',
    'teams.create', 'teams.read', 'teams.update', 'teams.delete',
    'products.create', 'products.read', 'products.update', 'products.delete',
    'territories.create', 'territories.read', 'territories.update', 'territories.delete',
    'dealers.create', 'dealers.read', 'dealers.update', 'dealers.delete',
    'reports.create', 'reports.read', 'reports.delete',
    'requests.approve',
    'audit.read',
    'exports.reports', 'exports.requests', 'exports.dashboard',
    'notifications.read.all',
    'permissions.manage',
})

_cache = {'value': None, 'expires_at': 0}
_CACHE_TTL = 15.0  # seconds


async def _load_overrides() -> Dict[str, Set[str]]:
    # Imported here to avoid import loops at module load time.
    from db import db as _db
    doc = await _db['permission_overrides'].find_one({'scope': 'global'}, {'_id': 0})
    overrides = {}
    if doc and isinstance(doc.get('matrix'), dict):
        for role, acts in doc['matrix'].items():
            try:
                overrides[role] = set(acts or [])
            except TypeError:
                overrides[role] = set()
    return overrides


async def _get_effective_matrix() -> Dict[str, Set[str]]:
    now = time.time()
    if _cache['value'] is not None and _cache['expires_at'] > now:
        return _cache['value']
    overrides = await _load_overrides()
    effective = {r: set(a) for r, a in BASE_PERMISSIONS.items()}
    for role, extra in overrides.items():
        if role not in effective:
            continue
        if '*' in effective[role]:
            continue
        effective[role] |= extra
    _cache['value'] = effective
    _cache['expires_at'] = now + _CACHE_TTL
    return effective


def invalidate_cache():
    _cache['value'] = None
    _cache['expires_at'] = 0


async def has_permission_async(user: dict, action: str) -> bool:
    if not user:
        return False
    role = user.get('role')
    matrix = await _get_effective_matrix()
    allowed = matrix.get(role, set())
    return '*' in allowed or action in allowed


def has_permission(user: dict, action: str) -> bool:
    """Sync variant (uses the currently cached matrix, falling back to base).
    Prefer this in route code paths that already passed through require_permission;
    it will have been primed there.
    """
    if not user:
        return False
    role = user.get('role')
    if _cache['value'] is not None and _cache['expires_at'] > time.time():
        allowed = _cache['value'].get(role, set())
    else:
        allowed = BASE_PERMISSIONS.get(role, set())
    return '*' in allowed or action in allowed


def require_permission(action: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        ok = await has_permission_async(user, action)
        if not ok:
            raise HTTPException(status_code=403, detail=f"Permission '{action}' denied for role '{user.get('role')}'")
        return user
    return checker


# Keep a backwards-compat alias
PERMISSIONS = BASE_PERMISSIONS
