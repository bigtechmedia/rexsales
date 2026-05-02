"""SLA (Service Level Agreement) — due dates and overdue detection.

A report can carry a `due_at` ISO datetime (UTC). If the report is not
resolved (i.e., no `resolved_at`) and `now > due_at`, it is considered
overdue.

This module exposes:
- GET /sla/overdue — list overdue reports visible to the user
- POST /sla/sweep — generate notifications for newly-overdue reports (runs on demand and also from background task on app startup)
- POST /reports/{id}/resolve — mark a report as resolved (closes the SLA)
"""
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
import logging

from db import reports as reports_col, notifications as notif_col
from auth import require_roles, get_current_user
from models import ReportStatusUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/sla', tags=['sla'])


def _visible_query(user):
    role = user['role']
    if role in ('owner', 'admin'):
        return {}
    if role == 'manager':
        team_ids = user.get('team_ids', [])
        return {'$or': [{'author_team_ids': {'$in': team_ids}}, {'author_id': user['user_id']}]}
    if role == 'sales_rep':
        return {'author_id': user['user_id']}
    if role == 'dealer':
        return {'dealer_id': user.get('dealer_id'), 'visible_to_dealer': True}
    return {'_never_match_': True}


@router.get('/overdue')
async def overdue(user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    q = _visible_query(user)
    q.update({
        'due_at': {'$ne': None, '$lt': now},
        '$and': [
            {'$or': [{'resolved': {'$exists': False}}, {'resolved': False}]},
        ],
    })
    rows = [r async for r in reports_col.find(q, {'_id': 0, 'attachments': 0}).sort('due_at', 1).limit(500)]
    return rows


@router.get('/upcoming')
async def upcoming(days: int = 7, user=Depends(get_current_user)):
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    soon = (now + timedelta(days=days)).isoformat()
    q = _visible_query(user)
    q.update({
        'due_at': {'$gte': now.isoformat(), '$lte': soon},
        '$or': [{'resolved': {'$exists': False}}, {'resolved': False}],
    })
    rows = [r async for r in reports_col.find(q, {'_id': 0, 'attachments': 0}).sort('due_at', 1).limit(500)]
    return rows


@router.post('/sweep')
async def sweep(user=Depends(require_roles('owner', 'admin', 'manager'))):
    """Send notifications for overdue reports without SLA notification yet."""
    created = await _sweep_overdue_internal()
    return {'notified': created}


async def _sweep_overdue_internal() -> int:
    now_iso = datetime.now(timezone.utc).isoformat()
    created = 0
    async for r in reports_col.find({
        'due_at': {'$ne': None, '$lt': now_iso},
        '$or': [{'resolved': {'$exists': False}}, {'resolved': False}],
        'sla_notified_at': {'$exists': False},
    }, {'_id': 0, 'attachments': 0}):
        # Notify author + their managers
        recipients = {r['author_id']}
        for tid in r.get('author_team_ids') or []:
            from db import teams
            async for t in teams.find({'team_id': tid}, {'_id': 0, 'manager_id': 1}):
                if t.get('manager_id'):
                    recipients.add(t['manager_id'])
        for uid in recipients:
            await notif_col.insert_one({
                'notification_id': f"ntf_{uuid.uuid4().hex[:10]}",
                'user_id': uid,
                'type': 'sla_overdue',
                'title': f"Overdue: {r.get('title')}",
                'body': f"This {(r.get('type') or '').replace('_', ' ')} was due {r.get('due_at')} and is still open.",
                'link': f"/reports/{r['report_id']}",
                'read': False,
                'created_at': now_iso,
            })
            created += 1
        await reports_col.update_one({'report_id': r['report_id']}, {'$set': {'sla_notified_at': now_iso}})
    return created


async def sla_background_loop(interval_seconds: int = 900):
    """Run periodic overdue sweep. Non-blocking; keep interval wide to avoid spam."""
    while True:
        try:
            n = await _sweep_overdue_internal()
            if n:
                logger.info('SLA sweep notified %d recipients', n)
        except Exception as e:
            logger.error('SLA sweep failed: %s', e)
        await asyncio.sleep(interval_seconds)


# Endpoint for marking a report resolved lives here to keep SLA logic together
resolve_router = APIRouter(prefix='/reports', tags=['reports'])


@resolve_router.post('/{report_id}/resolve')
async def resolve_report(report_id: str, payload: ReportStatusUpdate, user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep'))):
    q = _visible_query(user)
    q['report_id'] = report_id
    doc = await reports_col.find_one(q, {'_id': 0})
    if not doc:
        raise HTTPException(404, 'Report not found or not accessible')
    now = datetime.now(timezone.utc).isoformat()
    await reports_col.update_one(
        {'report_id': report_id},
        {'$set': {
            'resolved': payload.resolved,
            'resolved_at': now if payload.resolved else None,
            'resolved_by': user['user_id'] if payload.resolved else None,
            'resolved_by_name': user.get('name') if payload.resolved else None,
            'resolution_note': payload.note,
            'updated_at': now,
        }},
    )
    return await reports_col.find_one({'report_id': report_id}, {'_id': 0})
