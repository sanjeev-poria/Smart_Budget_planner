import apiClient from './api';

/**
 * Retrieve all debts for authenticated user with summary metrics.
 * GET /api/v1/debts
 */
export const getDebts = async () => {
  const response = await apiClient.get('/api/v1/debts');
  return response.data;
};

/**
 * Retrieve single debt by ID.
 * GET /api/v1/debts/:id
 */
export const getDebt = async (id) => {
  const response = await apiClient.get(`/api/v1/debts/${id}`);
  return response.data;
};

/**
 * Create a new debt liability.
 * POST /api/v1/debts
 */
export const createDebt = async (debtData) => {
  const response = await apiClient.post('/api/v1/debts', debtData);
  return response.data;
};

/**
 * Update an existing debt.
 * PUT /api/v1/debts/:id
 */
export const updateDebt = async (id, debtData) => {
  const response = await apiClient.put(`/api/v1/debts/${id}`, debtData);
  return response.data;
};

/**
 * Delete a debt record.
 * DELETE /api/v1/debts/:id
 */
export const deleteDebt = async (id) => {
  const response = await apiClient.delete(`/api/v1/debts/${id}`);
  return response.data;
};

/**
 * Generate deterministic repayment plan (Avalanche vs Snowball).
 * POST /api/v1/debts/plan
 */
export const getRepaymentPlan = async (planParams) => {
  const response = await apiClient.post('/api/v1/debts/plan', planParams);
  return response.data;
};
