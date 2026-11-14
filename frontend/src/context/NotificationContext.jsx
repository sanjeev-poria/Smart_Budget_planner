import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDashboardOverview } from '../services/dashboardService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem('smartfin_dismissed_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) {
      setAlerts([]);
      return;
    }

    try {
      setLoading(true);
      const data = await getDashboardOverview();
      const generated = [];

      // 1. Budget Alerts (from backend budget_alerts)
      if (data.budget_alerts && Array.isArray(data.budget_alerts)) {
        data.budget_alerts.forEach((bAlert, idx) => {
          generated.push({
            id: `budget-${idx}-${bAlert.category || 'general'}`,
            type: bAlert.severity === 'danger' || bAlert.severity === 'exceeded' ? 'critical' : 'warning',
            title: `Budget Alert: ${bAlert.category || 'Spending Outflow'}`,
            message: bAlert.message,
            link: '/budgets',
            read: false,
          });
        });
      }

      // 2. Emergency Fund Shortfall Alert
      if (data.emergency_fund) {
        const ef = data.emergency_fund;
        if (ef.months_covered < 3) {
          generated.push({
            id: 'emergency-shortfall',
            type: 'critical',
            title: 'Emergency Fund Below Safety Buffer',
            message: `Current reserves cover only ${ef.months_covered} months (Target: 6 months). Shortfall: ₹${Number(ef.shortfall || 0).toLocaleString()}.`,
            link: '/emergency-fund',
            read: false,
          });
        }
      }

      // 3. Health Score Warning Alert
      if (data.health_score) {
        const hs = data.health_score;
        if (hs.score < 60) {
          generated.push({
            id: 'health-score-low',
            type: 'warning',
            title: `Financial Health Index: ${hs.score}/100 (${hs.risk_level})`,
            message: hs.explanation || 'Consider optimizing your savings rate or high-interest liabilities to improve your financial score.',
            link: '/health-score',
            read: false,
          });
        }
      }

      // 4. Savings Rate Alert (if savings rate < 15%)
      if (data.summary_cards) {
        const s = data.summary_cards;
        if (s.savings_rate_pct < 15 && s.monthly_income > 0) {
          generated.push({
            id: 'savings-rate-low',
            type: 'info',
            title: 'Savings Rate Optimization Opportunity',
            message: `Your current savings rate is ${s.savings_rate_pct}%. Recommended fintech benchmark is ≥ 20%.`,
            link: '/what-if',
            read: false,
          });
        }
      }

      setAlerts(generated);
    } catch (err) {
      // Non-blocking for notification drawer
      console.warn('Failed to sync live notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlerts();

    const handleUpdate = () => {
      fetchAlerts();
    };

    window.addEventListener('smartfin_data_updated', handleUpdate);
    return () => window.removeEventListener('smartfin_data_updated', handleUpdate);
  }, [fetchAlerts]);

  const activeAlerts = alerts.filter((a) => !dismissedIds.includes(a.id));
  const unreadCount = activeAlerts.filter((a) => !a.read).length;

  const markAsRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const dismissAlert = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('smartfin_dismissed_alerts', JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        alerts: activeAlerts,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        dismissAlert,
        refreshAlerts: fetchAlerts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
