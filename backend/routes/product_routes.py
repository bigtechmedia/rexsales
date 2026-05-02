"""Products catalog."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from db import products
from auth import require_roles
from models import ProductIn

router = APIRouter(prefix='/products', tags=['products'])


@router.get('')
async def list_products(user=Depends(require_roles('owner', 'admin', 'manager', 'sales_rep', 'dealer'))):
    cursor = products.find({}, {'_id': 0}).sort('name', 1)
    return [p async for p in cursor]


@router.post('')
async def create_product(payload: ProductIn, user=Depends(require_roles('owner', 'admin'))):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        'product_id': f"prod_{uuid.uuid4().hex[:10]}",
        **payload.model_dump(),
        'created_at': now,
        'updated_at': now,
    }
    await products.insert_one(doc)
    doc.pop('_id', None)
    return doc


@router.patch('/{product_id}')
async def update_product(product_id: str, payload: ProductIn, user=Depends(require_roles('owner', 'admin'))):
    updates = payload.model_dump()
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    res = await products.update_one({'product_id': product_id}, {'$set': updates})
    if res.matched_count == 0:
        raise HTTPException(404, 'Product not found')
    return await products.find_one({'product_id': product_id}, {'_id': 0})


@router.delete('/{product_id}')
async def delete_product(product_id: str, user=Depends(require_roles('owner', 'admin'))):
    res = await products.delete_one({'product_id': product_id})
    if res.deleted_count == 0:
        raise HTTPException(404, 'Product not found')
    return {'ok': True}
