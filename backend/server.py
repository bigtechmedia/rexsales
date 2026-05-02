"""Rex Botanix CRM — FastAPI entrypoint."""
import os
import asyncio
import logging
import sys
from pathlib import Path
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
sys.path.insert(0, str(ROOT_DIR))

from db import ensure_indexes, get_client  # noqa: E402
from seeds import seed_if_empty  # noqa: E402

from routes.auth_routes import router as auth_router  # noqa: E402
from routes.user_routes import router as user_router  # noqa: E402
from routes.team_routes import router as team_router  # noqa: E402
from routes.product_routes import router as product_router  # noqa: E402
from routes.dealer_routes import router as dealer_router  # noqa: E402
from routes.report_routes import router as report_router  # noqa: E402
from routes.request_routes import router as request_router  # noqa: E402
from routes.messaging_routes import router as messaging_router  # noqa: E402
from routes.notification_routes import router as notification_router  # noqa: E402
from routes.dashboard_routes import router as dashboard_router  # noqa: E402
from routes.territory_routes import router as territory_router  # noqa: E402
from routes.audit_routes import router as audit_router  # noqa: E402
from routes.export_routes import router as export_router  # noqa: E402
from routes.sla_routes import router as sla_router, resolve_router, sla_background_loop  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

app = FastAPI(title='Rex Botanix CRM', version='1.1.0')

api_router = APIRouter(prefix='/api')


@api_router.get('/')
async def root():
    return {'app': 'Rex Botanix CRM', 'status': 'ok', 'version': '1.1.0'}


@api_router.get('/health')
async def health():
    return {'ok': True}


api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(team_router)
api_router.include_router(product_router)
api_router.include_router(dealer_router)
api_router.include_router(report_router)
api_router.include_router(resolve_router)  # /reports/{id}/resolve
api_router.include_router(request_router)
api_router.include_router(messaging_router)
api_router.include_router(notification_router)
api_router.include_router(dashboard_router)
api_router.include_router(territory_router)
api_router.include_router(audit_router)
api_router.include_router(export_router)
api_router.include_router(sla_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=['*'],
    allow_headers=['*'],
)


_sla_task = None


@app.on_event('startup')
async def _startup():
    try:
        await ensure_indexes()
    except Exception as e:
        logger.error('ensure_indexes failed: %s', e)
    try:
        await seed_if_empty()
    except Exception as e:
        logger.error('seed_if_empty failed: %s', e)
    # Kick off SLA sweep loop (every 15 min)
    global _sla_task
    try:
        _sla_task = asyncio.create_task(sla_background_loop(900))
    except Exception as e:
        logger.error('failed to start sla loop: %s', e)


@app.on_event('shutdown')
async def _shutdown():
    global _sla_task
    if _sla_task:
        _sla_task.cancel()
    get_client().close()
