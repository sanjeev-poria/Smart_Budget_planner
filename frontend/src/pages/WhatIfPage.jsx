import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getBaselineProfile,
  simulateScenario,
  getSavedScenarios,
  saveScenario,
  updateSavedScenario,
  deleteSavedScenario,
} from '../services/whatIfService';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  Bookmark,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  Calendar,
  IndianRupee,
  Briefcase,
  PiggyBank,
  LineChart,
  CreditCard,
  Target,
  Loader2,
  Save,
  Trash2,
  Edit3,
  X,
  ChevronRight,
  Info,
  Scale,
  Award,
  Layers,
  Zap,
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    id: 'salary_hike',
    icon: Briefcase,
    title: 'Salary Hike (+15%)',
    description: 'Simulate a career promotion with a 15% bump in monthly inflow.',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    apply: (b) => ({
      monthly_income: Math.round(b.monthly_income * 1.15),
    }),
  },
  {
    id: 'expense_cut',
    icon: ScissorsIcon,
    title: 'Expense Cut (-15%)',
    description: 'Optimize discretionary spending and curb lifestyle inflation.',
    color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
    apply: (b) => ({
      monthly_expenses: Math.max(0, Math.round(b.monthly_expenses * 0.85)),
    }),
  },
  {
    id: 'sip_step_up',
    icon: LineChart,
    title: 'SIP Step-Up (+₹3,000)',
    description: 'Accelerate wealth creation by boosting monthly mutual fund investments.',
    color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
    apply: (b) => ({
      monthly_investment: Math.round(b.monthly_investment + 3000),
    }),
  },
  {
    id: 'new_emi',
    icon: CreditCard,
    title: 'New Car EMI (+₹5,000)',
    description: 'Test whether your cashflow can comfortably absorb a new vehicle loan.',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    apply: (b) => ({
      monthly_emi: Math.round(b.monthly_emi + 5000),
    }),
  },
  {
    id: 'aggressive_saving',
    icon: PiggyBank,
    title: 'Emergency Boost (+₹5,000)',
    description: 'Prioritize liquid safety net by increasing monthly emergency savings.',
    color: 'from-violet-500/20 to-pink-500/20 text-violet-400 border-violet-500/30',
    apply: (b) => ({
      current_savings: Math.round(b.current_savings + 60000),
      monthly_savings: Math.round(b.monthly_savings + 5000),
    }),
  },
];

function ScissorsIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

