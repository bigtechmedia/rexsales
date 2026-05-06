"""Map data endpoint: territories (with radius fences), dealers (pins), and report pins.
Also exposes a violations list of dealers/reports outside their assigned territory fence.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query

from db import territories, dealers, reports as reports_col
from auth import get_current_user
from geo import is_within_fence, distance_to_fence_km

router = APIRouter(prefix='/map', tags=['map'])


def _dealer_visible_query(user):
    role = user['role']
    if role in ('owner', 'admin'):
        return {}
    if role == 'manager':
        team_ids = user.get('team_ids', [])
        return {'$or': [{'team_id': {'$in': team_ids}}, {'assigned_rep_id': user['user_id']}]}
    if role == 'sales_rep':
        return {'assigned_rep_id': user['user_id']}
    if role == 'dealer':
        return {'user_id': user['user_id']}
    return {'_never_match_': True}


def _report_visible_query(user):
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


@router.get('/data')
async def map_data(
    include: str = Query('territories,dealers,reports', description='comma separated'),
    report_type: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    parts = {p.strip() for p in include.split(',') if p.strip()}
    out = {}

    if 'territories' in parts:
        out['territories'] = [t async for t in territories.find({}, {'_id': 0}).sort('name', 1)]
    if 'dealers' in parts:
        dq = _dealer_visible_query(user)
        out['dealers'] = [d async for d in dealers.find(dq, {'_id': 0}).limit(2000)]
    if 'reports' in parts:
        rq = _report_visible_query(user)
        rq['geo'] = {'$ne': None}
        if report_type:
            rq['type'] = report_type
        out['reports'] = [r async for r in reports_col.find(rq, {'_id': 0, 'attachments': 0}).sort('created_at', -1).limit(2000)]
    return out


@router.get('/violations')
async def geo_fence_violations(user=Depends(get_current_user)):
    """Return dealers and reports located OUTSIDE their assigned territory fence.
    Requires the territory to have a center and radius_km > 0 for a check to be performed.
    """
    tmap = {t['territory_id']: t async for t in territories.find({}, {'_id': 0})}

    dealer_q = _dealer_visible_query(user)
    report_q = _report_visible_query(user)
    report_q['geo'] = {'$ne': None}

    dealer_violations = []
    async for d in dealers.find(dealer_q, {'_id': 0}).limit(2000):
        tid = d.get('territory_id')
        loc = d.get('location')
        if not tid or not loc:
            continue
        t = tmap.get(tid)
        if not t:
            continue
        inside = is_within_fence(loc, t.get('center'), t.get('radius_km'))
        if inside is False:
            dealer_violations.append({
                'dealer_id': d['dealer_id'],
                'firm_name': d.get('firm_name'),
                'territory_id': tid,
                'territory_name': t.get('name'),
                'distance_km': distance_to_fence_km(loc, t.get('center')),
                'radius_km': t.get('radius_km'),
                'location': loc,
            })

    report_violations = []
    async for r in reports_col.find(report_q, {'_id': 0, 'attachments': 0}).limit(2000):
        tid = r.get('territory_id')
        geo = r.get('geo')
        if not tid or not geo:
            continue
        t = tmap.get(tid)
        if not t:
            continue
        inside = is_within_fence(geo, t.get('center'), t.get('radius_km'))
        if inside is False:
            report_violations.append({
                'report_id': r['report_id'],
                'title': r.get('title'),
                'type': r.get('type'),
                'author_name': r.get('author_name'),
                'territory_id': tid,
                'territory_name': t.get('name'),
                'distance_km': distance_to_fence_km(geo, t.get('center')),
                'radius_km': t.get('radius_km'),
                'geo': geo,
            })
    return {
        'dealer_violations': dealer_violations,
        'report_violations': report_violations,
    }
