"""Dashboard analytics for all roles."""
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends, Query

from db import reports as reports_col, requests_col, dealers, users as users_col, teams, messages
from auth import get_current_user

router = APIRouter(prefix='/dashboard', tags=['dashboard'])


def _start_of(days_ago: int):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


def _iso_days_series(days: int):
    today = datetime.now(timezone.utc).date()
    return [(today - timedelta(days=i)).isoformat() for i in range(days - 1, -1, -1)]


async def _visible_author_ids(user):
    role = user['role']
    if role in ('owner', 'admin'):
        return None  # all
    if role == 'manager':
        team_ids = user.get('team_ids', [])
        ids = set()
        async for t in teams.find({'team_id': {'$in': team_ids}}, {'_id': 0, 'member_ids': 1, 'manager_id': 1}):
            for m in t.get('member_ids', []):
                ids.add(m)
            if t.get('manager_id'):
                ids.add(t['manager_id'])
        ids.add(user['user_id'])
        return list(ids)
    return [user['user_id']]


@router.get('/summary')
async def summary(days: int = Query(30, ge=1, le=365), user=Depends(get_current_user)):
    role = user['role']
    author_ids = await _visible_author_ids(user)
    base_q = {} if author_ids is None else {'author_id': {'$in': author_ids}}
    since = _start_of(days)

    # KPIs
    total_reports = await reports_col.count_documents({**base_q, 'created_at': {'$gte': since}})
    total_visits = await reports_col.count_documents({**base_q, 'created_at': {'$gte': since}, 'type': {'$in': ['farm_visit', 'dealer_visit', 'field_report']}})
    total_enquiries = await reports_col.count_documents({**base_q, 'created_at': {'$gte': since}, 'type': {'$in': ['sales_enquiry', 'product_enquiry']}})
    pending_reqs = await requests_col.count_documents({**base_q, 'status': 'pending'})

    # Dealer counts (visibility)
    dealer_q = {}
    if role == 'sales_rep':
        dealer_q = {'assigned_rep_id': user['user_id']}
    elif role == 'manager':
        dealer_q = {'team_id': {'$in': user.get('team_ids', [])}}
    elif role == 'dealer':
        dealer_q = {'user_id': user['user_id']}
    active_dealers = await dealers.count_documents({**dealer_q, 'status': 'active'})
    total_dealers = await dealers.count_documents(dealer_q)

    # Amount sum (sales requirements + approved expense)
    amount_pipeline = [
        {'$match': {**base_q, 'created_at': {'$gte': since}, 'amount': {'$ne': None}}},
        {'$group': {'_id': None, 'sum': {'$sum': '$amount'}}},
    ]
    sum_doc = await reports_col.aggregate(amount_pipeline).to_list(1)
    total_amount = sum_doc[0]['sum'] if sum_doc else 0

    # Trend: reports per day over last N days
    series_days = _iso_days_series(min(days, 14))
    trend = []
    per_day = defaultdict(lambda: {'reports': 0, 'visits': 0, 'enquiries': 0})
    async for r in reports_col.find({**base_q, 'created_at': {'$gte': series_days[0] + 'T00:00:00+00:00'}}, {'created_at': 1, 'type': 1}):
        d = r['created_at'][:10]
        per_day[d]['reports'] += 1
        if r.get('type') in ('farm_visit', 'dealer_visit', 'field_report'):
            per_day[d]['visits'] += 1
        if r.get('type') in ('sales_enquiry', 'product_enquiry'):
            per_day[d]['enquiries'] += 1
    for d in series_days:
        item = per_day.get(d, {'reports': 0, 'visits': 0, 'enquiries': 0})
        trend.append({'date': d, **item})

    # Report type breakdown
    types_breakdown = []
    pipeline = [
        {'$match': {**base_q, 'created_at': {'$gte': since}}},
        {'$group': {'_id': '$type', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}},
    ]
    async for t in reports_col.aggregate(pipeline):
        types_breakdown.append({'type': t['_id'], 'count': t['count']})

    # Top reps (by report count) — only owner/admin/manager see this
    top_reps = []
    if role in ('owner', 'admin', 'manager'):
        rpipe = [
            {'$match': {**base_q, 'created_at': {'$gte': since}}},
            {'$group': {'_id': {'author_id': '$author_id', 'author_name': '$author_name'}, 'count': {'$sum': 1}, 'amount': {'$sum': {'$ifNull': ['$amount', 0]}}}},
            {'$sort': {'count': -1}},
            {'$limit': 10},
        ]
        async for t in reports_col.aggregate(rpipe):
            top_reps.append({
                'author_id': t['_id'].get('author_id'),
                'name': t['_id'].get('author_name'),
                'reports': t['count'],
                'amount': t['amount'],
            })

    # Team breakdown (owner/admin only)
    team_breakdown = []
    if role in ('owner', 'admin'):
        async for team in teams.find({}, {'_id': 0}):
            cnt = await reports_col.count_documents({'author_team_ids': team['team_id'], 'created_at': {'$gte': since}})
            amt_doc = await reports_col.aggregate([
                {'$match': {'author_team_ids': team['team_id'], 'created_at': {'$gte': since}, 'amount': {'$ne': None}}},
                {'$group': {'_id': None, 'sum': {'$sum': '$amount'}}},
            ]).to_list(1)
            team_breakdown.append({
                'team_id': team['team_id'],
                'name': team['name'],
                'reports': cnt,
                'amount': amt_doc[0]['sum'] if amt_doc else 0,
            })

    # Recent activity
    recent = []
    async for r in reports_col.find(base_q, {'_id': 0}).sort('created_at', -1).limit(10):
        recent.append({
            'type': r.get('type'),
            'title': r.get('title'),
            'author_name': r.get('author_name'),
            'created_at': r.get('created_at'),
            'report_id': r.get('report_id'),
            'amount': r.get('amount'),
            'dealer_id': r.get('dealer_id'),
        })

    return {
        'role': role,
        'range_days': days,
        'kpis': {
            'total_reports': total_reports,
            'total_visits': total_visits,
            'total_enquiries': total_enquiries,
            'pending_requests': pending_reqs,
            'active_dealers': active_dealers,
            'total_dealers': total_dealers,
            'total_amount': total_amount,
        },
        'trend': trend,
        'types_breakdown': types_breakdown,
        'top_reps': top_reps,
        'team_breakdown': team_breakdown,
        'recent': recent,
    }
