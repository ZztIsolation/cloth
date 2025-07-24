from fastapi import APIRouter, HTTPException
from app.db.supabase_client import supabase
from app.db.schemas import GarmentCreate, GarmentOut, TagCreate, TagOut

router = APIRouter()

#负责对标签的增删查改
@router.patch("/{garment_id}")
async def update_tags(garment_id: int, tags: dict):
    # tags: {"style": "T恤", "color": "红色", ...}
    update_data = {k: v for k, v in tags.items() if k in GarmentCreate.__fields__}
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid tags")
    supabase.table("garment").update(update_data).eq("id", garment_id).execute()
    return {"msg": "Tags updated"}
