import React, { useState } from 'react';
import { Card, Upload, Button, Alert, Space, Typography, message, Progress } from 'antd';
import { InboxOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { uploadFile, triggerPipeline } from '../services/api';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

export default function UploadEmails() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [running, setRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState(null);

  const customUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true);
    setPipelineResult(null);
    try {
      const data = await uploadFile(file);
      setUploadedFile(data);
      onSuccess(data);
      message.success(`${file.name} uploaded to backend uploads staging.`);
    } catch (err) {
      onError(err);
      message.error(err.message || `Failed to upload ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRunPipeline = async () => {
    if (!uploadedFile) return;
    setRunning(true);
    try {
      const data = await triggerPipeline(uploadedFile.file_name);
      setPipelineResult(data);
      message.success(`Pipeline triggered successfully! Run ID: ${data.run_id}`);
    } catch (err) {
      message.error(err.message || 'Failed to trigger pipeline execution.');
    } finally {
      setRunning(false);
    }
  };

  const draggerProps = {
    name: 'file',
    multiple: false,
    accept: '.csv,.json',
    customRequest: customUpload,
    showUploadList: false,
    disabled: uploading || running,
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Card style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}>
        <Title level={3} style={{ color: '#f8fafc', marginTop: 0 }}>Upload Email Dataset</Title>
        <Paragraph style={{ color: '#94a3b8' }}>
          Select or drag a CSV or JSON file containing email data. The pipeline will clean, standardize, and load the dataset into both PostgreSQL (relational metadata) and MongoDB (raw emails).
        </Paragraph>

        <div style={{ padding: '24px 0' }}>
          <Dragger {...draggerProps} style={{ background: '#0f172a', border: '2px dashed #475569', borderRadius: '8px' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#38bdf8', fontSize: '48px' }} />
            </p>
            <p style={{ color: '#f8fafc', fontSize: '16px', fontWeight: 500, margin: '8px 0' }}>
              Click or drag file to this area to upload
            </p>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
              Support for a single CSV or JSON file. Checks structure, converts formats, and cleans fields.
            </p>
          </Dragger>
        </div>

        {uploading && (
          <div style={{ margin: '16px 0', textAlign: 'center' }}>
            <Progress percent={99} status="active" strokeColor="#38bdf8" />
            <Text style={{ color: '#94a3b8' }}>Uploading file to FastAPI backend...</Text>
          </div>
        )}

        {uploadedFile && (
          <Card 
            style={{ 
              background: '#0f172a', 
              border: '1px solid #334155', 
              borderRadius: '8px', 
              marginTop: '16px' 
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text style={{ color: '#94a3b8', display: 'block', fontSize: '12px' }}>Staged File Name</Text>
                  <Text style={{ color: '#f8fafc', fontWeight: 600, fontSize: '16px' }}>{uploadedFile.file_name}</Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />} 
                  onClick={handleRunPipeline}
                  loading={running}
                  disabled={uploading}
                  style={{ background: '#0284c7', borderColor: '#0284c7', height: '40px', borderRadius: '6px' }}
                >
                  {running ? 'Running ETL...' : 'Run Pipeline'}
                </Button>
              </div>
              <Alert 
                message="File upload complete. Click 'Run Pipeline' to trigger extraction, standardization, deduplication, and database load."
                type="info"
                showIcon
                style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}
              />
            </Space>
          </Card>
        )}

        {pipelineResult && (
          <div style={{ marginTop: '24px' }}>
            <Alert
              message={<span style={{ fontWeight: 600 }}>Pipeline Successfully Triggered</span>}
              description={
                <div>
                  <Text style={{ color: '#064e3b', display: 'block' }}>
                    The backend ETL pipeline is executing in the background. You can check its progress, logs, and valid/invalid record counts on the **Pipeline Logs** tab.
                  </Text>
                  <Text style={{ color: '#064e3b', fontWeight: 'bold', marginTop: '8px', display: 'block' }}>
                    Run ID: {pipelineResult.run_id}
                  </Text>
                </div>
              }
              type="success"
              showIcon
              icon={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
            />
          </div>
        )}
      </Card>

      <Card 
        title={<span style={{ color: '#f8fafc' }}>Expected CSV Format Reference</span>}
        style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
      >
        <Paragraph style={{ color: '#94a3b8' }}>
          Your uploaded CSV file should contain the following headers:
        </Paragraph>
        <div style={{ 
          background: '#0f172a', 
          padding: '16px', 
          borderRadius: '8px', 
          fontFamily: 'monospace', 
          color: '#cbd5e1', 
          overflowX: 'auto',
          border: '1px solid #334155'
        }}>
          email_id,sender_email,receiver_email,subject,body,timestamp,status,source<br />
          E101,orders@amazon.in,user@gmail.com,Your order has shipped,Your package will arrive tomorrow,2026-06-23 10:30:00,unread,shopping<br />
          E102,support@zomato.com,user@gmail.com,Issue update,Your issue has been resolved,2026-06-23 12:00:00,read,support
        </div>
      </Card>
    </div>
  );
}
