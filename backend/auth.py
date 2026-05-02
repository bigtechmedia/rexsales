"""Authentication: email/password (bcrypt), Emergent Google OAuth, session tokens stored in Mongo.
Supports BOTH cookie-based (session_token cookie) and Bearer header auth.
"""
import os
import uuid
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import bcrypt
import requests
from fastapi import Depends, HTTPException, Request, Response, status

from db import users as users_col, user_sessions

logger = logging.getLogger(__name__)

SESSION_DAYS = 7
ROLES = ('owner', 'admin', 'manager', 'sales_rep', 'dealer')


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=10)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


async def create_session(user_id: str) -> dict:
    token = new_session_token()
    doc = {
        'session_token': token,
        'user_id': user_id,
        'expires_at': datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS),
        'created_at': datetime.now(timezone.utc),
    }
    await user_sessions.insert_one(doc)
    return doc


async def revoke_session(token: str):
    await user_sessions.delete_one({'session_token': token})


async def resolve_user_from_token(token: str) -> Optional[dict]:
    session = await user_sessions.find_one({'session_token': token}, {'_id': 0})
    if not session:
        return None
    exp = session.get('expires_at')
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        await user_sessions.delete_one({'session_token': token})
        return None
    user = await users_col.find_one({'user_id': session['user_id']}, {'_id': 0, 'password_hash': 0})
    return user


def _extract_token(request: Request) -> Optional[str]:
    # Prefer cookie for browser flows
    token = request.cookies.get('session_token')
    if token:
        return token
    auth = request.headers.get('Authorization') or request.headers.get('authorization')
    if auth and auth.lower().startswith('bearer '):
        return auth.split(' ', 1)[1].strip()
    return None


async def get_current_user(request: Request) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    user = await resolve_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid or expired session')
    return user


def require_roles(*allowed: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get('role') not in allowed:
            raise HTTPException(status_code=403, detail=f"Role '{user.get('role')}' not allowed")
        return user
    return checker


def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        key='session_token',
        value=token,
        httponly=True,
        secure=True,
        samesite='none',
        path='/',
        max_age=SESSION_DAYS * 24 * 3600,
    )


def clear_session_cookie(response: Response):
    response.delete_cookie('session_token', path='/')


# ------------------------ Emergent Google OAuth ------------------------
EMERGENT_SESSION_URL = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data'


def exchange_emergent_session(session_id: str) -> dict:
    """Call Emergent Auth with session_id and get user info + session_token."""
    resp = requests.get(EMERGENT_SESSION_URL, headers={'X-Session-ID': session_id}, timeout=15)
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail='Invalid OAuth session_id')
    data = resp.json()
    required = ('id', 'email', 'name', 'session_token')
    if not all(k in data for k in required):
        raise HTTPException(status_code=500, detail='Incomplete OAuth response')
    return data


async def upsert_user_from_oauth(data: dict, default_role: str = 'sales_rep') -> dict:
    existing = await users_col.find_one({'email': data['email']}, {'_id': 0})
    if existing:
        # Update minor fields
        await users_col.update_one(
            {'user_id': existing['user_id']},
            {'$set': {
                'name': data.get('name') or existing.get('name'),
                'picture': data.get('picture') or existing.get('picture'),
                'oauth_provider': 'google',
                'oauth_sub': data.get('id'),
                'updated_at': datetime.now(timezone.utc).isoformat(),
            }},
        )
        user = await users_col.find_one({'user_id': existing['user_id']}, {'_id': 0, 'password_hash': 0})
        return user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        'user_id': user_id,
        'email': data['email'],
        'name': data.get('name') or data['email'].split('@')[0],
        'picture': data.get('picture'),
        'role': default_role,
        'team_ids': [],
        'phone': None,
        'area': None,
        'oauth_provider': 'google',
        'oauth_sub': data.get('id'),
        'password_hash': None,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await users_col.insert_one(doc)
    user = {k: v for k, v in doc.items() if k != 'password_hash'}
    return user
