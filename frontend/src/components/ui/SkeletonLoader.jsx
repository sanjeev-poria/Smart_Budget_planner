import React from 'react';

export const SkeletonLoader = ({
  type = 'card',
  count = 1,
  rows = 4,
  cols = 4,
  className = '',
}) => {
  if (type === 'metric') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ${className}`}>
        {Array.from({ length: count || 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-5 border border-fintech-border/80 skeleton-shimmer space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800/80 rounded" />
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800/80" />
            </div>
            <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800/80 rounded" />
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800/80 rounded" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800/80 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`glass-card rounded-2xl p-5 border border-fintech-border/80 ${className}`}>
        <div className="space-y-4">
          <div className="flex justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded skeleton-shimmer" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded skeleton-shimmer" />
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={r}
              className="grid gap-4 py-3 border-b border-slate-100 dark:border-slate-800/40"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: cols }).map((_, c) => (
                <div
                  key={c}
                  className="h-3.5 bg-slate-200/80 dark:bg-slate-800/70 rounded skeleton-shimmer"
                  style={{ width: `${60 + ((c * 17) % 35)}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`glass-card rounded-2xl p-6 border border-fintech-border/80 ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded skeleton-shimmer" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded skeleton-shimmer" />
        </div>
        <div className="h-64 flex items-end justify-between gap-3 px-4 pt-6 bg-slate-100 dark:bg-slate-900/40 rounded-xl skeleton-shimmer">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-t"
              style={{ height: `${20 + ((i * 23) % 75)}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default: generic card skeleton
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-card rounded-2xl p-6 border border-fintech-border/80 skeleton-shimmer space-y-4"
        >
          <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800/90 rounded" />
          <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800/70 rounded" />
          <div className="h-20 bg-slate-200/60 dark:bg-slate-800/50 rounded-xl" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
