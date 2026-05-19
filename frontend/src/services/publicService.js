import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const submitPublicReport = (formData) => {
  return publicApi.post('/public/report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const trackPublicIncident = (trackingId) => {
  return publicApi.get(`/public/track/${trackingId}`);
};
