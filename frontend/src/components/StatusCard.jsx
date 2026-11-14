import React from 'react';

export const StatusCard = ({
  title,
  subtitle,
  status,
  statusText,
  icon: Icon,
  metric,
  metricLabel,
  description,
  variant = 'default',
}) => {
  const isOk = status === 'ok' || status === 'ready' || status === 'healthy' || status === 'configured';
  const isWarning = status === 'warning' || status === 'degraded' || status === 'key_not_configured';

  const badgeStyles = isOk
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    : isWarning
    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

  const iconBg = isOk
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    : isWarning
    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-600/60 group">
      {/* Subtle background glow */}
      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-30 pointer-events-none ${
        isOk ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
      }`} />

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border capitalize ${badgeStyles}`}>
          {statusText || status}
        </span>
      </div>

      {metric && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-baseline justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{metricLabel}</span>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{metric}</span>
        </div>
      )}

      {description && (
        <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
