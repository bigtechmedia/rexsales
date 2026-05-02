"""WhatsApp-style threads and messages (polling-based)."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from db import threads, messages, notifications as notif_col, users as users_col
from auth import require_roles
from models import ThreadIn, MessageIn

router = APIRouter(prefix='/messaging', tags=['messaging'])


@router.get('/threads')
async def list_threads(user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    query = {'participant_ids': user['user_id']}
    cursor = threads.find(query, {'_id': 0}).sort('last_message_at', -1)
    threads_list = [t async for t in cursor]
    # Attach participant summary (name/role)
    all_uids = list({uid for t in threads_list for uid in t.get('participant_ids', [])})
    user_map = {}
    if all_uids:
        async for u in users_col.find({'user_id': {'$in': all_uids}}, {'_id': 0, 'user_id': 1, 'name': 1, 'role': 1, 'picture': 1}):
            user_map[u['user_id']] = u
    for t in threads_list:
        t['participants'] = [user_map.get(uid, {'user_id': uid}) for uid in t.get('participant_ids', [])]
    return threads_list


@router.post('/threads')
async def create_thread(payload: ThreadIn, user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    participants = list({*payload.participant_ids, user['user_id']})
    if len(participants) < 2:
        raise HTTPException(400, 'Thread needs at least 2 participants')
    # Check if a thread with same participants already exists (simple)
    existing = await threads.find_one({
        'participant_ids': {'$all': participants, '$size': len(participants)},
        'dealer_id': payload.dealer_id,
    }, {'_id': 0})
    if existing:
        return existing
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        'thread_id': f"thr_{uuid.uuid4().hex[:10]}",
        'name': payload.name,
        'participant_ids': participants,
        'dealer_id': payload.dealer_id,
        'topic': payload.topic,
        'last_message': None,
        'last_message_at': now,
        'created_by': user['user_id'],
        'created_at': now,
        'updated_at': now,
    }
    await threads.insert_one(doc)
    doc.pop('_id', None)
    return doc


@router.get('/threads/{thread_id}/messages')
async def list_messages(thread_id: str, after: Optional[str] = Query(None), user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    thread = await threads.find_one({'thread_id': thread_id, 'participant_ids': user['user_id']}, {'_id': 0})
    if not thread:
        raise HTTPException(404, 'Thread not found')
    q = {'thread_id': thread_id}
    if after:
        q['created_at'] = {'$gt': after}
    cursor = messages.find(q, {'_id': 0}).sort('created_at', 1).limit(500)
    return [m async for m in cursor]


@router.post('/messages')
async def send_message(payload: MessageIn, user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    thread = await threads.find_one({'thread_id': payload.thread_id, 'participant_ids': user['user_id']}, {'_id': 0})
    if not thread:
        raise HTTPException(404, 'Thread not found')
    if not payload.text and not payload.attachments:
        raise HTTPException(400, 'Empty message')
    now = datetime.now(timezone.utc).isoformat()
    msg = {
        'message_id': f"msg_{uuid.uuid4().hex[:12]}",
        'thread_id': payload.thread_id,
        'author_id': user['user_id'],
        'author_name': user.get('name'),
        'text': payload.text,
        'attachments': [a.model_dump() for a in payload.attachments],
        'created_at': now,
    }
    await messages.insert_one(msg)
    preview = payload.text or (f"[Attachment: {payload.attachments[0].filename}]" if payload.attachments else '')
    await threads.update_one(
        {'thread_id': payload.thread_id},
        {'$set': {'last_message': preview[:160], 'last_message_at': now, 'updated_at': now}},
    )
    # Notify other participants
    for uid in thread.get('participant_ids', []):
        if uid == user['user_id']:
            continue
        await notif_col.insert_one({
            'notification_id': f"ntf_{uuid.uuid4().hex[:10]}",
            'user_id': uid,
            'type': 'message',
            'title': f"New message from {user.get('name')}",
            'body': preview[:160],
            'link': f"/messages/{payload.thread_id}",
            'read': False,
            'created_at': now,
        })
    msg.pop('_id', None)
    return msg
