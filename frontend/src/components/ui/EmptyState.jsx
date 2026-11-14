import React from 'react';
import { Plus, ArrowRight, FolderArchive } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderArchive,
  title = 'No Records Found',
  description = 'There are no active records in this section yet.',
  actionText,
  onAction,
  actionIcon: ActionIcon = Plus,
  secondaryActionText,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`glass-card rounded-2xl p-8 sm:p-12 text-center border border-fintech-border/80 flex flex-col items-center justify-center ${className}`}
    >
      {/* Glowing icon backdrop */}
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl scale-150" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
          <Icon className="w-8 h-8" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {/* Action Buttons */}
      {(actionText || secondaryActionText) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all transform active:scale-[0.98]"
            >
              <ActionIcon className="w-4 h-4" />
              <span>{actionText}</span>
            </button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-medium transition-all"
            >
              <span>{secondaryActionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
