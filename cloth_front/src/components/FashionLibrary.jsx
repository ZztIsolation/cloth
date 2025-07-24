import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Card, 
  Image, 
  Space, 
  Button, 
  Modal, 
  message,
  Spin,
  Empty,
  Row,
  Col,
  Typography,
  Input,
  Divider,
  Input as TextArea,
  Form,
  Select,
  Pagination
} from 'antd';
import { 
  UploadOutlined, 
  EyeOutlined,
  DeleteOutlined,
  LoadingOutlined,
  LinkOutlined,
  RobotOutlined,
  SaveOutlined,
  SearchOutlined,
  AppstoreOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TagDisplay from './TagDisplay';
import { getAllTagCategories } from '../utils/tagConfig';
import './FashionLibrary.less';

const { Title, Text } = Typography;

// 14个标签字段
const ALL_TAG_KEYS = [
  'style', 'tone', 'craft', 'collar', 'sleeve', 'color', 'silhouette', 'length',
  'material', 'pattern', 'occasion', 'season', 'style_tag', 'ai_confidence'
];
// 标签选项映射
const TAG_OPTIONS = {
  style: ['无','衬衫','T恤','连衣裙','裤子','裙子','外套','毛衣'],
  color: ['无','红色','蓝色','白色','黑色','灰色','绿色','黄色','紫色','粉色','棕色'],
  tone: ['无','浅色调','深色调','中性色调','亮色调'],
  collar: ['无','圆领','V领','高领','翻领','立领','一字领','方领','心形领'],
  sleeve: ['无','长袖','短袖','无袖','七分袖','五分袖','泡泡袖','喇叭袖','紧身袖'],
  silhouette: ['无','修身','宽松','直筒','A字型','H型','X型'],
  length: ['无','超短','短款','中长款','长款','及膝','及踝'],
  material: ['无','棉质','丝质','麻质','毛料','化纤','混纺','牛仔','皮革'],
  pattern: ['无','纯色','条纹','格子','印花','刺绣','蕾丝','网纱'],
  craft: ['无','拼接','褶皱','抽绳','拉链','纽扣','系带'],
  occasion: ['无','休闲','正式','运动','居家','派对','职场','度假'],
  season: ['无','春季','夏季','秋季','冬季','四季通用'],
  style_tag: ['无','简约','复古','甜美','帅气','优雅','个性','时尚'],
  ai_confidence: []
};

const FashionLibrary = () => {
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [aiTags, setAiTags] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [uploading, setUploading] = useState(false);
  const [gettingAI, setGettingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [uploadMeta, setUploadMeta] = useState(null);
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const pageItems = clothingItems.slice(startIdx, endIdx);
  // IntersectionObserver 懒加载
  const [visibleItems, setVisibleItems] = useState({});
  const cardRefs = React.useRef({});
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => ({ ...prev, [entry.target.dataset.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    Object.values(cardRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [pageItems]);
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(clothingItems.length / PAGE_SIZE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [clothingItems, currentPage]);

  useEffect(() => {
    fetchClothingItems();
  }, []);

  useEffect(() => {
    console.log('clothingItems:', clothingItems);
  }, [clothingItems]);

  const fetchClothingItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/search/all', {
        credentials: 'include'
      });
      const data = await response.json();
      setClothingItems(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error('Error fetching clothing items:', error);
      setClothingItems([]);
    }
    setLoading(false);
  };

  const handleUpload = async (file) => {
    setUploadedFile(file);
    setImageUrl('');
    setAiTags(null);
    setAiResponse('');
    setUploadModalVisible(true);
    return false;
  };

  const handleGetImageUrl = async () => {
    if (!uploadedFile) {
      message.error('请选择图片文件');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('http://127.0.0.1:8000/images/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('图片上传失败');
      }

      const result = await response.json();
      
      // 从返回结果中提取image_url
      const uploadedImageUrl = result.image_url || result.url || result;
      
      if (!uploadedImageUrl) {
        throw new Error('未获取到image_url');
      }

      setImageUrl(uploadedImageUrl);
      setUploadMeta(result); // 保存所有图片元信息
      message.success('图片上传成功！');
      
    } catch (error) {
      console.error('Upload error:', error);
      message.error('图片上传失败：' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditTags = () => {
    setEditingTags(true);
    form.setFieldsValue(aiTags || {});
  };
  const handleTagsChange = (changedValues, allValues) => {
    setAiTags(allValues);
  };

  const handleCancelEditTags = () => {
    setEditingTags(false);
    form.setFieldsValue(aiTags || {});
  };

  const handleGetAIResult = async () => {
    if (!imageUrl) {
      message.error('请先上传图片获取URL');
      return;
    }

    console.log('AI识别用的 imageUrl:', imageUrl);  // 新增调试信息
    
    setGettingAI(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/images/ai-image-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: imageUrl }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('AI识别失败');
      }

      const result = await response.json();
      
      // 补全所有标签
      const completeTags = { ...Object.fromEntries(ALL_TAG_KEYS.map(k => [k, '无'])), ...(result.tags || {}) };
      setAiTags(completeTags);
      console.log('AI识别返回的tags:', completeTags);
      setAiResponse(result.result || result.description || '');
      setEditingTags(false);
      message.success('AI识别成功！');
      
    } catch (error) {
      console.error('AI error:', error);
      message.error('AI识别失败：' + error.message);
    } finally {
      setGettingAI(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!uploadMeta || !aiTags) {
      message.error('请先完成图片上传和AI识别');
      return;
    }
    // 校验所有标签字段
    for (const key of ALL_TAG_KEYS) {
      if (key !== 'ai_confidence' && (!aiTags[key] && aiTags[key] !== '无')) {
        message.error(`标签 ${key} 不能为空`);
        return;
      }
    }
    setSaving(true);
    
    try {
      // 保存前自动去除所有枚举字段的首尾空格
      const ENUM_SINGLE_KEYS = [
        'style', 'color', 'tone', 'collar', 'sleeve', 'silhouette', 'length',
        'material', 'pattern', 'craft', 'occasion', 'season', 'style_tag'
      ];
      for (const key of ENUM_SINGLE_KEYS) {
        if (aiTags[key] && typeof aiTags[key] === 'string') {
          aiTags[key] = aiTags[key].trim();
        }
      }
      const payload = {
        ...uploadMeta, // filename, storage_key, width, height, file_size, uploaded_at, similarity_vector, image_url
        ...aiTags     // 用户最终确认的标签
        // description: aiResponse // 不再上传description
      };
      console.log('即将上传的payload:', payload);
      const response = await fetch('http://127.0.0.1:8000/images/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      message.success('已保存到服装库！');
      setUploadModalVisible(false);
      setUploadedFile(null);
      setImageUrl('');
      setAiTags(null);
      setAiResponse('');
      setUploadMeta(null);
      fetchClothingItems();
      
    } catch (error) {
      console.error('Save error:', error);
      message.error('保存失败：' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除这张图片吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`http://127.0.0.1:8000/images/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (response.ok) {
            message.success('删除成功！');
            fetchClothingItems();
          }
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const uploadProps = {
    accept: 'image/*',
    multiple: false,
    showUploadList: false,
    beforeUpload: handleUpload,
  };

  return (
    <div className="fashion-library-root">
      {/* 顶部导航栏 */}
      <div
        className="fashion-navbar"
        style={{
          background: `rgba(255,255,255,0.8)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid #e0e0e0',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px 0 24px',
          fontFamily: 'SF Pro, PingFang SC, sans-serif',
          transition: 'background 0.3s cubic-bezier(.4,0,.2,1)'
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <span
            className="navbar-logo"
            style={{
              fontWeight: 800,
              fontSize: 22,
              color: '#111827',
              letterSpacing: 1,
              marginLeft: 0,
              fontFamily: 'SF Pro, PingFang SC, Helvetica Neue, Arial, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            Fashion Manager
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Button
            className="navbar-btn"
            type="primary"
            icon={<UploadOutlined />}
            shape="round"
            size="large"
            style={{
              background: '#007aff',
              border: 'none',
              color: '#fff',
              fontWeight: 500,
              fontSize: 14,
              borderRadius: 32,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'transform 0.15s',
              marginLeft: 0
            }}
            onClick={() => setUploadModalVisible(true)}
          >
            上传服装
          </Button>
        </div>
      </div>
      {/* 居中大号上传服装按钮 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0px 0 32px 0' }}>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
        >
          <Button
            type="primary"
            icon={<UploadOutlined style={{ fontSize: 32, marginRight: 12 }} />}
            size="large"
            style={{
              height: 64,
              fontSize: 28,
              padding: '0 48px',
              borderRadius: 40,
              background: '#007aff',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              transition: 'transform 0.15s',
            }}
          >
            上传服装
          </Button>
        </Upload>
      </div>
      {/* 服装库卡片区 */}
      <div className="fashion-cards-bg">
        <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
          {clothingItems.length === 0 ? (
            <Empty
              description="暂无服装，请上传您的第一件服装"
              className="empty-state"
            />
          ) : (
            <>
              <Row gutter={[24, 32]} className="clothing-grid">
                {pageItems.map((item, idx) => (
                  <Col
                    key={item.id}
                    xs={24}
                    sm={12}
                    md={6}
                    lg={6}
                    style={{ display: 'flex', justifyContent: 'center' }}
                  >
                    <div
                      className={`fashion-card glass-card${visibleItems[item.id] ? ' visible' : ''}`}
                      ref={el => (cardRefs.current[item.id] = el)}
                      data-id={item.id}
                    >
                      <div className="image-container" style={{ aspectRatio: '4/5', width: '100%', minHeight: 0, height: 320, overflow: 'hidden', borderRadius: 16, background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Image
                          alt="clothing"
                          src={item.image_url}
                          preview={false}
                          className="clothing-image"
                          style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: 16 }}
                          onClick={() => {
                            setPreviewImage(item);
                            setPreviewModalVisible(true);
                          }}
                        />
                      </div>
                      <div className="card-content">
                        <div className="card-title" style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Segoe UI, Microsoft YaHei, Arial, sans-serif', color: '#1d1d1f', marginBottom: 0 }}>
                          服装 #{item.id}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <TagDisplay tags={item.tags} showEmpty={false} />
                        </div>
                      </div>
                      <div className="card-actions">
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/detail/${item.id}`)}
                          style={{ marginRight: 8 }}
                        >查看</Button>
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => handleDelete(item.id)}
                        >删除</Button>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={clothingItems.length}
                  onChange={page => setCurrentPage(page)}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </Spin>
      </div>
      {/* 上传模态框 */}
      <Modal
        title="上传服装 - AI识别标签"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setUploadedFile(null);
          setImageUrl('');
          setAiTags(null);
          setAiResponse('');
          setUploadMeta(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setUploadModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSaveToLibrary}
            loading={saving}
            disabled={!imageUrl || !aiTags}
          >
            保存到服装库
          </Button>
        ]}
        width={800}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 图片预览 */}
          <div className="upload-preview">
            {uploadedFile && (
              <img 
                src={imageUrl || URL.createObjectURL(uploadedFile)} 
                alt="preview" 
                className="preview-image"
                style={{ maxWidth: 250, maxHeight: 250, borderRadius: 8 }}
              />
            )}
          </div>

          {/* 获取图片URL */}
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>上传图片：</Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input 
                value={imageUrl} 
                placeholder="点击右侧按钮上传图片"
                readOnly
                prefix={<LinkOutlined />}
              />
              <Button 
                type="primary"
                onClick={handleGetImageUrl}
                loading={uploading}
                disabled={!uploadedFile || !!imageUrl}
              >
                {imageUrl ? '已上传' : '上传图片'}
              </Button>
            </Space.Compact>
          </Space>

          {/* 获取AI结果 */}
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>获取AI结果：</Text>
            <Button 
              type="primary"
              icon={<RobotOutlined />}
              onClick={handleGetAIResult}
              loading={gettingAI}
              disabled={!imageUrl || !!aiTags}
              style={{ width: '100%' }}
            >
              {aiTags ? '已识别' : '获取AI结果'}
            </Button>
          </Space>

          {/* AI识别原始结果展示为大号方框 */}
          <div style={{
            background: '#f5f5f5',
            borderRadius: 8,
            padding: '16px',
            fontSize: 20,
            minHeight: 80,
            marginBottom: 8,
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
            border: '1px solid #e0e0e0'
          }}>
            {aiResponse}
          </div>

          {/* AI结果展示 */}
          {aiTags && (
            <Card title="AI识别结果" size="small">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {editingTags ? (
                  <>
                    <Form
                      form={form}
                      layout="vertical"
                      initialValues={aiTags}
                      onValuesChange={handleTagsChange}
                    >
                      {ALL_TAG_KEYS.filter(key => key !== 'ai_confidence').map(key => (
                        <Form.Item label={<span style={{fontSize: 18}}>{key}</span>} name={key} key={key}>
                          <Select style={{fontSize: 18}} dropdownStyle={{fontSize: 16}}>
                            {(TAG_OPTIONS[key] || []).map(opt => (
                              <Select.Option value={opt} key={opt} style={{fontSize: 16}}>{opt}</Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      ))}
                    </Form>
                    <Button onClick={handleCancelEditTags} style={{ marginTop: 8 }}>
                      退出修改
                    </Button>
                  </>
                ) : (
                  <>
                    <div style={{fontSize: 26, display: 'flex', flexWrap: 'wrap', gap: '18px 24px', alignItems: 'center'}}>
                      <TagDisplay tags={aiTags} showEmpty={true} horizontal />
                    </div>
                    <Button onClick={handleEditTags} style={{ marginTop: 8 }}>
                      修改标签
                    </Button>
                  </>
                )}
              </Space>
            </Card>
          )}
        </Space>
      </Modal>

      {/* 预览模态框 */}
      <Modal
        open={previewModalVisible}
        footer={null}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
      >
        {previewImage && (
          <img 
            src={previewImage.image_url} 
            alt="preview" 
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </Modal>
      {/* 页脚 */}
      <footer className="fashion-footer">
        <div className="footer-content">© 2024 Fashion Manager. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default FashionLibrary;
