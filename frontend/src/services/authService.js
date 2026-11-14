import apiClient from './api';

/**
 * Register a new user account.
 * POST /api/v1/auth/register
 */
export const registerUser = async (userData) => {
  const response = await apiClient.post('/api/v1/auth/register', userData);
  return response.data;
};

/**
 * Authenticate user credentials and retrieve JWT token.
 * POST /api/v1/auth/login
 */
export const loginUser = async (credentials) => {
  const response = await apiClient.post('/api/v1/auth/login', credentials);
  return response.data;
};

/**
 * Retrieve current authenticated user profile.
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/v1/auth/me');
  return response.data;
};

/**
 * Update authenticated user personal and financial profile.
 * PUT /api/v1/users/profile
 */
export const updateUserProfile = async (profileData) => {
  const response = await apiClient.put('/api/v1/users/profile', profileData);
  return response.data;
};
