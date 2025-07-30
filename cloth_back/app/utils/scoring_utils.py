import numpy as np
from typing import Dict, Any, List

def calculate_tag_similarity(ai_tags: Dict[str, str], db_tags: Dict[str, Any]) -> float:
    """
    计算标签相似度
    
    Args:
        ai_tags: AI识别的标签字典
        db_tags: 数据库中的标签字典
    
    Returns:
        标签相似度分数 (0.0 - 1.0)
    """
    # 获取服装类型
    style = ai_tags.get('style', '无')
    
    # 根据服装类型选择权重配置
    if style in ['裙子', '裤子']:
        # 裙子和裤子的权重配置（不包含领型和袖型）
        tag_weights = {
            'style': 0.25,      # 服装类型权重提高
            'color': 0.10,      # 颜色权重降低
            'silhouette': 0.15, # 廓形重要
            'material': 0.12,   # 材质重要
            'pattern': 0.10,    # 图案
            'tone': 0.08,       # 色调
            'length': 0.10,     # 长度对裙子裤子很重要
            'craft': 0.04,      # 工艺
            'occasion': 0.03,   # 场合
            'season': 0.02,     # 季节
            'style_tag': 0.01   # 风格标签
            # 注意：不包含 collar 和 sleeve
        }
    else:
        # 其他服装类型的权重配置（包含领型和袖型）
        tag_weights = {
            'style': 0.23,      # 服装类型权重提高
            'color': 0.10,      # 颜色权重降低
            'silhouette': 0.12, # 廓形重要
            'material': 0.10,   # 材质重要
            'pattern': 0.08,    # 图案
            'tone': 0.08,       # 色调
            'length': 0.07,     # 长度
            'collar': 0.06,     # 领型
            'sleeve': 0.06,     # 袖型
            'craft': 0.04,      # 工艺
            'occasion': 0.03,   # 场合
            'season': 0.02,     # 季节
            'style_tag': 0.01   # 风格标签
        }
    
    total_weight = 0.0
    matched_weight = 0.0
    
    for tag_name, weight in tag_weights.items():
        ai_value = ai_tags.get(tag_name)
        db_value = db_tags.get(tag_name)
        
        # 只考虑AI识别出的有效标签
        if ai_value and ai_value != '无':
            total_weight += weight
            
            # 如果标签完全匹配
            if ai_value == db_value:
                matched_weight += weight
            # 如果是相似的标签，给予部分分数
            elif _is_similar_tag(tag_name, ai_value, db_value):
                matched_weight += weight * 0.5
    
    # 避免除零错误
    if total_weight == 0:
        return 0.0
    
    return matched_weight / total_weight

def _is_similar_tag(tag_name: str, value1: str, value2: str) -> bool:
    """
    判断两个标签值是否相似
    """
    if not value1 or not value2 or value1 == '无' or value2 == '无':
        return False
    
    # 定义相似标签组（基于sql.txt中的枚举定义）
    similar_groups = {
        'color': [
            ['红色', '粉色'],  # 暖色系
            ['蓝色', '紫色'],  # 冷色系
            ['黑色', '灰色'],  # 中性深色
            ['白色', '黄色']   # 明亮色系
        ],
        'tone': [
            ['浅色调', '亮色调'],
            ['深色调', '中性色调']
        ],
        'sleeve': [
            ['短袖', '无袖'],
            ['长袖', '七分袖'],
            ['五分袖', '七分袖']
        ],
        'silhouette': [
            ['修身', 'X型'],
            ['宽松', 'H型'],
            ['直筒', 'H型'],
            ['A字型', 'X型']
        ],
        'length': [
            ['超短', '短款'],
            ['中长款', '长款'],
            ['及膝', '及踝']
        ],
        'occasion': [
            ['休闲', '居家'],
            ['正式', '职场'],
            ['运动', '休闲']
        ],
        'season': [
            ['春季', '秋季'],
            ['夏季', '四季通用'],
            ['冬季', '四季通用']
        ],
        'style_tag': [
            ['简约', '优雅'],
            ['复古', '个性'],
            ['甜美', '时尚']
        ]
    }
    
    groups = similar_groups.get(tag_name, [])
    for group in groups:
        if value1 in group and value2 in group:
            return True
    
    return False

def calculate_composite_score(
    vector_similarity: float,
    tag_similarity: float,
    vector_weight: float = 0.6,
    tag_weight: float = 0.4
) -> float:
    """
    计算综合相似度分数
    
    Args:
        vector_similarity: 向量相似度 (0.0 - 1.0)
        tag_similarity: 标签相似度 (0.0 - 1.0)
        vector_weight: 向量相似度权重
        tag_weight: 标签相似度权重
    
    Returns:
        综合相似度分数 (0.0 - 1.0)
    """
    # 确保权重和为1
    total_weight = vector_weight + tag_weight
    if total_weight > 0:
        vector_weight = vector_weight / total_weight
        tag_weight = tag_weight / total_weight
    
    # 计算加权平均
    composite_score = vector_similarity * vector_weight + tag_similarity * tag_weight
    
    # 添加协同效应：如果两个分数都很高，给予额外奖励
    if vector_similarity > 0.7 and tag_similarity > 0.7:
        synergy_bonus = min(0.1, (vector_similarity - 0.7) * (tag_similarity - 0.7) * 0.5)
        composite_score += synergy_bonus
    
    return min(1.0, composite_score)

def calculate_adaptive_weights(tag_similarity: float) -> tuple:
    """
    根据标签相似度自适应调整权重
    
    Args:
        tag_similarity: 标签相似度
    
    Returns:
        (vector_weight, tag_weight) 权重元组
    """
    # 如果标签相似度很高，增加标签权重
    if tag_similarity > 0.8:
        return 0.4, 0.6  # 标签权重更高
    elif tag_similarity > 0.5:
        return 0.5, 0.5  # 平衡权重
    else:
        return 0.7, 0.3  # 向量权重更高

def rank_results_by_composite_score(
    results: List[Dict[str, Any]],
    ai_tags: Dict[str, str],
    use_adaptive_weights: bool = True
) -> List[Dict[str, Any]]:
    """
    使用综合评分对结果进行排序
    
    Args:
        results: 搜索结果列表
        ai_tags: AI识别的标签
        use_adaptive_weights: 是否使用自适应权重
    
    Returns:
        排序后的结果列表
    """
    for item in results:
        # 计算标签相似度
        tag_sim = calculate_tag_similarity(ai_tags, item)
        
        # 获取向量相似度（已经计算过）
        vector_sim = item.get('similarity', 0.0)
        
        # 确定权重
        if use_adaptive_weights:
            vector_weight, tag_weight = calculate_adaptive_weights(tag_sim)
        else:
            vector_weight, tag_weight = 0.6, 0.4
        
        # 计算综合分数
        composite_score = calculate_composite_score(
            vector_sim, tag_sim, vector_weight, tag_weight
        )
        
        # 添加详细信息到结果中
        item['tag_similarity'] = tag_sim
        item['vector_similarity'] = vector_sim
        item['composite_score'] = composite_score
        item['vector_weight'] = vector_weight
        item['tag_weight'] = tag_weight
    
    # 按综合分数排序
    results.sort(key=lambda x: x.get('composite_score', 0), reverse=True)
    
    return results