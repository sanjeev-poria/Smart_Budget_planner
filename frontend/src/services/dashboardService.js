import apiClient from './api';

/**
 * Retrieve consolidated dashboard data (summary cards, health score, emergency fund,
 * spending overview, recent transactions, budget alerts, and AI insights).
 * GET /api/v1/analytics/dashboard
 */
export const getDashboardOverview = async () => {
  const response = await apiClient.get('/api/v1/analytics/dashboard');
  return response.data;
};

/**
 * Retrieve dedicated emergency fund analytics.
 * GET /api/v1/analytics/emergency-fund
 */
export const getEmergencyFundData = async () => {
  const response = await apiClient.get('/api/v1/analytics/emergency-fund');
  return response.data;
};

/**
 * Retrieve spending breakdown and monthly cashflow timeline for Recharts.
 * GET /api/v1/analytics/spending-overview
 */
export const getSpendingOverview = async () => {
  const response = await apiClient.get('/api/v1/analytics/spending-overview');
  return response.data;
};

/**
 * Retrieve historical health score trend entries for Recharts.
 * GET /api/v1/analytics/score-history
 */
export const getScoreHistory = async () => {
  const response = await apiClient.get('/api/v1/analytics/score-history');
  return response.data;
};
