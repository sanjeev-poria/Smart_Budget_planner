import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFinancialHealth } from '../services/analyticsService';
import { getScoreHistory } from '../services/dashboardService';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  IndianRupee,
  PiggyBank,
  CreditCard,
  PieChart,
  Loader2,
  Cpu,
  History,
  Sparkles,
} from 'lucide-react';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { Badge } from '../components/ui/Badge';

export const HealthScorePage = () => {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchScore = async () => {
    setLoading(true);
    setError('');
    try {
      const [healthRes, historyRes] = await Promise.all([
        getFinancialHealth(),
        getScoreHistory().catch(() => []),
      ]);
      setData(healthRes);
      setHistory(Array.isArray(historyRes) ? historyRes : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch financial health score.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, []);

  const chartData = React.useMemo(() => {
    if (!history || history.length === 0) {
      return [
        {
          timestamp: 'Initial Audit',
          score: data?.health_score || 0,
          risk: data?.risk_level || 'N/A',
          surplus: data?.surplus || 0,
        },
      ];
    }
    return history.map((item) => {
      const d = item.recorded_at ? new Date(item.recorded_at) : new Date();
      const timeStr = `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      return {
        timestamp: timeStr,
        score: item.score,
        risk: item.risk_level,
        surplus: item.surplus,
        savings_rate: item.savings_rate,
      };
    });
  }, [history, data]);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        <div className="glass-card rounded-3xl p-8 border border-fintech-border/80 skeleton-shimmer space-y-3">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-8 w-64 bg-slate-800 rounded" />
        </div>
        <SkeletonLoader type="metric" count={4} />
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center glass-panel rounded-3xl border border-rose-500/30">
        <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Calculation Engine Offline</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchScore}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
        >
          Retry Calculation
        </button>
      </div>
    );
  }

  const score = data.health_score;
  const isExcellent = score >= 80;
  const isGood = score >= 60 && score < 80;
  const isStressed = score < 60;

  const scoreColor = isExcellent
    ? 'text-emerald-400'
    : isGood
    ? 'text-indigo-400'
    : 'text-rose-400';

  const badgeBg = isExcellent
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : isGood
    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
    : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

  const glowColor = isExcellent
    ? 'rgba(16, 185, 129, 0.25)'
    : isGood
    ? 'rgba(99, 102, 241, 0.25)'
    : 'rgba(244, 63, 94, 0.25)';

  const CustomTrendTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const pt = payload[0].payload;
      return (
        <div className="p-3 bg-white dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl text-xs space-y-1 z-50">
          <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">{pt.timestamp}</p>
          <p className="font-bold text-slate-900 dark:text-white flex items-center justify-between gap-3">
            <span>Score:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{pt.score} / 100</span>
          </p>
          <p className="text-slate-600 dark:text-slate-300 flex items-center justify-between gap-3">
            <span>Risk Tier:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{pt.risk}</span>
          </p>
          {pt.surplus !== undefined && (
            <p className="text-slate-500 dark:text-slate-400 flex items-center justify-between gap-3">
              <span>Surplus:</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">₹{Number(pt.surplus).toLocaleString()}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-fintech-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Health Index
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Authoritative 0–100 score computed deterministically across 5 financial stability pillars.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchScore}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-800 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Hero Score Showcase Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-fintech-border shadow-glow-card relative overflow-hidden">
        {/* Subtle background ring */}
        <div
          className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ background: glowColor }}
        />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative z-10">
          {/* Score Dial Display */}
          <div className="flex items-center space-x-6">
            <div className="w-32 h-32 rounded-3xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center p-3 text-center shadow-inner relative">
              <span className={`text-5xl font-extrabold font-mono tracking-tighter ${scoreColor}`}>
                {score}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">Out of 100</span>
            </div>

            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider mb-2">
                <span className={`w-2 h-2 rounded-full ${isExcellent ? 'bg-emerald-400' : isGood ? 'bg-indigo-400' : 'bg-rose-400'}`} />
                <span className={scoreColor}>{data.risk_level}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {isExcellent ? 'Optimal Financial Vitality' : isGood ? 'Solid Financial Position' : 'Action Required: High Risk'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
                Deterministic calculation combining Savings Rate (25pts), Emergency Runway (20pts), Debt Burden (20pts), Investment Pace (20pts), and Expense Velocity (15pts).
              </p>
            </div>
          </div>

          {/* Quick Metrics Callout */}
          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">Monthly Surplus</span>
              <span className={`text-base font-bold font-mono mt-0.5 block ${data.surplus >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {data.surplus >= 0 ? '+' : '-'}₹{Math.abs(data.surplus).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Income - Expenses</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">Savings Rate</span>
              <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {data.savings_rate}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Surplus / Income</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">Runway</span>
              <span className="text-base font-bold font-mono text-teal-600 dark:text-teal-400 mt-0.5 block">
                {data.emergency_fund_months} Mo
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Living reserve</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">DTI Ratio</span>
              <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                {data.emi_burden_percentage}%
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">EMI / Income</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Score Trajectory Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-fintech-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5 text-slate-900 dark:text-white font-bold text-base">
            <History className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <span>Historical Health Score Trajectory</span>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>&gt;= 80 Optimal</span>
            </div>
            <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
              <span>60–79 Good</span>
            </div>
            <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
              <span>&lt; 60 High Risk</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeOpacity={0.6} vertical={false} />
              <XAxis
                dataKey="timestamp"
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <ReferenceLine y={80} stroke="#10B981" strokeDasharray="4 4" strokeOpacity={0.6} />
              <ReferenceLine y={60} stroke="#6366F1" strokeDasharray="4 4" strokeOpacity={0.6} />
              <Tooltip content={<CustomTrendTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4, strokeWidth: 1, stroke: '#FFFFFF' }}
                activeDot={{ r: 7, fill: '#34D399', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
          Snapshot captured automatically upon deterministic score recalculations into MongoDB.
        </p>
      </div>

      {/* 5 Pillars Progress Breakdown */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-fintech-border space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5 text-slate-900 dark:text-white font-bold text-base">
            <Cpu className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>5-Pillar Score Breakdown (Pure Python Execution)</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clamped 0 – 100</span>
        </div>

        <div className="space-y-5">
          {data.pillars.map((pillar) => {
            const isFull = pillar.score >= pillar.max_score * 0.8;
            const isMid = pillar.score >= pillar.max_score * 0.5 && !isFull;

            const barColor = isFull
              ? 'bg-emerald-500'
              : isMid
              ? 'bg-indigo-500'
              : 'bg-rose-500';

            return (
              <div
                key={pillar.name}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{pillar.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isFull ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : isMid ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}>
                      {pillar.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    <span className="text-emerald-600 dark:text-emerald-400">{pillar.score}</span> / {pillar.max_score} pts
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pillar.percentage}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">{pillar.insight}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategic Improvement Guidance */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-fintech-border">
        <h3 className="text-base font-bold text-slate-900 dark:text-white pb-4 border-b border-slate-200 dark:border-slate-800">
          Deterministic Recommendations to Improve Score
        </h3>

        <ul className="mt-5 space-y-3">
          {data.summary_recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-slate-600 dark:text-slate-400">Want Gemini to explain your 5 score pillars in detail?</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="flex items-center space-x-1.5 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <span>Update Profile</span>
            </Link>
            <Link
              to="/ai-chat"
              className="flex items-center space-x-1.5 font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-all shadow-sm"
            >
              <span>Consult AI Advisor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
