import React from 'react';

const GLOW_CLASSES = {
  emerald: 'hover:shadow-md hover:border-emerald-400 dark:hover:shadow-glow-emerald dark:hover:border-emerald-500/40',
  indigo: 'hover:shadow-md hover:border-indigo-400 dark:hover:shadow-glow-indigo dark:hover:border-indigo-500/40',
  cyan: 'hover:shadow-md hover:border-cyan-400 dark:hover:shadow-glow-cyan dark:hover:border-cyan-500/40',
  rose: 'hover:shadow-md hover:border-rose-400 dark:hover:shadow-glow-rose dark:hover:border-rose-500/40',
  amber: 'hover:shadow-md hover:border-amber-400 dark:hover:shadow-glow-amber dark:hover:border-amber-500/40',
  none: '',
};

export const FintechCard = ({
  children,
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  interactive = false,
  glow = 'indigo',
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) => {
  const glowStyle = interactive ? (GLOW_CLASSES[glow] || GLOW_CLASSES.indigo) : '';
  const cardStyle = interactive
    ? 'glass-card-interactive transition-all duration-200'
    : 'glass-card';

  return (
    <div className={`rounded-2xl border border-fintech-border/80 overflow-hidden ${cardStyle} ${glowStyle} ${className}`}>
      {(title || Icon || badge || action) && (
        <div
          className={`px-5 py-4 border-b border-fintech-border/60 flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 transition-colors">
                <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                {title && (
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {title}
                  </h3>
                )}
                {badge && <div>{badge}</div>}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default FintechCard;
