"""Notifications."""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone

from db import notifications as notif_col
from auth import require_roles

router = APIRouter(prefix='/notifications', tags=['notifications'])


@router.get('')
async def list_notifications(user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    cursor = notif_col.find({'user_id': user['user_id']}, {'_id': 0}).sort('created_at', -1).limit(100)
    return [n async for n in cursor]


@router.post('/{notification_id}/read')
async def mark_read(notification_id: str, user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    await notif_col.update_one({'notification_id': notification_id, 'user_id': user['user_id']}, {'$set': {'read': True}})
    return {'ok': True}


@router.post('/read-all')
async def mark_all_read(user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    await notif_col.update_many({'user_id': user['user_id'], 'read': False}, {'$set': {'read': True}})
    return {'ok': True}
