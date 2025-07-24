import os
from fastapi import APIRouter, Query, UploadFile, File, HTTPException, Form
from app.db.supabase_client import supabase
from app.services.ai_service import extract_image_vector
from app.utils.vector_utils import cosine_similarity
import io
import ast
from typing import Optional

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
    print("数据库查询结果 res:", res)
    candidates = res.data
    print("candidates:", candidates)
    supabase_url = os.getenv("SUPABASE_URL")
    results = []
    for item in candidates:
        db_vector = item.get("similarity_vector")
        print("db_vector:", db_vector)
        if isinstance(db_vector, str):
            try:
                db_vector = ast.literal_eval(db_vector)
            except Exception:
                db_vector = None
        if db_vector and isinstance(db_vector, list) and len(db_vector) == 512:
            sim = cosine_similarity(query_vector, db_vector)
            item["similarity"] = sim
            item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
            results.append(item)
    print("最终results:", results)
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return {"results": results[:3]} #取最相似的三个

@router.get("/by-text")
async def search_by_text(keyword: str = Query(..., description="搜索关键词")):
    """
    根据关键词搜索filename，支持部分匹配
    例如：用户输入"三二一"，数据库filename为"四三二一"则匹配成功
    """
    if not keyword or not keyword.strip():
        raise HTTPException(status_code=400, detail="搜索关键词不能为空")
    
    # 使用LIKE进行部分匹配搜索
    query = supabase.table("garment").select("*").like("filename", f"%{keyword}%")
    data = query.execute().data
    
    # 为每个结果动态拼接 image_url
    supabase_url = os.getenv("SUPABASE_URL")
    for item in data:
        item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
    
    return {"results": data}

@router.post("/comprehensive")
async def comprehensive_search(
    keyword: Optional[str] = Form(None),
    style: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    tone: Optional[str] = Form(None),
    collar: Optional[str] = Form(None),
    sleeve: Optional[str] = Form(None),
    silhouette: Optional[str] = Form(None),
    length: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    pattern: Optional[str] = Form(None),
    craft: Optional[str] = Form(None),
    occasion: Optional[str] = Form(None),
    season: Optional[str] = Form(None),
    style_tag: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    综合搜索功能，支持关键词、标签和图片的组合搜索
    """
    # 检查是否至少有一个搜索条件
    has_keyword = keyword and keyword.strip()
    has_tags = any([style, color, tone, collar, sleeve, silhouette, length, 
                   material, pattern, craft, occasion, season, style_tag])
    has_image = file is not None
    
    if not (has_keyword or has_tags or has_image):
        raise HTTPException(status_code=400, detail="请至少提供一个搜索条件")
    
    supabase_url = os.getenv("SUPABASE_URL")
    
    # 情况1: 只有关键词搜索
    if has_keyword and not has_tags and not has_image:
        query = supabase.table("garment").select("*").like("filename", f"%{keyword}%")
        data = query.execute().data
        for item in data:
            item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
        return {"results": data}
    
    # 情况2: 只有标签搜索
    if has_tags and not has_keyword and not has_image:
        query = supabase.table("garment").select("*")
        if style: query = query.eq("style", style)
        if color: query = query.eq("color", color)
        if tone: query = query.eq("tone", tone)
        if collar: query = query.eq("collar", collar)
        if sleeve: query = query.eq("sleeve", sleeve)
        if silhouette: query = query.eq("silhouette", silhouette)
        if length: query = query.eq("length", length)
        if material: query = query.eq("material", material)
        if pattern: query = query.eq("pattern", pattern)
        if craft: query = query.eq("craft", craft)
        if occasion: query = query.eq("occasion", occasion)
        if season: query = query.eq("season", season)
        if style_tag: query = query.eq("style_tag", style_tag)
        data = query.execute().data
        for item in data:
            item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
        return {"results": data}
    
    # 情况3: 只有图片搜索
    if has_image and not has_keyword and not has_tags:
        img_bytes = await file.read()
        query_vector = extract_image_vector(img_bytes)
        res = supabase.table("garment").select("*").execute()
        candidates = res.data
        results = []
        for item in candidates:
            db_vector = item.get("similarity_vector")
            if isinstance(db_vector, str):
                try:
                    db_vector = ast.literal_eval(db_vector)
                except Exception:
                    db_vector = None
            if db_vector and isinstance(db_vector, list) and len(db_vector) == 512:
                sim = cosine_similarity(query_vector, db_vector)
                item["similarity"] = sim
                item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
                results.append(item)
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return {"results": results[:3]}
    
    # 情况4: 关键词 + 标签组合
    if has_keyword and has_tags and not has_image:
        query = supabase.table("garment").select("*").like("filename", f"%{keyword}%")
        if style: query = query.eq("style", style)
        if color: query = query.eq("color", color)
        if tone: query = query.eq("tone", tone)
        if collar: query = query.eq("collar", collar)
        if sleeve: query = query.eq("sleeve", sleeve)
        if silhouette: query = query.eq("silhouette", silhouette)
        if length: query = query.eq("length", length)
        if material: query = query.eq("material", material)
        if pattern: query = query.eq("pattern", pattern)
        if craft: query = query.eq("craft", craft)
        if occasion: query = query.eq("occasion", occasion)
        if season: query = query.eq("season", season)
        if style_tag: query = query.eq("style_tag", style_tag)
        data = query.execute().data
        for item in data:
            item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
        return {"results": data}
    
    # 情况5: 包含图片的组合搜索（关键词和/或标签 + 图片）
    if has_image and (has_keyword or has_tags):
        # 首先根据关键词和标签筛选
        query = supabase.table("garment").select("*")
        if has_keyword:
            query = query.like("filename", f"%{keyword}%")
        if style: query = query.eq("style", style)
        if color: query = query.eq("color", color)
        if tone: query = query.eq("tone", tone)
        if collar: query = query.eq("collar", collar)
        if sleeve: query = query.eq("sleeve", sleeve)
        if silhouette: query = query.eq("silhouette", silhouette)
        if length: query = query.eq("length", length)
        if material: query = query.eq("material", material)
        if pattern: query = query.eq("pattern", pattern)
        if craft: query = query.eq("craft", craft)
        if occasion: query = query.eq("occasion", occasion)
        if season: query = query.eq("season", season)
        if style_tag: query = query.eq("style_tag", style_tag)
        
        filtered_data = query.execute().data
        
        # 如果筛选后没有结果，直接返回
        if not filtered_data:
            return {"results": []}
        
        # 对筛选后的结果进行图片相似度计算
        img_bytes = await file.read()
        query_vector = extract_image_vector(img_bytes)
        results = []
        
        for item in filtered_data:
            db_vector = item.get("similarity_vector")
            if isinstance(db_vector, str):
                try:
                    db_vector = ast.literal_eval(db_vector)
                except Exception:
                    db_vector = None
            if db_vector and isinstance(db_vector, list) and len(db_vector) == 512:
                sim = cosine_similarity(query_vector, db_vector)
                item["similarity"] = sim
                item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
                results.append(item)
        
        # 按相似度排序
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return {"results": results[:3]}
    
    return {"results": []}

@router.get("/all")
async def get_all_garments():
    import os
    supabase_url = os.getenv("SUPABASE_URL")
    data = supabase.table("garment").select("*").execute().data
    for item in data:
        item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
    return {"results": data}
