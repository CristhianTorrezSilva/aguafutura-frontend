import api from './api';

export const tenantsApi = {
  list: () => api.get('/api/v1/tenants'),
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
};

export const consumptionsApi = {
  byAsset: (assetId) => api.get(`/api/v1/consumptions/asset/${assetId}`),
  create: (payload) => api.post('/api/v1/consumptions', payload),
};

export const incidentsApi = {
  list: () => api.get('/api/v1/incidents'),
  create: (payload) => api.post('/api/v1/incidents', payload),
};

export const workOrdersApi = {
  list: () => api.get('/api/v1/work-orders'),
  create: (payload) => api.post('/api/v1/work-orders', payload),
};

export const evidenceApi = {
  upload: (formData) =>
    api.post('/api/v1/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (referenceType, referenceId) =>
    api.get(`/api/v1/evidence/${referenceType}/${referenceId}`),
  download: (url) =>
    api.get(url, {
      responseType: 'blob',
    }),
};

export const aiApi = {
  analyzeAsset: (assetId) => api.get(`/api/v1/ai/analyze/${assetId}`),
  assetSuggestions: (assetId) => api.get(`/api/v1/ai/suggestions/assets/${assetId}`),
  incidentSuggestions: (incidentId) => api.get(`/api/v1/ai/suggestions/incidents/${incidentId}`),
};
