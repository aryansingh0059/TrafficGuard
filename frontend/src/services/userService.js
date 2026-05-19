import api from './api';

export const getOfficers = () => api.get('/users?role=traffic_officer');
