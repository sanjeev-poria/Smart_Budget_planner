import React, { useState } from 'react';
import {
  Server,
  Database,
  Calculator,
  Sparkles,
  FileText,
  Clock,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Info,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { StatusCard } from '../components/StatusCard';
import { ArchitectureFlow } from '../components/ArchitectureFlow';

export const SystemStatusPage = ({ healthData, clientLatency, loading, error, refresh, lastChecked }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  const isConnected = !!healthData && healthData.status === 'healthy';
  const isDegraded = !!healthData && healthData.status === 'degraded';
  const isOffline = !healthData;

  const dbConnected = healthData?.database?.connected || false;
  const dbLatency = healthData?.database?.latency_ms;
  const dbError = healthData?.database?.error;
  const dbName = healthData?.database?.database_name || 'smartfin_db';

  const engineStatus = healthData?.services?.financial_engine || 'ready';
  const aiStatus = healthData?.services?.ai_service || 'key_not_configured';
  const reportStatus = healthData?.services?.report_generator || 'ready';

  const plannedModules = [
    { name: 'Financial Health Score (0–100)', desc: 'Holistic multi-factor scoring (Savings, Debt, Liquidity, Investments)' },
    { name: 'Net Worth & Asset Tracking', desc: 'Real-time tracking of liquid assets, investments, properties & liabilities' },
    { name: 'Deterministic Budget Engine', desc: '50/30/20 rule adherence and category-level expense velocity' },
    { name: 'Emergency Fund & Risk Analyzer', desc: 'Coverage ratio calculation against essential living expenses' },
    { name: 'Debt Payoff Simulator', desc: 'Algorithmic Avalanche vs Snowball repayment optimization' },
    { name: 'Gemini AI Advisory Chat', desc: 'Context-aware explanations and strategic advice based on backend metrics' },
    { name: 'ReportLab PDF Statements', desc: 'Automated executive financial summaries and visual PDF statements' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero System Status Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-200 dark:border-fintech-border shadow-sm dark:shadow-glow-card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Full-Stack Foundation Initialized</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              SMARTFIN Core Architecture
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              AI-Powered Personal Financial Management System foundational gateway. 
              Verifying real-time API communication, database connectivity, and subsystem readiness.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center min-w-[120px]">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">REST API</span>
              <span className={`text-base font-bold ${isOffline ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {isOffline ? 'Offline' : 'Online'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{clientLatency !== null ? `${clientLatency}ms` : '--'}</span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center min-w-[120px]">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">MongoDB</span>
              <span className={`text-base font-bold ${dbConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>
                {dbConnected ? 'Connected' : 'Offline'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{dbLatency ? `${dbLatency}ms` : 'No Ping'}</span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center min-w-[120px]">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">Calculations</span>
              <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">Deterministic</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Python Native</span>
            </div>
          </div>
        </div>

        {/* Status Alert if Degraded or Offline */}
        {isOffline && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-800 dark:text-rose-200">Unable to reach FastAPI backend server</p>
              <p className="mt-0.5 text-rose-700/80 dark:text-rose-300/80">
                Ensure the backend is running via <code className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 font-mono text-rose-900 dark:text-white">python -m uvicorn app.main:app --port 8000</code> in the backend directory.
              </p>
            </div>
          </div>
        )}

        {isDegraded && (
          <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">MongoDB is not currently reachable</p>
              <p className="mt-0.5 text-amber-700/80 dark:text-amber-300/80">
                The FastAPI REST API and Calculation Engine are healthy. For MongoDB, you can run a local instance or configure a free <strong className="text-amber-900 dark:text-amber-100">MongoDB Atlas</strong> connection string in <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 font-mono text-amber-800 dark:text-amber-200">backend/.env</code> (<code className="font-mono">MONGODB_URL=mongodb+srv://...</code>).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subsystem Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* FastAPI Backend Card */}
        <StatusCard
          title="FastAPI REST API"
          subtitle="v1.0.0 &bull; Python 3.14"
          status={isOffline ? 'error' : 'ok'}
          statusText={isOffline ? 'Disconnected' : 'Operational'}
          icon={Server}
          metric={clientLatency !== null ? `${clientLatency} ms` : '--'}
          metricLabel="HTTP Roundtrip"
          description="High-performance asynchronous API gateway with Pydantic validation and CORS."
        />

        {/* MongoDB Database Card */}
        <StatusCard
          title="MongoDB Storage"
          subtitle={`DB: ${dbName}`}
          status={dbConnected ? 'ok' : 'warning'}
          statusText={dbConnected ? 'Connected' : 'Offline / Standby'}
          icon={Database}
          metric={dbLatency !== null && dbLatency !== undefined ? `${dbLatency} ms` : 'Standby'}
          metricLabel="Ping Latency"
          description={dbConnected ? 'PyMongo client successfully connected with ping acknowledgment.' : 'Awaiting local MongoDB service or MongoDB Atlas connection string in .env.'}
        />

        {/* Calculation Engine Card */}
        <StatusCard
          title="Calculation Engine"
          subtitle="Deterministic Core"
          status={engineStatus === 'ready' ? 'ok' : 'warning'}
          statusText={engineStatus}
          icon={Calculator}
          metric="Deterministic"
          metricLabel="Execution Mode"
          description="Authoritative calculations performed strictly in Python. Gemini AI never calculates raw numbers."
        />

        {/* Gemini AI Advisory Card */}
        <StatusCard
          title="Gemini AI Advisor"
          subtitle="Contextual Guidance"
          status={aiStatus === 'configured' ? 'ok' : 'warning'}
          statusText={aiStatus === 'configured' ? 'Key Set' : 'Key Needed'}
          icon={Sparkles}
          metric={aiStatus === 'configured' ? 'Active' : 'Unset'}
          metricLabel="Environment Status"
          description={aiStatus === 'configured' ? 'Gemini API key loaded from .env. Ready for natural language insights.' : 'Add your GEMINI_API_KEY to backend/.env when ready for AI insights.'}
        />
      </div>

      {/* Architecture Flow Diagram */}
      <ArchitectureFlow />

      {/* System Diagnostics & Environment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Overview */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-fintech-border lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm">
              <Terminal className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>Environment & Gateway Verification</span>
            </div>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              <span>Swagger Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Backend URL</span>
              <span className="text-slate-900 dark:text-white font-mono mt-1 block">http://localhost:8000</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Health Check Endpoint</span>
              <span className="text-slate-900 dark:text-white font-mono mt-1 block">/api/v1/health</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">CORS Policy</span>
              <span className="text-slate-900 dark:text-white font-mono mt-1 block">http://localhost:5173 (Vite)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Last Ping Verification</span>
              <span className="text-slate-900 dark:text-white font-mono mt-1 block">
                {lastChecked ? lastChecked.toLocaleTimeString() : 'Pending'}
              </span>
            </div>
          </div>

          {/* Database Diagnostics Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium mb-1">
              <span className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>MongoDB Target: <code className="font-mono text-slate-900 dark:text-white">{dbName}</code></span>
              </span>
              <span className={dbConnected ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                {dbConnected ? 'Connection Verified' : 'Standby / Local or Atlas URI'}
              </span>
            </div>
            {dbError && (
              <p className="mt-2 text-[11px] text-slate-700 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-800/80 overflow-x-auto">
                {dbError}
              </p>
            )}
            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              To connect to MongoDB Atlas, add your cluster string to <code className="text-slate-800 dark:text-slate-300 font-mono">backend/.env</code>:
              <br />
              <code className="text-indigo-600 dark:text-indigo-300 font-mono">MONGODB_URL="mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority"</code>
            </p>
          </div>
        </div>

        {/* Blueprint Modules (Real data in upcoming phases) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-fintech-border flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold text-sm pb-4 border-b border-slate-200 dark:border-slate-800">
              <Layers className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Upcoming Core Modules</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              In accordance with our architecture guidelines, no fake mock dashboards are rendered. Real data services will drive each module:
            </p>

            <ul className="mt-4 space-y-2.5">
              {plannedModules.slice(0, 4).map((mod) => (
                <li key={mod.name} className="text-xs flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{mod.name}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{mod.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Phase 1 provides the verified full-stack highway for all future features.
          </div>
        </div>
      </div>

      {/* Raw Health API Response Inspector */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-fintech-border overflow-hidden">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="w-full px-6 py-4 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Developer Inspector: Raw Backend JSON Response (GET /api/v1/health)</span>
          </div>
          {showRawJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRawJson && (
          <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60">
            <pre className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-72">
              {JSON.stringify(healthData || { error: error || 'No response' }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
