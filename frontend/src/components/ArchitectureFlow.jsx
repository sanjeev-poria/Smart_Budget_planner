import React from 'react';
import { ArrowRight, Monitor, Cpu, Sparkles, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ArchitectureFlow = () => {
  const tiers = [
    {
      title: 'Frontend Presentation',
      tech: 'React 18 + Vite + Tailwind',
      role: 'User Interface, Charts & Reactive State',
      icon: Monitor,
      color: 'from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      title: 'REST API Gateway',
      tech: 'FastAPI + Pydantic + JWT',
      role: 'Endpoints, CORS, Auth & Validation',
      icon: Cpu,
      color: 'from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20',
      borderColor: 'border-indigo-500/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Dual Engine Layer',
      tech: 'Python Deterministic + Gemini AI',
      role: 'Deterministic Math & AI Advisor Layer',
      icon: Sparkles,
      color: 'from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      highlight: true,
    },
    {
      title: 'Persistent Storage',
      tech: 'MongoDB (Local / Atlas)',
      role: 'Accounts, Transactions & Profiles',
      icon: Database,
      color: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 mt-8 border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Architecture & Calculation Mandate</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Four-Tier Verified Financial Pipeline</h2>
        </div>
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-medium">Deterministic Python Math Guaranteed</span>
        </div>
      </div>

      {/* Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {tiers.map((tier, idx) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.title}
              className={`relative rounded-2xl border p-5 bg-gradient-to-b ${tier.color} ${tier.borderColor} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 ${tier.textColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                    Tier 0{idx + 1}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{tier.title}</h4>
                <p className={`text-xs font-medium mt-0.5 ${tier.textColor}`}>{tier.tech}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300/80 mt-2.5 leading-relaxed">{tier.role}</p>
              </div>

              {idx < 3 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-full p-1 shadow-md">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Critical Rule Banner */}
      <div className="mt-6 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-1.5 flex-shrink-0 animate-ping" />
          <p>
            <strong className="text-slate-900 dark:text-white font-semibold">Authoritative Integrity Rule: </strong>
            Gemini AI is strictly isolated from calculations. Health scores, net worth, budgets, and debt schedules are computed deterministically in Python backend services; Gemini generates conversational guidance and narrative insights based on the verified backend outputs.
          </p>
        </div>
      </div>
    </div>
  );
};
