import os
from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from app.db.supabase_client import supabase
from app.services.ai_service import extract_image_vector
from app.utils.vector_utils import cosine_similarity
import io

router = APIRouter()

@router.get("/by-tag")
async def search_by_tags(
    style: str = None,
    color: str = None,
    tone: str = None,
    collar: str = None,
    sleeve: str = None,
    silhouette: str = None,
    length: str = None,
    material: str = None,
    pattern: str = None,
    craft: str = None,
    occasion: str = None,
    season: str = None,
    style_tag: str = None
):
    query = supabase.table("garment").select("*")
    if style:
        query = query.eq("style", style)
    if color:
        query = query.eq("color", color)
    if tone:
        query = query.eq("tone", tone)
    if collar:
        query = query.eq("collar", collar)
    if sleeve:
        query = query.eq("sleeve", sleeve)
    if silhouette:
        query = query.eq("silhouette", silhouette)
    if length:
        query = query.eq("length", length)
    if material:
        query = query.eq("material", material)
    if pattern:
        query = query.eq("pattern", pattern)
    if craft:
        query = query.eq("craft", craft)
    if occasion:
        query = query.eq("occasion", occasion)
    if season:
        query = query.eq("season", season)
    if style_tag:
        query = query.eq("style_tag", style_tag)
    data = query.execute().data
    # 为每个结果动态拼接 image_url
    supabase_url = os.getenv("SUPABASE_URL")
    for item in data:
        item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
    return {"results": data}

@router.post("/by-image")
async def search_by_image(file: UploadFile = File(...)):
    img_bytes = await file.read()
    query_vector = extract_image_vector(img_bytes)
    res = supabase.table("garment").select("id,filename,storage_key,similarity_vector").execute()
    candidates = res.data
    supabase_url = os.getenv("SUPABASE_URL")
    results = []
    for item in candidates:
        db_vector = item.get("similarity_vector")
        if db_vector and len(db_vector) == 512:
            sim = cosine_similarity(query_vector, db_vector)
            item["similarity"] = sim
            item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
            results.append(item)
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return {"results": results[:5]}

@router.get("/all")
async def get_all_garments():
    import os
    supabase_url = os.getenv("SUPABASE_URL")
    data = supabase.table("garment").select("*").execute().data
    for item in data:
        item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
    return {"results": data}
