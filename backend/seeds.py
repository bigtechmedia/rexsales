"""Seed initial users, teams, territories, products, and a sample dealer for demo/testing."""
import logging
from datetime import datetime, timezone
import uuid

from db import users as users_col, teams, products, dealers, territories
from auth import hash_password

logger = logging.getLogger(__name__)

SEED_PASSWORD = 'Passw0rd!'

SEED_USERS = [
    {'email': 'owner@rexbotanix.com', 'name': 'Rex Botanix Owner', 'role': 'owner', 'area': 'HQ'},
    {'email': 'admin@rexbotanix.com', 'name': 'Aarav Admin', 'role': 'admin', 'area': 'HQ'},
    {'email': 'manager@rexbotanix.com', 'name': 'Meera Manager', 'role': 'manager', 'area': 'North Zone'},
    {'email': 'rep@rexbotanix.com', 'name': 'Rohan Sales Rep', 'role': 'sales_rep', 'area': 'Pune District', 'phone': '+91 98000 11111'},
    {'email': 'rep2@rexbotanix.com', 'name': 'Priya Sales Rep', 'role': 'sales_rep', 'area': 'Nashik District', 'phone': '+91 98000 22222'},
    {'email': 'dealer@rexbotanix.com', 'name': 'Deepak Dealer', 'role': 'dealer', 'area': 'Pune'},
]


async def seed_if_empty():
    count = await users_col.count_documents({})
    if count > 0:
        return
    logger.info('Seeding initial users, team, territory, products, dealer...')
    now = datetime.now(timezone.utc).isoformat()
    created_ids = {}
    for u in SEED_USERS:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        doc = {
            'user_id': user_id,
            'email': u['email'],
            'name': u['name'],
            'role': u['role'],
            'team_ids': [],
            'phone': u.get('phone'),
            'area': u.get('area'),
            'picture': None,
            'oauth_provider': None,
            'oauth_sub': None,
            'password_hash': hash_password(SEED_PASSWORD),
            'created_at': now,
            'updated_at': now,
        }
        await users_col.insert_one(doc)
        created_ids[u['email']] = user_id

    # Team
    team_id = f"team_{uuid.uuid4().hex[:10]}"

    # Territories
    territory_ids = []
    seed_territories = [
        {
            'name': 'Pune District',
            'code': 'MH-PUN',
            'region': 'West',
            'state': 'Maharashtra',
            'districts': ['Pune', 'Pimpri-Chinchwad'],
            'description': 'Grapes, sugarcane & pomegranate belt',
            'center': {'lat': 18.5204, 'lng': 73.8567, 'accuracy_m': None, 'captured_at': None},
            'radius_km': 50,
            'rep_ids': [created_ids['rep@rexbotanix.com']],
        },
        {
            'name': 'Nashik District',
            'code': 'MH-NSK',
            'region': 'West',
            'state': 'Maharashtra',
            'districts': ['Nashik', 'Niphad', 'Dindori'],
            'description': 'Grape & onion belt',
            'center': {'lat': 19.9975, 'lng': 73.7898, 'accuracy_m': None, 'captured_at': None},
            'rep_ids': [created_ids['rep2@rexbotanix.com']],
        },
    ]
    for st in seed_territories:
        tid = f"tty_{uuid.uuid4().hex[:10]}"
        doc = {
            'territory_id': tid,
            **st,
            'team_id': team_id,
            'manager_id': created_ids['manager@rexbotanix.com'],
            'created_at': now,
            'updated_at': now,
        }
        await territories.insert_one(doc)
        territory_ids.append(tid)

    await teams.insert_one({
        'team_id': team_id,
        'name': 'North Zone Field Team',
        'description': 'Demo sales team covering Pune & Nashik districts',
        'manager_id': created_ids['manager@rexbotanix.com'],
        'member_ids': [
            created_ids['rep@rexbotanix.com'],
            created_ids['rep2@rexbotanix.com'],
        ],
        'territory_ids': territory_ids,
        'created_at': now,
        'updated_at': now,
    })
    await users_col.update_many(
        {'user_id': {'$in': [created_ids['rep@rexbotanix.com'], created_ids['rep2@rexbotanix.com'], created_ids['manager@rexbotanix.com']]}},
        {'$set': {'team_ids': [team_id]}},
    )

    sample_products = [
        {'name': 'Rex Grow NPK 19-19-19', 'sku': 'RG-NPK-19', 'category': 'Water Soluble', 'pack_size': '25kg', 'unit': 'Bag', 'mrp': 3200},
        {'name': 'Rex Bio Micro Mix', 'sku': 'RB-MICRO-M', 'category': 'Micronutrient', 'pack_size': '1L', 'unit': 'Bottle', 'mrp': 620},
        {'name': 'Rex Humic Shield', 'sku': 'RH-SHIELD', 'category': 'Biostimulant', 'pack_size': '5kg', 'unit': 'Bag', 'mrp': 2100},
        {'name': 'Rex Sulphur 90', 'sku': 'RS-90', 'category': 'Granular', 'pack_size': '10kg', 'unit': 'Bag', 'mrp': 550},
        {'name': 'Rex Zinc Sulphate 33%', 'sku': 'RZ-33', 'category': 'Micronutrient', 'pack_size': '5kg', 'unit': 'Bag', 'mrp': 480},
    ]
    for p in sample_products:
        await products.insert_one({
            'product_id': f"prod_{uuid.uuid4().hex[:10]}",
            **p,
            'description': None,
            'created_at': now,
            'updated_at': now,
        })

    dealer_user_id = created_ids['dealer@rexbotanix.com']
    await dealers.insert_one({
        'dealer_id': f"dlr_{uuid.uuid4().hex[:10]}",
        'firm_name': "Deepak Krishi Kendra",
        'contact_name': 'Deepak Dealer',
        'phone': '+91 98111 00000',
        'email': 'dealer@rexbotanix.com',
        'gstin': '27ABCDE1234F1Z5',
        'address': 'Market Yard, Pune',
        'city': 'Pune',
        'state': 'Maharashtra',
        'pincode': '411037',
        'crop_types': ['Grapes', 'Pomegranate', 'Sugarcane'],
        'status': 'active',
        'assigned_rep_id': created_ids['rep@rexbotanix.com'],
        'team_id': team_id,
        'territory_id': territory_ids[0],
        'location': {'lat': 18.5018, 'lng': 73.8636, 'accuracy_m': None, 'captured_at': None},
        'user_id': dealer_user_id,
        'created_at': now,
        'updated_at': now,
    })
    logger.info('Seed complete: %d users', len(SEED_USERS))
