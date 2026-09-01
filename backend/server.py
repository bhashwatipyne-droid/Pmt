from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------------- Constants ----------------
DELIVERABLE_TYPES = ["Blog Post", "Social Media Post", "Design Asset", "Video", "Presentation", "Report", "Email Campaign", "Other"]
WORK_CATEGORIES = ["Core", "Non-Core"]
STATUSES = ["Not Started", "Ongoing", "Ready for Review", "Changes Requested", "Closed"]
MEMBER_FORWARD_STATUSES = ["Not Started", "Ongoing", "Ready for Review"]
MEMBER_EDITABLE_FIELDS = {"work_date", "version", "time_taken_minutes", "remarks", "status"}

SEED_USERS = [
    {"id": "admin-1", "name": "Aisha Khan", "role": "admin"},
    {"id": "manager-1", "name": "Rahul Verma", "role": "manager"},
    {"id": "manager-2", "name": "Priya Nair", "role": "manager"},
    {"id": "member-1", "name": "Sam Fernandes", "role": "member"},
    {"id": "member-2", "name": "Neha Joshi", "role": "member"},
    {"id": "member-3", "name": "Vikram Singh", "role": "member"},
]


# ---------------- Models ----------------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    role: str


class WorkItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    work_date: str
    month: str
    deliverable_name: str = ""
    deliverable_type: str = ""
    work_category: str = "Core"
    version: str = ""
    time_taken_minutes: float = 0
    creator_id: Optional[str] = None
    reviewer_id: Optional[str] = None
    manager_id: Optional[str] = None
    remarks: str = ""
    status: str = "Not Started"
    created_at: str
    updated_at: str


class WorkItemCreate(BaseModel):
    work_date: Optional[str] = None
    deliverable_name: Optional[str] = ""
    deliverable_type: Optional[str] = ""
    work_category: Optional[str] = "Core"
    version: Optional[str] = ""
    time_taken_minutes: Optional[float] = 0
    creator_id: Optional[str] = None
    reviewer_id: Optional[str] = None
    manager_id: Optional[str] = None
    remarks: Optional[str] = ""
    status: Optional[str] = "Not Started"


class WorkItemUpdate(BaseModel):
    work_date: Optional[str] = None
    deliverable_name: Optional[str] = None
    deliverable_type: Optional[str] = None
    work_category: Optional[str] = None
    version: Optional[str] = None
    time_taken_minutes: Optional[float] = None
    creator_id: Optional[str] = None
    reviewer_id: Optional[str] = None
    manager_id: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = None


class BulkUpdatePayload(BaseModel):
    ids: List[str]
    patch: WorkItemUpdate


class BulkDeletePayload(BaseModel):
    ids: List[str]


