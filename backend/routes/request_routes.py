"""Requests & approvals: expense, leave, travel."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from db import requests_col, notifications as notif_col, users as users_col, teams
from auth import require_roles
from models import RequestIn, ApprovalAction

router = APIRouter(prefix='/requests', tags=['requests'])


def _visible_query(user):
    role = user['role']
    if role in ('owner', 'admin'):
        return {}
    if role == 'manager':
        team_ids = user.get('team_ids', [])
        return {'$or': [{'author_team_ids': {'$in': team_ids}}, {'author_id': user['user_id']}]}
    # reps/dealers: own requests only
    return {'author_id': user['user_id']}


@router.get('')
async def list_requests(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    scope: Optional[str] = Query(None, description="'mine' | 'team' | 'all'"),
    user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer')),
):
    if scope == 'mine':
        query = {'author_id': user['user_id']}
    else:
        query = _visible_query(user)
    if type:
        query['type'] = type
    if status:
        query['status'] = status
    cursor = requests_col.find(query, {'_id': 0}).sort('created_at', -1).limit(500)
    return [r async for r in cursor]


@router.post('')
async def create_request(payload: RequestIn, user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        'request_id': f"req_{uuid.uuid4().hex[:10]}",
        **payload.model_dump(),
        'author_id': user['user_id'],
        'author_name': user.get('name'),
        'author_role': user['role'],
        'author_team_ids': user.get('team_ids', []),
        'status': 'pending',
        'approver_id': None,
        'approver_name': None,
        'approver_note': None,
        'approved_at': None,
        'created_at': now,
        'updated_at': now,
    }
    await requests_col.insert_one(doc)
    doc.pop('_id', None)

    # Notify managers of all teams rep belongs to
    team_ids = user.get('team_ids', [])
    if team_ids:
        async for t in teams.find({'team_id': {'$in': team_ids}}, {'_id': 0, 'manager_id': 1}):
            mid = t.get('manager_id')
            if mid and mid != user['user_id']:
                await notif_col.insert_one({
                    'notification_id': f"ntf_{uuid.uuid4().hex[:10]}",
                    'user_id': mid,
                    'type': 'request_submitted',
                    'title': f"New {payload.type} request from {user.get('name')}",
                    'body': payload.title,
                    'link': f"/approvals",
                    'read': False,
                    'created_at': now,
                })
    # Notify admins too
    async for admin_user in users_col.find({'role': {'$in': ['admin', 'owner']}}, {'_id': 0, 'user_id': 1}):
        await notif_col.insert_one({
            'notification_id': f"ntf_{uuid.uuid4().hex[:10]}",
            'user_id': admin_user['user_id'],
            'type': 'request_submitted',
            'title': f"New {payload.type} request from {user.get('name')}",
            'body': payload.title,
            'link': f"/approvals",
            'read': False,
            'created_at': now,
        })
    return doc


@router.post('/{request_id}/action')
async def act_on_request(request_id: str, payload: ApprovalAction, user=Depends(require_roles('owner', 'admin', 'manager'))):
    doc = await requests_col.find_one({'request_id': request_id}, {'_id': 0})
    if not doc:
        raise HTTPException(404, 'Request not found')
    if user['role'] == 'manager':
        # Manager can act only for their team members
        user_team_ids = set(user.get('team_ids', []))
        author_team_ids = set(doc.get('author_team_ids', []))
        if not (user_team_ids & author_team_ids):
            raise HTTPException(403, 'You cannot approve requests outside your teams')
    now = datetime.now(timezone.utc).isoformat()
    new_status = 'approved' if payload.action == 'approve' else 'rejected'
    await requests_col.update_one(
        {'request_id': request_id},
        {'$set': {
            'status': new_status,
            'approver_id': user['user_id'],
            'approver_name': user.get('name'),
            'approver_note': payload.note,
            'approved_at': now,
            'updated_at': now,
        }},
    )
    # Notify author
    await notif_col.insert_one({
        'notification_id': f"ntf_{uuid.uuid4().hex[:10]}",
        'user_id': doc['author_id'],
        'type': 'request_status',
        'title': f"Your {doc['type']} request was {new_status}",
        'body': doc['title'],
        'link': '/requests',
        'read': False,
        'created_at': now,
    })
    return await requests_col.find_one({'request_id': request_id}, {'_id': 0})
