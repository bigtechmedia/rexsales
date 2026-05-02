"""Granular permissions matrix. Admin vs Manager capabilities explicitly split.

Usage:
  user=Depends(require_permission('users.create'))

Row-level visibility is still enforced inside each route (via _visible_query).
This matrix controls WHAT ACTIONS a role can perform; scoping is in-route.
"""
from fastapi import Depends, HTTPException
from auth import get_current_user

PERMISSIONS = {
    # Owner: god mode
    'owner': {'*'},

    # Admin: everything except owner-only things; manages catalog + users + territories
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
    },

    # Manager: approvals + visibility of team + can onboard/update dealers but not delete/create system catalogs
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

    # Sales rep: field reporting & dealer onboarding (scoped)
    'sales_rep': {
        'products.read',
        'territories.read',
        'dealers.create', 'dealers.read', 'dealers.update',
        'reports.create', 'reports.read',
        'exports.reports',
    },

    # Dealer: read-only + enquiry creation
    'dealer': {
        'products.read',
        'territories.read',
        'dealers.read',
        'reports.create', 'reports.read',
    },
}


def has_permission(user: dict, action: str) -> bool:
    if not user:
        return False
    role = user.get('role')
    allowed = PERMISSIONS.get(role, set())
    return '*' in allowed or action in allowed


def require_permission(action: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if not has_permission(user, action):
            raise HTTPException(status_code=403, detail=f"Permission '{action}' denied for role '{user.get('role')}'")
        return user
    return checker