export const WhatIfPage = () => {
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);

  // Baseline & Simulation state
  const [baselineProfile, setBaselineProfile] = useState(null);
  const [inputs, setInputs] = useState({
    monthly_income: 0,
    monthly_expenses: 0,
    current_savings: 0,
    monthly_emi: 0,
    monthly_investment: 0,
    investment_return_rate: 12,
    debt_payment: 0,
    monthly_savings: 0,
    target_goal_contribution: 0,
  });
  const [simulationData, setSimulationData] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('wealth'); // 'wealth' or 'cashflow'

  // Saved scenarios state
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ scenario_name: '', description: '' });
  const [savingScenario, setSavingScenario] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [editingScenarioId, setEditingScenarioId] = useState(null);
  const [editNameInput, setEditNameInput] = useState('');

  // 1. Initial Load of Baseline Profile and Saved Scenarios
  const initSimulator = async () => {
    try {
      setLoading(true);
      setError(null);
      const [baseline, savedList] = await Promise.all([
        getBaselineProfile(),
        getSavedScenarios(),
      ]);

      setBaselineProfile(baseline);
      setSavedScenarios(savedList);

      const initialInputs = {
        monthly_income: baseline.monthly_income,
        monthly_expenses: baseline.monthly_expenses,
        current_savings: baseline.current_savings,
        monthly_emi: baseline.monthly_emi,
        monthly_investment: baseline.monthly_investment,
        investment_return_rate: baseline.investment_return_rate || 12,
        debt_payment: baseline.debt_payment || baseline.monthly_emi,
        monthly_savings: baseline.monthly_savings || 0,
        target_goal_contribution: 0,
      };
      setInputs(initialInputs);

      // Run initial simulation matching baseline
      const sim = await simulateScenario(initialInputs);
      setSimulationData(sim);
    } catch (err) {
      console.error('Failed to initialize simulator:', err);
      setError(err.response?.data?.detail || 'Unable to connect to financial simulator engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSimulator();
  }, []);

  // 2. Debounced / Interactive Simulation Runner
  const triggerSimulation = useCallback(
    async (currentInputs) => {
      try {
        setSimulating(true);
        const sim = await simulateScenario(currentInputs);
        setSimulationData(sim);
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setSimulating(false);
      }
    },
    []
  );

  // Update a single input and trigger simulation
  const handleInputChange = (field, value) => {
    const numVal = parseFloat(value);
    const safeVal = isNaN(numVal) ? 0 : Math.max(0, numVal);
    const updated = { ...inputs, [field]: safeVal };
    setInputs(updated);
    triggerSimulation(updated);
  };

  // Quick delta button (+100, -100, +1000, etc.)
  const handleQuickAdjust = (field, delta) => {
    const current = inputs[field] || 0;
    const nextVal = Math.max(0, Math.round(current + delta));
    const updated = { ...inputs, [field]: nextVal };
    setInputs(updated);
    triggerSimulation(updated);
  };

  // Reset to live profile baseline
  const handleResetToBaseline = () => {
    if (!baselineProfile) return;
    const initialInputs = {
      monthly_income: baselineProfile.monthly_income,
      monthly_expenses: baselineProfile.monthly_expenses,
      current_savings: baselineProfile.current_savings,
      monthly_emi: baselineProfile.monthly_emi,
      monthly_investment: baselineProfile.monthly_investment,
      investment_return_rate: baselineProfile.investment_return_rate || 12,
      debt_payment: baselineProfile.debt_payment || baselineProfile.monthly_emi,
      monthly_savings: baselineProfile.monthly_savings || 0,
      target_goal_contribution: 0,
    };
    setInputs(initialInputs);
    triggerSimulation(initialInputs);
  };

  // Apply Preset Scenario
  const handleApplyPreset = (preset) => {
    if (!baselineProfile) return;
    const overrides = preset.apply(baselineProfile);
    const updated = { ...inputs, ...overrides };
    setInputs(updated);
    triggerSimulation(updated);
  };

  // Save Scenario
  const handleSaveScenarioSubmit = async (e) => {
    e.preventDefault();
    if (!saveForm.scenario_name.trim()) return;

    try {
      setSavingScenario(true);
      const res = await saveScenario({
        scenario_name: saveForm.scenario_name,
        description: saveForm.description,
        inputs: inputs,
      });
      setSavedScenarios((prev) => [res, ...prev]);
      setShowSaveModal(false);
      setSaveForm({ scenario_name: '', description: '' });
      setSaveSuccessMsg(`Scenario "${res.scenario_name}" successfully saved!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save scenario:', err);
    } finally {
      setSavingScenario(false);
    }
  };

  // Load a Saved Scenario
  const handleLoadSavedScenario = (scenario) => {
    const savedInputs = {
      monthly_income: scenario.inputs.monthly_income ?? baselineProfile.monthly_income,
      monthly_expenses: scenario.inputs.monthly_expenses ?? baselineProfile.monthly_expenses,
      current_savings: scenario.inputs.current_savings ?? baselineProfile.current_savings,
      monthly_emi: scenario.inputs.monthly_emi ?? baselineProfile.monthly_emi,
      monthly_investment: scenario.inputs.monthly_investment ?? baselineProfile.monthly_investment,
      investment_return_rate: scenario.inputs.investment_return_rate ?? 12,
      debt_payment: scenario.inputs.debt_payment ?? baselineProfile.monthly_emi,
      monthly_savings: scenario.inputs.monthly_savings ?? 0,
      target_goal_contribution: scenario.inputs.target_goal_contribution ?? 0,
    };
    setInputs(savedInputs);
    triggerSimulation(savedInputs);
    setShowSavedModal(false);
  };

  // Rename Saved Scenario
  const handleRenameScenario = async (id) => {
    if (!editNameInput.trim()) return;
    try {
      const updated = await updateSavedScenario(id, { scenario_name: editNameInput });
      setSavedScenarios((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingScenarioId(null);
      setEditNameInput('');
    } catch (err) {
      console.error('Failed to rename scenario:', err);
    }
  };

  // Delete Saved Scenario
  const handleDeleteScenario = async (id) => {
    try {
      await deleteSavedScenario(id);
      setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete scenario:', err);
    }
  };

  // Cashflow Comparison Chart Data
  const cashflowBarData = useMemo(() => {
    if (!simulationData) return [];
    const b = simulationData.baseline_profile;
    const w = simulationData.simulated_inputs;
    return [
      { name: 'Income', Baseline: b.monthly_income, WhatIf: w.monthly_income },
      { name: 'Expenses', Baseline: b.monthly_expenses, WhatIf: w.monthly_expenses },
      { name: 'Surplus', Baseline: b.surplus, WhatIf: w.surplus },
      { name: 'Investments', Baseline: b.monthly_investment, WhatIf: w.monthly_investment },
      { name: 'EMI Burden', Baseline: b.monthly_emi, WhatIf: w.monthly_emi },
    ];
  }, [simulationData]);

  // Rating badge styling
  const getRatingBadge = (rating) => {
    switch (rating) {
      case 'Highly Positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Moderately Positive':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'Neutral':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
      case 'Critical Outflow Risk':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse';
      case 'Cautionary / Cashflow Strain':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Scenario Management Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 rounded-xl border border-purple-500/30 text-purple-500 dark:text-purple-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  What-If Financial Simulator
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  FLAGSHIP
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Simulate salary hikes, new loans, and aggressive SIP step-ups without affecting your actual stored data.
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetToBaseline}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition active:scale-95 cursor-pointer"
            title="Reset all inputs back to your live profile"
          >
            <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={() => setShowSavedModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition active:scale-95 cursor-pointer"
            title="View or load your saved scenarios"
          >
            <Bookmark className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span>Saved ({savedScenarios.length})</span>
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-purple-500/20 transition transform active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Scenario</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Quick-Click Scenarios */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          ⚡ One-Click Financial Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESET_SCENARIOS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-3.5 rounded-xl border bg-gradient-to-tr ${preset.color} hover:scale-[1.02] active:scale-[0.98] transition text-left flex flex-col justify-between cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className="w-4 h-4" />
                  <Sparkles className="w-3 h-3 opacity-60" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">{preset.title}</h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 dark:text-purple-400 mb-3" />
          <p className="text-sm">Connecting multi-module sensitivity engine...</p>
        </div>
      ) : (
        /* Dual-Pane Simulator Studio */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Interactive Sliders & Inputs (5 cols) */}
          <div className="lg:col-span-5 glass-panel border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Scenario Controls</span>
                  {simulating && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500 dark:text-purple-400" />}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Tweak hypothetical variables in real-time</p>
              </div>
              <button
                onClick={handleResetToBaseline}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Variable Slider 1: Monthly Income */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Monthly Inflow / Income
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Actual: ₹{baselineProfile?.monthly_income?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAdjust('monthly_income', -1000)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min="0"
                  max={Math.max(200000, (baselineProfile?.monthly_income || 50000) * 3)}
                  step="1000"
                  value={inputs.monthly_income}
                  onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => handleQuickAdjust('monthly_income', 1000)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">₹0</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 dark:text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    value={inputs.monthly_income}
                    onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                    className="w-28 text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Variable Slider 2: Monthly Expenses */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ScissorsIcon className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Monthly Living Expenses
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Actual: ₹{baselineProfile?.monthly_expenses?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAdjust('monthly_expenses', -1000)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min="0"
                  max={Math.max(150000, (baselineProfile?.monthly_expenses || 30000) * 3)}
                  step="500"
                  value={inputs.monthly_expenses}
                  onChange={(e) => handleInputChange('monthly_expenses', e.target.value)}
                  className="w-full accent-rose-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => handleQuickAdjust('monthly_expenses', 1000)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">₹0</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 dark:text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    value={inputs.monthly_expenses}
                    onChange={(e) => handleInputChange('monthly_expenses', e.target.value)}
                    className="w-28 text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Variable Slider 3: Monthly Investment (SIP) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <LineChart className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Monthly SIP Investment
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Actual: ₹{baselineProfile?.monthly_investment?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAdjust('monthly_investment', -500)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min="0"
                  max={Math.max(100000, (baselineProfile?.monthly_investment || 10000) * 4)}
                  step="500"
                  value={inputs.monthly_investment}
                  onChange={(e) => handleInputChange('monthly_investment', e.target.value)}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => handleQuickAdjust('monthly_investment', 500)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">₹0</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 dark:text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    value={inputs.monthly_investment}
                    onChange={(e) => handleInputChange('monthly_investment', e.target.value)}
                    className="w-28 text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Variable Slider 4: Monthly EMI / Debt Payment */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Monthly EMI / Debt Payment
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Actual: ₹{baselineProfile?.monthly_emi?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAdjust('monthly_emi', -500)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min="0"
                  max={Math.max(100000, (baselineProfile?.monthly_emi || 10000) * 4)}
                  step="500"
                  value={inputs.monthly_emi}
                  onChange={(e) => handleInputChange('monthly_emi', e.target.value)}
                  className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => handleQuickAdjust('monthly_emi', 500)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">₹0</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 dark:text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    value={inputs.monthly_emi}
                    onChange={(e) => handleInputChange('monthly_emi', e.target.value)}
                    className="w-28 text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Variable Slider 5: Liquid Savings Reserve */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <PiggyBank className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Liquid Savings Reserve
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Actual: ₹{baselineProfile?.current_savings?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAdjust('current_savings', -5000)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="range"
                  min="0"
                  max={Math.max(1000000, (baselineProfile?.current_savings || 100000) * 3)}
                  step="5000"
                  value={inputs.current_savings}
                  onChange={(e) => handleInputChange('current_savings', e.target.value)}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  onClick={() => handleQuickAdjust('current_savings', 5000)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">₹0</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-slate-400 dark:text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    value={inputs.current_savings}
                    onChange={(e) => handleInputChange('current_savings', e.target.value)}
                    className="w-28 text-right bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-6 pr-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Variable Slider 6: Investment Return Rate (%) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> Expected Annual Return
                </span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{inputs.investment_return_rate}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={inputs.investment_return_rate}
                onChange={(e) => handleInputChange('investment_return_rate', e.target.value)}
                className="w-full accent-purple-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>1% (Conservative)</span>
                <span>12% (Equity)</span>
                <span>25% (Aggressive)</span>
              </div>
            </div>
          </div>

          {/* Right Pane: CURRENT vs WHAT-IF Results (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Executive Impact Banner */}
            {simulationData?.net_financial_impact && (
              <div
                className={`p-5 rounded-2xl border ${getRatingBadge(
                  simulationData.net_financial_impact.rating
                )} backdrop-blur-md space-y-3 shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border">
                    {simulationData.net_financial_impact.rating}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">
                      Annual Cashflow Delta
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        simulationData.net_financial_impact.annual_cashflow_delta >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {simulationData.net_financial_impact.annual_cashflow_delta >= 0 ? '+' : ''}₹
                      {simulationData.net_financial_impact.annual_cashflow_delta.toLocaleString('en-IN')}
                      /yr
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {simulationData.net_financial_impact.headline}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-xs">
                  {simulationData.net_financial_impact.takeaways.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Have Gemini break down the trade-offs of this simulation</span>
                  </div>
                  <Link
                    to="/ai-chat"
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all shadow-sm"
                  >
                    <span>Consult AI Advisor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Comparison Cards: CURRENT vs WHAT-IF */}
            {simulationData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Monthly Surplus */}
                <div className="glass-panel border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Monthly Surplus
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Current</span>
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                        ₹{simulationData.metrics.monthly_surplus.baseline.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <div className="text-right">
                      <span className="text-xs text-cyan-600 dark:text-cyan-400 block font-medium">What-If</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        ₹{simulationData.metrics.monthly_surplus.what_if.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Net Delta:</span>
                    <span
                      className={`font-bold ${
                        simulationData.metrics.monthly_surplus.is_improvement
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {simulationData.metrics.monthly_surplus.delta >= 0 ? '+' : ''}₹
                      {simulationData.metrics.monthly_surplus.delta.toLocaleString('en-IN')} (
                      {simulationData.metrics.monthly_surplus.delta_percent}%)
                    </span>
                  </div>
                </div>

                {/* 2. Financial Health Score */}
                <div className="glass-panel border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Health Score (0-100)
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Current</span>
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                        {simulationData.metrics.health_score.baseline} / 100
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <div className="text-right">
                      <span className="text-xs text-purple-600 dark:text-purple-400 block font-medium">What-If</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        {simulationData.metrics.health_score.what_if} / 100
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Score Impact:</span>
                    <span
                      className={`font-bold ${
                        simulationData.metrics.health_score.is_improvement
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {simulationData.metrics.health_score.delta >= 0 ? '+' : ''}
                      {simulationData.metrics.health_score.delta} pts (
                      {simulationData.simulated_inputs.risk_level})
                    </span>
                  </div>
                </div>

                {/* 3. Emergency Runway */}
                <div className="glass-panel border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Emergency Runway
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Current</span>
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                        {simulationData.metrics.emergency_runway.baseline} mos
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <div className="text-right">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">What-If</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        {simulationData.metrics.emergency_runway.what_if} mos
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Runway Shift:</span>
                    <span
                      className={`font-bold ${
                        simulationData.metrics.emergency_runway.is_improvement
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {simulationData.metrics.emergency_runway.delta >= 0 ? '+' : ''}
                      {simulationData.metrics.emergency_runway.delta} months
                    </span>
                  </div>
                </div>

                {/* 4. 10-Year Wealth Projection */}
                <div className="glass-panel border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    10-Year Wealth (SIP)
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Current</span>
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                        ₹{simulationData.metrics.wealth_10y.baseline.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <div className="text-right">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 block font-medium">What-If</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        ₹{simulationData.metrics.wealth_10y.what_if.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Wealth Delta:</span>
                    <span
                      className={`font-bold ${
                        simulationData.metrics.wealth_10y.is_improvement
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {simulationData.metrics.wealth_10y.delta >= 0 ? '+' : ''}₹
                      {simulationData.metrics.wealth_10y.delta.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Recharts: Wealth Trajectory & Cashflow Waterfall */}
            <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveChartTab('wealth')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeChartTab === 'wealth'
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    10-Year Wealth Trajectory
                  </button>
                  <button
                    onClick={() => setActiveChartTab('cashflow')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      activeChartTab === 'cashflow'
                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Cashflow Diff BarChart
                  </button>
                </div>
              </div>

              {activeChartTab === 'wealth' ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={simulationData?.wealth_trajectory || []}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="whatifGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A855F7" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeOpacity={0.5} vertical={false} />
                      <XAxis
                        dataKey="year"
                        stroke="#64748B"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickFormatter={(y) => `Yr ${y}`}
                      />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickFormatter={(val) => `₹${val >= 10000000 ? (val / 10000000).toFixed(1) + 'Cr' : val >= 100000 ? (val / 100000).toFixed(0) + 'L' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1">
                                <p className="font-bold text-slate-900 dark:text-white">Year {data.year}</p>
                                <p className="text-cyan-600 dark:text-cyan-400">
                                  Current: ₹{data.baseline_wealth?.toLocaleString('en-IN')}
                                </p>
                                <p className="text-purple-600 dark:text-purple-400 font-semibold">
                                  What-If: ₹{data.whatif_wealth?.toLocaleString('en-IN')}
                                </p>
                                <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  Delta: +₹{data.wealth_delta?.toLocaleString('en-IN')}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="baseline_wealth"
                        name="Current Baseline"
                        stroke="#38BDF8"
                        strokeWidth={2}
                        fill="url(#baselineGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="whatif_wealth"
                        name="What-If Scenario"
                        stroke="#A855F7"
                        strokeWidth={2}
                        fill="url(#whatifGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={cashflowBarData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeOpacity={0.5} vertical={false} />
                      <XAxis dataKey="name" stroke="#64748B" tick={{ fill: '#64748B', fontSize: 11 }} />
                      <YAxis
                        stroke="#64748B"
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        tickFormatter={(val) => `₹${val >= 10000000 ? (val / 10000000).toFixed(1) + 'Cr' : val >= 100000 ? (val / 100000).toFixed(0) + 'L' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                                <p className="font-bold text-slate-900 dark:text-white">{data.name}</p>
                                <p className="text-slate-600 dark:text-slate-400">Baseline: ₹{data.Baseline?.toLocaleString('en-IN')}</p>
                                <p className="text-cyan-600 dark:text-cyan-400 font-semibold">What-If: ₹{data.WhatIf?.toLocaleString('en-IN')}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                      />
                      <Bar dataKey="Baseline" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Current Baseline" />
                      <Bar dataKey="WhatIf" fill="#06B6D4" radius={[4, 4, 0, 0]} name="What-If Scenario" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Active Goals Feasibility Radar */}
            {simulationData?.goals_impact?.length > 0 && (
              <div className="glass-panel border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Impact on Active Goals ({simulationData.goals_impact.length})</span>
                </h4>
                <div className="space-y-2">
                  {simulationData.goals_impact.map((goal) => (
                    <div
                      key={goal.goal_id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{goal.goal_name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          Required: ₹{goal.monthly_required?.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Scenario Status</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              goal.whatif_on_track
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {goal.whatif_on_track ? '✓ On Track' : '✗ Off Track'}
                          </span>
                        </div>
                        {goal.months_saved > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                            +{goal.months_saved} mos accelerated
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Scenario Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSaveModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Save What-If Scenario</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Persist this simulation to MongoDB for future reference
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveScenarioSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Scenario Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Architect Promotion + 20% SIP"
                  value={saveForm.scenario_name}
                  onChange={(e) => setSaveForm({ ...saveForm, scenario_name: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Assumes job switch with ₹15,000 salary bump and cutting dining out"
                  value={saveForm.description}
                  onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-300">Active Overrides Snapshot:</p>
                <p>Income: ₹{inputs.monthly_income?.toLocaleString('en-IN')} | Expenses: ₹{inputs.monthly_expenses?.toLocaleString('en-IN')}</p>
                <p>SIP: ₹{inputs.monthly_investment?.toLocaleString('en-IN')} | EMI: ₹{inputs.monthly_emi?.toLocaleString('en-IN')}</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScenario}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingScenario && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save to MongoDB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Saved Scenarios Drawer / Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowSavedModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 flex-shrink-0">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Saved Scenarios</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Switch between or manage previously saved hypothetical setups
                </p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {savedScenarios.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
                  No saved scenarios found. Tweak inputs and click &quot;Save Scenario&quot; to store one.
                </div>
              ) : (
                savedScenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl space-y-2.5 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {editingScenarioId === sc.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editNameInput}
                              onChange={(e) => setEditNameInput(e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-purple-500 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                            />
                            <button
                              onClick={() => handleRenameScenario(sc.id)}
                              className="px-2 py-1 bg-purple-600 rounded text-xs text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingScenarioId(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-400"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{sc.scenario_name}</h4>
                        )}
                        {sc.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{sc.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingScenarioId(sc.id);
                            setEditNameInput(sc.scenario_name);
                          }}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition"
                          title="Rename"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteScenario(sc.id)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-900 text-xs">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Saved: {new Date(sc.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleLoadSavedScenario(sc)}
                        className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-lg font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>Load Scenario</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
