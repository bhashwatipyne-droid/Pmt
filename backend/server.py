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

    update_fields = payload.model_dump(exclude_unset=True)

    if user.role == "member":
        if existing.get("creator_id") != user.id:
            raise HTTPException(status_code=403, detail="You can only edit your own work items")
        update_fields = {k: v for k, v in update_fields.items() if k in MEMBER_EDITABLE_FIELDS}
        if "status" in update_fields and update_fields["status"] not in MEMBER_FORWARD_STATUSES:
            raise HTTPException(status_code=403, detail="Members cannot set this status")

    if "work_date" in update_fields and update_fields["work_date"]:
        update_fields["month"] = update_fields["work_date"][:7]

    update_fields["updated_at"] = now_iso()
    await db.work_items.update_one({"id": item_id}, {"$set": update_fields})
    updated = await db.work_items.find_one({"id": item_id}, {"_id": 0})
    return updated


@api_router.delete("/work-items/{item_id}")
async def delete_work_item(item_id: str, x_user_id: Optional[str] = Header(default=None)):
    user = await get_acting_user(x_user_id)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete work items")
    result = await db.work_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Work item not found")
    return {"success": True}


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
