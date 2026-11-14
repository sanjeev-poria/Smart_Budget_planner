import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardOverview } from '../services/dashboardService';
import { formatCurrency } from '../utils/formatters';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  Activity,
  TrendingUp,
  CreditCard,
  PiggyBank,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  PieChart as PieIcon,
  Sliders,
  FileText,
  IndianRupee,
  Landmark,
  Scale,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  GraduationCap,
  HeartPulse,
  Tv,
  Briefcase,
  Tag,
  Zap,
} from 'lucide-react';
import { FintechCard } from '../components/ui/FintechCard';
import { StatCard } from '../components/ui/StatCard';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Tooltip } from '../components/ui/Tooltip';
import { useTheme } from '../context/ThemeContext';

const DONUT_COLORS = [
  '#10B981', // emerald
  '#6366F1', // indigo
  '#06B6D4', // cyan
  '#F43F5E', // rose
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#14B8A6', // teal
  '#EC4899', // pink
  '#3B82F6', // blue
  '#64748B', // slate
];

const CATEGORY_ICONS = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Rent: Home,
  Education: GraduationCap,
  Healthcare: HeartPulse,
  Entertainment: Tv,
  Investment: TrendingUp,
  Salary: Briefcase,
  Other: Tag,
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const res = await getDashboardOverview();
      setData(res);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message || 'Failed to connect to the financial engine.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const handleDataUpdate = () => {
      fetchDashboard(true);
    };
    window.addEventListener('smartfin_data_updated', handleDataUpdate);
    return () => window.removeEventListener('smartfin_data_updated', handleDataUpdate);
  }, [fetchDashboard]);

  // Loading skeleton screen
  if (loading && !data) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-fintech-card rounded-3xl p-8 border border-slate-200 dark:border-fintech-border/80 skeleton-shimmer space-y-3">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-72 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <SkeletonLoader type="metric" count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader type="chart" />
          <SkeletonLoader type="chart" />
        </div>
        <SkeletonLoader type="table" rows={4} cols={4} />
      </div>
    );
  }

  // Error screen with retry
  if (error && !data) {
    return (
      <div className="bg-white dark:bg-fintech-card rounded-3xl p-10 text-center border border-rose-200 dark:border-rose-500/30 max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ledger Synchronization Offline</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{error}</p>
        <button
          onClick={() => fetchDashboard()}
          className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white text-xs font-semibold shadow-glow-emerald"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const {
    user_name = 'User',
    user_city = 'India',
    summary_cards: s = {},
    health_score: hs = {},
    emergency_fund: ef = {},
    spending_overview: sp = {},
    recent_transactions: recentTx = [],
    budget_alerts: alerts = [],
    ai_insight: ai = '',
  } = data || {};

  const isLowRisk = (hs?.score || 0) >= 80;
  const isMedRisk = (hs?.score || 0) >= 60 && (hs?.score || 0) < 80;
  const healthVariant = isLowRisk ? 'emerald' : isMedRisk ? 'indigo' : 'rose';

  // Custom Chart Tooltips
  const CustomDonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="p-3 rounded-xl bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-700 text-xs shadow-xl">
          <span className="font-semibold text-slate-900 dark:text-white block">{p.name}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-0.5">
            {formatCurrency(p.value)} ({p.payload.percentage}%)
          </span>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-700 text-xs shadow-xl space-y-1.5 min-w-[160px]">
          <span className="font-bold text-slate-800 dark:text-slate-200 block border-b border-slate-100 dark:border-slate-800 pb-1">
            {label}
          </span>
          {payload.map((item) => (
            <div key={item.name} className="flex justify-between space-x-3">
              <span className="text-slate-500 dark:text-slate-400 capitalize">{item.name}:</span>
              <span className="font-mono font-bold" style={{ color: item.color }}>
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Executive Command Header */}
      <div className="bg-white dark:bg-fintech-card rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-fintech-border/80 shadow-sm dark:shadow-glow-card relative overflow-hidden transition-colors">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="emerald" size="xs" pulse>
                Deterministic Core Active
              </Badge>
              <Badge variant="slate" size="xs">
                Vault: {user_city}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Command Center, {user_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time multi-asset aggregation, deterministic health diagnostics, and verified MongoDB ledger sync.
            </p>
          </div>

          {/* Quick Command Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/transactions"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-emerald transition-all transform active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Record Transaction</span>
            </Link>

            <Link
              to="/what-if"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-sm"
            >
              <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">What-If</span>
            </Link>

            <Link
              to="/ai-chat"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">AI Advisor</span>
            </Link>

            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              title="Synchronize live financial ledger"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>
        </div>

        {lastRefreshed && (
          <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Synchronized at {lastRefreshed.toLocaleTimeString()}</span>
            <span className="hidden sm:inline font-mono text-emerald-600 dark:text-emerald-400 font-semibold">0% Fake Data • Live Engine</span>
          </div>
        )}
      </div>

      {/* 2. Top KPI Command Strip (4 High-Impact Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(s.monthly_income)}
          icon={TrendingUp}
          accent="emerald"
          trend="+Verified Inflow"
          trendPositive={true}
          onClick={() => navigate('/transactions')}
        />

        <StatCard
          title="Monthly Outflow"
          value={formatCurrency(s.monthly_expenses)}
          icon={CreditCard}
          accent="rose"
          subtitle={
            s.monthly_income > 0
              ? `${((s.monthly_expenses / s.monthly_income) * 100).toFixed(0)}% of monthly income`
              : '0% expense ratio'
          }
          progress={s.monthly_income > 0 ? (s.monthly_expenses / s.monthly_income) * 100 : 0}
          onClick={() => navigate('/transactions')}
        />

        <StatCard
          title="Net Monthly Surplus"
          value={formatCurrency(s.net_surplus)}
          icon={PiggyBank}
          accent="cyan"
          badge={
            <Badge variant="cyan" size="xs">
              {s.savings_rate_pct || 0}% Savings Rate
            </Badge>
          }
          onClick={() => navigate('/what-if')}
        />

        <StatCard
          title="Financial Health Index"
          value={`${hs.score || 0} / 100`}
          icon={Activity}
          accent={healthVariant}
          badge={
            <Badge variant={healthVariant} size="xs" pulse>
              {hs.risk_level || 'Evaluated'}
            </Badge>
          }
          progress={hs.score || 0}
          onClick={() => navigate('/health-score')}
        />
      </div>

      {/* 3. Central Visualizer Deck: Cashflow Timeline + Category Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Timeline (2 cols) */}
        <div className="lg:col-span-2">
          <FintechCard
            title="Cashflow Dynamics"
            subtitle="Monthly comparison of verified Inflow vs Outflow vs Retained Surplus"
            icon={TrendingUp}
            action={
              <Link
                to="/transactions"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1"
              >
                <span>Ledger Drilldown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {sp.cashflow_timeline && sp.cashflow_timeline.length > 0 ? (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sp.cashflow_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      stroke={isDark ? '#64748B' : '#94A3B8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#26354D' : '#E2E8F0' }}
                    />
                    <YAxis
                      stroke={isDark ? '#64748B' : '#94A3B8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#26354D' : '#E2E8F0' }}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <RechartsTooltip content={<CustomBarTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ paddingBottom: '16px', fontSize: '11px' }}
                    />
                    <Bar dataKey="income" name="Inflow" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="expenses" name="Outflow" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="savings" name="Net Savings" fill="#06B6D4" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No Cashflow History Yet"
                description="Record your monthly income and expenses to visualize multi-month cashflow velocity."
                actionText="Record Entry"
                onAction={() => navigate('/transactions')}
              />
            )}
          </FintechCard>
        </div>

        {/* Category Spending Donut Chart (1 col) */}
        <div>
          <FintechCard
            title="Outflow Allocation"
            subtitle="Expense breakdown by category"
            icon={PieIcon}
            action={
              <Link
                to="/budgets"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center space-x-1"
              >
                <span>Budgets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {sp.category_breakdown && sp.category_breakdown.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sp.category_breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {sp.category_breakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                            stroke={isDark ? '#0B0F19' : '#FFFFFF'}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomDonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Categories Mini-list */}
                <div className="w-full space-y-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {sp.category_breakdown.slice(0, 3).map((cat, idx) => (
                    <div key={cat.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{cat.category}</span>
                      </div>
                      <span className="font-mono text-slate-900 dark:text-white font-semibold">
                        {formatCurrency(cat.amount)} ({cat.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={PieIcon}
                title="No Expense Categories"
                description="Categorize your spending entries to uncover highest outflow areas."
                actionText="Add Transaction"
                onAction={() => navigate('/transactions')}
              />
            )}
          </FintechCard>
        </div>
      </div>

      {/* 4. Financial Resilience Matrix: Emergency Fund + Health Score 5 Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Fund Dial Card */}
        <FintechCard
          title="Emergency Reserve Buffer"
          subtitle="Liquid liquidity vs recommended 6-month buffer"
          icon={ShieldAlert}
          action={
            <Link
              to="/emergency-fund"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center space-x-1"
            >
              <span>Manage Buffer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {ef.months_covered || 0}{' '}
                  <span className="text-base text-slate-500 dark:text-slate-400 font-sans font-normal">Months</span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                  Target Reserve: 6 Months ({formatCurrency(ef.target_fund)})
                </span>
              </div>
              <Badge
                variant={ef.status === 'optimal' ? 'emerald' : ef.status === 'good' ? 'cyan' : 'rose'}
                size="sm"
                pulse={ef.status !== 'optimal'}
              >
                {ef.status === 'optimal'
                  ? 'Optimal Safety'
                  : ef.status === 'good'
                  ? 'Adequate Buffer'
                  : 'Needs Expansion'}
              </Badge>
            </div>

            {/* Progress Bar to 6-month buffer */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span>Coverage Progress</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {Math.min(100, Math.round(((ef.months_covered || 0) / 6) * 100))}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((ef.months_covered || 0) / 6) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                  Current Liquid Savings
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {formatCurrency(ef.current_savings)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                  Target Buffer Shortfall
                </span>
                <span
                  className={`font-mono text-sm font-bold mt-0.5 block ${
                    (ef.shortfall || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {(ef.shortfall || 0) > 0 ? `- ${formatCurrency(ef.shortfall)}` : 'Fully Funded ✓'}
                </span>
              </div>
            </div>
          </div>
        </FintechCard>

        {/* Health Score 5-Pillar Diagnostics Card */}
        <FintechCard
          title="Financial Health Diagnostics"
          subtitle="Institutional 5-pillar assessment breakdown"
          icon={Activity}
          action={
            <Link
              to="/health-score"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center space-x-1"
            >
              <span>Full Diagnostic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3.5">
            {hs.breakdown ? (
              Object.entries(hs.breakdown).map(([key, item]) => {
                const label = key
                  .replace('_', ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                const pct = Math.min(100, Math.round((item.score / item.max_score) * 100));

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{label}</span>
                      <span className="font-mono text-slate-900 dark:text-white font-semibold">
                        {item.score} / {item.max_score} pts ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Complete your profile to generate pillar scoring.</p>
            )}

            <div className="pt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
              {hs.explanation || 'Healthy financial habits maintain resilience against macro shocks.'}
            </div>
          </div>
        </FintechCard>
      </div>

      {/* 5. Lower Deck: AI Financial Intelligence + Budget Alerts + Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gemini AI Intelligence Card */}
        <FintechCard
          title="Gemini AI Intelligence"
          subtitle="Automated narrative summary from verified calculations"
          icon={Sparkles}
          glow="indigo"
          interactive
          action={
            <Link
              to="/ai-chat"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center space-x-1"
            >
              <span>Chat Advisor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              {typeof ai === 'string' && ai ? (
                ai
              ) : ai?.narrative ? (
                ai.narrative
              ) : (
                'Your cashflow velocity is synchronized. Ask Gemini to analyze debt avalanche opportunities or tax optimization strategies.'
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Zero Hallucinations Engine</span>
              </span>
              <Link
                to="/ai-chat"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                Ask Gemini &rarr;
              </Link>
            </div>
          </div>
        </FintechCard>

        {/* Live Budget Radar Card */}
        <FintechCard
          title="Budget Radar & Alerts"
          subtitle="Real-time threshold monitoring"
          icon={PieIcon}
          action={
            <Link
              to="/budgets"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center space-x-1"
            >
              <span>All Budgets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {alerts && alerts.length > 0 ? (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {alerts.map((alert, idx) => {
                const isCrit = alert.severity === 'danger' || alert.severity === 'exceeded';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs ${
                      isCrit
                        ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate">{alert.category || 'Spending Category'}</span>
                      <Badge variant={isCrit ? 'rose' : 'amber'} size="xs">
                        {isCrit ? 'Exceeded' : 'Warning'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">Budgets in Safe Zone</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                All tracked categories are within allocated spending thresholds.
              </p>
              <Link
                to="/budgets"
                className="inline-block mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                Set Category Limits &rarr;
              </Link>
            </div>
          )}
        </FintechCard>

        {/* Recent Ledger Activity */}
        <FintechCard
          title="Recent Ledger Stream"
          subtitle="Latest verified transaction entries"
          icon={Receipt}
          action={
            <Link
              to="/transactions"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center space-x-1"
            >
              <span>Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {recentTx && recentTx.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentTx.slice(0, 5).map((tx) => {
                const isIncome = tx.type === 'income';
                const CatIcon = CATEGORY_ICONS[tx.category] || Tag;

                return (
                  <div key={tx._id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isIncome
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {tx.title || tx.category}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {tx.date ? new Date(tx.date).toLocaleDateString() : 'Recent'} &bull;{' '}
                          {tx.category}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-mono font-bold text-xs flex-shrink-0 ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-200'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold text-slate-900 dark:text-white">No Ledger Entries</p>
              <Link
                to="/transactions"
                className="inline-block mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                + Record First Entry
              </Link>
            </div>
          )}
        </FintechCard>
      </div>

      {/* 6. Quick Launchpad: Direct Access to Core Modules */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Institutional Wealth Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <Link
            to="/what-if"
            className="bg-white dark:bg-fintech-card rounded-2xl p-4 border border-slate-200 dark:border-fintech-border/80 flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                What-If Simulator
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Monte Carlo Scenarios</p>
            </div>
          </Link>

          <Link
            to="/tax"
            className="bg-white dark:bg-fintech-card rounded-2xl p-4 border border-slate-200 dark:border-fintech-border/80 flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Tax Center
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">80C, EPF & Regimes</p>
            </div>
          </Link>

          <Link
            to="/debts"
            className="bg-white dark:bg-fintech-card rounded-2xl p-4 border border-slate-200 dark:border-fintech-border/80 flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Debt Snowball
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Payoff Optimization</p>
            </div>
          </Link>

          <Link
            to="/investments"
            className="bg-white dark:bg-fintech-card rounded-2xl p-4 border border-slate-200 dark:border-fintech-border/80 flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Investments
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">CAGR & SIP Models</p>
            </div>
          </Link>

          <Link
            to="/reports"
            className="bg-white dark:bg-fintech-card rounded-2xl p-4 border border-slate-200 dark:border-fintech-border/80 flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Monthly Reports
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">ReportLab PDF Engine</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
