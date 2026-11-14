import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Cpu,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ModulePlaceholderPage = ({
  title,
  subtitle,
  category,
  icon: Icon,
  description,
  deterministicMetrics = [],
}) => {
  const { user } = useAuth();
  const p = user?.financial_profile || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-fintech-border shadow-sm dark:shadow-glow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 dark:text-indigo-400 flex-shrink-0">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                {category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                {subtitle || description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Protected Route &bull; {user?.name}</span>
          </div>
        </div>
      </div>

      {/* Architecture Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-fintech-border lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm pb-3 border-b border-slate-200 dark:border-slate-800">
            <Cpu className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Deterministic Service Pipeline</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Authoritative Mathematical Metrics Computed
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deterministicMetrics.map((metric, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">{metric.name}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{metric.formula}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Data Context Box */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-fintech-border flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm pb-3 border-b border-slate-200 dark:border-slate-800">
              <Database className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Active User Parameters</span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Monthly Inflow</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">₹{p.monthly_income?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Monthly Expenses</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">₹{p.monthly_expenses?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Current Savings</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">₹{p.current_savings?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Monthly EMI</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">₹{p.monthly_emi?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Tax Regime</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 uppercase font-semibold">{p.tax_regime || 'New'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/profile"
              className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
            >
              <span>Update Baseline Parameters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
