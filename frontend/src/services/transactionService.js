import apiClient from './api';

/**
 * Fetch paginated and filtered transactions.
 * GET /api/v1/transactions
 */
export const getTransactions = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.type && params.type !== 'all') queryParams.append('type', params.type);
  if (params.category && params.category !== 'all') queryParams.append('category', params.category);
  if (params.startDate) queryParams.append('start_date', params.startDate);
  if (params.endDate) queryParams.append('end_date', params.endDate);
  if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());

  const response = await apiClient.get(`/api/v1/transactions?${queryParams.toString()}`);
  return response.data;
};

/**
 * Retrieve single transaction by ID.
 * GET /api/v1/transactions/{id}
 */
export const getTransaction = async (id) => {
  const response = await apiClient.get(`/api/v1/transactions/${id}`);
  return response.data;
};

/**
 * Record a new transaction.
 * POST /api/v1/transactions
 */
export const createTransaction = async (data) => {
  const response = await apiClient.post('/api/v1/transactions', data);
  return response.data;
};

/**
 * Update an existing transaction.
 * PUT /api/v1/transactions/{id}
 */
export const updateTransaction = async (id, data) => {
  const response = await apiClient.put(`/api/v1/transactions/${id}`, data);
  return response.data;
};

/**
 * Delete a transaction.
 * DELETE /api/v1/transactions/{id}
 */
export const deleteTransaction = async (id) => {
  const response = await apiClient.delete(`/api/v1/transactions/${id}`);
  return response.data;
};
