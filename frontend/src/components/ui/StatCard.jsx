import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const ACCENTS = {
  emerald: {
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30',
    glow: 'hover:shadow-md hover:border-emerald-300 dark:hover:shadow-glow-emerald dark:hover:border-emerald-500/40',
    bar: 'bg-emerald-500',
  },
  rose: {
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30',
    glow: 'hover:shadow-md hover:border-rose-300 dark:hover:shadow-glow-rose dark:hover:border-rose-500/40',
    bar: 'bg-rose-500',
  },
  indigo: {
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/30',
    glow: 'hover:shadow-md hover:border-indigo-300 dark:hover:shadow-glow-indigo dark:hover:border-indigo-500/40',
    bar: 'bg-indigo-500',
  },
  cyan: {
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-200 dark:border-cyan-500/30',
    glow: 'hover:shadow-md hover:border-cyan-300 dark:hover:shadow-glow-cyan dark:hover:border-cyan-500/40',
    bar: 'bg-cyan-500',
  },
  amber: {
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30',
    glow: 'hover:shadow-md hover:border-amber-300 dark:hover:shadow-glow-amber dark:hover:border-amber-500/40',
    bar: 'bg-amber-500',
  },
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  accent = 'emerald',
  trend,
  trendPositive = true,
  subtitle,
  progress,
  badge,
  onClick,
  className = '',
}) => {
  const conf = ACCENTS[accent] || ACCENTS.emerald;

  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-5 border border-fintech-border/80 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-1 ' + conf.glow : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            {title}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm flex-shrink-0 transition-colors ${conf.iconBg} ${conf.iconColor}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Optional Progress Bar */}
      {typeof progress === 'number' && (
        <div className="mt-3">
          <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${conf.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer info: trend, subtitle, badge */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between text-xs">
        {trend ? (
          <div
            className={`flex items-center space-x-1 font-semibold ${
              trendPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trendPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>{trend}</span>
          </div>
        ) : subtitle ? (
          <span className="text-slate-500 dark:text-slate-400 truncate text-[11px]">{subtitle}</span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Real-Time Verified</span>
        )}

        {badge && <div>{badge}</div>}
      </div>
    </div>
  );
};

export default StatCard;
