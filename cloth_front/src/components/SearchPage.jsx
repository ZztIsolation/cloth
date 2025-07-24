import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Image, 
  Tag, 
  Space, 
  Input, 
  Select, 
  Upload, 
  Button, 
  message,
  Spin,
  Empty,
  Row,
  Col,
  Typography,
  Tabs,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  UploadOutlined,
  FilterOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TagSelector from './TagSelector';
import TagDisplay from './TagDisplay';
import { getAllTagCategories } from '../utils/tagConfig';
import './SearchPage.less';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SearchPage = () => {
  const [searchType, setSearchType] = useState('text');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState({});
  const [uploadedImage, setUploadedImage] = useState(null);
  const navigate = useNavigate();

  // 初始化搜索标签
  const initializeSearchTags = () => {
    const initialTags = {};
    getAllTagCategories().forEach(category => {
      initialTags[category] = undefined;
    });
    return initialTags;
  };

  useEffect(() => {
    setSearchTags(initializeSearchTags());
  }, []);

  const handleTextSearch = async (value) => {
    if (!value.trim()) return;
    
    setLoading(true);
    setSearchQuery(value);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/search/by-text?keyword=${encodeURIComponent(value)}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      setSearchResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error('Text search error:', error);
      message.error('搜索失败，请检查网络连接或稍后重试');
      setSearchResults([]);
    }
    setLoading(false);
  };

  const handleTagSearch = async () => {
    const activeTags = Object.fromEntries(
      Object.entries(searchTags).filter(([_, value]) => value && value !== '无')
    );
    
    if (Object.keys(activeTags).length === 0) {
      message.warning('请至少选择一个标签');
      return;
    }
    
    setLoading(true);
    try {
      // 拼接GET参数
      const params = new URLSearchParams(activeTags).toString();
      const response = await fetch(`http://127.0.0.1:8000/search/by-tag?${params}`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      setSearchResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error('Tag search error:', error);
      message.error('搜索失败，请检查网络连接或稍后重试');
      setSearchResults([]);
    }
    setLoading(false);
  };

  const handleImageSearch = async (file) => {
    setUploadedImage(file);
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/search/by-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await response.json();
      setSearchResults(
        Array.isArray(data.results)
          ? data.results
          : (Array.isArray(data) ? data : [])
      );
    } catch (error) {
      console.error('Image search error:', error);
      message.error('搜索失败，请检查网络连接或稍后重试');
      setSearchResults([]);
    }
    setLoading(false);
    
    return false;
  };

  const handleComprehensiveSearch = async () => {
    const hasKeyword = searchQuery && searchQuery.trim();
    const activeTags = Object.fromEntries(
      Object.entries(searchTags).filter(([_, value]) => value && value !== '无')
    );
    const hasActiveTags = Object.keys(activeTags).length > 0;
    const hasImage = uploadedImage;

    if (!hasKeyword && !hasActiveTags && !hasImage) {
      message.warning('请至少输入关键词、选择标签或上传图片');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      
      // 添加关键词
      if (hasKeyword) {
        formData.append('keyword', searchQuery.trim());
      }
      
      // 添加标签
      if (hasActiveTags) {
        Object.entries(activeTags).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      
      // 添加图片
      if (hasImage) {
        formData.append('file', uploadedImage);
      }
      
      const response = await fetch('http://127.0.0.1:8000/search/comprehensive', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      setSearchResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error('Comprehensive search error:', error);
      message.error('搜索失败，请检查网络连接或稍后重试');
      setSearchResults([]);
    }
    setLoading(false);
  };

  const handleImageUpload = (file) => {
    setUploadedImage(file);
    return false; // 阻止自动上传
  };

  const uploadProps = {
    accept: 'image/*',
    multiple: false,
    showUploadList: false,
    beforeUpload: searchType === 'image' ? handleImageSearch : handleImageUpload,
  };

  const getActiveSearchTags = () => {
    return Object.entries(searchTags).filter(([_, value]) => value && value !== '无');
  };

  return (
    <div className="search-page-root">
      {/* 装饰性背景元素 */}
      <div className="search-decoration-bg"></div>
      <div className="search-decoration-dots"></div>
      
      <div className="search-page">
        {/* 标题区域 */}
        <div className="search-header">
          <div className="search-title-section">
            <h1 className="search-main-title">智能搜索</h1>
            <p className="search-subtitle">多维度精准查找，发现完美搭配</p>
          </div>
        </div>
      
      <Tabs 
        activeKey={searchType} 
        onChange={setSearchType}
        className="search-tabs"
      >
        <TabPane tab="文字搜索" key="text">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Search
              placeholder="输入关键词搜索服装..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleTextSearch}
              loading={loading}
            />
          </Space>
        </TabPane>
        
        <TabPane tab="标签搜索" key="tags">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <TagSelector 
              tags={searchTags} 
              onTagsChange={setSearchTags}
            />
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleTagSearch}
              loading={loading}
              size="large"
              style={{ alignSelf: 'flex-start' }}
            >
              搜索
            </Button>
          </Space>
        </TabPane>
        
        <TabPane tab="以图搜图" key="image">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Upload.Dragger {...uploadProps} className="image-search-upload">
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此处</p>
              <p className="ant-upload-hint">
                上传一张服装图片，系统将为您查找相似的服装
              </p>
            </Upload.Dragger>
            
            {uploadedImage && (
              <div className="upload-preview">
                <Text>已上传图片：</Text>
                <img 
                  src={URL.createObjectURL(uploadedImage)} 
                  alt="search" 
                  className="search-preview-image"
                />
              </div>
            )}
          </Space>
        </TabPane>
        
        <TabPane tab="综合搜索" key="comprehensive">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 使用说明 */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f6f9fc 0%, #e9f4ff 100%)', 
              padding: '16px 20px', 
              borderRadius: '12px', 
              border: '1px solid #e1f0ff',
              marginBottom: '8px'
            }}>
              <Text strong style={{ color: '#1890ff', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                💡 综合搜索使用指南
              </Text>
              <Text style={{ color: '#666', fontSize: '13px', lineHeight: '1.6' }}>
                您可以单独使用或组合使用以下搜索方式：<br/>
                • <strong>关键词搜索</strong>：输入服装描述词汇，如"连衣裙"、"休闲"等<br/>
                • <strong>标签筛选</strong>：选择具体的服装属性，如颜色、款式、场合等<br/>
                • <strong>相似图片</strong>：上传参考图片，系统会找到相似的服装<br/>
                组合使用多种方式可以获得更精准的搜索结果！
              </Text>
            </div>
            {/* 关键词搜索 */}
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>关键词搜索：</Text>
              <Input
                placeholder="输入关键词搜索服装..."
                allowClear
                size="large"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* 标签选择 */}
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>标签筛选：</Text>
              <TagSelector 
                tags={searchTags} 
                onTagsChange={setSearchTags}
              />
            </div>
            
            {/* 图片上传 */}
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>相似图片：</Text>
              <Upload.Dragger {...uploadProps} className="image-search-upload" style={{ height: 120 }}>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽图片到此处</p>
                <p className="ant-upload-hint">
                  可选：上传图片进行相似度匹配
                </p>
              </Upload.Dragger>
              
              {uploadedImage && (
                <div className="upload-preview" style={{ marginTop: 8 }}>
                  <Text>已上传图片：</Text>
                  <img 
                    src={URL.createObjectURL(uploadedImage)} 
                    alt="search" 
                    className="search-preview-image"
                  />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={handleComprehensiveSearch}
                loading={loading}
                size="large"
                style={{ 
                  height: '56px',
                  fontSize: '18px',
                  fontWeight: '600',
                  padding: '0 48px',
                  borderRadius: '12px'
                }}
              >
                综合搜索
              </Button>
            </div>
          </Space>
        </TabPane>
      </Tabs>

      <Divider />

      <Spin spinning={loading} size="large">
        {searchResults.length > 0 ? (
          <>
            <div className="search-results-count">
              找到 {searchResults.length} 个结果
            </div>
            <Row gutter={[16, 16]} className="search-results">
              {searchResults.map((item) => {
                // 动态拼接图片url（兼容后端未返回image_url的情况）
                let imageUrl = item.image_url;
                if (!imageUrl && item.storage_key) {
                  // 你可以将supabase_url替换为你的实际Supabase URL
                  const supabase_url = 'https://rfigsjdwdxigjsnlvtej.supabase.co';
                  imageUrl = `${supabase_url}/storage/v1/object/public/zzt/${item.storage_key}`;
                }
                return (
                  <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                    <div className="search-result-card">
                      <div className="search-card-image">
                        <Image
                          alt={`search result ${item.id}`}
                          src={imageUrl}
                          preview={false}
                          style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 16 }}
                          onClick={() => navigate(`/detail/${item.id}`)}
                        />
                        {item.similarity !== undefined && (
                          <div className="similarity-badge">
                            {(item.similarity * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      <div className="search-card-content">
                        <div className="search-card-title" style={{ textAlign: 'center' }}>
                          时尚单品 #{item.id}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <TagDisplay tags={item.tags} showEmpty={false} />
                        </div>
                      </div>
                      <div className="search-card-actions">
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/detail/${item.id}`)}
                          style={{ marginRight: 8 }}
                        >查看详情</Button>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </>
        ) : (searchQuery || getActiveSearchTags().length > 0 || uploadedImage) ? (
          <Empty 
            description="未找到匹配的服装" 
            className="empty-results"
          />
        ) : null}
      </Spin>
      </div>
    </div>
  );
};

export default SearchPage;
