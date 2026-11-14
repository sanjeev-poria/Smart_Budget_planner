import apiClient from './api';

/**
 * Retrieve centralized tax configuration, section caps, supported categories, and legal disclaimers.
 * GET /api/v1/tax/config
 */
export const getTaxConfig = async () => {
  const response = await apiClient.get('/api/v1/tax/config');
  return response.data;
};

/**
 * Retrieve consolidated tax overview for a financial year (80C summary, deductions, regime comparison).
 * GET /api/v1/tax/overview?financial_year=:fy&gross_income=:gross
 */
export const getTaxOverview = async (financialYear = '2025-26', grossIncome = null) => {
  const params = { financial_year: financialYear };
  if (grossIncome && grossIncome > 0) {
    params.gross_income = grossIncome;
  }
  const response = await apiClient.get('/api/v1/tax/overview', { params });
  return response.data;
};

/**
 * Record a new tax-saving investment (PPF, ELSS, LIC, NSC, EPF, etc.).
 * POST /api/v1/tax/investments
 */
export const createTaxInvestment = async (investmentData) => {
  const response = await apiClient.post('/api/v1/tax/investments', investmentData);
  return response.data;
};

/**
 * Update an existing tax investment record.
 * PUT /api/v1/tax/investments/:id
 */
export const updateTaxInvestment = async (id, investmentData) => {
  const response = await apiClient.put(`/api/v1/tax/investments/${id}`, investmentData);
  return response.data;
};

/**
 * Delete a tax investment record.
 * DELETE /api/v1/tax/investments/:id
 */
export const deleteTaxInvestment = async (id) => {
  const response = await apiClient.delete(`/api/v1/tax/investments/${id}`);
  return response.data;
};

/**
 * Simulate New vs Old regime tax for custom annual gross income.
 * POST /api/v1/tax/compare
 */
export const compareTaxRegimes = async (annualGrossIncome, financialYear = '2025-26') => {
  const response = await apiClient.post('/api/v1/tax/compare', {
    annual_gross_income: annualGrossIncome,
    financial_year: financialYear,
  });
  return response.data;
};
