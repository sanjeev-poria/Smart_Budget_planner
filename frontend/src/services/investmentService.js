import apiClient from './api';

/**
 * Calculate deterministic investment projection with given parameters.
 * POST /api/v1/investments/calculate
 */
export const calculateProjection = async (params) => {
  const response = await apiClient.post('/api/v1/investments/calculate', params);
  return response.data;
};

/**
 * Retrieve saved investment assumptions for the user.
 * GET /api/v1/investments/assumptions
 */
export const getAssumptions = async () => {
  const response = await apiClient.get('/api/v1/investments/assumptions');
  return response.data;
};

/**
 * Persist updated investment assumptions to MongoDB.
 * PUT /api/v1/investments/assumptions
 */
export const saveAssumptions = async (assumptionsData) => {
  const response = await apiClient.put('/api/v1/investments/assumptions', assumptionsData);
  return response.data;
};

/**
 * Retrieve consolidated projection using saved user assumptions.
 * GET /api/v1/investments/projection
 */
export const getSavedProjection = async () => {
  const response = await apiClient.get('/api/v1/investments/projection');
  return response.data;
};
