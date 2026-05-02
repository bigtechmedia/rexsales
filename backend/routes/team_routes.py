"""Team management."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from db import teams, users as users_col
from auth import require_roles
from models import TeamIn, TeamMembersReq

router = APIRouter(prefix='/teams', tags=['teams'])


@router.get('')
async def list_teams(user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep'))):
    cursor = teams.find({}, {'_id': 0}).sort('created_at', -1)
    return [t async for t in cursor]


@router.post('')
async def create_team(payload: TeamIn, user=Depends(require_roles('owner', 'admin'))):
    now = datetime.now(timezone.utc).isoformat()
    team_id = f"team_{uuid.uuid4().hex[:10]}"
    doc = {
        'team_id': team_id,
        'name': payload.name,
        'description': payload.description,
        'manager_id': payload.manager_id,
        'member_ids': payload.member_ids,
        'created_at': now,
        'updated_at': now,
    }
    await teams.insert_one(doc)
    if payload.member_ids:
        await users_col.update_many(
            {'user_id': {'$in': payload.member_ids}},
            {'$addToSet': {'team_ids': team_id}},
        )
    if payload.manager_id:
        await users_col.update_one(
            {'user_id': payload.manager_id},
            {'$addToSet': {'team_ids': team_id}},
        )
    doc.pop('_id', None)
    return doc


@router.patch('/{team_id}')
async def update_team(team_id: str, payload: TeamIn, user=Depends(require_roles('owner', 'admin'))):
    updates = {
        'name': payload.name,
        'description': payload.description,
        'manager_id': payload.manager_id,
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    res = await teams.update_one({'team_id': team_id}, {'$set': updates})
    if res.matched_count == 0:
        raise HTTPException(404, 'Team not found')
    return await teams.find_one({'team_id': team_id}, {'_id': 0})


@router.post('/{team_id}/members')
async def add_members(team_id: str, payload: TeamMembersReq, user=Depends(require_roles('owner', 'admin'))):
    await teams.update_one({'team_id': team_id}, {'$addToSet': {'member_ids': {'$each': payload.member_ids}}, '$set': {'updated_at': datetime.now(timezone.utc).isoformat()}})
    await users_col.update_many({'user_id': {'$in': payload.member_ids}}, {'$addToSet': {'team_ids': team_id}})
    return await teams.find_one({'team_id': team_id}, {'_id': 0})


@router.delete('/{team_id}/members/{user_id}')
async def remove_member(team_id: str, user_id: str, user=Depends(require_roles('owner', 'admin'))):
    await teams.update_one({'team_id': team_id}, {'$pull': {'member_ids': user_id}, '$set': {'updated_at': datetime.now(timezone.utc).isoformat()}})
    await users_col.update_one({'user_id': user_id}, {'$pull': {'team_ids': team_id}})
    return await teams.find_one({'team_id': team_id}, {'_id': 0})


@router.delete('/{team_id}')
async def delete_team(team_id: str, user=Depends(require_roles('owner', 'admin'))):
    res = await teams.delete_one({'team_id': team_id})
    if res.deleted_count == 0:
        raise HTTPException(404, 'Team not found')
    await users_col.update_many({}, {'$pull': {'team_ids': team_id}})
    return {'ok': True}
