import os
from openai import OpenAI
import re
import torch
import clip
import io
from PIL import Image

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

_clip_model = None
_clip_preprocess = None

def get_clip_model():
    global _clip_model, _clip_preprocess
    if _clip_model is None or _clip_preprocess is None:
        _clip_model, _clip_preprocess = clip.load("ViT-B/32", device="cpu")
    return _clip_model, _clip_preprocess

def extract_image_vector(image_bytes: bytes) -> list:
    """
    输入图片二进制，返回512维向量（list[float]）
    """
    model, preprocess = get_clip_model()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_tensor = preprocess(img).unsqueeze(0)  # [1, 3, 224, 224]
    with torch.no_grad():
        image_features = model.encode_image(img_tensor)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
    vector = image_features[0].cpu().numpy().tolist()  # 512维
    return vector



def qwen_image_chat(image_url: str) -> str:
    user_prompt = '''
标签体系：

- 样式：衬衫/T恤/连衣裙/裤子/裙子/外套/毛衣

- 颜色：红色/蓝色/白色/黑色/灰色/绿色/黄色/紫色/粉色/棕色

- 色调：浅色调/深色调/中性色调/亮色调

- 领型：圆领/V领/高领/翻领/立领/一字领/方领/心形领

- 袖型：长袖/短袖/无袖/七分袖/五分袖/泡泡袖/喇叭袖/紧身袖

- 版型：修身/宽松/直筒/A字型/H型/X型

- 长度：超短/短款/中长款/长款/及膝/及踝

- 面料：棉质/丝质/麻质/毛料/化纤/混纺/牛仔/皮革

- 图案：纯色/条纹/格子/印花/刺绣/蕾丝/网纱

- 工艺：拼接/褶皱/抽绳/拉链/纽扣/系带

- 场合：休闲/正式/运动/居家/派对/职场/度假

- 季节：春季/夏季/秋季/冬季/四季通用

- 风格：简约/复古/甜美/帅气/优雅/个性/时尚

- 置信度：本次AI识别的置信度，0~1之间

要求：

1. 只输出最可能最主要最符合的1个值，不要解释。如蓝白衣服只要输出最主要的颜色，不如蓝色，不要输出“蓝色/白色”，季节也要一个季节。

2. 严格按照以下格式，用中文逗号分隔：

样式：{值} ，颜色：{值}，色调：{值}，领型：{值}，袖型：{值}，版型：{值}，长度：{值}，面料：{值}，图案：{值}，工艺：{值}，场合：{值}，季节：{值}，风格：{值}，置信度：{值}'''

    completion = client.chat.completions.create(
        model="qwen-vl-max",
        messages=[
            {
                "role": "system",
                "content": [{"type": "text", "text": "你是一位时尚买手，请对图片中的【主单品】进行专业识别。"}],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url},
                    },
                    {"type": "text", "text": user_prompt},
                ],
            },
        ],
    )
    return completion.choices[0].message.content

def parse_ai_result(result: str) -> dict:
    # 匹配所有“字段：值”对
    pattern = r'([\u4e00-\u9fa5]+)：([^，]+)'
    matches = re.findall(pattern, result)
    # 中文字段名到数据库字段的映射
    field_map = {
        "样式": "style",
        "色调": "tone",
        "工艺": "craft",
        "领型": "collar",
        "袖型": "sleeve",
        "颜色": "color",
        "版型": "silhouette",
        "长度": "length",
        "面料": "material",
        "图案": "pattern",
        "场合": "occasion",
        "季节": "season",
        "风格": "style_tag",
        "置信度": "ai_confidence"
    }
    parsed = {}
    for k, v in matches:
        if k in field_map:
            if k == "置信度":
                try:
                    parsed[field_map[k]] = float(v)
                except:
                    parsed[field_map[k]] = None
            else:
                parsed[field_map[k]] = v
    return parsed
