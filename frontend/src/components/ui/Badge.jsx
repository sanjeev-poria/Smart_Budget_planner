import React from 'react';

const VARIANTS = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/30',
    dot: 'bg-emerald-600 dark:bg-emerald-400',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-500/30',
    dot: 'bg-indigo-600 dark:bg-indigo-400',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    text: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-500/30',
    dot: 'bg-cyan-600 dark:bg-cyan-400',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/30',
    dot: 'bg-rose-600 dark:bg-rose-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/30',
    dot: 'bg-amber-600 dark:bg-amber-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-500/30',
    dot: 'bg-purple-600 dark:bg-purple-400',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800/80',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700/80',
    dot: 'bg-slate-500 dark:bg-slate-400',
  },
};

const SIZES = {
  xs: 'text-[10px] px-2 py-0.5',
  sm: 'text-xs px-2.5 py-0.5',
  md: 'text-sm px-3 py-1',
};

export const Badge = ({
  children,
  variant = 'emerald',
  size = 'xs',
  pulse = false,
  className = '',
}) => {
  const v = VARIANTS[variant] || VARIANTS.slate;
  const s = SIZES[size] || SIZES.xs;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-semibold rounded-full border ${v.bg} ${v.text} ${v.border} ${s} transition-colors ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${v.dot}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${v.dot}`} />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
