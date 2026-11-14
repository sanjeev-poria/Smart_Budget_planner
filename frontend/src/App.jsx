import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { TransactionsPage } from './pages/TransactionsPage';
import { HealthScorePage } from './pages/HealthScorePage';
import { EmergencyFundPage } from './pages/EmergencyFundPage';
import { GoalsPage } from './pages/GoalsPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { DebtsPage } from './pages/DebtsPage';
import { NetWorthPage } from './pages/NetWorthPage';
import { AssetsPage } from './pages/AssetsPage';
import { LiabilitiesPage } from './pages/LiabilitiesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { TaxCenterPage } from './pages/TaxCenterPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { AIChatPage } from './pages/AIChatPage';
import { ReportsPage } from './pages/ReportsPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';
import { useHealthCheck } from './hooks/useHealthCheck';

import {
  ArrowLeftRight,
  Target,
  LineChart,
  CreditCard,
  PieChart,
  Sliders,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Receipt,
  FileText,
  Activity,
} from 'lucide-react';

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const health = useHealthCheck(15000);

  return (
    <Routes>
      {/* Public Authentication & Status Routes */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/status"
        element={
          <div className="min-h-screen bg-fintech-bg p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
              <SystemStatusPage
                healthData={health.healthData}
                clientLatency={health.clientLatency}
                loading={health.loading}
                error={health.error}
                refresh={health.refresh}
                lastChecked={health.lastChecked}
              />
            </div>
          </div>
        }
      />

      {/* Protected Routes inside DashboardLayout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/transactions" element={<TransactionsPage />} />

        <Route path="/budgets" element={<BudgetsPage />} />

        <Route path="/emergency-fund" element={<EmergencyFundPage />} />

        <Route path="/goals" element={<GoalsPage />} />

        <Route path="/investments" element={<InvestmentsPage />} />

        <Route path="/debts" element={<DebtsPage />} />

        <Route path="/what-if" element={<WhatIfPage />} />
        <Route path="/ai-chat" element={<AIChatPage />} />

        <Route path="/net-worth" element={<NetWorthPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/liabilities" element={<LiabilitiesPage />} />

        <Route path="/tax" element={<TaxCenterPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        <Route path="/health-score" element={<HealthScorePage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
