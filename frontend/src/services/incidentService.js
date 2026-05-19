import api from './api';

export const getIncidents = (params) => api.get('/incidents', { params });
export const getActiveIncidents = () => api.get('/incidents?per_page=200');
export const getIncidentById = (id) => api.get(`/incidents/${id}`);
export const reportIncident = (data) => api.post('/incidents', data);
export const updateIncident = (id, data) => api.patch(`/incidents/${id}`, data);
export const deleteIncident = (id) => api.delete(`/incidents/${id}`);
export const assignIncident = (id, data) => api.post(`/incidents/${id}/assign`, data);
export const getIncidentUpdates = (id) => api.get(`/incidents/${id}/updates`);
export const addIncidentUpdate = (id, data) => api.post(`/incidents/${id}/updates`, data);
export const getCongestionPredictions = () => api.get('/ai/congestion-predictions');
