import React from 'react';
import { Select, Space, Typography } from 'antd';
import { TAG_CATEGORIES } from '../utils/tagConfig';
import './TagEditor.less';

const { Text } = Typography;
const { Option } = Select;

const TagEditor = ({ tags, onTagsChange, disabled = false }) => {
  const handleTagChange = (category, value) => {
    const newTags = { ...tags, [category]: value };
    onTagsChange(newTags);
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {Object.entries(TAG_CATEGORIES).map(([key, category]) => (
        <div key={key} className="tag-category">
          <Text strong className="category-label">{category.name}：</Text>
          <Select
            value={tags[key] || undefined}
            onChange={(value) => handleTagChange(key, value)}
            placeholder={`选择${category.name}`}
            style={{ width: 200 }}
            disabled={disabled}
            allowClear
          >
            {category.options.map(option => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </Select>
        </div>
      ))}
    </Space>
  );
};

export default TagEditor;
