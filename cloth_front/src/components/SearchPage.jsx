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
  EyeOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TagSelector from './TagSelector';
import TagDisplay from './TagDisplay';
import { getAllTagCategories } from '../utils/tagConfig';
import { useSearchContext } from '../contexts/SearchContext';
import './SearchPage.less';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SearchPage = () => {
  const { searchState, updateSearchState } = useSearchContext();
  const [loading, setLoading] = useState(false);
  const [ragUploading, setRagUploading] = useState(false);
  const [ragGettingAI, setRagGettingAI] = useState(false);
  const navigate = useNavigate();
  
  // 从context中解构状态
  const {
    searchType,
    searchResults,
    searchQuery,
    searchTags,
    uploadedImage,
    ragImage,
    ragImageUrl,
    ragAiTags,
    ragAiResponse,
    ragSimilarityVector,
    ragResults,
    similarityThreshold,
    hasSearched
  } = searchState;
  
  // 更新状态的辅助函数
  const setSearchType = (value) => updateSearchState({ searchType: value });
  const setSearchResults = (value) => updateSearchState({ searchResults: value, hasSearched: true });
  const setSearchQuery = (value) => updateSearchState({ searchQuery: value });
  const setSearchTags = (value) => updateSearchState({ searchTags: value });
  const setUploadedImage = (value) => updateSearchState({ uploadedImage: value });
  const setRagImage = (value) => updateSearchState({ ragImage: value });
  const setRagImageUrl = (value) => updateSearchState({ ragImageUrl: value });
  const setRagAiTags = (value) => updateSearchState({ ragAiTags: value });
  const setRagAiResponse = (value) => updateSearchState({ ragAiResponse: value });
  const setRagSimilarityVector = (value) => updateSearchState({ ragSimilarityVector: value });
  const setRagResults = (value) => updateSearchState({ ragResults: value, hasSearched: true });
  const setSimilarityThreshold = (value) => updateSearchState({ similarityThreshold: value });

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

  // RAG搜索步骤1: 上传图片
  const handleRagUploadImage = async () => {
    if (!ragImage) {
      message.error('请选择图片文件');
      return;
    }

    setRagUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', ragImage);

      const response = await fetch('http://127.0.0.1:8000/images/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('图片上传失败');
      }

      const result = await response.json();
      
      const uploadedImageUrl = result.image_url || result.url || result;
      
      if (!uploadedImageUrl) {
        throw new Error('未获取到image_url');
      }

      setRagImageUrl(uploadedImageUrl);
      message.success('图片上传成功！');
      
    } catch (error) {
      console.error('Upload error:', error);
      message.error('图片上传失败：' + error.message);
    } finally {
      setRagUploading(false);
    }
  };

  // RAG搜索步骤2: 获取AI结果
  const handleRagGetAIResult = async () => {
    if (!ragImageUrl) {
      message.error('请先上传图片获取URL');
      return;
    }

    setRagGettingAI(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/images/ai-image-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: ragImageUrl }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('AI识别失败');
      }

      const result = await response.json();
      
      setRagAiTags(result.tags || {});
      setRagAiResponse(result.result || result.description || '');
      setRagSimilarityVector(result.similarity_vector || null);
      message.success('AI识别成功！');
      
    } catch (error) {
      console.error('AI error:', error);
      message.error('AI识别失败：' + error.message);
    } finally {
      setRagGettingAI(false);
    }
  };

  // RAG搜索步骤3: 开始搜索
  const handleRagStartSearch = async () => {
    if (!ragImage || !ragAiTags || !ragSimilarityVector) {
      message.error('请先完成图片上传和AI识别，确保获取到向量数据');
      return;
    }

    setLoading(true);
    setRagResults(null);
    
    try {
      const formData = new FormData();
      formData.append('file', ragImage);
      formData.append('similarity_threshold', similarityThreshold);
      
      const response = await fetch('http://127.0.0.1:8000/search/rag-search', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('RAG搜索失败');
      }
      
      const data = await response.json();
      setRagResults(data);
      setSearchType('rag');
      
      message.success(`RAG搜索完成！找到 ${data.results?.length || 0} 个结果`);
    } catch (error) {
      console.error('RAG search error:', error);
      message.error('RAG搜索失败：' + error.message);
      setSearchResults([]);
      setRagResults(null);
    } finally {
      setLoading(false);
    }
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
        
        <TabPane tab="RAG搜索" key="rag">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 使用说明 */}
            <div style={{ 
              background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)', 
              padding: '16px 20px', 
              borderRadius: '12px', 
              border: '1px solid #ffd591',
              marginBottom: '8px'
            }}>
              <Text strong style={{ color: '#fa8c16', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                🤖 RAG搜索使用指南
              </Text>
              <Text style={{ color: '#666', fontSize: '13px', lineHeight: '1.6' }}>
                RAG（检索增强生成）搜索流程：<br/>
                • <strong>步骤1</strong>：上传图片到云端存储<br/>
                • <strong>步骤2</strong>：获取AI分析结果<br/>
                • <strong>步骤3</strong>：开始智能识别搜索<br/>
                这种方法结合了标签的精确性和向量的相似性！
              </Text>
            </div>
            
            {/* 相似度阈值设置 */}
            <div>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>相似度阈值：</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value) || 0.8)}
                  style={{ width: '120px' }}
                  placeholder="0.8"
                />
                <Text style={{ color: '#666', fontSize: '13px' }}>
                  (0.0-1.0，值越高结果越精确，建议0.7-0.9)
                </Text>
              </div>
            </div>
            
            {/* RAG搜索操作区域 */}
            <div style={{
              border: '2px dashed #d9d9d9',
              borderRadius: '12px',
              padding: '24px',
              background: '#fafafa'
            }}>
              {/* 图片预览 */}
              <div className="upload-preview" style={{ marginBottom: '16px', textAlign: 'center' }}>
                {ragImage && (
                  <img 
                    src={ragImageUrl || URL.createObjectURL(ragImage)} 
                    alt="rag search" 
                    style={{ maxWidth: 250, maxHeight: 250, borderRadius: 8 }}
                  />
                )}
              </div>
              
              {/* 步骤1: 选择并上传图片 */}
              <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '16px' }}>
                <Text strong>步骤1: 选择并上传图片</Text>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      setRagImage(file);
                      setRagImageUrl('');
                      setRagAiTags(null);
                      setRagAiResponse('');
                      setRagSimilarityVector(null);
                      setRagResults(null);
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />}>
                      选择图片
                    </Button>
                  </Upload>
                  <Button 
                    type="primary"
                    onClick={handleRagUploadImage}
                    loading={ragUploading}
                    disabled={!ragImage || !!ragImageUrl}
                  >
                    {ragImageUrl ? '已上传' : '上传图片'}
                  </Button>
                </div>
              </Space>
              
              {/* 步骤2: 获取AI结果 */}
              <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '16px' }}>
                <Text strong>步骤2: 获取AI结果</Text>
                <Button 
                  type="primary"
                  icon={<RobotOutlined />}
                  onClick={handleRagGetAIResult}
                  loading={ragGettingAI}
                  disabled={!ragImageUrl || !!ragAiTags}
                  style={{ width: '100%' }}
                >
                  {ragAiTags ? '已识别' : '获取AI结果'}
                </Button>
              </Space>
              
              {/* AI识别原始结果展示 */}
              {ragAiResponse && (
                <div style={{
                  background: '#f5f5f5',
                  borderRadius: 8,
                  padding: '12px',
                  fontSize: 14,
                  minHeight: 60,
                  marginBottom: 16,
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #e0e0e0'
                }}>
                  {ragAiResponse}
                </div>
              )}
              
              {/* 步骤3: 开始识别 */}
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>步骤3: 开始识别</Text>
                {ragSimilarityVector && (
                  <Text type="success" style={{ fontSize: '12px' }}>
                    ✓ 向量数据已准备就绪
                  </Text>
                )}
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  onClick={handleRagStartSearch}
                  loading={loading}
                  disabled={!ragAiTags || !ragSimilarityVector}
                  size="large"
                  style={{ 
                    width: '100%',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    background: ragAiTags ? 'linear-gradient(135deg, #fa8c16 0%, #fa541c 100%)' : undefined
                  }}
                >
                  开始识别
                </Button>
              </Space>
            </div>
            
            {/* AI识别结果显示 */}
            {ragAiTags && (
              <div style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '8px',
                padding: '12px 16px'
              }}>
                <Text strong style={{ color: '#52c41a', marginBottom: '8px', display: 'block' }}>
                  🎯 AI识别的标签：
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.entries(ragAiTags).map(([key, value]) => (
                    value && value !== '无' && (
                      <Tag key={key} color="green" style={{ margin: 0 }}>
                        {key}: {value}
                      </Tag>
                    )
                  ))}
                </div>
              </div>
            )}
            
            {/* 搜索结果统计 */}
            {ragResults && (
              <div style={{
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '8px',
                padding: '12px 16px'
              }}>
                <Text strong style={{ color: '#1890ff', marginBottom: '8px', display: 'block' }}>
                  📊 搜索结果统计：
                </Text>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                  <div>标签筛选：{ragResults.total_candidates} → 向量计算：{ragResults.vector_candidates} → 最终结果：{ragResults.final_results}</div>
                  <div>相似度阈值：{ragResults.similarity_threshold} | 评分方法：{ragResults.scoring_method === 'multi_factor' ? '多因子综合评分' : '向量相似度'}</div>
                  {ragResults.scoring_method === 'multi_factor' && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                      💡 使用自适应权重：向量相似度 + 标签相似度 + 协同效应奖励
                    </div>
                  )}
                </div>
              </div>
            )}
          </Space>
        </TabPane>
      </Tabs>

      <Divider />

      <Spin spinning={loading} size="large">
        {((searchType === 'rag' ? ragResults?.results : searchResults) || []).length > 0 ? (
          <>
            <div className="search-results-count">
              找到 {(searchType === 'rag' ? ragResults?.results : searchResults)?.length || 0} 个结果
            </div>
            <Row gutter={[16, 16]} className="search-results">
              {((searchType === 'rag' ? ragResults?.results : searchResults) || []).map((item) => {
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
                          onClick={() => {
                            // 确保搜索状态被标记为已搜索
                            updateSearchState({ hasSearched: true });
                            navigate(`/detail/${item.id}`);
                          }}
                        />
                        {/* 显示多因子评分信息 */}
                        {searchType === 'rag' && item.composite_score !== undefined ? (
                          <div className="similarity-badge" style={{ 
                            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            minWidth: '60px'
                          }}>
                            综合: {(item.composite_score * 100).toFixed(0)}%
                          </div>
                        ) : item.similarity !== undefined && (
                          <div className="similarity-badge">
                            {(item.similarity * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      <div className="search-card-content">
                        <div className="search-card-title" style={{ textAlign: 'center' }}>
                          时尚单品 #{item.id}
                        </div>
                        {/* 多因子评分详情 */}
                        {searchType === 'rag' && item.composite_score !== undefined && (
                          <div style={{
                            background: '#f6ffed',
                            border: '1px solid #d9f7be',
                            borderRadius: '6px',
                            padding: '8px',
                            marginTop: '8px',
                            fontSize: '11px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>🎯 标签相似度:</span>
                              <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                                {((item.tag_similarity || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>🔍 向量相似度:</span>
                              <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                {((item.vector_similarity || item.similarity || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666' }}>
                              <span>权重 (向量:标签)</span>
                              <span>
                                {((item.vector_weight || 0.6) * 100).toFixed(0)}%:{((item.tag_weight || 0.4) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div style={{ marginTop: 8 }}>
                          <TagDisplay tags={{
                            style: item.style,
                            color: item.color,
                            tone: item.tone,
                            collar: item.collar,
                            sleeve: item.sleeve,
                            silhouette: item.silhouette,
                            length: item.length,
                            material: item.material,
                            pattern: item.pattern,
                            craft: item.craft,
                            occasion: item.occasion,
                            season: item.season,
                            style_tag: item.style_tag
                          }} showEmpty={false} />
                        </div>
                      </div>
                      <div className="search-card-actions">
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => {
                            // 确保搜索状态被标记为已搜索
                            updateSearchState({ hasSearched: true });
                            navigate(`/detail/${item.id}`);
                          }}
                          style={{ marginRight: 8 }}
                        >查看详情</Button>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </>
        ) : (hasSearched && (searchQuery || getActiveSearchTags().length > 0 || uploadedImage || ragImage)) ? (
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
