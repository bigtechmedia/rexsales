"""Audit log helper — records who did what and when."""
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from db import audit_log


async def record(
    actor: dict,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    entity_label: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    try:
        await audit_log.insert_one({
            'audit_id': f"aud_{uuid.uuid4().hex[:12]}",
            'actor_id': actor.get('user_id') if actor else None,
            'actor_name': actor.get('name') if actor else None,
            'actor_role': actor.get('role') if actor else None,
            'action': action,  # e.g., 'create', 'update', 'delete', 'approve', 'reject', 'login'
            'entity_type': entity_type,  # 'user', 'team', 'dealer', 'product', 'report', 'request', 'territory'
            'entity_id': entity_id,
            'entity_label': entity_label,
            'metadata': metadata or {},
            'created_at': datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        # never fail the main request due to audit issues
        pass
