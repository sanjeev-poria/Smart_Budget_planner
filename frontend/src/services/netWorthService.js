import apiClient from './api';

/**
 * Retrieve consolidated Net Worth balance sheet with asset and liability category breakdowns.
 * GET /api/v1/net-worth
 */
export const getNetWorthOverview = async () => {
  const response = await apiClient.get('/api/v1/net-worth');
  return response.data;
};

// ============================================================================
// ASSETS
// ============================================================================

export const getAssets = async () => {
  const response = await apiClient.get('/api/v1/net-worth/assets');
  return response.data;
};

export const createAsset = async (assetData) => {
  const response = await apiClient.post('/api/v1/net-worth/assets', assetData);
  return response.data;
};

export const updateAsset = async (id, assetData) => {
  const response = await apiClient.put(`/api/v1/net-worth/assets/${id}`, assetData);
  return response.data;
};

export const deleteAsset = async (id) => {
  const response = await apiClient.delete(`/api/v1/net-worth/assets/${id}`);
  return response.data;
};

// ============================================================================
// LIABILITIES
// ============================================================================

export const getLiabilities = async () => {
  const response = await apiClient.get('/api/v1/net-worth/liabilities');
  return response.data;
};

export const createLiability = async (liabilityData) => {
  const response = await apiClient.post('/api/v1/net-worth/liabilities', liabilityData);
  return response.data;
};

export const updateLiability = async (id, liabilityData) => {
  const response = await apiClient.put(`/api/v1/net-worth/liabilities/${id}`, liabilityData);
  return response.data;
};

export const deleteLiability = async (id) => {
  const response = await apiClient.delete(`/api/v1/net-worth/liabilities/${id}`);
  return response.data;
};
