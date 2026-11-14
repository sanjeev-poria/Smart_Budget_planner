import React, { useState, useEffect, useMemo } from 'react';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  copyPreviousMonthBudgets,
} from '../services/budgetService';
import { formatCurrency } from '../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  PieChart as PieChartIcon,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  IndianRupee,
  Edit2,
  Trash2,
  Copy,
  Loader2,
  X,
  HelpCircle,
  ShoppingBag,
  Car,
  Utensils,
  Receipt,
  Home,
  GraduationCap,
  HeartPulse,
  Film,
  PiggyBank,
  FolderMinus,
  CheckCircle2,
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const STANDARD_CATEGORIES = [
  { name: 'Food', icon: Utensils, color: '#10B981' },
  { name: 'Transport', icon: Car, color: '#3B82F6' },
  { name: 'Shopping', icon: ShoppingBag, color: '#EC4899' },
  { name: 'Bills', icon: Receipt, color: '#F59E0B' },
  { name: 'Rent', icon: Home, color: '#8B5CF6' },
  { name: 'Education', icon: GraduationCap, color: '#06B6D4' },
  { name: 'Healthcare', icon: HeartPulse, color: '#EF4444' },
  { name: 'Entertainment', icon: Film, color: '#F97316' },
  { name: 'Investment', icon: PiggyBank, color: '#14B8A6' },
  { name: 'Other', icon: FolderMinus, color: '#64748B' },
];

function getCategoryIcon(categoryName) {
  const match = STANDARD_CATEGORIES.find(
    (c) => c.name.toLowerCase() === (categoryName || '').toLowerCase()
  );
  return match ? match.icon : FolderMinus;
}

