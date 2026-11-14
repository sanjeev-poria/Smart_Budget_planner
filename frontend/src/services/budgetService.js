import apiClient from './api';

/**
 * Retrieve monthly budget overview with category spending and adherence status.
 * GET /api/v1/budgets?month=:month&year=:year
 */
export const getBudgets = async (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  const response = await apiClient.get('/api/v1/budgets', { params });
  return response.data;
};

/**
 * Create a new budget or update limit if it exists for this category/month/year.
 * POST /api/v1/budgets
 */
export const createBudget = async (budgetData) => {
  const response = await apiClient.post('/api/v1/budgets', budgetData);
  return response.data;
};

/**
 * Retrieve single budget item by ID.
 * GET /api/v1/budgets/:id
 */
export const getBudgetById = async (id) => {
  const response = await apiClient.get(`/api/v1/budgets/${id}`);
  return response.data;
};

/**
 * Update existing budget limit or category.
 * PUT /api/v1/budgets/:id
 */
export const updateBudget = async (id, budgetData) => {
  const response = await apiClient.put(`/api/v1/budgets/${id}`, budgetData);
  return response.data;
};

/**
 * Delete a budget item.
 * DELETE /api/v1/budgets/:id
 */
export const deleteBudget = async (id) => {
  const response = await apiClient.delete(`/api/v1/budgets/${id}`);
  return response.data;
};

/**
 * Copy previous month's budgets into target month.
 * POST /api/v1/budgets/copy-previous
 */
export const copyPreviousMonthBudgets = async (sourceMonth, sourceYear, targetMonth, targetYear) => {
  const response = await apiClient.post('/api/v1/budgets/copy-previous', {
    source_month: sourceMonth,
    source_year: sourceYear,
    target_month: targetMonth,
    target_year: targetYear,
  });
  return response.data;
};
