import apiClient from './api';

/**
 * Retrieve all financial goals for the authenticated user with computed metrics and summary.
 * GET /api/v1/goals
 */
export const getGoals = async () => {
  const response = await apiClient.get('/api/v1/goals');
  return response.data;
};

/**
 * Retrieve a single goal by ID.
 * GET /api/v1/goals/:id
 */
export const getGoal = async (id) => {
  const response = await apiClient.get(`/api/v1/goals/${id}`);
  return response.data;
};

/**
 * Create a new financial goal.
 * POST /api/v1/goals
 */
export const createGoal = async (goalData) => {
  const response = await apiClient.post('/api/v1/goals', goalData);
  return response.data;
};

/**
 * Update an existing goal.
 * PUT /api/v1/goals/:id
 */
export const updateGoal = async (id, goalData) => {
  const response = await apiClient.put(`/api/v1/goals/${id}`, goalData);
  return response.data;
};

/**
 * Delete a goal by ID.
 * DELETE /api/v1/goals/:id
 */
export const deleteGoal = async (id) => {
  const response = await apiClient.delete(`/api/v1/goals/${id}`);
  return response.data;
};
