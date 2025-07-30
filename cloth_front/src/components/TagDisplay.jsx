import React from 'react';
import { Tag, Space, Typography } from 'antd';
import { TAG_CATEGORIES } from '../utils/tagConfig';
import './TagDisplay.less';

const { Text } = Typography;

// 14个标签字段顺序
const ALL_TAG_KEYS = [
  'style', 'tone', 'craft', 'collar', 'sleeve', 'color', 'silhouette', 'length',
  'material', 'pattern', 'occasion', 'season', 'style_tag', 'ai_confidence'
];

const TagDisplay = ({ tags, showEmpty = false, horizontal = false }) => {
  // 用ALL_TAG_KEYS顺序渲染，保证所有标签都显示
  const displayTags = ALL_TAG_KEYS
    .filter(key => tags && tags[key] && tags[key] !== '无')
    .map(key => ({
      category: key,
      value: tags[key],
      label: TAG_CATEGORIES[key]?.name || key,
      color: getCategoryColor(key)
    }));

  if (displayTags.length === 0 && !showEmpty) {
    return null;
  }

  if (horizontal) {
    return (
      <>
        {displayTags.map(({ category, value, label, color }) => (
          <span key={category} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 24, marginBottom: 18 }}>
            <Text strong style={{ fontSize: 22 }}>{label}:</Text>
            <Tag color={color} style={{ margin: '0 0 0 6px', fontSize: 22, height: 36, display: 'flex', alignItems: 'center' }}>
              {value}
            </Tag>
          </span>
        ))}
        {displayTags.length === 0 && showEmpty && (
          <Text type="secondary" style={{ fontSize: 18 }}>暂无标签信息</Text>
        )}
      </>
    );
  }
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
      {displayTags.map(({ category, value, label, color }) => (
        <Space key={category} size="small">
          <Text strong style={{ fontSize: 12 }}>{label}:</Text>
          <Tag color={color} style={{ margin: 0 }}>
            {value}
          </Tag>
        </Space>
      ))}
      {displayTags.length === 0 && showEmpty && (
        <Text type="secondary" style={{ fontSize: 12 }}>暂无标签信息</Text>
      )}
    </div>
  );
};

const getCategoryColor = (category) => {
  const colors = {
    style: 'blue',
    color: 'red',
    tone: 'orange',
    collar: 'purple',
    sleeve: 'cyan',
    silhouette: 'green',
    length: 'magenta',
    material: 'geekblue',
    pattern: 'gold',
    craft: 'lime',
    occasion: 'volcano',
    season: 'processing',
    style_tag: 'pink', // 新增风格颜色
    ai_confidence: 'gray' // 新增置信度颜色
  };
  return colors[category] || 'default';
};

export default TagDisplay;
