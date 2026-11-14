import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNetWorthOverview } from '../services/netWorthService';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  CreditCard,
  Landmark,
  Scale,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Coins,
  Percent,
} from 'lucide-react';

const ASSET_COLORS = ['#10B981', '#06B6D4', '#6366F1', '#8B5CF6', '#3B82F6', '#F59E0B', '#64748B'];
const LIABILITY_COLORS = ['#F43F5E', '#FB7185', '#F59E0B', '#A855F7', '#EC4899', '#64748B'];

export const NetWorthPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getNetWorthOverview();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve net worth balance sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const CustomDonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const pt = payload[0];
      return (
        <div className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl text-xs space-y-1 z-50">
          <p className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pt.payload.fill }} />
            <span>{pt.name}</span>
          </p>
          <div className="flex items-center justify-between gap-4 font-mono">
            <span className="text-slate-500 dark:text-slate-400">Valuation:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{Number(pt.value).toLocaleString()}</span>
          </div>
          {pt.payload.percentage !== undefined && (
            <div className="flex items-center justify-between gap-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              <span>Share:</span>
              <span>{pt.payload.percentage}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Consolidating asset and liability balance sheets...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center glass-panel rounded-3xl border border-rose-500/30">
        <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Balance Sheet Offline</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchOverview}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-semibold transition-colors"
        >
          Retry Calculation
        </button>
      </div>
    );
  }

  const isPositive = data.net_worth >= 0;
  const netWorthColor = isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const glowColor = isPositive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';

  const comparisonData = [
    { name: 'Balance Sheet', Assets: data.total_assets, Liabilities: data.total_liabilities },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-fintech-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <span>Net Worth & Balance Sheet Center</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Deterministic Accounting
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Authoritative measure of your financial solvency: <span className="font-mono font-medium text-slate-900 dark:text-white">Net Worth = Total Assets − Total Liabilities</span>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOverview}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 dark:hover:text-white text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate</span>
          </button>
          <Link
            to="/assets"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 dark:hover:text-white text-xs font-semibold transition-colors"
          >
            <span>Manage Assets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/liabilities"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 dark:hover:text-white text-xs font-semibold transition-colors"
          >
            <span>Manage Liabilities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Hero Net Worth Showcase Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-fintech-border shadow-glow-card relative overflow-hidden">
        <div
          className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: glowColor }}
        />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider mb-2">
              <span className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={netWorthColor}>{data.status}</span>
            </div>

            <span className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 block tracking-wider">
              Consolidated Net Worth
            </span>
            <div className={`text-4xl sm:text-6xl font-extrabold font-mono tracking-tight mt-1 ${netWorthColor}`}>
              {data.net_worth >= 0 ? '+' : '-'}₹{Math.abs(data.net_worth).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
              Calculated across {data.asset_breakdown.reduce((acc, c) => acc + c.count, 0)} assets and {data.liability_breakdown.reduce((acc, c) => acc + c.count, 0)} liabilities in your personal ledger.
            </p>
          </div>

          {/* Quick Ratios Matrix */}
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold block">Asset / Debt Ratio</span>
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                {data.asset_to_liability_ratio > 100 ? 'Debt Free' : `${data.asset_to_liability_ratio}x`}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Assets ÷ Liabilities</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold block">Debt-to-Asset</span>
              <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                {data.debt_to_asset_ratio}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Liabilities ÷ Assets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assets & Liabilities Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Assets Box */}
        <div className="glass-panel rounded-3xl p-6 border border-fintech-border flex items-center justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Landmark className="w-4 h-4 text-emerald-500" />
              <span>Total Assets</span>
            </span>
            <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
              ₹{data.total_assets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              {data.asset_breakdown.length} distinct asset categories
            </span>
          </div>

          <Link
            to="/assets"
            className="p-3 rounded-2xl bg-slate-100 border border-slate-200 hover:border-emerald-500/40 text-slate-600 hover:text-emerald-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Liabilities Box */}
        <div className="glass-panel rounded-3xl p-6 border border-fintech-border flex items-center justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-rose-500" />
              <span>Total Liabilities</span>
            </span>
            <div className="text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
              ₹{data.total_liabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              {data.liability_breakdown.length} liability obligations
            </span>
          </div>

          <Link
            to="/liabilities"
            className="p-3 rounded-2xl bg-slate-100 border border-slate-200 hover:border-rose-500/40 text-slate-600 hover:text-rose-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-rose-400 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Visual Recharts Section: Donut Breakdown & Bar Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Asset Category Distribution */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-fintech-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-emerald-500" />
                <span>Asset Allocation by Category</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Asset diversification distribution.</p>
            </div>
          </div>

          {data.asset_breakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              No assets recorded. <Link to="/assets" className="text-emerald-500 underline">Add assets</Link> to generate allocation chart.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomDonutTooltip />} />
                  <Pie
                    data={data.asset_breakdown.map((item, idx) => ({
                      name: item.category,
                      value: item.total_value,
                      percentage: item.percentage,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {data.asset_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Chips */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {data.asset_breakdown.map((cat, idx) => (
              <div key={cat.category} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length] }} />
                  <span className="text-slate-700 dark:text-slate-300 truncate">{cat.category}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{cat.total_value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Liability Category Distribution */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-fintech-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-rose-500" />
                <span>Liability Obligations by Category</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Distribution of debt obligations.</p>
            </div>
          </div>

          {data.liability_breakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              No liabilities recorded. <Link to="/liabilities" className="text-rose-500 underline">Add liabilities</Link> to generate chart.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomDonutTooltip />} />
                  <Pie
                    data={data.liability_breakdown.map((item, idx) => ({
                      name: item.category,
                      value: item.total_value,
                      percentage: item.percentage,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {data.liability_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={LIABILITY_COLORS[index % LIABILITY_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Chips */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {data.liability_breakdown.map((cat, idx) => (
              <div key={cat.category} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: LIABILITY_COLORS[idx % LIABILITY_COLORS.length] }} />
                  <span className="text-slate-700 dark:text-slate-300 truncate">{cat.category}</span>
                </div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">₹{cat.total_value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
