from dotenv import load_dotenv #引入“读环境变量”的工具。
load_dotenv() #把项目根目录下 .env 文件里的变量一次性读进来

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import image, tag, search #把三个功能模块（图片、标签、搜索）的代码“接进来”。
from app.db.supabase_client import supabase

app = FastAPI(title="Cloth Backend API")  #生成一个名字叫“Cloth Backend API”的网站应用，FastAPI 会自动帮它生成文档

# 允许本地开发和alipay的前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://weavefox.alipay.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image.router, prefix="/images", tags=["Image"]) #告诉 FastAPI：凡是访问 /images/... 开头的网址，都交给 image.py 里写的函数处理；在 Swagger 文档里把这些接口放在 “Image” 分组。
app.include_router(tag.router, prefix="/tags", tags=["Tag"])
app.include_router(search.router, prefix="/search", tags=["Search"])

@app.get("/")  #在浏览器访问 根地址就会触发下面的函数。
async def root():
    return {"msg": "API is running"}

@app.get("/test-db") #在浏览器访问 test-db用于测试能否连接supabase
async def test_db():
    res = supabase.table("garment").select("*").limit(1).execute()
    return {"data": res.data}
