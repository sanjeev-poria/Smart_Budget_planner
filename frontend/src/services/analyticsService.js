import apiClient from './api';

/**
 * Retrieve deterministic Financial Health Score (0-100), 5 pillars, and risk level.
 * GET /api/v1/analytics/financial-health
 */
export const getFinancialHealth = async () => {
  const response = await apiClient.get('/api/v1/analytics/financial-health');
  return response.data;
};

/**
 * Retrieve consolidated cashflow summary.
 * GET /api/v1/analytics/summary
 */
export const getCashflowSummary = async () => {
  const response = await apiClient.get('/api/v1/analytics/summary');
  return response.data;
};
