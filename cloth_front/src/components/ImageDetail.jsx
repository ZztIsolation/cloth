import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Image, 
  Space, 
  Button, 
  message,
  Spin,
  Typography,
  Row,
  Col,
  Divider,
  Modal
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined,
  EditOutlined
} from '@ant-design/icons';
import TagEditor from './TagEditor';
import TagDisplay from './TagDisplay';
import { getAllTagCategories } from '../utils/tagConfig';
import './ImageDetail.less';

const { Title, Text } = Typography;

const ALL_TAG_KEYS = [
  'style', 'tone', 'craft', 'collar', 'sleeve', 'color', 'silhouette', 'length',
  'material', 'pattern', 'occasion', 'season', 'style_tag', 'ai_confidence'
];

const ImageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clothing, setClothing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState({});
  const [originalTags, setOriginalTags] = useState({});

  // 初始化标签结构
  const initializeTags = () => {
    const initialTags = {};
    getAllTagCategories().forEach(category => {
      initialTags[category] = undefined;
    });
    return initialTags;
  };

  useEffect(() => {
    const fetchClothingDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:8000/images/${id}`, { credentials: 'include' });
        const data = await response.json();
        setClothing(data);
        setTags(data.tags || initializeTags());
        setOriginalTags(data.tags || initializeTags());
      } catch (error) {
        setClothing(null);
      }
      setLoading(false);
    };
    fetchClothingDetail();
  }, [id]);

  const handleSaveTags = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
        credentials: 'include'
      });
      
      if (response.ok) {
        message.success('标签已保存');
        setEditing(false);
        setOriginalTags(tags);
        setClothing({ ...clothing, tags });
      }
    } catch (error) {
      console.error('Save error:', error);
      message.error('保存失败');
    }
  };

  const handleCancelEdit = () => {
    setTags(originalTags);
    setEditing(false);
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (!clothing) {
    return <div style={{ textAlign: 'center', marginTop: 100 }}><Title level={3}>服装未找到</Title></div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <Button onClick={() => navigate('/library')} style={{ marginBottom: 24 }}>返回服装库</Button>
      <Row gutter={32}>
        <Col xs={24} md={12}>
          <Image src={clothing.image_url} alt={clothing.filename} style={{ width: '100%', borderRadius: 8 }} />
        </Col>
        <Col xs={24} md={12}>
          <Card title={`服装 #${clothing.id}`}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div><Text strong>文件名：</Text>{clothing.filename}</div>
              <div><Text strong>上传时间：</Text>{clothing.uploaded_at}</div>
              <Divider />
              <TagDisplay tags={Object.fromEntries(ALL_TAG_KEYS.map(k => [k, clothing[k]]))} showEmpty={true} horizontal />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ImageDetail;
