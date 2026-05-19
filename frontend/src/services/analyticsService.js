import api from './api';

export const getAnalyticsSummary = (params) => api.get('/analytics/summary', { params });
export const getAnalyticsByType = (params) => api.get('/analytics/by-type', { params });
export const getAnalyticsByDate = (params) => api.get('/analytics/by-date', { params });
export const getAnalyticsBySeverity = (params) => api.get('/analytics/by-severity', { params });
export const getAnalyticsHotspots = (params) => api.get('/analytics/hotspots', { params });
export const getAnalyticsResponseTime = (params) => api.get('/analytics/response-time', { params });
export const generateAIReport = (data) => api.post('/ai/generate-report', data);
