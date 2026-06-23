import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  UploadOutlined,
  MailOutlined,
  HistoryOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import { getDashboardStats } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function AppLayout({ children, currentTab, setCurrentTab }) {
  const [collapsed, setCollapsed] = useState(false);
  const [lastStatus, setLastStatus] = useState('NO_RUNS');

  // Fetch last status occasionally
  const fetchStatus = async () => {
    try {
      const stats = await getDashboardStats();
      setLastStatus(stats.last_run_status);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge status="success" text="Pipeline: Success" />;
      case 'RUNNING':
        return <Badge status="processing" text="Pipeline: Running" />;
      case 'FAILED':
        return <Badge status="error" text="Pipeline: Failed" />;
      default:
        return <Badge status="default" text="Pipeline: Idle" />;
    }
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'upload',
      icon: <UploadOutlined />,
      label: 'Upload Emails',
    },
    {
      key: 'emails',
      icon: <MailOutlined />,
      label: 'Processed Emails',
    },
    {
      key: 'runs',
      icon: <HistoryOutlined />,
      label: 'Pipeline Logs',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          background: '#1e293b',
          borderRight: '1px solid #334155',
        }}
        theme="dark"
      >
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: '0 24px',
          borderBottom: '1px solid #334155',
          background: '#0f172a'
        }}>
          <CloudServerOutlined style={{ fontSize: '24px', color: '#38bdf8', marginRight: collapsed ? 0 : '12px' }} />
          {!collapsed && (
            <Title level={5} style={{ margin: 0, color: '#f8fafc', fontWeight: 700 }}>
              Email ETL
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentTab]}
          onClick={({ key }) => setCurrentTab(key)}
          style={{ background: 'transparent', padding: '16px 0' }}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ background: '#0f172a' }}>
        <Header style={{ 
          background: '#1e293b', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155',
          height: '64px'
        }}>
          <Title level={4} style={{ margin: 0, color: '#f8fafc' }}>
            Automated Email Data Integration Pipeline
          </Title>
          <div style={{ background: '#0f172a', padding: '6px 16px', borderRadius: '8px', border: '1px solid #334155' }}>
            {getStatusBadge(lastStatus)}
          </div>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