# ---------------- Helpers ----------------
async def get_acting_user(x_user_id: Optional[str] = Header(default=None)) -> User:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    doc = await db.users.find_one({"id": x_user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Acting user not found")
    return User(**doc)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def scoped_update_fields(user: User, existing: dict, update_fields: dict) -> dict:
    """Apply role-based restrictions to a raw update payload. Raises HTTPException on violation."""
    if user.role == "member":
        if existing.get("creator_id") != user.id:
            raise HTTPException(status_code=403, detail="You can only edit your own work items")
        update_fields = {k: v for k, v in update_fields.items() if k in MEMBER_EDITABLE_FIELDS}
        if "status" in update_fields and update_fields["status"] not in MEMBER_FORWARD_STATUSES:
            raise HTTPException(status_code=403, detail="Members cannot set this status")
    if "work_date" in update_fields and update_fields["work_date"]:
        update_fields["month"] = update_fields["work_date"][:7]
    return update_fields


async def require_admin(x_user_id: Optional[str] = Header(default=None)) -> User:
    user = await get_acting_user(x_user_id)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")
    return user


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Work Sheet API"}


@api_router.get("/users", response_model=List[User])
async def list_users():
    return await db.users.find({}, {"_id": 0}).to_list(1000)


@api_router.get("/config/options")
async def get_options():
    return {
        "deliverable_types": DELIVERABLE_TYPES,
        "work_categories": WORK_CATEGORIES,
        "statuses": STATUSES,
        "member_forward_statuses": MEMBER_FORWARD_STATUSES,
    }


@api_router.get("/work-items", response_model=List[WorkItem])
async def list_work_items(
    status: Optional[str] = None,
    deliverable_type: Optional[str] = None,
    work_category: Optional[str] = None,
    month: Optional[str] = None,
    search: Optional[str] = None,
    creator_id: Optional[str] = None,
    x_user_id: Optional[str] = Header(default=None),
):
    user = await get_acting_user(x_user_id)
    query = {}
    if user.role == "member":
        query["creator_id"] = user.id
    elif creator_id:
        query["creator_id"] = creator_id
    if status:
        query["status"] = status
    if deliverable_type:
        query["deliverable_type"] = deliverable_type
    if work_category:
        query["work_category"] = work_category
    if month:
        query["month"] = month
    if search:
        query["$or"] = [
            {"deliverable_name": {"$regex": search, "$options": "i"}},
            {"remarks": {"$regex": search, "$options": "i"}},
        ]
    items = await db.work_items.find(query, {"_id": 0}).sort("work_date", -1).to_list(5000)
    return items


@api_router.post("/work-items", response_model=WorkItem)
async def create_work_item(payload: WorkItemCreate, x_user_id: Optional[str] = Header(default=None)):
    user = await get_acting_user(x_user_id)
    data = payload.model_dump()
    work_date = data.pop("work_date", None) or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    month = work_date[:7]
    if user.role == "member":
        data["creator_id"] = user.id
        data["reviewer_id"] = None
        data["manager_id"] = None
    else:
        data["creator_id"] = data.get("creator_id") or user.id
    ts = now_iso()
    item = WorkItem(work_date=work_date, month=month, created_at=ts, updated_at=ts, **data)
    await db.work_items.insert_one(item.model_dump())
    return item


@api_router.patch("/work-items/{item_id}", response_model=WorkItem)
async def update_work_item(item_id: str, payload: WorkItemUpdate, x_user_id: Optional[str] = Header(default=None)):
    user = await get_acting_user(x_user_id)
    existing = await db.work_items.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Work item not found")

    update_fields = scoped_update_fields(user, existing, payload.model_dump(exclude_unset=True))

    update_fields["updated_at"] = now_iso()
    await db.work_items.update_one({"id": item_id}, {"$set": update_fields})
    updated = await db.work_items.find_one({"id": item_id}, {"_id": 0})
    return updated


@api_router.post("/work-items/bulk-update", response_model=List[WorkItem])
async def bulk_update_work_items(payload: BulkUpdatePayload, x_user_id: Optional[str] = Header(default=None)):
    user = await get_acting_user(x_user_id)
    raw_fields = payload.patch.model_dump(exclude_unset=True)
    updated_items = []
    for item_id in payload.ids:
        existing = await db.work_items.find_one({"id": item_id}, {"_id": 0})
        if not existing:
            continue
        try:
            update_fields = scoped_update_fields(user, existing, dict(raw_fields))
        except HTTPException:
            continue
        update_fields["updated_at"] = now_iso()
        await db.work_items.update_one({"id": item_id}, {"$set": update_fields})
        updated_items.append(await db.work_items.find_one({"id": item_id}, {"_id": 0}))
    return updated_items


@api_router.post("/work-items/bulk-delete")
async def bulk_delete_work_items(payload: BulkDeletePayload, x_user_id: Optional[str] = Header(default=None)):
    await require_admin(x_user_id)
    result = await db.work_items.delete_many({"id": {"$in": payload.ids}})
    return {"deleted_count": result.deleted_count}


@api_router.delete("/work-items/{item_id}")
async def delete_work_item(item_id: str, x_user_id: Optional[str] = Header(default=None)):
    await require_admin(x_user_id)
    result = await db.work_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Work item not found")
    return {"success": True}


# ---------------- Dashboard ----------------
@api_router.get("/dashboard/summary")
async def dashboard_summary(x_user_id: Optional[str] = Header(default=None)):
    await require_admin(x_user_id)
    all_items = await db.work_items.find({}, {"_id": 0}).to_list(10000)
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    status_counts = {s: 0 for s in STATUSES}
    total_minutes = 0.0
    items_this_month = 0
    closed_this_month = 0
    creators = set()
    for it in all_items:
        status_counts[it.get("status", "Not Started")] = status_counts.get(it.get("status", "Not Started"), 0) + 1
        total_minutes += it.get("time_taken_minutes", 0) or 0
        if it.get("creator_id"):
            creators.add(it["creator_id"])
        if it.get("month") == current_month:
            items_this_month += 1
            if it.get("status") == "Closed":
                closed_this_month += 1
    needs_attention = status_counts.get("Ready for Review", 0) + status_counts.get("Changes Requested", 0)
    return {
        "total_items": len(all_items),
        "status_counts": status_counts,
        "total_hours_logged": round(total_minutes / 60, 1),
        "items_this_month": items_this_month,
        "closed_this_month": closed_this_month,
        "active_members": len(creators),
        "needs_attention_count": needs_attention,
    }


@api_router.get("/dashboard/team-summary")
async def dashboard_team_summary(x_user_id: Optional[str] = Header(default=None)):
    await require_admin(x_user_id)
    users = await db.users.find({"role": {"$ne": "admin"}}, {"_id": 0}).to_list(1000)
    all_items = await db.work_items.find({}, {"_id": 0}).to_list(10000)
    result = []
    for u in users:
        user_items = [it for it in all_items if it.get("creator_id") == u["id"]]
        status_counts = {s: 0 for s in STATUSES}
        total_minutes = 0.0
        for it in user_items:
            status_counts[it.get("status", "Not Started")] = status_counts.get(it.get("status", "Not Started"), 0) + 1
            total_minutes += it.get("time_taken_minutes", 0) or 0
        result.append({
            "user_id": u["id"],
            "name": u["name"],
            "role": u["role"],
            "total_items": len(user_items),
            "status_counts": status_counts,
            "total_hours": round(total_minutes / 60, 1),
        })
    return result


@api_router.get("/dashboard/attention-items")
async def dashboard_attention_items(x_user_id: Optional[str] = Header(default=None)):
    await require_admin(x_user_id)
    items = await db.work_items.find(
        {"status": {"$in": ["Ready for Review", "Changes Requested"]}}, {"_id": 0}
    ).sort("updated_at", 1).to_list(50)
    users = {u["id"]: u["name"] for u in await db.users.find({}, {"_id": 0}).to_list(1000)}
    for it in items:
        it["creator_name"] = users.get(it.get("creator_id"), "Unassigned")
    return items


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def seed_users():
    for u in SEED_USERS:
        await db.users.update_one({"id": u["id"]}, {"$set": u}, upsert=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
