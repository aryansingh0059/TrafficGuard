import api from './api';

/**
 * POST /auth/register
 */
export const registerUser = (data) => api.post('/auth/register', data);

/**
 * POST /auth/login
 */
export const loginUser = (data) => api.post('/auth/login', data);

/**
 * POST /auth/logout
 */
export const logoutUser = () => api.post('/auth/logout');

/**
 * GET /auth/profile
 */
export const getProfile = () => api.get('/auth/profile');

/**
 * POST /auth/forgot-password
 */
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

/**
 * POST /auth/reset-password
 */
export const resetPassword = (data) => api.post('/auth/reset-password', data);
