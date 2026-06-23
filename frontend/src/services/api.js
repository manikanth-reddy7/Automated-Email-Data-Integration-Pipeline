const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : '/_/backend/api');

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'File upload failed');
  }

  return response.json();
}

export async function triggerPipeline(fileName) {
  const response = await fetch(`${API_BASE_URL}/pipeline/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_name: fileName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to trigger pipeline');
  }

  return response.json();
}

export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard statistics');
  }
  return response.json();
}

export async function getProcessedEmails(params = {}) {
  const { page = 1, limit = 10, search = '', status = '', source = '' } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) queryParams.append('search', search);
  if (status) queryParams.append('status', status);
  if (source) queryParams.append('source', source);

  const response = await fetch(`${API_BASE_URL}/emails?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch processed emails');
  }
  return response.json();
}

export async function getRawEmail(emailId) {
  const response = await fetch(`${API_BASE_URL}/emails/${emailId}/raw`);
  if (!response.ok) {
    throw new Error('Failed to fetch raw email details');
  }
  return response.json();
}

export async function getPipelineRuns() {
  const response = await fetch(`${API_BASE_URL}/pipeline/runs`);
  if (!response.ok) {
    throw new Error('Failed to fetch pipeline run history');
  }
  return response.json();
}
