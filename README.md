# Fashion Manager - 智能服装管理系统

一个基于AI技术的智能服装管理和搜索系统，支持服装图片的智能识别、多维度搜索和标签管理。

## 🌟 项目特色

- **AI智能识别**：基于通义千问视觉模型，自动识别服装的14个维度属性
- **多维度搜索**：支持文字搜索、标签筛选、以图搜图和综合搜索
- **图片相似度匹配**：使用CLIP模型进行图片特征提取和相似度计算
- **现代化UI**：基于React + Ant Design的响应式界面设计
- **云端存储**：集成Supabase数据库和存储服务

## 🏗️ 技术架构

### 前端技术栈
- **React 18** - 现代化前端框架
- **Ant Design 5** - 企业级UI组件库
- **React Router 6** - 单页应用路由管理
- **Vite** - 快速构建工具
- **Less** - CSS预处理器

### 后端技术栈
- **FastAPI** - 高性能Python Web框架
- **Supabase** - 开源Firebase替代方案
- **通义千问VL** - 阿里云视觉语言模型
- **CLIP** - OpenAI图片特征提取模型
- **Uvicorn** - ASGI服务器

## 📋 功能特性

### 1. 服装库管理
- 📤 **图片上传**：支持拖拽上传服装图片
- 🤖 **AI智能识别**：自动识别服装的14个维度属性
  - 样式、颜色、色调、领型、袖型、版型、长度
  - 面料、图案、工艺、场合、季节、风格、置信度
- ✏️ **标签编辑**：支持手动修改AI识别结果
- 💾 **数据存储**：自动保存到云端数据库

### 2. 智能搜索系统
- 🔍 **文字搜索**：基于文件名的模糊匹配搜索
- 🏷️ **标签搜索**：多维度标签组合筛选
- 🖼️ **以图搜图**：上传图片找相似服装（返回最相似的3个结果）
- 🔄 **综合搜索**：支持关键词、标签、图片的任意组合搜索

### 3. 详情页面
- 🖼️ **高清预览**：支持图片放大查看
- 📝 **详细信息**：展示完整的服装属性标签
- ✏️ **在线编辑**：直接修改服装标签信息
- ⬅️ **智能返回**：根据来源页面智能返回

## 🚀 快速开始

### 环境要求
- Node.js 16+
- Python 3.8+
- Git

### 1. 克隆项目
```bash
git clone https://github.com/ZztIsolation/cloth.git
cd cloth
```

### 2. 后端设置

#### 安装依赖
```bash
cd cloth_back
pip install -r requirements.txt
```

#### 环境配置
在 `cloth_back` 目录下创建 `.env` 文件：
```env
# Supabase配置
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# 阿里云通义千问API
DASHSCOPE_API_KEY=your_dashscope_api_key
```

#### 启动后端服务
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 前端设置

#### 安装依赖
```bash
cd cloth_front
npm install
```

#### 启动前端服务
```bash
npm run dev
```

### 4. 访问应用
- 前端地址：http://localhost:5173
- 后端API文档：http://localhost:8000/docs

## 📊 数据库结构

### garment表结构
```sql
- id: 主键
- filename: 文件名
- storage_key: 存储键值
- similarity_vector: 图片特征向量(512维)
- style: 样式
- color: 颜色
- tone: 色调
- collar: 领型
- sleeve: 袖型
- silhouette: 版型
- length: 长度
- material: 面料
- pattern: 图案
- craft: 工艺
- occasion: 场合
- season: 季节
- style_tag: 风格
- ai_confidence: AI置信度
```

## 🔧 API接口

### 图片管理
- `POST /images/upload` - 上传图片
- `POST /images/ai-image-chat` - AI图片识别
- `POST /images/save` - 保存服装信息
- `GET /images/{id}` - 获取服装详情
- `PUT /images/{id}` - 更新服装信息

### 搜索功能
- `GET /search/by-text` - 文字搜索
- `GET /search/by-tag` - 标签搜索
- `POST /search/by-image` - 以图搜图
- `POST /search/comprehensive` - 综合搜索
- `GET /search/all` - 获取所有服装

## 🎯 使用指南

### 添加新服装
1. 进入"服装库"页面
2. 点击上传区域或拖拽图片
3. 等待AI自动识别服装属性
4. 检查并修改识别结果（如需要）
5. 点击"保存到数据库"完成添加

### 搜索服装
1. 进入"搜索"页面
2. 选择搜索方式：
   - **文字搜索**：输入关键词
   - **标签搜索**：选择服装属性
   - **以图搜图**：上传参考图片
   - **综合搜索**：组合使用多种方式
3. 点击搜索按钮查看结果
4. 点击结果图片查看详情

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👥 作者

- **ZztIsolation** - *初始工作* - [ZztIsolation](https://github.com/ZztIsolation)

## 🙏 致谢

- [Ant Design](https://ant.design/) - 优秀的React UI组件库
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的Python Web框架
- [Supabase](https://supabase.com/) - 开源的Firebase替代方案
- [通义千问](https://tongyi.aliyun.com/) - 阿里云大语言模型
- [OpenAI CLIP](https://github.com/openai/CLIP) - 图片特征提取模型

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 [Issue](https://github.com/ZztIsolation/cloth/issues)
- 发送邮件到项目维护者

---

⭐ 如果这个项目对你有帮助，请给它一个星标！