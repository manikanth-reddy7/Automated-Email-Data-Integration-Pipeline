import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Empty, Spin, message, Typography } from 'antd';
import {
  MailOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { getDashboardStats } from '../services/api';

const { Title, Text } = Typography;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      message.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getStatusTag = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <Tag color="success" icon={<CheckCircleOutlined />}>SUCCESS</Tag>;
      case 'RUNNING':
        return <Tag color="processing" icon={<SyncOutlined spin />}>RUNNING</Tag>;
      case 'FAILED':
        return <Tag color="error" icon={<ExclamationCircleOutlined />}>FAILED</Tag>;
      default:
        return <Tag color="default">NO RUNS</Tag>;
    }
  };

  const getSourceColor = (source) => {
    const s = source.toLowerCase();
    if (s.includes('shop') || s.includes('order')) return 'gold';
    if (s.includes('support')) return 'blue';
    if (s.includes('alert')) return 'volcano';
    if (s.includes('job')) return 'cyan';
    if (s.includes('newsletter')) return 'purple';
    if (s.includes('billing')) return 'magenta';
    return 'lime';
  };

  const recentColumns = [
    {
      title: 'Email ID',
      dataIndex: 'email_id',
      key: 'email_id',
      render: (text) => <Text style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{text}</Text>,
    },
    {
      title: 'Sender',
      dataIndex: 'sender_email',
      key: 'sender_email',
      ellipsis: true,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts) => new Date(ts).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge status={status === 'read' ? 'success' : 'processing'} text={status} />
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source) => (
        <Tag color={getSourceColor(source)}>{source}</Tag>
      ),
    },
  ];

  // Custom Badge mapping for standard CSS styles
  const Badge = ({ status, text }) => {
    const color = status === 'success' ? '#10b981' : '#38bdf8';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          marginRight: 8,
          boxShadow: `0 0 8px ${color}`
        }} />
        <span style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{text}</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4 Stat Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8' }}>Total Emails</span>}
              value={stats?.total_emails || 0}
              valueStyle={{ color: '#f8fafc', fontWeight: 700 }}
              prefix={<MailOutlined style={{ color: '#38bdf8' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8' }}>Unread Emails</span>}
              value={stats?.unread_emails || 0}
              valueStyle={{ color: '#f8fafc', fontWeight: 700 }}
              prefix={<EyeInvisibleOutlined style={{ color: '#f59e0b' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8' }}>Distinct Senders</span>}
              value={stats?.distinct_senders || 0}
              valueStyle={{ color: '#f8fafc', fontWeight: 700 }}
              prefix={<UserOutlined style={{ color: '#ec4899' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', height: '100%' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Last Run Status</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>
              {getStatusTag(stats?.last_run_status)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Visual Analytics */}
      <Row gutter={[24, 24]}>
        {/* Emails by Source Chart */}
        <Col xs={24} md={12}>
          <Card 
            title={<span style={{ color: '#f8fafc' }}>Emails by Source / Channel</span>}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
          >
            {stats?.emails_by_source && stats.emails_by_source.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                {stats.emails_by_source.map((item, idx) => {
                  const maxCount = Math.max(...stats.emails_by_source.map(o => o.count), 1);
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#cbd5e1', textTransform: 'capitalize', fontWeight: 500 }}>{item.source}</span>
                        <span style={{ color: '#94a3b8' }}>{item.count} emails ({Math.round((item.count / stats.total_emails) * 100)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: '#0f172a', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)', 
                          borderRadius: '6px',
                          boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description={<span style={{ color: '#64748b' }}>No source data available. Run the pipeline first.</span>} />
            )}
          </Card>
        </Col>

        {/* Emails by Status Chart */}
        <Col xs={24} md={12}>
          <Card 
            title={<span style={{ color: '#f8fafc' }}>Emails by Read Status</span>}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
          >
            {stats?.emails_by_status && stats.emails_by_status.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0' }}>
                {stats.emails_by_status.map((item, idx) => {
                  const percentage = stats.total_emails > 0 ? (item.count / stats.total_emails) * 100 : 0;
                  const isRead = item.status === 'read';
                  const barColor = isRead ? '#10b981' : '#f59e0b';
                  const shadowColor = isRead ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)';
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#cbd5e1', textTransform: 'capitalize', fontWeight: 600 }}>{item.status}</span>
                        <span style={{ color: '#cbd5e1' }}>{item.count} emails ({Math.round(percentage)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '16px', background: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: barColor, 
                          borderRadius: '8px',
                          boxShadow: `0 0 12px ${shadowColor}`,
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description={<span style={{ color: '#64748b' }}>No status data available. Run the pipeline first.</span>} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Emails Table */}
      <Card 
        title={<span style={{ color: '#f8fafc' }}>Recent Processed Emails</span>}
        style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
      >
        {stats?.recent_emails && stats.recent_emails.length > 0 ? (
          <Table
            columns={recentColumns}
            dataSource={stats.recent_emails.map((e, idx) => ({ ...e, key: idx }))}
            pagination={false}
            size="middle"
            rowClassName={() => 'dark-table-row'}
          />
        ) : (
          <Empty description={<span style={{ color: '#64748b' }}>No processed emails found. Ingest some data!</span>} />
        )}
      </Card>
    </div>
  );
}
