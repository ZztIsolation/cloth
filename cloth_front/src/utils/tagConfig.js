export const TAG_CATEGORIES = {
  style: {
    name: '样式名称',
    options: ['衬衫', 'T恤', '连衣裙', '裤子', '裙子', '外套', '毛衣'],
    enum: 'style_enum'
  },
  color: {
    name: '颜色',
    options: ['红色', '蓝色', '白色', '黑色', '灰色', '绿色', '黄色', '紫色', '粉色', '棕色'],
    enum: 'color_enum'
  },
  tone: {
    name: '色调',
    options: ['浅色调', '深色调', '中性色调', '亮色调'],
    enum: 'tone_enum'
  },
  collar: {
    name: '领型',
    options: ['圆领', 'V领', '高领', '翻领', '立领', '一字领', '方领', '心形领'],
    enum: 'collar_enum'
  },
  sleeve: {
    name: '袖型',
    options: ['长袖', '短袖', '无袖', '七分袖', '五分袖', '泡泡袖', '喇叭袖', '紧身袖'],
    enum: 'sleeve_enum'
  },
  silhouette: {
    name: '版型',
    options: ['修身', '宽松', '直筒', 'A字型', 'H型', 'X型'],
    enum: 'sil_enum'
  },
  length: {
    name: '长度',
    options: ['超短', '短款', '中长款', '长款', '及膝', '及踝'],
    enum: 'len_enum'
  },
  material: {
    name: '面料',
    options: ['棉质', '丝质', '麻质', '毛料', '化纤', '混纺', '牛仔', '皮革'],
    enum: 'mat_enum'
  },
  pattern: {
    name: '图案',
    options: ['纯色', '条纹', '格子', '印花', '刺绣', '蕾丝', '网纱'],
    enum: 'pat_enum'
  },
  craft: {
    name: '工艺',
    options: ['拼接', '褶皱', '抽绳', '拉链', '纽扣', '系带'],
    enum: 'craft_enum'
  },
  occasion: {
    name: '场合',
    options: ['休闲', '正式', '运动', '居家', '派对', '职场', '度假'],
    enum: 'occ_enum'
  },
  season: {
    name: '季节',
    options: ['春季', '夏季', '秋季', '冬季', '四季通用'],
    enum: 'sea_enum'
  },
  style_tag: {
    name: '风格',
    options: ['简约', '复古', '甜美', '帅气', '优雅', '个性', '时尚'],
    enum: 'styl_enum'
  },
  ai_confidence: {
    name: '置信度',
    options: [],
    enum: ''
  }
};

export const getAllTagCategories = () => Object.keys(TAG_CATEGORIES);

export const getCategoryOptions = (category) => TAG_CATEGORIES[category]?.options || [];

export const getCategoryName = (category) => TAG_CATEGORIES[category]?.name || category;
