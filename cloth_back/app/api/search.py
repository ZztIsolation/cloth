import os
from fastapi import APIRouter, Query, UploadFile, File, HTTPException, Form
from app.db.supabase_client import supabase
from app.services.ai_service import extract_image_vector
from app.utils.vector_utils import cosine_similarity
from app.utils.scoring_utils import rank_results_by_composite_score, calculate_tag_similarity
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

@router.post("/rag-search")
async def rag_search(
    file: UploadFile = File(...),
    similarity_threshold: float = Form(0.8)
):
    """
    RAG搜索：上传图片进行AI分析得到标签，然后基于标签和向量进行搜索
    1. 提取图片向量
    2. AI分析得到标签
    3. 先用标签筛选候选集
    4. 再用向量相似度排序
    5. 应用相似度阈值筛选
    """
    try:
        # 读取上传的图片
        img_bytes = await file.read()
        
        # 提取图片向量
        query_vector = extract_image_vector(img_bytes)
        
        # AI分析图片得到标签
        from app.services.ai_service import qwen_image_chat, parse_ai_result
        import time
        import os as temp_os
        
        # 临时上传图片到supabase用于AI分析
        filename = f"temp_{int(time.time())}_{file.filename}"
        storage_key = f"temp/{filename}"
        supabase.storage.from_("zzt").upload(storage_key, img_bytes)
        
        # 构造临时图片URL
        supabase_url = temp_os.getenv("SUPABASE_URL")
        temp_image_url = f"{supabase_url}/storage/v1/object/public/zzt/{storage_key}"
        
        # AI分析
        ai_result = qwen_image_chat(temp_image_url)
        ai_tags = parse_ai_result(ai_result)
        
        # 删除临时图片
        supabase.storage.from_("zzt").remove([storage_key])
        
        # 第一阶段：基于AI识别的标签进行分组筛选
        # 定义服装分组
        STYLE_GROUPS = {
            "上装组": ["衬衫", "T恤", "毛衣", "连衣裙"],
            "下装组": ["裙子", "裤子"],
            "外套组": ["外套"]
        }
        
        upload_style = ai_tags.get("style")
        filtered_data = []
        
        # 第一步：筛选出所有style相同的图片
        if upload_style and upload_style != "无":
            exact_match_query = supabase.table("garment").select("*").eq("style", upload_style)
            exact_match_data = exact_match_query.execute().data
            filtered_data.extend(exact_match_data)
        
        # 第二步：根据分组进行扩展搜索
        if upload_style and upload_style != "无":
            # 找到上传图片所属的组
            current_group = None
            for group_name, styles in STYLE_GROUPS.items():
                if upload_style in styles:
                    current_group = styles
                    break
            
            # 如果找到了分组，进行组内扩展搜索
            if current_group:
                # 获取组内其他style
                other_styles = [style for style in current_group if style != upload_style]
                
                for other_style in other_styles:
                    # 查询该style的所有数据
                    style_query = supabase.table("garment").select("*").eq("style", other_style)
                    style_data = style_query.execute().data
                    
                    # 对每个结果检查是否有3个其他标签匹配
                    for item in style_data:
                        match_count = 0
                        # 检查除style外的其他标签
                        other_tags = ["color", "tone", "collar", "sleeve", "silhouette", 
                                    "length", "material", "pattern", "craft", "occasion", 
                                    "season", "style_tag"]
                        
                        for tag in other_tags:
                            ai_value = ai_tags.get(tag)
                            db_value = item.get(tag)
                            if ai_value and ai_value != "无" and ai_value == db_value:
                                match_count += 1
                        
                        # 如果有3个或以上标签匹配，加入结果
                        if match_count >= 3:
                            # 避免重复添加
                            if item not in filtered_data:
                                filtered_data.append(item)
        
        # 如果筛选后没有结果，则使用全库搜索
        if not filtered_data:
            filtered_data = supabase.table("garment").select("*").execute().data
        
        # 第二阶段：对筛选结果进行向量相似度计算
        candidates = []
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
                candidates.append(item)
        
        # 第三阶段：使用多因子评分机制进行综合排序
        ranked_results = rank_results_by_composite_score(candidates, ai_tags, use_adaptive_weights=True)
        
        # 第四阶段：应用综合相似度阈值筛选
        # 这里我们使用综合分数而不是单纯的向量相似度
        results = []
        for item in ranked_results:
            # 可以选择使用向量相似度阈值或综合分数阈值
            vector_sim = item.get("similarity", 0)
            composite_score = item.get("composite_score", 0)
            
            # 使用更灵活的阈值策略：向量相似度或综合分数满足其一即可
            if vector_sim >= similarity_threshold or composite_score >= similarity_threshold:
                results.append(item)
        
        return {
            "results": results[:10],  # 返回前10个最相似的结果
            "ai_tags": ai_tags,  # 返回AI识别的标签供前端显示
            "total_candidates": len(filtered_data),  # 标签筛选后的候选数量
            "vector_candidates": len(candidates),  # 有效向量的候选数量
            "final_results": len(results),  # 最终结果数量
            "similarity_threshold": similarity_threshold,
            "scoring_method": "multi_factor",  # 标识使用了多因子评分
            "scoring_details": {
                "vector_weight_range": "0.4-0.7",
                "tag_weight_range": "0.3-0.6",
                "adaptive_weights": True,
                "synergy_bonus": "up to 0.1 for high scores"
            }
        }
        
    except Exception as e:
        print(f"RAG搜索错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"RAG搜索失败: {str(e)}")

@router.get("/all")
async def get_all_garments():
    import os
    supabase_url = os.getenv("SUPABASE_URL")
    data = supabase.table("garment").select("*").execute().data
    for item in data:
        item["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{item['storage_key']}"
    return {"results": data}
