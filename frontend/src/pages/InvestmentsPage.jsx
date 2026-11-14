import React, { useState, useEffect, useMemo } from 'react';
import {
  calculateProjection,
  getAssumptions,
  saveAssumptions,
} from '../services/investmentService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  LineChart as LineChartIcon,
  TrendingUp,
  IndianRupee,
  Percent,
  Calendar,
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Info,
  Loader2,
  Coins,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const InvestmentsPage = () => {
  const [params, setParams] = useState({
    monthly_investment: 500,
    annual_return_rate: 10.0,
    investment_period: 10,
    inflation_rate: 6.0,
    initial_lumpsum: 0,
  });

  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Initial load: fetch saved user assumptions and run initial calculation
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const saved = await getAssumptions();
        const initialParams = {
          monthly_investment: Number(saved.monthly_investment) || 500,
          annual_return_rate: Number(saved.annual_return_rate) || 10.0,
          investment_period: Number(saved.investment_period) || 10,
          inflation_rate: Number(saved.inflation_rate) || 6.0,
          initial_lumpsum: Number(saved.initial_lumpsum) || 0,
        };
        setParams(initialParams);

        const proj = await calculateProjection(initialParams);
        setProjection(proj);
      } catch (err) {
        setError(err.message || 'Failed to initialize investment calculations.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Recalculate whenever inputs change (debounced or on change)
  const runCalculation = async (currentParams) => {
    try {
      const res = await calculateProjection(currentParams);
      setProjection(res);
    } catch (err) {
      console.error('Calculation error:', err);
    }
  };

  const handleParamChange = (field, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    const updated = { ...params, [field]: num };
    setParams(updated);
    setSaveSuccess(false);
    runCalculation(updated);
  };

  const handleSaveAssumptions = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveAssumptions(params);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      alert(err.message || 'Failed to save investment assumptions.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults = {
      monthly_investment: 500,
      annual_return_rate: 10.0,
      investment_period: 10,
      inflation_rate: 6.0,
      initial_lumpsum: 0,
    };
    setParams(defaults);
    setSaveSuccess(false);
    runCalculation(defaults);
  };

  // Custom Recharts Tooltip
  const CustomProjectionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pt = payload[0].payload;
      return (
        <div className="p-3 bg-white dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1">
            Year {pt.year} Projection
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Nominal FV:</span>
              <span>{formatCurrency(Number(pt.future_value))}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-cyan-600 dark:text-cyan-400 font-medium">
              <span>Real Purchasing Power:</span>
              <span>{formatCurrency(Number(pt.inflation_adjusted_value))}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-600 dark:text-slate-300">
              <span>Total Invested:</span>
              <span>{formatCurrency(Number(pt.total_invested))}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-indigo-600 dark:text-indigo-300">
              <span>Estimated Gains:</span>
              <span>+{formatCurrency(Number(pt.estimated_gains))}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Loading investment projection engine & compounding algorithms...
        </p>
      </div>
    );
  }

  const p = projection || {
    total_invested: 0,
    estimated_future_value: 0,
    estimated_gains: 0,
    inflation_adjusted_value: 0,
    real_gains: 0,
    trajectory: [],
    disclaimer: '',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-fintech-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <span>Investment Planning & Wealth Projections</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Pure Python Compounding
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Systematic compound interest projections with inflation discounting for real future purchasing power.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white dark:border-slate-800 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveAssumptions}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? 'Assumptions Saved!' : 'Save Assumptions'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Capital Invested</span>
            <Coins className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {formatCurrency(p.total_invested)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {formatCurrency(params.monthly_investment)}/mo over {params.investment_period} yrs
          </span>
        </div>

        {/* Estimated Future Value (Nominal) */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Estimated Future Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(p.estimated_future_value)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            +{formatCurrency(p.estimated_gains)} gains ({((p.estimated_gains / (p.total_invested || 1)) * 100).toFixed(1)}%)
          </span>
        </div>

        {/* Inflation-Adjusted Purchasing Power */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Inflation-Adjusted Value</span>
            <IndianRupee className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-2">
            {formatCurrency(p.inflation_adjusted_value)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Discounted at {params.inflation_rate}% annual inflation
          </span>
        </div>

        {/* Real Purchasing Gains */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Real Wealth Creation</span>
            <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-purple-600 dark:text-purple-300 mt-2">
            +{formatCurrency(p.real_gains)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Net real purchasing power gain
          </span>
        </div>
      </div>

      {/* Main Interactive Grid: Sliders Controls + Visual Recharts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Parameters (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-fintech-border space-y-6">
          <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <LineChartIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Investment Assumptions</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Adjust variables to simulate long-term portfolio growth.
            </p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Monthly Investment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Monthly Investment</label>
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={params.monthly_investment}
                    onChange={(e) => handleParamChange('monthly_investment', e.target.value)}
                    className="w-24 bg-transparent text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="500"
                value={params.monthly_investment}
                onChange={(e) => handleParamChange('monthly_investment', e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>₹0</span>
                <span>₹50,000</span>
                <span>₹1,00,000+</span>
              </div>
            </div>

            {/* Expected Annual Return Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Expected Annual Return</label>
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={params.annual_return_rate}
                    onChange={(e) => handleParamChange('annual_return_rate', e.target.value)}
                    className="w-16 bg-transparent text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  />
                  <span className="text-slate-500 dark:text-slate-400">%</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={params.annual_return_rate}
                onChange={(e) => handleParamChange('annual_return_rate', e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>1% (Cash/Bonds)</span>
                <span>10% (Index Funds)</span>
                <span>20%+ (Aggressive)</span>
              </div>
            </div>

            {/* Investment Period (Years) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Investment Horizon</label>
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  <input
                    type="number"
                    min="1"
                    max="40"
                    step="1"
                    value={params.investment_period}
                    onChange={(e) => handleParamChange('investment_period', e.target.value)}
                    className="w-14 bg-transparent text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  />
                  <span className="text-slate-500 dark:text-slate-400">Yrs</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={params.investment_period}
                onChange={(e) => handleParamChange('investment_period', e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>1 Year</span>
                <span>20 Years</span>
                <span>40 Years</span>
              </div>
            </div>

            {/* Inflation Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Expected Inflation Rate</label>
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.5"
                    value={params.inflation_rate}
                    onChange={(e) => handleParamChange('inflation_rate', e.target.value)}
                    className="w-14 bg-transparent text-right font-mono font-bold text-cyan-600 dark:text-cyan-400 focus:outline-none"
                  />
                  <span className="text-slate-500 dark:text-slate-400">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={params.inflation_rate}
                onChange={(e) => handleParamChange('inflation_rate', e.target.value)}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>0%</span>
                <span>6% (Standard)</span>
                <span>12%</span>
              </div>
            </div>

            {/* Starting Capital / Initial Lumpsum */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Initial Starting Capital</label>
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={params.initial_lumpsum}
                    onChange={(e) => handleParamChange('initial_lumpsum', e.target.value)}
                    className="w-24 bg-transparent text-right font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={params.initial_lumpsum}
                onChange={(e) => handleParamChange('initial_lumpsum', e.target.value)}
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Recharts Trajectory Visualization (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-fintech-border flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Projected Wealth Accumulation Curve</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nominal return trajectory vs. inflation-adjusted real purchasing power.
              </p>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={p.trajectory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeOpacity={0.4} vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickFormatter={(val) => `Yr ${val}`}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickFormatter={(val) => `₹${val >= 10000000 ? (val / 10000000).toFixed(1) + 'Cr' : val >= 100000 ? (val / 100000).toFixed(0) + 'L' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip content={<CustomProjectionTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey="future_value"
                  name="Nominal Future Value"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorFv)"
                />
                <Area
                  type="monotone"
                  dataKey="inflation_adjusted_value"
                  name="Real (Inflation-Adjusted)"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReal)"
                />
                <Area
                  type="monotone"
                  dataKey="total_invested"
                  name="Capital Invested"
                  stroke="#6366F1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorInv)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Year Milestones Comparison */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
            {p.trajectory.length >= 5 && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">5-Year Mark</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                  ₹{Number(p.trajectory[4]?.future_value || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                  Real: ₹{Number(p.trajectory[4]?.inflation_adjusted_value || 0).toLocaleString()}
                </span>
              </div>
            )}
            {p.trajectory.length >= 10 && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">10-Year Mark</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                  ₹{Number(p.trajectory[9]?.future_value || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                  Real: ₹{Number(p.trajectory[9]?.inflation_adjusted_value || 0).toLocaleString()}
                </span>
              </div>
            )}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                Year {params.investment_period} (End)
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                ₹{Number(p.estimated_future_value || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400">
                Real: ₹{Number(p.inflation_adjusted_value || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Compliance Disclaimer */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-amber-500/20 bg-amber-500/5 space-y-2">
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Educational & Planning Disclaimer</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {p.disclaimer ||
            'Investment projections and compounding models are calculated deterministically for educational and financial planning purposes only. They do not constitute guaranteed investment returns or certified financial advice. Actual investment performance varies according to real market fluctuations, asset class distributions, and macroeconomic factors.'}
        </p>
      </div>
    </div>
  );
};
