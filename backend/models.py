"""Shared Pydantic models (v2 — extended with territories, geo, due_at)."""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal, Any, Dict
from datetime import datetime, timezone
import uuid


def _uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


Role = Literal['owner', 'admin', 'manager', 'sales_rep', 'dealer']


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class OAuthReq(BaseModel):
    session_id: str


class GeoPoint(BaseModel):
    lat: float
    lng: float
    accuracy_m: Optional[float] = None
    captured_at: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(extra='ignore')
    user_id: str
    email: EmailStr
    name: str
    role: Role
    team_ids: List[str] = []
    phone: Optional[str] = None
    area: Optional[str] = None
    picture: Optional[str] = None
    created_at: Optional[str] = None


class CreateUserReq(BaseModel):
    email: EmailStr
    name: str
    role: Role
    password: Optional[str] = None
    phone: Optional[str] = None
    area: Optional[str] = None
    team_ids: List[str] = []


class UpdateUserReq(BaseModel):
    name: Optional[str] = None
    role: Optional[Role] = None
    phone: Optional[str] = None
    area: Optional[str] = None
    team_ids: Optional[List[str]] = None
    password: Optional[str] = None


class ChangePasswordReq(BaseModel):
    current_password: str
    new_password: str


class TeamIn(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[str] = None
    member_ids: List[str] = []
    territory_ids: List[str] = []


class TeamMembersReq(BaseModel):
    member_ids: List[str]


class ProductIn(BaseModel):
    name: str
    sku: str
    category: Optional[str] = None
    unit: Optional[str] = None
    pack_size: Optional[str] = None
    mrp: Optional[float] = None
    description: Optional[str] = None


class TerritoryIn(BaseModel):
    name: str
    code: Optional[str] = None
    region: Optional[str] = None  # e.g. 'North', 'West'
    state: Optional[str] = None
    districts: List[str] = []
    description: Optional[str] = None
    center: Optional[GeoPoint] = None
    team_id: Optional[str] = None
    manager_id: Optional[str] = None
    rep_ids: List[str] = []


class DealerIn(BaseModel):
    firm_name: str
    contact_name: str
    phone: str
    email: Optional[EmailStr] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    crop_types: List[str] = []
    status: Literal['active', 'inactive', 'prospect'] = 'active'
    assigned_rep_id: Optional[str] = None
    team_id: Optional[str] = None
    territory_id: Optional[str] = None
    location: Optional[GeoPoint] = None
    create_login: bool = False


class Attachment(BaseModel):
    filename: str
    mime: str
    data_base64: str
    size: Optional[int] = None


ReportType = Literal[
    'sales_requirement',
    'sales_enquiry',
    'product_enquiry',
    'field_report',
    'farm_visit',
    'dealer_visit',
    'area_status',
]


class ReportIn(BaseModel):
    type: ReportType
    title: str
    summary: Optional[str] = None
    dealer_id: Optional[str] = None
    farmer_name: Optional[str] = None
    crop: Optional[str] = None
    acreage: Optional[float] = None
    location: Optional[str] = None  # free-text
    geo: Optional[GeoPoint] = None
    territory_id: Optional[str] = None
    area: Optional[str] = None
    items: List[Dict[str, Any]] = []
    amount: Optional[float] = None
    next_action: Optional[str] = None
    due_at: Optional[str] = None  # ISO date/datetime for SLA
    notes: Optional[str] = None
    attachments: List[Attachment] = []


RequestType = Literal['expense', 'leave', 'travel']
ReqStatus = Literal['pending', 'approved', 'rejected']


class RequestIn(BaseModel):
    type: RequestType
    title: str
    description: Optional[str] = None
    amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    destination: Optional[str] = None
    mode: Optional[str] = None
    attachments: List[Attachment] = []


class ApprovalAction(BaseModel):
    action: Literal['approve', 'reject']
    note: Optional[str] = None


class ThreadIn(BaseModel):
    name: Optional[str] = None
    participant_ids: List[str]
    dealer_id: Optional[str] = None
    topic: Optional[str] = None


class MessageIn(BaseModel):
    thread_id: str
    text: Optional[str] = None
    attachments: List[Attachment] = []


class ReportStatusUpdate(BaseModel):
    resolved: bool = True
    note: Optional[str] = None
