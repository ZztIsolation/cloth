import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Space, Typography } from 'antd';
import { HomeOutlined, SearchOutlined, UploadOutlined, DatabaseOutlined } from '@ant-design/icons';
import FashionLibrary from './components/FashionLibrary';
import ImageDetail from './components/ImageDetail';
import SearchPage from './components/SearchPage';
import './App.less';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App = () => {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState('library');

  const menuItems = [
    {
      key: 'library',
      icon: <DatabaseOutlined />,
      label: '服装库',
      onClick: () => navigate('/library')
    },
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: '搜索',
      onClick: () => navigate('/search')
    }
  ];

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="brand-logo">
              <span className="brand-text-light">Fashion</span>
              <span className="brand-text-bold">Manager</span>
            </div>
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            className="main-menu"
            onClick={({ key }) => setSelectedKey(key)}
          />
        </div>
      </Header>
      
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="/library" element={<FashionLibrary />} />
          <Route path="/detail/:id" element={<ImageDetail />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </Content>
      
      <Footer className="app-footer">
        Fashion Management System ©2025 Created with React & Ant Design
      </Footer>
    </Layout>
  );
};

export default App;
