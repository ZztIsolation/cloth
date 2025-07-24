import React from 'react';
import { Typography, Space, Tag } from 'antd';
import { TAG_CATEGORIES } from '../utils/tagConfig';
import './TagSelector.less';

const { Text } = Typography;

const TagSelector = ({ tags, onTagsChange, disabled = false }) => {
  const handleTagClick = (category, option) => {
    const currentValue = tags[category];
    const newValue = currentValue === option ? undefined : option;
    const newTags = { ...tags, [category]: newValue };
    onTagsChange(newTags);
  };

  return (
    <div className="tag-selector">
      {Object.entries(TAG_CATEGORIES).map(([key, category]) => (
        <div key={key} className="tag-category-section">
          <div className="category-header">
            <Text strong className="category-title">{category.name}</Text>
          </div>
          <div className="tag-options">
            {category.options.map(option => {
              const isSelected = tags[key] === option;
              return (
                <Tag.CheckableTag
                  key={option}
                  checked={isSelected}
                  onChange={() => !disabled && handleTagClick(key, option)}
                  className={`tag-option ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                >
                  {option}
                </Tag.CheckableTag>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TagSelector;