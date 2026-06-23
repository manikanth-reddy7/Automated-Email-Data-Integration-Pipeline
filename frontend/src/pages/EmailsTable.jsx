import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Select, Button, Drawer, Tag, Space, Descriptions, Spin, message, Typography, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, MailOutlined } from '@ant-design/icons';
import { getProcessedEmails, getRawEmail } from '../services/api';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

export default function EmailsTable() {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loadingRaw, setLoadingRaw] = useState(false);

  const fetchEmails = async (page = currentPage) => {
    setLoading(true);
    try {
      const data = await getProcessedEmails({
        page,
        limit,
        search,
        status,
        source
      });
      setEmails(data.emails);
      setTotalRecords(data.total_records);
      setCurrentPage(page);
    } catch (err) {
      message.error('Failed to load processed emails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails(1);
  }, [status, source]);

  const handleSearch = () => {
    fetchEmails(1);
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setSource('');
    setCurrentPage(1);
    fetchEmails(1);
  };

  const handleOpenRaw = async (emailId) => {
    setDrawerOpen(true);
    setLoadingRaw(true);
    try {
      const data = await getRawEmail(emailId);
      setSelectedEmail(data);
    } catch (err) {
      message.error('Failed to retrieve raw email body from NoSQL.');
      setDrawerOpen(false);
    } finally {
      setLoadingRaw(false);
    }
  };

  const getSourceColor = (source) => {
    const s = source ? source.toLowerCase() : '';
    if (s.includes('shop') || s.includes('order')) return 'gold';
    if (s.includes('support')) return 'blue';
    if (s.includes('alert')) return 'volcano';
    if (s.includes('job')) return 'cyan';
    if (s.includes('newsletter')) return 'purple';
    if (s.includes('billing')) return 'magenta';
    return 'lime';
  };

  const columns = [
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
      title: 'Sender Domain',
      dataIndex: 'sender_domain',
      key: 'sender_domain',
      render: (domain) => domain || <Text style={{ color: '#64748b' }}>-</Text>,
    },
    {
      title: 'Receiver',
      dataIndex: 'receiver_email',
      key: 'receiver_email',
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
        <Tag color={status === 'read' ? 'success' : 'processing'}>{status}</Tag>
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
    {
      title: 'Body Length',
      dataIndex: 'body_length',
      key: 'body_length',
      render: (len) => `${len} chars`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => handleOpenRaw(record.email_id)}
          style={{ color: '#38bdf8', padding: 0 }}
        >
          View Raw
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
        <Title level={3} style={{ color: '#f8fafc', marginTop: 0, marginBottom: '24px' }}>Processed Emails Metadata</Title>
        
        {/* Filters Panel */}
        <Space wrap style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Space wrap>
            <Input
              placeholder="Search sender or subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: '#64748b' }} />}
              style={{ width: '240px', background: '#0f172a', border: '1px solid #334155', color: '#cbd5e1' }}
            />
            
            <Select
              placeholder="Filter by Status"
              value={status || undefined}
              onChange={(val) => setStatus(val || '')}
              allowClear
              style={{ width: '150px' }}
              dropdownStyle={{ background: '#1e293b' }}
            >
              <Option value="read">Read</Option>
              <Option value="unread">Unread</Option>
            </Select>

            <Select
              placeholder="Filter by Source"
              value={source || undefined}
              onChange={(val) => setSource(val || '')}
              allowClear
              style={{ width: '150px' }}
              dropdownStyle={{ background: '#1e293b' }}
            >
              <Option value="shopping">Shopping</Option>
              <Option value="support">Support</Option>
              <Option value="alerts">Alerts</Option>
              <Option value="jobs">Jobs</Option>
              <Option value="newsletter">Newsletter</Option>
              <Option value="billing">Billing</Option>
              <Option value="spam">Spam</Option>
            </Select>
            
            <Button 
              type="primary" 
              onClick={handleSearch}
              style={{ background: '#0284c7', borderColor: '#0284c7' }}
            >
              Apply
            </Button>
            
            <Button onClick={handleReset}>Reset</Button>
          </Space>
          
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => fetchEmails(currentPage)}
            style={{ float: 'right' }}
          />
        </Space>

        {/* Paginated Table */}
        <Table
          columns={columns}
          dataSource={emails.map((e, idx) => ({ ...e, key: e.email_id || idx }))}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: limit,
            total: totalRecords,
            onChange: (page) => fetchEmails(page),
            showSizeChanger: false,
          }}
          size="middle"
          rowClassName={() => 'dark-table-row'}
        />
      </Card>

      {/* Raw Email Details Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MailOutlined style={{ color: '#38bdf8', fontSize: '20px' }} />
            <span style={{ color: '#f8fafc' }}>Full Email Document (NoSQL Storage)</span>
          </div>
        }
        placement="right"
        width={650}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        headerStyle={{ background: '#1e293b', borderBottom: '1px solid #334155' }}
        bodyStyle={{ background: '#0f172a', color: '#cbd5e1' }}
      >
        {loadingRaw ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <Spin size="large" />
          </div>
        ) : selectedEmail ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title={<span style={{ color: '#38bdf8' }}>Metadata Fields</span>} bordered column={1} size="small">
              <Descriptions.Item label="Email ID">{selectedEmail.email_id}</Descriptions.Item>
              <Descriptions.Item label="Sender">{selectedEmail.sender_email}</Descriptions.Item>
              <Descriptions.Item label="Sender Domain">{selectedEmail.sender_domain || '-'}</Descriptions.Item>
              <Descriptions.Item label="Receiver">{selectedEmail.receiver_email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Subject">{selectedEmail.subject || '-'}</Descriptions.Item>
              <Descriptions.Item label="Timestamp">{new Date(selectedEmail.timestamp).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedEmail.status === 'read' ? 'success' : 'processing'}>
                  {selectedEmail.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Source">
                <Tag color={getSourceColor(selectedEmail.source)}>
                  {selectedEmail.source}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Storage loaded_at">{selectedEmail.loaded_at ? new Date(selectedEmail.loaded_at).toLocaleString() : '-'}</Descriptions.Item>
            </Descriptions>

            <div>
              <Title level={5} style={{ color: '#38bdf8', marginBottom: '12px' }}>Raw Email Body Content</Title>
              <div style={{ 
                background: '#1e293b', 
                padding: '20px', 
                borderRadius: '8px', 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'system-ui, sans-serif',
                border: '1px solid #334155',
                color: '#cbd5e1',
                lineHeight: 1.6
              }}>
                {selectedEmail.body || <span style={{ fontStyle: 'italic', color: '#64748b' }}>[Empty email body]</span>}
              </div>
            </div>
          </Space>
        ) : (
          <Empty description="No email details found." />
        )}
      </Drawer>
    </div>
  );
}
