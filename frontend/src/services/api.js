const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api'
    : '/_/backend/api');

async function parseResponse(response) {
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // If it's not valid JSON and the response is not OK, throw the raw text (like gateway errors or HTML)
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
    }
    throw new Error(`Invalid JSON response: ${text}`);
  }

  if (!response.ok) {
    throw new Error(json.detail || json.error || `Request failed with status ${response.status}`);
  }

  return json;
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  return parseResponse(response);
}

export async function triggerPipeline(fileName) {
  const response = await fetch(`${API_BASE_URL}/pipeline/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_name: fileName }),
  });

  return parseResponse(response);
}

export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
  return parseResponse(response);
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
  return parseResponse(response);
}

export async function getRawEmail(emailId) {
  const response = await fetch(`${API_BASE_URL}/emails/${emailId}/raw`);
  return parseResponse(response);
}

export async function getPipelineRuns() {
  const response = await fetch(`${API_BASE_URL}/pipeline/runs`);
  return parseResponse(response);
}
