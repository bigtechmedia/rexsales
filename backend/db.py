"""MongoDB connection and shared collections."""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
_client = AsyncIOMotorClient(mongo_url)
db = _client[os.environ['DB_NAME']]

# Collections
users = db.users
user_sessions = db.user_sessions
teams = db.teams
dealers = db.dealers
products = db.products
reports = db.reports
requests_col = db.requests
threads = db.threads
messages = db.messages
notifications = db.notifications
territories = db.territories
audit_log = db.audit_log


async def ensure_indexes():
    await users.create_index('email', unique=True)
    await users.create_index('user_id', unique=True)
    await user_sessions.create_index('session_token', unique=True)
    await user_sessions.create_index('expires_at')
    await teams.create_index('team_id', unique=True)
    await dealers.create_index('dealer_id', unique=True)
    await products.create_index('product_id', unique=True)
    await reports.create_index('report_id', unique=True)
    await reports.create_index([('type', 1), ('created_at', -1)])
    await reports.create_index('author_id')
    await reports.create_index('dealer_id')
    await reports.create_index('due_at')
    await reports.create_index('territory_id')
    await requests_col.create_index('request_id', unique=True)
    await requests_col.create_index([('status', 1), ('created_at', -1)])
    await threads.create_index('thread_id', unique=True)
    await threads.create_index('last_message_at')
    await messages.create_index([('thread_id', 1), ('created_at', 1)])
    await notifications.create_index([('user_id', 1), ('created_at', -1)])
    await territories.create_index('territory_id', unique=True)
    await audit_log.create_index([('created_at', -1)])
    await audit_log.create_index('actor_id')
    await audit_log.create_index('entity_type')


def get_client():
    return _client
