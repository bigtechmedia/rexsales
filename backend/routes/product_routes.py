"""Products catalog."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from db import products
from permissions import require_permission
from models import ProductIn
from audit import record as audit_record

router = APIRouter(prefix='/products', tags=['products'])


@router.get('')
async def list_products(user=Depends(require_permission('products.read'))):
    cursor = products.find({}, {'_id': 0}).sort('name', 1)
    return [p async for p in cursor]


@router.post('', status_code=201)
async def create_product(payload: ProductIn, user=Depends(require_permission('products.create'))):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        'product_id': f"prod_{uuid.uuid4().hex[:10]}",
        **payload.model_dump(),
        'created_at': now,
        'updated_at': now,
    }
    await products.insert_one(doc)
    doc.pop('_id', None)
    await audit_record(user, 'create', 'product', doc['product_id'], payload.name)
    return doc


@router.patch('/{product_id}')
async def update_product(product_id: str, payload: ProductIn, user=Depends(require_permission('products.update'))):
    updates = payload.model_dump()
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    res = await products.update_one({'product_id': product_id}, {'$set': updates})
    if res.matched_count == 0:
        raise HTTPException(404, 'Product not found')
    await audit_record(user, 'update', 'product', product_id, payload.name)
    return await products.find_one({'product_id': product_id}, {'_id': 0})


@router.delete('/{product_id}')
async def delete_product(product_id: str, user=Depends(require_permission('products.delete'))):
    existing = await products.find_one({'product_id': product_id}, {'_id': 0, 'name': 1})
    res = await products.delete_one({'product_id': product_id})
    if res.deleted_count == 0:
        raise HTTPException(404, 'Product not found')
    await audit_record(user, 'delete', 'product', product_id, (existing or {}).get('name'))
    return {'ok': True}
