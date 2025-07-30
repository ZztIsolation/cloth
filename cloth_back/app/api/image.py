from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from app.db.supabase_client import supabase
from app.db.schemas import GarmentCreate, GarmentOut
from app.services.ai_service import qwen_image_chat, parse_ai_result, extract_image_vector
from PIL import Image
import io
import time
import os
from pydantic import BaseModel

router = APIRouter()
_temp_data = {}  # 全局变量，仅用于本地单用户测试

class ImageUrlRequest(BaseModel):
    image_url: str

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # 检查格式
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    # 读取图片
    img_bytes = await file.read()
    img = Image.open(io.BytesIO(img_bytes))
    width, height = img.size
    file_size = len(img_bytes)
    filename = f"{int(time.time())}_{file.filename}"
    # 上传到 Supabase Storage（zzt bucket）
    storage_key = f"garments/{filename}"
    res = supabase.storage.from_("zzt").upload(storage_key, img_bytes)
    if not res:
        raise HTTPException(status_code=500, detail="Upload failed")
    # 构造图片公网URL（zzt bucket）
    supabase_url = os.getenv("SUPABASE_URL")
    image_url = f"{supabase_url}/storage/v1/object/public/zzt/{storage_key}"
    uploaded_at = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    # 提取图片向量
    similarity_vector = extract_image_vector(img_bytes)
    # 暂存图片元数据和向量
    _temp_data['upload'] = {
        "filename": filename,
        "storage_key": storage_key,
        "width": width,
        "height": height,
        "file_size": file_size,
        "uploaded_at": uploaded_at,
        "image_url": image_url,
        "similarity_vector": similarity_vector
    }
    return _temp_data['upload']

@router.post("/ai-image-chat")
async def ai_image_chat(req: ImageUrlRequest):
    image_url = req.image_url
    try:
        result = qwen_image_chat(image_url)
        tags = parse_ai_result(result)
        _temp_data['ai_result'] = result
        
        # 如果之前上传过图片，返回向量数据
        vector_data = None
        if 'upload' in _temp_data and _temp_data['upload'].get('similarity_vector'):
            vector_data = _temp_data['upload']['similarity_vector']
        
        return {
            "result": result, 
            "tags": tags,
            "similarity_vector": vector_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit")
async def submit_image_info(request: Request):
    """接收图片元数据和标签，插入 garment 表。"""
    payload = await request.json()
    garment_data = {
        "filename": payload.get("filename"),
        "storage_key": payload.get("storage_key"),
        "width": payload.get("width"),
        "height": payload.get("height"),
        "file_size": payload.get("file_size"),
        "uploaded_at": payload.get("uploaded_at"),


        "style": payload.get("style", "无"),
        "color": payload.get("color", "无"),
        "tone": payload.get("tone", "无"),
        "collar": payload.get("collar", "无"),
        "sleeve": payload.get("sleeve", "无"),
        "silhouette": payload.get("silhouette", "无"),
        "length": payload.get("length", "无"),
        "material": payload.get("material", "无"),
        "pattern": payload.get("pattern", "无"),
        "craft": payload.get("craft", "无"),
        "occasion": payload.get("occasion", "无"),
        "season": payload.get("season", "无"),
        "style_tag": payload.get("style_tag", "无"),
        
        "ai_confidence": payload.get("ai_confidence", None),
        "similarity_vector": payload.get("similarity_vector")
    }
    try:
        supabase.table("garment").insert(garment_data).execute()
        return {"msg": "保存成功", "data": garment_data}
    except Exception as e:
        print("插入数据库出错：", e)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{garment_id}")
async def delete_image(garment_id: int):
    # 查询 garment
    garment = supabase.table("garment").select("*").eq("id", garment_id).single().execute().data
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")
    # 删除图片
    supabase.storage.from_("zzt").remove(garment["storage_key"])
    # 删除 garment 记录
    supabase.table("garment").delete().eq("id", garment_id).execute()
    return {"msg": "Delete success"}

@router.get("/{garment_id}")
async def get_garment(garment_id: int):
    data = supabase.table("garment").select("*").eq("id", garment_id).single().execute().data
    if not data:
        raise HTTPException(status_code=404, detail="Garment not found")
    import os
    supabase_url = os.getenv("SUPABASE_URL")
    data["image_url"] = f"{supabase_url}/storage/v1/object/public/zzt/{data['storage_key']}"
    return data
