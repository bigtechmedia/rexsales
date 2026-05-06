"""SLA (Service Level Agreement) — due dates, pre-due reminders, overdue detection, escalation.

Escalation model:
  level 0  -> on track
  level 1  -> just overdue (notify author + team manager(s))
  level 2  -> overdue by ≥ 2 days (notify admin + owner as well)
  level 3  -> overdue by ≥ 5 days (critical — flag; repeated reminders)

Pre-due reminder:
  1 day before due, notify author.
"""
import asyncio
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from db import reports as reports_col, notifications as notif_col, teams, users as users_col
from auth import require_roles, get_current_user
from models import ReportStatusUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix='/sla', tags=['sla'])

ESC_THRESHOLDS = [
    # (min_days_overdue, level)
    (5, 3),
    (2, 2),
    (0, 1),
]


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


def _parse_iso(dt) -> Optional[datetime]:
    if not dt:
        return None
    try:
        d = datetime.fromisoformat(str(dt).replace('Z', '+00:00'))
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d
    except Exception:
        return None


def _compute_level(due_at: Optional[datetime], now: datetime) -> int:
    if not due_at:
        return 0
    if now < due_at:
        return 0
    days_over = (now - due_at).total_seconds() / 86400.0
    for threshold, level in ESC_THRESHOLDS:
        if days_over >= threshold:
            return level
    return 0


@router.get('/overdue')
async def overdue(level: Optional[int] = None, user=Depends(get_current_user)):
    now_iso = datetime.now(timezone.utc).isoformat()
    q = _visible_query(user)
    q.update({
        'due_at': {'$ne': None, '$lt': now_iso},
        '$and': [{'$or': [{'resolved': {'$exists': False}}, {'resolved': False}]}],
    })
    if level:
        q['escalation_level'] = {'$gte': level}
    rows = [r async for r in reports_col.find(q, {'_id': 0, 'attachments': 0}).sort('due_at', 1).limit(500)]
    return rows


@router.get('/upcoming')
async def upcoming(days: int = 7, user=Depends(get_current_user)):
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
    """Trigger pre-due reminders + escalation sweep."""
    pre_due = await _sweep_pre_due_internal()
    escalated = await _sweep_escalations_internal()
    return {'pre_due_reminded': pre_due, 'escalated_notifications': escalated}


@router.get('/escalations')
async def escalations(user=Depends(get_current_user)):
    """Return summary counts per escalation level for the current user scope."""
    base = _visible_query(user)
    now_iso = datetime.now(timezone.utc).isoformat()
    base.update({
        'due_at': {'$ne': None, '$lt': now_iso},
        '$or': [{'resolved': {'$exists': False}}, {'resolved': False}],
    })
    out = {'level_1': 0, 'level_2': 0, 'level_3': 0}
    async for r in reports_col.find(base, {'escalation_level': 1}):
        lvl = r.get('escalation_level') or 1
        key = f'level_{min(max(lvl, 1), 3)}'
        out[key] += 1
    return out


async def _notify(user_ids, title, body, link, ntype, created_at):
    for uid in user_ids:
        await notif_col.insert_one({
            'notification_id': f"ntf_{uuid.uuid4().hex[:10]}",
            'user_id': uid,
            'type': ntype,
            'title': title,
            'body': body,
            'link': link,
            'read': False,
            'created_at': created_at,
        })


async def _managers_of(team_ids):
    out = set()
    if not team_ids:
        return out
    async for t in teams.find({'team_id': {'$in': team_ids}}, {'_id': 0, 'manager_id': 1}):
        if t.get('manager_id'):
            out.add(t['manager_id'])
    return out


async def _admins_and_owners():
    out = set()
    async for u in users_col.find({'role': {'$in': ['admin', 'owner']}}, {'_id': 0, 'user_id': 1}):
        out.add(u['user_id'])
    return out


async def _sweep_pre_due_internal() -> int:
    """Remind authors ~24h before due for open reports."""
    now = datetime.now(timezone.utc)
    window_start = now.isoformat()
    window_end = (now + timedelta(hours=24)).isoformat()
    count = 0
    async for r in reports_col.find({
        'due_at': {'$ne': None, '$gte': window_start, '$lte': window_end},
        '$or': [{'resolved': {'$exists': False}}, {'resolved': False}],
        'pre_due_reminded_at': {'$exists': False},
    }, {'_id': 0, 'attachments': 0}):
        await _notify(
            [r['author_id']],
            title=f"Reminder: {r.get('title')} due soon",
            body=f"This {(r.get('type') or '').replace('_', ' ')} is due {r.get('due_at')}",
            link=f"/reports/{r['report_id']}",
            ntype='sla_pre_due',
            created_at=now.isoformat(),
        )
        await reports_col.update_one({'report_id': r['report_id']}, {'$set': {'pre_due_reminded_at': now.isoformat()}})
        count += 1
    return count


async def _sweep_escalations_internal() -> int:
    """Advance escalation_level and notify appropriate audience each time level increases."""
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    created = 0
    async for r in reports_col.find({
        'due_at': {'$ne': None, '$lt': now_iso},
        '$or': [{'resolved': {'$exists': False}}, {'resolved': False}],
    }, {'_id': 0, 'attachments': 0}):
        due = _parse_iso(r.get('due_at'))
        desired = _compute_level(due, now)
        current = r.get('escalation_level') or 0
        if desired <= current:
            continue
        # Build recipients based on the new level
        recipients = {r['author_id']}
        mgrs = await _managers_of(r.get('author_team_ids') or [])
        recipients.update(mgrs)
        if desired >= 2:
            recipients.update(await _admins_and_owners())
        level_label = ['', 'overdue', 'escalated (L2)', 'critical (L3)'][desired]
        await _notify(
            list(recipients),
            title=f"{level_label.title()}: {r.get('title')}",
            body=f"Due {r.get('due_at')}, still open. Please action.",
            link=f"/reports/{r['report_id']}",
            ntype=f'sla_level_{desired}',
            created_at=now_iso,
        )
        await reports_col.update_one({'report_id': r['report_id']}, {'$set': {
            'escalation_level': desired,
            'last_escalated_at': now_iso,
        }})
        created += len(recipients)
    return created


async def sla_background_loop(interval_seconds: int = 900):
    while True:
        try:
            p = await _sweep_pre_due_internal()
            e = await _sweep_escalations_internal()
            if p or e:
                logger.info('SLA sweep: pre_due=%d, escalated_notifications=%d', p, e)
        except Exception as ex:
            logger.error('SLA sweep failed: %s', ex)
        await asyncio.sleep(interval_seconds)


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
            'escalation_level': 0 if payload.resolved else doc.get('escalation_level', 0),
            'updated_at': now,
        }},
    )
    return await reports_col.find_one({'report_id': report_id}, {'_id': 0})
