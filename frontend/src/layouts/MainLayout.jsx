import React from 'react';
import { Navbar } from '../components/Navbar';

export const MainLayout = ({ children, isConnected, isDegraded, latency, onRefresh, loading }) => {
  return (
    <div className="min-h-screen bg-fintech-bg flex flex-col relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-48 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar
        isConnected={isConnected}
        isDegraded={isDegraded}
        latency={latency}
        onRefresh={onRefresh}
        loading={loading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-fintech-border/60 bg-white dark:bg-fintech-bg/90 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-400">SMARTFIN</span>
            <span>&bull;</span>
            <span>AI-Powered Personal Financial Management System</span>
          </div>
          <div>
            FastAPI &bull; React &bull; MongoDB &bull; Gemini AI &bull; ReportLab
          </div>
        </div>
      </footer>
    </div>
  );
};