export const BudgetsPage = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budgetData, setBudgetData] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Copy previous state
  const [copying, setCopying] = useState(false);
  const [copySuccessMsg, setCopySuccessMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    category: 'Food',
    monthly_limit: '',
    month: selectedMonth,
    year: selectedYear,
  });

  const fetchBudgets = async (month, year) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBudgets(month, year);
      setBudgetData(data);
    } catch (err) {
      console.error('Failed to load budgets:', err);
      setError(err.response?.data?.detail || 'Unable to retrieve budget data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleOpenAddModal = (defaultCategory = 'Food') => {
    setEditingBudget(null);
    setFormData({
      category: defaultCategory,
      monthly_limit: '',
      month: selectedMonth,
      year: selectedYear,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      monthly_limit: budget.monthly_limit,
      month: budget.month,
      year: budget.year,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBudget(null);
    setModalError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    const limitNum = parseFloat(formData.monthly_limit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setModalError('Please enter a valid monthly limit greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          category: formData.category,
          monthly_limit: limitNum,
        });
      } else {
        await createBudget({
          category: formData.category,
          monthly_limit: limitNum,
          month: selectedMonth,
          year: selectedYear,
        });
      }
      handleCloseModal();
      await fetchBudgets(selectedMonth, selectedYear);
    } catch (err) {
      console.error('Failed to save budget:', err);
      setModalError(err.response?.data?.detail || 'Failed to save budget item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!deleteConfirmId) return;
    try {
      setDeleting(true);
      await deleteBudget(deleteConfirmId);
      setDeleteConfirmId(null);
      await fetchBudgets(selectedMonth, selectedYear);
    } catch (err) {
      console.error('Failed to delete budget:', err);
      setError(err.response?.data?.detail || 'Failed to delete budget.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyFromPrevious = async () => {
    let srcMonth = selectedMonth - 1;
    let srcYear = selectedYear;
    if (srcMonth === 0) {
      srcMonth = 12;
      srcYear -= 1;
    }

    try {
      setCopying(true);
      setCopySuccessMsg(null);
      setError(null);
      const res = await copyPreviousMonthBudgets(
        srcMonth,
        srcYear,
        selectedMonth,
        selectedYear
      );
      setCopySuccessMsg(res.message);
      await fetchBudgets(selectedMonth, selectedYear);
      setTimeout(() => setCopySuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to copy budgets:', err);
      setError(
        err.response?.data?.detail ||
          `No budgets found from ${MONTH_NAMES[srcMonth - 1]} ${srcYear} to copy.`
      );
    } finally {
      setCopying(false);
    }
  };

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!budgetData || !budgetData.budgets) return [];
    return budgetData.budgets.map((b) => ({
      category: b.category,
      Budget: b.monthly_limit,
      Spent: b.amount_spent,
      Remaining: b.remaining_amount,
      usage: b.budget_usage,
      status: b.status,
    }));
  }, [budgetData]);

  const pieData = useMemo(() => {
    if (!budgetData) return [];
    return [
      { name: 'Safe (<80%)', value: budgetData.safe_count, color: '#10B981' },
      { name: 'Warning (80-100%)', value: budgetData.warning_count, color: '#F59E0B' },
      { name: 'Exceeded (>100%)', value: budgetData.exceeded_count, color: '#EF4444' },
    ].filter((item) => item.value > 0);
  }, [budgetData]);

  // Status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Safe':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safe
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Warning
          </span>
        );
      case 'Exceeded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5" />
            Exceeded
          </span>
        );
      default:
        return null;
    }
  };

  const getProgressBarColor = (status) => {
    switch (status) {
      case 'Safe':
        return 'bg-gradient-to-r from-emerald-500 to-teal-400';
      case 'Warning':
        return 'bg-gradient-to-r from-amber-500 to-orange-400';
      case 'Exceeded':
        return 'bg-gradient-to-r from-rose-500 to-red-600';
      default:
        return 'bg-cyan-500';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Month/Year Navigator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 rounded-xl border border-cyan-500/30 text-cyan-400">
              <PieChartIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Monthly Budget Management
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Deterministic expense limits, live category adherence, and intelligent threshold alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 font-semibold text-slate-800 dark:text-slate-200 text-sm">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCopyFromPrevious}
            disabled={copying}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-50"
            title="Duplicate previous month's budget layout"
          >
            {copying ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-500 dark:text-cyan-400" />
            ) : (
              <Copy className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            )}
            <span>Copy Prev Month</span>
          </button>

          <button
            onClick={() => handleOpenAddModal('Food')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Budget</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {copySuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400" />
          <span>{copySuccessMsg}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Level Summary Cards */}
      {budgetData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Budget */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Budgeted</span>
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600 dark:text-cyan-400">
                <PieChartIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              ₹{budgetData.total_budgeted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Allocated across {budgetData.budgets?.length || 0} active categories
            </p>
          </div>

          {/* Card 2: Total Spent */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Actual Spent</span>
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              ₹{budgetData.total_spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {budgetData.overall_usage_percentage}%
              </span>{' '}
              of total allocated budget
            </p>
          </div>

          {/* Card 3: Remaining Buffer */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Remaining Buffer</span>
              <div
                className={`p-2 rounded-lg ${
                  budgetData.total_remaining >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {budgetData.total_remaining >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <AlertOctagon className="w-4 h-4" />
                )}
              </div>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                budgetData.total_remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              ₹{budgetData.total_remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {budgetData.total_remaining >= 0
                ? 'Available spending capacity remaining'
                : 'Deficit incurred across budgeted limits'}
            </p>
          </div>

          {/* Card 4: Adherence Health */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Adherence Status</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {budgetData.safe_count} Safe
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {budgetData.warning_count} Warning
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                {budgetData.exceeded_count} Exceeded
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Total monthly expense: ₹{budgetData.total_monthly_expense?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Visual Analytics Section: Budget vs Actual Bar Chart & Adherence Donut */}
      {budgetData && budgetData.budgets?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bar Chart: Budget vs Spent */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Budget vs. Actual Spending</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Real-time category spending matched against configured limits
                </p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeOpacity={0.6} vertical={false} />
                  <XAxis
                    dataKey="category"
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{data.category}</p>
                            <p className="text-cyan-600 dark:text-cyan-400">
                              Budget: ₹{data.Budget?.toLocaleString()}
                            </p>
                            <p
                              className={
                                data.status === 'Safe'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : data.status === 'Warning'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              Spent: ₹{data.Spent?.toLocaleString()} ({data.usage}%)
                            </p>
                            <p className="text-slate-500 dark:text-slate-400">
                              Remaining: ₹{data.Remaining?.toLocaleString()}
                            </p>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">Status: {data.status}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <Bar dataKey="Budget" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Budget Limit" />
                  <Bar dataKey="Spent" radius={[4, 4, 0, 0]} name="Actual Spent">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.status === 'Safe'
                            ? '#10B981'
                            : entry.status === 'Warning'
                            ? '#F59E0B'
                            : '#EF4444'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Adherence Donut Chart */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Status Breakdown</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Adherence distribution for this month</p>
            </div>

            <div className="h-52 w-full my-auto flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs shadow-md">
                            <span className="font-semibold text-slate-900 dark:text-white">{payload[0].name}: </span>
                            <span className="text-cyan-600 dark:text-cyan-400">{payload[0].value} categories</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {budgetData.budgets?.length || 0}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Budgets</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                <span className="block font-bold text-emerald-600 dark:text-emerald-400">{budgetData.safe_count}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Safe</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                <span className="block font-bold text-amber-600 dark:text-amber-400">{budgetData.warning_count}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Warning</span>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
                <span className="block font-bold text-rose-600 dark:text-rose-400">{budgetData.exceeded_count}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Exceeded</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unbudgeted Categories Alert Panel */}
      {budgetData && budgetData.unbudgeted_spending?.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Unbudgeted Expenses Detected in {MONTH_NAMES[selectedMonth - 1]}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                You have recorded expenses in categories that do not have a budget configured for this month:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {budgetData.unbudgeted_spending.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.category}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{item.amount_spent.toLocaleString()}</span>
                    <button
                      onClick={() => handleOpenAddModal(item.category)}
                      className="ml-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Set Budget
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Budgets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Category Budgets</span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-full font-normal">
              {budgetData?.budgets?.length || 0} active
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500 dark:text-cyan-400 mb-3" />
            <p className="text-sm">Calculating real-time budget adherence...</p>
          </div>
        ) : budgetData?.budgets?.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            <PieChartIcon className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">
              No budgets set for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              Set monthly spending targets to keep your expenses in check and track category velocity.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCopyFromPrevious}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Copy Previous Month
              </button>
              <button
                onClick={() => handleOpenAddModal('Food')}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-xs font-semibold transition"
              >
                + Create First Budget
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetData?.budgets?.map((budget) => {
              const CategoryIcon = getCategoryIcon(budget.category);
              const isOver = budget.status === 'Exceeded';

              return (
                <div
                  key={budget.id}
                  className="bg-white dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700/80 p-5 rounded-2xl transition duration-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-slate-800/80 border border-cyan-100 dark:border-slate-700/50 text-cyan-600 dark:text-cyan-400">
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                            {budget.category}
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Limit: ₹{budget.monthly_limit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div>{getStatusBadge(budget.status)}</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 my-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">
                          ₹{budget.amount_spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          <span className="text-[10px] text-slate-500 font-normal"> spent</span>
                        </span>
                        <span
                          className={
                            budget.status === 'Safe'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : budget.status === 'Warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {budget.budget_usage}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                            budget.status
                          )}`}
                          style={{ width: `${Math.min(100, budget.budget_usage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Metric Details */}
                    <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/50 mb-3">
                      <span className="text-slate-500 dark:text-slate-400">
                        {isOver ? 'Over budget by' : 'Remaining balance'}
                      </span>
                      <span
                        className={`font-bold ${
                          isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isOver
                          ? `+${formatCurrency(Math.abs(budget.remaining_amount))}`
                          : formatCurrency(budget.remaining_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleOpenEditModal(budget)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                      title="Edit Budget Limit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(budget.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingBudget ? 'Edit Budget Limit' : 'Set Category Budget'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Target: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={!!editingBudget}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 transition disabled:opacity-50"
                >
                  {STANDARD_CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Monthly Spending Limit (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 10000.00"
                    value={formData.monthly_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, monthly_limit: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Month</label>
                  <input
                    type="text"
                    disabled
                    value={MONTH_NAMES[selectedMonth - 1]}
                    className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Year</label>
                  <input
                    type="text"
                    disabled
                    value={selectedYear}
                    className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBudget ? 'Save Changes' : 'Create Budget'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => {
          if (!deleting) setDeleteConfirmId(null);
        }}
        onConfirm={handleDeleteBudget}
        loading={deleting}
        title="Delete Category Budget"
        message="Are you sure you want to remove this category budget? This will remove the spending target for this month."
        confirmText="Delete Budget"
        confirmVariant="danger"
      />
    </div>
  );
};
