import apiClient from './api';

/**
 * Retrieve user's live baseline profile for populating initial simulation sliders.
 * GET /api/v1/what-if/baseline
 */
export const getBaselineProfile = async () => {
  const response = await apiClient.get('/api/v1/what-if/baseline');
  return response.data;
};

/**
 * Execute real-time deterministic sensitivity calculation for scenario overrides.
 * POST /api/v1/what-if/simulate
 */
export const simulateScenario = async (inputs) => {
  const response = await apiClient.post('/api/v1/what-if/simulate', inputs);
  return response.data;
};

/**
 * Retrieve all saved scenarios for authenticated user.
 * GET /api/v1/what-if/saved
 */
export const getSavedScenarios = async () => {
  const response = await apiClient.get('/api/v1/what-if/saved');
  return response.data;
};

/**
 * Explicitly save a named scenario to MongoDB.
 * POST /api/v1/what-if/saved
 */
export const saveScenario = async (scenarioData) => {
  const response = await apiClient.post('/api/v1/what-if/saved', scenarioData);
  return response.data;
};

/**
 * Retrieve a single saved scenario by ID.
 * GET /api/v1/what-if/saved/:id
 */
export const getSavedScenarioById = async (id) => {
  const response = await apiClient.get(`/api/v1/what-if/saved/${id}`);
  return response.data;
};

/**
 * Rename or update an existing saved scenario.
 * PUT /api/v1/what-if/saved/:id
 */
export const updateSavedScenario = async (id, scenarioData) => {
  const response = await apiClient.put(`/api/v1/what-if/saved/${id}`, scenarioData);
  return response.data;
};

/**
 * Delete a saved scenario from MongoDB.
 * DELETE /api/v1/what-if/saved/:id
 */
export const deleteSavedScenario = async (id) => {
  const response = await apiClient.delete(`/api/v1/what-if/saved/${id}`);
  return response.data;
};
