import apiClient from './api';

/**
 * Fetch system health status and database latency from FastAPI backend.
 * Calls GET /api/v1/health
 */
export const getSystemHealth = async () => {
  const startTime = performance.now();
  try {
    const response = await apiClient.get('/api/v1/health');
    const clientRoundtripMs = Math.round(performance.now() - startTime);
    return {
      success: true,
      clientRoundtripMs,
      data: response.data,
      error: null,
    };
  } catch (error) {
    const clientRoundtripMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      clientRoundtripMs,
      data: null,
      error: error.message || 'Failed to connect to FastAPI backend server',
    };
  }
};
