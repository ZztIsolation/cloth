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
import TagEditor from './TagEditor';
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
      const response = await fetch(`http://127.0.0.1:8000/images/search?q=${encodeURIComponent(value)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search error:', error);
      // 使用模拟搜索结果
      setSearchResults([
        {
          id: 1,
          image_url: 'https://weavefox.alipay.com/api/bolt/unsplash_image?keyword=fashion%20dress&width=300&height=400&random=search1',
          tags: {
            style: '连衣裙',
            color: '蓝色',
            tone: '浅色调',
            collar: '圆领',
            sleeve: '短袖',
            silhouette: 'A字型',
            length: '中长款',
            material: '棉质',
            pattern: '纯色',
            craft: '纽扣',
            occasion: '休闲',
            season: '夏季',
            styleType: '简约'
          },
          similarity: 0.95
        }
      ]);
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
      // 使用模拟结果
      setSearchResults([
        {
          id: 3,
          image_url: 'https://weavefox.alipay.com/api/bolt/unsplash_image?keyword=fashion%20summer&width=300&height=400&random=tagsearch1',
          tags: {
            style: 'T恤',
            color: '白色',
            tone: '中性色调',
            collar: '圆领',
            sleeve: '短袖',
            silhouette: '宽松',
            length: '短款',
            material: '棉质',
            pattern: '印花',
            craft: '印花',
            occasion: '休闲',
            season: '夏季',
            styleType: '简约'
          },
          similarity: 0.92
        }
      ]);
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
      // 使用模拟结果
      setSearchResults([
        {
          id: 4,
          image_url: 'https://weavefox.alipay.com/api/bolt/unsplash_image?keyword=fashion%20similar&width=300&height=400&random=imagesearch1',
          tags: {
            style: '外套',
            color: '黑色',
            tone: '深色调',
            collar: '翻领',
            sleeve: '长袖',
            silhouette: '修身',
            length: '长款',
            material: '牛仔',
            pattern: '纯色',
            craft: '拉链',
            occasion: '休闲',
            season: '秋季',
            styleType: '帅气'
          },
          similarity: 0.89
        }
      ]);
    }
    setLoading(false);
    
    return false;
  };

  const uploadProps = {
    accept: 'image/*',
    multiple: false,
    showUploadList: false,
    beforeUpload: handleImageSearch,
  };

  const getActiveSearchTags = () => {
    return Object.entries(searchTags).filter(([_, value]) => value && value !== '无');
  };

  return (
    <div className="search-page">
      <Title level={2}>服装搜索</Title>
      
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
            <TagEditor 
              tags={searchTags} 
              onTagsChange={setSearchTags}
            />
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleTagSearch}
              loading={loading}
              size="large"
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
      </Tabs>

      <Divider />

      <Spin spinning={loading} size="large">
        {searchResults.length > 0 ? (
          <>
            <Text style={{ marginBottom: 16, display: 'block' }}>
              找到 {searchResults.length} 个结果
            </Text>
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
                    <Card
                      hoverable
                      className="result-card"
                      cover={
                        <div className="result-image-container">
                          <Image
                            alt={`search result ${item.id}`}
                            src={imageUrl}
                            preview={false}
                            className="result-image"
                            style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 8 }}
                          />
                          {item.similarity !== undefined && (
                            <div className="similarity-badge">
                              相似度: {(item.similarity * 100).toFixed(2)}%
                            </div>
                          )}
                        </div>
                      }
                      actions={[
                        <EyeOutlined 
                          key="view" 
                          onClick={() => navigate(`/detail/${item.id}`)} 
                        />
                      ]}
                    >
                      <Card.Meta
                        title={`服装 #${item.id}`}
                        description={
                          <>
                            <div>文件名: {item.filename}</div>
                            <div>相似度: {(item.similarity * 100).toFixed(2)}%</div>
                          </>
                        }
                      />
                    </Card>
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
  );
};

export default SearchPage;
