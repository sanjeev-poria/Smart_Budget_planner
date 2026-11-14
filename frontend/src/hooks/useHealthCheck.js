import { useState, useEffect, useCallback } from 'react';
import { getSystemHealth } from '../services/healthService';

export const useHealthCheck = (pollIntervalMs = 0) => {
  const [healthData, setHealthData] = useState(null);
  const [clientLatency, setClientLatency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    const result = await getSystemHealth();
    setClientLatency(result.clientRoundtripMs);

    if (result.success) {
      setHealthData(result.data);
      setError(null);
    } else {
      setError(result.error);
      setHealthData(null);
    }
    setLastChecked(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    checkHealth();

    if (pollIntervalMs > 0) {
      const interval = setInterval(checkHealth, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [checkHealth, pollIntervalMs]);

  return {
    healthData,
    clientLatency,
    loading,
    error,
    lastChecked,
    refresh: checkHealth,
  };
};
