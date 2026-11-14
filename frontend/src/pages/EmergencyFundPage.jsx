import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEmergencyFundData } from '../services/dashboardService';
import {
  ShieldAlert,
  ShieldCheck,
  PiggyBank,
  IndianRupee,
  Calendar,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sliders,
  TrendingUp,
  Loader2,
  Info,
} from 'lucide-react';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { formatCurrency } from '../utils/formatters';

export const EmergencyFundPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive target simulator
  const [targetMonths, setTargetMonths] = useState(6);
  const [simulatedExpenses, setSimulatedExpenses] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getEmergencyFundData();
      setData(res);
      setSimulatedExpenses(res.monthly_expenses);
    } catch (err) {
      setError(err.message || 'Failed to fetch emergency fund data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div className="glass-card rounded-3xl p-8 border border-fintech-border/80 skeleton-shimmer space-y-3">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-8 w-64 bg-slate-800 rounded" />
        </div>
        <SkeletonLoader type="metric" count={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center glass-panel rounded-3xl border border-rose-500/30">
        <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Emergency Fund Engine Offline</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
        >
          Retry Calculation
        </button>
      </div>
    );
  }

  const savings = data.current_savings;
  const baseExpenses = data.monthly_expenses;
  const currentCovered = data.months_covered;
  const isOptimal = currentCovered >= 6.0;
  const isAdequate = currentCovered >= 3.0 && currentCovered < 6.0;
  const isVulnerable = currentCovered >= 1.0 && currentCovered < 3.0;
  const isCritical = currentCovered < 1.0;

  // Simulator math
  const expSim = simulatedExpenses !== null ? simulatedExpenses : baseExpenses;
  const simTarget = Math.round(expSim * targetMonths);
  const simShortfall = Math.max(0, simTarget - savings);
  const simCovered = expSim > 0 ? (savings / expSim).toFixed(1) : (savings > 0 ? '12.0' : '0.0');
  const simPct = simTarget > 0 ? Math.min(100, Math.round((savings / simTarget) * 100)) : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-fintech-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Emergency Reserve & Runway Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Deterministic liquidity modeling protecting against zero-income events and unforeseen expenses.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Hero Showcase Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-fintech-border shadow-glow-card relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider mb-3">
              <span className={`w-2 h-2 rounded-full ${isOptimal ? 'bg-emerald-400' : isAdequate ? 'bg-indigo-400' : 'bg-rose-400'}`} />
              <span className={isOptimal ? 'text-emerald-500 dark:text-emerald-400' : isAdequate ? 'text-indigo-500 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'}>
                Liquidity Status: {data.status}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {data.months_covered} Months of Living Expenses Covered
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl leading-relaxed">
              {data.recommendation}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium">
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Current Liquid Savings: <strong className="text-slate-900 dark:text-white">{formatCurrency(savings)}</strong></span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span>6-Month Target: <strong className="text-slate-900 dark:text-white">{formatCurrency(data.target_amount)}</strong></span>
              </div>
            </div>
          </div>

          {/* Circular/Gauge Progress */}
          <div className="w-48 h-48 rounded-3xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 p-6 flex flex-col items-center justify-center text-center shadow-inner relative flex-shrink-0">
            <span className="text-4xl font-extrabold font-mono text-emerald-500 dark:text-emerald-400">
              {data.percentage_completed}%
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
              Target Reached
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
              {data.amount_still_required > 0 ? `${formatCurrency(data.amount_still_required)} gap` : 'Goal Fulfilled'}
            </span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Progress toward 6-Month Emergency Target</span>
            <span className="text-slate-900 dark:text-white">{data.percentage_completed}%</span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 transition-all duration-700"
              style={{ width: `${data.percentage_completed}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4 Core Metric Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-fintech-border">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Current Liquid Savings
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {formatCurrency(savings)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Checking, savings & cash</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-fintech-border">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Monthly Living Expenses
          </span>
          <span className="text-2xl font-bold font-mono text-rose-500 dark:text-rose-400 mt-1 block">
            {formatCurrency(baseExpenses)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Fixed burn rate denominator</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-fintech-border">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Recommended Reserve (6 Mo)
          </span>
          <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">
            {formatCurrency(data.target_amount)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Monthly Expenses &times; 6</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-fintech-border">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Amount Still Required
          </span>
          <span className={`text-2xl font-bold font-mono mt-1 block ${data.amount_still_required === 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>
            {formatCurrency(data.amount_still_required)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{data.amount_still_required === 0 ? 'Zero shortfall' : 'Deficit to 6 months'}</span>
        </div>
      </div>

      {/* Runway Tiers Reference & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Benchmarks */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-fintech-border space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <span>Emergency Fund Tier Benchmarks</span>
          </div>

          <div className="space-y-3 pt-2">
            <div className={`p-3.5 rounded-2xl border flex items-start justify-between text-xs ${isOptimal ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'}`}>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Tier 1: Optimal (6+ Months)</span>
                <span className="text-slate-600 dark:text-slate-400">Complete safety from layoffs, health crises, or recession.</span>
              </div>
              <span className="font-bold text-emerald-500 dark:text-emerald-400 text-sm">6+ Mo</span>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-start justify-between text-xs ${isAdequate ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'}`}>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Tier 2: Adequate (3 to 6 Months)</span>
                <span className="text-slate-600 dark:text-slate-400">Standard buffer for minor job disruptions or automotive repairs.</span>
              </div>
              <span className="font-bold text-indigo-500 dark:text-indigo-400 text-sm">3–6 Mo</span>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-start justify-between text-xs ${isVulnerable ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'}`}>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Tier 3: Vulnerable (1 to 3 Months)</span>
                <span className="text-slate-600 dark:text-slate-400">High vulnerability if multiple surprise bills occur in same month.</span>
              </div>
              <span className="font-bold text-amber-500 dark:text-amber-400 text-sm">1–3 Mo</span>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-start justify-between text-xs ${isCritical ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'}`}>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Tier 4: Critical (&lt; 1 Month)</span>
                <span className="text-slate-600 dark:text-slate-400">Immediate debt reliance required if income is interrupted.</span>
              </div>
              <span className="font-bold text-rose-500 dark:text-rose-400 text-sm">&lt; 1 Mo</span>
            </div>
          </div>
        </div>

        {/* Interactive Simulator */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-fintech-border flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base pb-3 border-b border-slate-200 dark:border-slate-800">
              <Sliders className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <span>Interactive Runway Simulator</span>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Target Reserve Horizon:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{targetMonths} Months</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="1"
                  value={targetMonths}
                  onChange={(e) => setTargetMonths(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>3 Months (Starter)</span>
                  <span>6 Months (Standard)</span>
                  <span>12 Months (Conservative)</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Simulated Monthly Expense (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  value={expSim}
                  onChange={(e) => setSimulatedExpenses(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Simulated Target:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(simTarget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Current Savings Available:</span>
                  <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">{formatCurrency(savings)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Shortfall to Reach {targetMonths} Months:</span>
                  <span className={`font-mono font-bold ${simShortfall > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                    {formatCurrency(simShortfall)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Need to update your baseline savings number?</span>
            <Link
              to="/profile"
              className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold"
            >
              <span>Profile Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
