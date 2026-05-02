"""Authentication + /me + logout routes."""
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from datetime import datetime, timezone

from models import LoginReq, OAuthReq, UserOut
from auth import (
    verify_password,
    create_session,
    revoke_session,
    set_session_cookie,
    clear_session_cookie,
    get_current_user,
    exchange_emergent_session,
    upsert_user_from_oauth,
)
from db import users as users_col

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/login')
async def login(payload: LoginReq, response: Response):
    user = await users_col.find_one({'email': payload.email.lower().strip()})
    if not user or not user.get('password_hash'):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    if not verify_password(payload.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    session = await create_session(user['user_id'])
    set_session_cookie(response, session['session_token'])
    user.pop('_id', None)
    user.pop('password_hash', None)
    return {'session_token': session['session_token'], 'user': user}


@router.post('/google/session')
async def google_session(payload: OAuthReq, response: Response):
    data = exchange_emergent_session(payload.session_id)
    user = await upsert_user_from_oauth(data)
    # Use Emergent's token as our session_token directly (stored in our sessions coll)
    from db import user_sessions
    from datetime import timedelta
    token = data['session_token']
    # Idempotent upsert
    await user_sessions.update_one(
        {'session_token': token},
        {'$set': {
            'session_token': token,
            'user_id': user['user_id'],
            'expires_at': datetime.now(timezone.utc) + timedelta(days=7),
            'created_at': datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    set_session_cookie(response, token)
    return {'session_token': token, 'user': user}


@router.get('/me')
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post('/logout')
async def logout(request: Request, response: Response):
    token = request.cookies.get('session_token')
    if not token:
        auth = request.headers.get('Authorization') or ''
        if auth.lower().startswith('bearer '):
            token = auth.split(' ', 1)[1].strip()
    if token:
        await revoke_session(token)
    clear_session_cookie(response)
    return {'ok': True}
