import React from 'react';
import { ShieldCheck, Activity, Database, Server, RefreshCw, Cpu } from 'lucide-react';

export const Navbar = ({ isConnected, isDegraded, latency, onRefresh, loading }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-fintech-border/60 bg-white/85 dark:bg-fintech-bg/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-glow-emerald">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">SMARTFIN</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  Phase 1 Foundation
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">AI-Powered Personal Financial Management System</p>
            </div>
          </div>

          {/* Right Status Badge & Actions */}
          <div className="flex items-center space-x-4">
            {/* Live Status Pill */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30'
                : isDegraded
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/30'
                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : isDegraded ? 'bg-amber-500 dark:bg-amber-400' : 'bg-rose-500 dark:bg-rose-400'
              }`} />
              <span>
                {isConnected ? 'System Healthy' : isDegraded ? 'Degraded (DB Offline)' : 'API Disconnected'}
              </span>
              {latency !== null && (
                <span className="text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2 ml-1">
                  {latency}ms
                </span>
              )}
            </div>

            {/* Refresh Button */}
            <button
              id="refresh-health-btn"
              onClick={onRefresh}
              disabled={loading}
              title="Ping Backend API"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-600 transition-all text-xs font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} />
              <span className="hidden md:inline">Ping Status</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
