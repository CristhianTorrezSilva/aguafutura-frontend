import api from './api';

export const tenantsApi = {
  list: () => api.get('/api/v1/tenants'),
};

export const coreApi = {
  health: () => api.get('/api/v1/health'),
  ping: () => api.get('/api/v1/ping'),
};

export const authApi = {
  login: (payload) => api.post('/api/v1/auth/login', payload),
  register: (payload) => api.post('/api/v1/auth/register', payload),
  me: () => api.get('/api/v1/auth/me'),
};

export const analyticsApi = {
  dashboard: () => api.get('/api/v1/analytics/dashboard'),
};

export const zonesApi = {
  list: () => api.get('/api/v1/zones'),
  create: (payload) => api.post('/api/v1/zones', payload),
  update: (zoneId, payload) => api.patch(`/api/v1/zones/${zoneId}`, payload),
  remove: (zoneId) => api.delete(`/api/v1/zones/${zoneId}`),
};

export const assetsApi = {
  list: () => api.get('/api/v1/assets'),
  create: (payload) => api.post('/api/v1/assets', payload),
  update: (assetId, payload) => api.patch(`/api/v1/assets/${assetId}`, payload),
  remove: (assetId) => api.delete(`/api/v1/assets/${assetId}`),
};

export const consumptionsApi = {
  byAsset: (assetId) => api.get(`/api/v1/consumptions/asset/${assetId}`),
  create: (payload) => api.post('/api/v1/consumptions', payload),
  update: (consumptionId, payload) => api.patch(`/api/v1/consumptions/${consumptionId}`, payload),
};

export const incidentsApi = {
  list: () => api.get('/api/v1/incidents'),
  create: (payload) => api.post('/api/v1/incidents', payload),
  update: (incidentId, payload) => api.patch(`/api/v1/incidents/${incidentId}`, payload),
  remove: (incidentId) => api.delete(`/api/v1/incidents/${incidentId}`),
};

export const workOrdersApi = {
  list: () => api.get('/api/v1/work-orders'),
  create: (payload) => api.post('/api/v1/work-orders', payload),
  update: (workOrderId, payload) => api.patch(`/api/v1/work-orders/${workOrderId}`, payload),
  remove: (workOrderId) => api.delete(`/api/v1/work-orders/${workOrderId}`),
};

export const evidenceApi = {
  upload: (formData) =>
    api.post('/api/v1/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (referenceType, referenceId) =>
    api.get(`/api/v1/evidence/${referenceType}/${referenceId}`),
  referenceOptions: (type) => api.get('/api/v1/evidence/reference-options', { params: { type } }),
  download: (evidenceId) =>
    api.get(`/api/v1/evidence/download/${evidenceId}`, {
      responseType: 'blob',
    }),
};

export const aiApi = {
  analyzeAsset: (assetId) => api.get(`/api/v1/ai/analyze/${assetId}`),
  assetSuggestions: (assetId) => api.get(`/api/v1/ai/suggestions/assets/${assetId}`),
  incidentSuggestions: (incidentId) => api.get(`/api/v1/ai/suggestions/incidents/${incidentId}`),
};
