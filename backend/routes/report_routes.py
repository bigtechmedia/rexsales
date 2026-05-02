"""Reports (field/farm/dealer visits, enquiries, requirements, area status)."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from db import reports as reports_col, notifications as notif_col, users as users_col, dealers
from auth import require_roles
from models import ReportIn

router = APIRouter(prefix='/reports', tags=['reports'])


def _visible_query(user):
    role = user['role']
    if role in ('owner', 'admin'):
        return {}
    if role == 'manager':
        team_ids = user.get('team_ids', [])
        # Reports by any member of my teams
        return {'$or': [{'author_team_ids': {'$in': team_ids}}, {'author_id': user['user_id']}]}
    if role == 'sales_rep':
        return {'author_id': user['user_id']}
    if role == 'dealer':
        return {'dealer_id': user.get('dealer_id'), 'visible_to_dealer': True}
    return {'_never_match_': True}


@router.get('')
async def list_reports(
    type: Optional[str] = Query(None),
    dealer_id: Optional[str] = Query(None),
    author_id: Optional[str] = Query(None),
    user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer')),
):
    query = _visible_query(user)
    if type:
        query['type'] = type
    if dealer_id:
        query['dealer_id'] = dealer_id
    if author_id:
        query['author_id'] = author_id
    cursor = reports_col.find(query, {'_id': 0}).sort('created_at', -1).limit(500)
    return [r async for r in cursor]


@router.get('/{report_id}')
async def get_report(report_id: str, user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    query = _visible_query(user)
    query['report_id'] = report_id
    doc = await reports_col.find_one(query, {'_id': 0})
    if not doc:
        raise HTTPException(404, 'Report not found')
    return doc


@router.post('')
async def create_report(payload: ReportIn, user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep'))):
    now = datetime.now(timezone.utc).isoformat()
    report_id = f"rep_{uuid.uuid4().hex[:10]}"
    doc = {
        'report_id': report_id,
        **payload.model_dump(),
        'author_id': user['user_id'],
        'author_name': user.get('name'),
        'author_role': user['role'],
        'author_team_ids': user.get('team_ids', []),
        'visible_to_dealer': payload.type in ('sales_requirement', 'sales_enquiry', 'product_enquiry'),
        'created_at': now,
        'updated_at': now,
    }
    await reports_col.insert_one(doc)
    doc.pop('_id', None)

    # Notify manager(s) of the rep
    team_ids = user.get('team_ids', [])
    if team_ids:
        from db import teams
        async for t in teams.find({'team_id': {'$in': team_ids}}, {'_id': 0, 'manager_id': 1}):
            mid = t.get('manager_id')
            if mid and mid != user['user_id']:
                await notif_col.insert_one({
                    'notification_id': f"ntf_{uuid.uuid4().hex[:10]}",
                    'user_id': mid,
                    'type': 'report_submitted',
                    'title': f"New {payload.type.replace('_', ' ')} by {user.get('name')}",
                    'body': payload.title,
                    'link': f"/reports/{report_id}",
                    'read': False,
                    'created_at': now,
                })
    return doc


@router.delete('/{report_id}')
async def delete_report(report_id: str, user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep'))):
    query = _visible_query(user)
    query['report_id'] = report_id
    res = await reports_col.delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(404, 'Report not found or not accessible')
    return {'ok': True}
