import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, message, Spin, Typography } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { getPipelineRuns } from '../services/api';

const { Title, Text } = Typography;

export default function PipelineRuns() {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState([]);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const data = await getPipelineRuns();
      setRuns(data);
    } catch (err) {
      message.error('Failed to load pipeline run history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    // Poll logs every 15 seconds
    const interval = setInterval(fetchRuns, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusTag = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <Tag color="success" icon={<CheckCircleOutlined />}>SUCCESS</Tag>;
      case 'RUNNING':
        return <Tag color="processing" icon={<SyncOutlined spin />}>RUNNING</Tag>;
      case 'FAILED':
        return <Tag color="error" icon={<ExclamationCircleOutlined />}>FAILED</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getDuration = (record) => {
    if (!record.started_at || !record.ended_at) return '-';
    const start = new Date(record.started_at);
    const end = new Date(record.ended_at);
    const diffMs = end - start;
    if (diffMs < 0) return '-';
    
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s`;
    
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins}m ${secs}s`;
  };

  const columns = [
    {
      title: 'Run ID',
      dataIndex: 'run_id',
      key: 'run_id',
      render: (text) => <Text style={{ fontWeight: 600, color: '#f8fafc' }}>#{text}</Text>,
      sorter: (a, b) => a.run_id - b.run_id,
    },
    {
      title: 'File Name',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      render: (text) => <Text style={{ color: '#e2e8f0' }}>{text}</Text>,
    },
    {
      title: 'Total Records',
      dataIndex: 'total_records',
      key: 'total_records',
      render: (val) => val || 0,
    },
    {
      title: 'Valid Records',
      dataIndex: 'valid_records',
      key: 'valid_records',
      render: (val) => (
        <span style={{ color: '#10b981', fontWeight: 500 }}>{val || 0}</span>
      ),
    },
    {
      title: 'Invalid Records',
      dataIndex: 'invalid_records',
      key: 'invalid_records',
      render: (val) => (
        <span style={{ color: val > 0 ? '#ef4444' : '#64748b', fontWeight: 500 }}>{val || 0}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Started At',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (ts) => ts ? new Date(ts).toLocaleString() : '-',
    },
    {
      title: 'Ended At',
      dataIndex: 'ended_at',
      key: 'ended_at',
      render: (ts) => ts ? new Date(ts).toLocaleString() : '-',
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => getDuration(record),
    },
  ];

  return (
    <div>
      <Card style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ color: '#f8fafc', margin: 0 }}>ETL Pipeline Execution Logs</Title>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchRuns}
            style={{ background: '#0284c7', borderColor: '#0284c7' }}
          >
            Refresh Logs
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={runs.map((r, idx) => ({ ...r, key: r.run_id || idx }))}
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
          rowClassName={() => 'dark-table-row'}
        />
      </Card>
    </div>
  );
}
