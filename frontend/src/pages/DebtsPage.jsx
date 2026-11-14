import React, { useState, useEffect } from 'react';
import {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  getRepaymentPlan,
} from '../services/debtService';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatCurrency } from '../utils/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  CreditCard,
  Plus,
  TrendingDown,
  Percent,
  Calendar,
  Zap,
  Snowflake,
  Flame,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Edit2,
  Trash2,
  Loader2,
  X,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

const CATEGORIES = [
  'Credit Card',
  'Personal Loan',
  'Student Loan',
  'Auto Loan',
  'Mortgage',
  'Medical',
  'Other',
];

export const DebtsPage = () => {
  const [debtsData, setDebtsData] = useState({ items: [], summary: null });
  const [strategy, setStrategy] = useState('avalanche');
  const [extraPayment, setExtraPayment] = useState(0);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deletingDebt, setDeletingDebt] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    debt_name: '',
    principal: '',
    remaining_balance: '',
    interest_rate: '',
    minimum_payment: '',
    due_date: '1st',
    category: 'Credit Card',
  });

  const fetchDebtsAndPlan = async (currentStrategy = strategy, currentExtra = extraPayment) => {
    setError('');
    try {
      const debtsRes = await getDebts();
      setDebtsData(debtsRes);

      if (debtsRes.items && debtsRes.items.length > 0) {
        setPlanLoading(true);
        const planRes = await getRepaymentPlan({
          strategy: currentStrategy,
          extra_monthly_payment: currentExtra,
        });
        setPlan(planRes);
      } else {
        setPlan(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load debts and repayment plan.');
    } finally {
      setLoading(false);
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    fetchDebtsAndPlan();
  }, []);

  const handleStrategyChange = async (newStrategy) => {
    setStrategy(newStrategy);
    if (debtsData.items.length > 0) {
      setPlanLoading(true);
      try {
        const planRes = await getRepaymentPlan({
          strategy: newStrategy,
          extra_monthly_payment: extraPayment,
        });
        setPlan(planRes);
      } catch (err) {
        console.error(err);
      } finally {
        setPlanLoading(false);
      }
    }
  };

  const handleExtraPaymentChange = async (newExtra) => {
    const val = Math.max(0, parseFloat(newExtra) || 0);
    setExtraPayment(val);
    if (debtsData.items.length > 0) {
      try {
        const planRes = await getRepaymentPlan({
          strategy,
          extra_monthly_payment: val,
        });
        setPlan(planRes);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openCreateModal = () => {
    setEditingDebt(null);
    setFormError('');
    setFormData({
      debt_name: '',
      principal: '',
      remaining_balance: '',
      interest_rate: '',
      minimum_payment: '',
      due_date: '15th',
      category: 'Credit Card',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (debt) => {
    setEditingDebt(debt);
    setFormError('');
    setFormData({
      debt_name: debt.debt_name,
      principal: String(debt.principal),
      remaining_balance: String(debt.remaining_balance),
      interest_rate: String(debt.interest_rate),
      minimum_payment: String(debt.minimum_payment),
      due_date: debt.due_date,
      category: debt.category,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const principal = parseFloat(formData.principal);
    const balance = parseFloat(formData.remaining_balance);
    const rate = parseFloat(formData.interest_rate);
    const minPay = parseFloat(formData.minimum_payment);

    if (!formData.debt_name.trim()) {
      setFormError('Debt name is required.');
      return;
    }
    if (isNaN(principal) || principal <= 0) {
      setFormError('Principal amount must be a positive number.');
      return;
    }
    if (isNaN(balance) || balance < 0) {
      setFormError('Remaining balance cannot be negative.');
      return;
    }
    if (isNaN(rate) || rate < 0) {
      setFormError('Interest rate cannot be negative.');
      return;
    }
    if (isNaN(minPay) || minPay <= 0) {
      setFormError('Minimum payment must be greater than zero.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        debt_name: formData.debt_name.trim(),
        principal,
        remaining_balance: balance,
        interest_rate: rate,
        minimum_payment: minPay,
        due_date: formData.due_date.trim() || '1st',
        category: formData.category,
      };

      if (editingDebt) {
        await updateDebt(editingDebt.id, payload);
      } else {
        await createDebt(payload);
      }
      setIsFormOpen(false);
      await fetchDebtsAndPlan(strategy, extraPayment);
    } catch (err) {
      setFormError(err.message || 'Error saving debt liability.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingDebt) return;
    setDeleteSubmitting(true);
    try {
      await deleteDebt(deletingDebt.id);
      setDeletingDebt(null);
      await fetchDebtsAndPlan(strategy, extraPayment);
    } catch (err) {
      alert(err.message || 'Failed to delete debt record.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Custom Chart Tooltip
  const CustomPayoffTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pt = payload[0].payload;
      return (
        <div className="p-3 bg-white dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1">
            Month {pt.month}
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between gap-4 text-rose-500 dark:text-rose-400 font-semibold">
              <span>Remaining Debt:</span>
              <span>{formatCurrency(Number(pt.remaining_total))}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Principal Cleared:</span>
              <span>{formatCurrency(Number(pt.principal_paid))}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-amber-600 dark:text-amber-400 font-medium">
              <span>Interest Paid:</span>
              <span>{formatCurrency(Number(pt.interest_paid))}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Loading debt portfolio & simulating repayment schedules...
        </p>
      </div>
    );
  }

  const summary = debtsData.summary || {
    total_debts: 0,
    total_principal: 0,
    total_remaining_balance: 0,
    total_minimum_payment: 0,
    weighted_average_interest_rate: 0,
  };

  const hasDebts = debtsData.items && debtsData.items.length > 0;
  const isAvalanche = strategy === 'avalanche';

  // Strategy comparison deltas
  const comp = plan?.comparison || {};
  const avalancheComp = comp['avalanche'];
  const snowballComp = comp['snowball'];

  const interestDiff =
    avalancheComp && snowballComp
      ? Math.abs(snowballComp.total_interest_paid - avalancheComp.total_interest_paid)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-fintech-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <span>Debt Elimination & Repayment Hub</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/30">
              Avalanche & Snowball
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Simulate mathematical debt payoff schedules. Optimize for lowest total interest (Avalanche) or psychological wins (Snowball).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Debt Liability</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Remaining Balance */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Debt Balance</span>
            <CreditCard className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-500 dark:text-rose-400 mt-2">
            {formatCurrency(summary.total_remaining_balance)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Across {summary.total_debts} active liabilities
          </span>
        </div>

        {/* Monthly Minimum Obligation */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Minimum Outflow</span>
            <IndianRupee className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary.total_minimum_payment)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Required baseline monthly EMI
          </span>
        </div>

        {/* Weighted Average Interest Rate */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Weighted APR</span>
            <Percent className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-300 mt-2">
            {summary.weighted_average_interest_rate}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Annualized portfolio cost
          </span>
        </div>

        {/* Estimated Debt-Free Date */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Debt-Free Horizon</span>
            <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {plan?.debt_free_date || 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {plan?.months_to_debt_free ? `${plan.months_to_debt_free} months remaining` : 'No active debts'}
          </span>
        </div>
      </div>

      {hasDebts && (
        <>
          {/* Strategy Selector & Extra Payment Allocation Box */}
          <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-fintech-border space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Repayment Strategy Simulator</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Compare how Avalanche vs. Snowball alters your total interest and payoff speed.
                </p>
              </div>

              {/* Strategy Switcher Pills */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleStrategyChange('avalanche')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isAvalanche
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Avalanche (Highest APR)</span>
                </button>

                <button
                  onClick={() => handleStrategyChange('snowball')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    !isAvalanche
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>Snowball (Lowest Balance)</span>
                </button>
              </div>
            </div>

            {/* Extra Monthly Payment Slider */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center space-x-1.5">
                    <span>Accelerated Extra Payment:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(extraPayment)}/mo</span>
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Total Budget: {formatCurrency(summary.total_minimum_payment + extraPayment)}/mo
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="500"
                  value={extraPayment}
                  onChange={(e) => handleExtraPaymentChange(e.target.value)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>+₹0</span>
                  <span>+₹5,000</span>
                  <span>+₹10,000</span>
                  <span>+₹20,000</span>
                </div>
              </div>

              {/* Comparison Delta Callout */}
              <div className="md:col-span-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Avalanche Interest Advantage:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(interestDiff)} saved
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAvalanche
                    ? 'Avalanche attacks highest-APR debt first, mathematically minimizing cumulative interest charges.'
                    : 'Snowball eliminates small debts rapidly, offering psychological momentum at the cost of higher interest.'}
                </p>
              </div>
            </div>

            {/* Negative Amortization / Insufficient Payment Warning */}
            {plan && !plan.is_viable && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-700 dark:text-rose-200">Negative Amortization Warning</h4>
                  <p className="mt-0.5 leading-relaxed">{plan.warning_message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Recharts Month-by-Month Payoff Trajectory Chart */}
          {plan && plan.schedule && plan.schedule.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-fintech-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>Projected Debt Elimination Trajectory ({plan.strategy.toUpperCase()})</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Watch remaining debt balance shrink to ₹0 with automatic payment rollovers.
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-500 dark:text-slate-400 block">Total Interest Cost:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(plan.total_interest_paid)}
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={plan.schedule} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      tickFormatter={(m) => `Mo ${m}`}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                    <Tooltip content={<CustomPayoffTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="remaining_total"
                      name="Remaining Debt Balance"
                      stroke="#F43F5E"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#debtGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Debts Ledger List */}
      {!hasDebts ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-fintech-border space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Active Debts Recorded</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            You are operating debt-free! If you hold liabilities such as credit card balances, personal loans, or auto loans, record them here to model elimination.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Debt</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Debt Liabilities ({debtsData.items.length})</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Sorted by highest balance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debtsData.items.map((debt) => {
              const isCleared = debt.remaining_balance <= 0;
              const perDebt = plan?.per_debt_summary?.find((p) => p.debt_id === debt.id);

              return (
                <div
                  key={debt.id}
                  className="glass-panel rounded-3xl p-5 sm:p-6 border border-fintech-border flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Category & Status */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                        {debt.category}
                      </span>
                      {isCleared ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Paid Off
                        </span>
                      ) : perDebt && perDebt.payoff_month > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                          Payoff in Mo {perDebt.payoff_month}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-1">
                        {debt.debt_name}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-semibold text-rose-500 dark:text-rose-400">{debt.interest_rate}% APR</span>
                        <span>•</span>
                        <span>Due {debt.due_date}</span>
                      </div>
                    </div>

                    {/* Progress Bar: % Principal Cleared */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">Principal Cleared</span>
                        <span className="font-mono text-slate-900 dark:text-white">{debt.payoff_progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${debt.payoff_progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Financial Metrics 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Remaining</span>
                        <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
                          {formatCurrency(debt.remaining_balance)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">of {formatCurrency(debt.principal)}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Min Payment</span>
                        <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                          {formatCurrency(debt.minimum_payment)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">per month</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(debt)}
                      title="Edit Debt"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white dark:border-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingDebt(debt)}
                      title="Delete Debt"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/10 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-500/30 dark:bg-slate-900 dark:hover:bg-rose-500/20 dark:text-slate-400 dark:hover:text-rose-400 dark:border-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-fintech-border shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {editingDebt ? 'Edit Debt Record' : 'Record New Debt Liability'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Deterministic engines will factor this liability into your repayment timeline and Health Score.
            </p>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Debt / Creditor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chase Sapphire Reserve, SoFi Student Loan, Honda Auto Loan"
                  value={formData.debt_name}
                  onChange={(e) => setFormData({ ...formData, debt_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Original Principal (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 150000"
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Remaining Balance (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 124500"
                    value={formData.remaining_balance}
                    onChange={(e) => setFormData({ ...formData, remaining_balance: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Annual Interest Rate (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 11.5"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Minimum Monthly Payment (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 350"
                    value={formData.minimum_payment}
                    onChange={(e) => setFormData({ ...formData, minimum_payment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 15th of month or 2026-10-15"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingDebt ? 'Update Debt' : 'Add Debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingDebt)}
        onClose={() => {
          if (!deleteSubmitting) setDeletingDebt(null);
        }}
        onConfirm={handleDeleteSubmit}
        loading={deleteSubmitting}
        title="Delete Debt Record"
        message={
          deletingDebt
            ? `Are you sure you want to remove "${deletingDebt.debt_name}"? This will adjust your payoff schedule and DTI ratio.`
            : ''
        }
        confirmText="Delete Debt"
        confirmVariant="danger"
      />
    </div>
  );
};
