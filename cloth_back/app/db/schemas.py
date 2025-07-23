from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

StyleEnum = Literal['无','衬衫','T恤','连衣裙','裤子','裙子','外套','毛衣']
ColorEnum = Literal['无','红色','蓝色','白色','黑色','灰色','绿色','黄色','紫色','粉色','棕色']
ToneEnum = Literal['无','浅色调','深色调','中性色调','亮色调']
CollarEnum = Literal['无','圆领','V领','高领','翻领','立领','一字领','方领','心形领']
SleeveEnum = Literal['无','长袖','短袖','无袖','七分袖','五分袖','泡泡袖','喇叭袖','紧身袖']
SilhouetteEnum = Literal['无','修身','宽松','直筒','A字型','H型','X型']
LengthEnum = Literal['无','超短','短款','中长款','长款','及膝','及踝']
MaterialEnum = Literal['无','棉质','丝质','麻质','毛料','化纤','混纺','牛仔','皮革']
PatternEnum = Literal['无','纯色','条纹','格子','印花','刺绣','蕾丝','网纱']
CraftEnum = Literal['无','拼接','褶皱','抽绳','拉链','纽扣','系带']
OccasionEnum = Literal['无','休闲','正式','运动','居家','派对','职场','度假']
SeasonEnum = Literal['无','春季','夏季','秋季','冬季','四季通用']
StyleTagEnum = Literal['无','简约','复古','甜美','帅气','优雅','个性','时尚']

class GarmentCreate(BaseModel):
    filename: str
    storage_key: str
    width: Optional[int]
    height: Optional[int]
    file_size: Optional[int]
    style: StyleEnum
    color: ColorEnum
    tone: ToneEnum
    collar: CollarEnum
    sleeve: SleeveEnum
    silhouette: SilhouetteEnum
    length: LengthEnum
    material: MaterialEnum
    pattern: PatternEnum
    craft: CraftEnum
    occasion: OccasionEnum
    season: SeasonEnum
    style_tag: StyleTagEnum
    ai_confidence: Optional[float]
    similarity_vector: Optional[List[float]] = Field(default=None, max_items=512, min_items=512)

class GarmentOut(GarmentCreate):
    id: int
    uploaded_at: Optional[datetime]

class TagCreate(BaseModel):
    garment_id: int
    tag_type: str  # 如 'style', 'color' 等
    tag_value: str
    source: str    # 'ai' 或 'user'
    confidence: Optional[float]

class TagOut(TagCreate):
    id: int 