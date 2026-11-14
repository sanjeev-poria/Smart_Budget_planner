import React, { useState, useEffect } from 'react';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../services/goalService';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Clock,
  IndianRupee,
  PiggyBank,
  Edit2,
  Trash2,
  ShieldCheck,
  Compass,
  Home,
  GraduationCap,
  Car,
  Plane,
  Sparkles,
  Loader2,
  X,
  ArrowUpRight,
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Emergency', icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { name: 'Retirement', icon: Compass, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { name: 'Real Estate', icon: Home, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  { name: 'Education', icon: GraduationCap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { name: 'Vehicle', icon: Car, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { name: 'Travel', icon: Plane, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { name: 'Wealth', icon: TrendingUp, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { name: 'Other', icon: Target, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
];

export const GoalsPage = () => {
  const [data, setData] = useState({ items: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Quick Add Funds modal state
  const [quickAddGoal, setQuickAddGoal] = useState(null);
  const [quickAddAmount, setQuickAddAmount] = useState('');
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);

  // Delete modal state
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    goal_name: '',
    target_amount: '',
    current_saved: '0',
    target_date: '',
    category: 'Wealth',
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getGoals();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve financial goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormError('');
    // Default target date 1 year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const dateStr = nextYear.toISOString().split('T')[0];

    setFormData({
      goal_name: '',
      target_amount: '',
      current_saved: '0',
      target_date: dateStr,
      category: 'Wealth',
      description: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setFormError('');
    setFormData({
      goal_name: goal.goal_name,
      target_amount: String(goal.target_amount),
      current_saved: String(goal.current_saved),
      target_date: goal.target_date,
      category: goal.category,
      description: goal.description || '',
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const targetAmt = parseFloat(formData.target_amount);
    const currSaved = parseFloat(formData.current_saved || '0');

    if (!formData.goal_name.trim()) {
      setFormError('Goal name is required.');
      return;
    }
    if (isNaN(targetAmt) || targetAmt <= 0) {
      setFormError('Target amount must be a positive number.');
      return;
    }
    if (isNaN(currSaved) || currSaved < 0) {
      setFormError('Current saved amount cannot be negative.');
      return;
    }
    if (!formData.target_date) {
      setFormError('Target completion date is required.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        goal_name: formData.goal_name.trim(),
        target_amount: targetAmt,
        current_saved: currSaved,
        target_date: formData.target_date,
        category: formData.category,
        description: formData.description.trim(),
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, payload);
      } else {
        await createGoal(payload);
      }
      setIsFormOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(err.message || 'Error saving goal.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    const addAmt = parseFloat(quickAddAmount);
    if (isNaN(addAmt) || addAmt <= 0) return;

    setQuickAddSubmitting(true);
    try {
      const newSaved = Number(quickAddGoal.current_saved) + addAmt;
      await updateGoal(quickAddGoal.id, { current_saved: newSaved });
      setQuickAddGoal(null);
      setQuickAddAmount('');
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update goal funds.');
    } finally {
      setQuickAddSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingGoal) return;
    setDeleteSubmitting(true);
    try {
      await deleteGoal(deletingGoal.id);
      setDeletingGoal(null);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete goal.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Filter items
  const filteredGoals = data.items.filter((item) => {
    if (filterCategory === 'All') return true;
    return item.category === filterCategory;
  });

  const getCategoryMeta = (catName) => {
    return CATEGORIES.find((c) => c.name.toLowerCase() === (catName || '').toLowerCase()) || CATEGORIES[7];
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Loading financial goals & deterministic milestone engine...
        </p>
      </div>
    );
  }

  const summary = data.summary || {
    total_goals: 0,
    completed_goals: 0,
    on_track_goals: 0,
    off_track_goals: 0,
    total_target_amount: 0,
    total_current_saved: 0,
    overall_progress: 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-fintech-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <span>Financial Goals & Milestones</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Deterministic Tracking
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Map financial targets to real time horizons. Evaluates monthly required savings against your cashflow surplus.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Goal</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Target */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Target Capital</span>
            <Target className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            ₹{summary.total_target_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Across {summary.total_goals} recorded milestones
          </span>
        </div>

        {/* Total Saved */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Capital Accumulated</span>
            <PiggyBank className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-500 dark:text-emerald-400 mt-2">
            ₹{summary.total_current_saved.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {summary.overall_progress}% overall completed
          </span>
        </div>

        {/* On Track Goals */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>On-Track Velocity</span>
            <TrendingUp className="w-4 h-4 text-teal-500 dark:text-teal-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-2">
            {summary.on_track_goals} / {summary.total_goals}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Covered by monthly surplus
          </span>
        </div>

        {/* Completed Goals */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-fintech-border">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Completed Goals</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-2">
            {summary.completed_goals}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {summary.off_track_goals} off-track or pending
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilterCategory('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filterCategory === 'All'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          All Goals ({data.items.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = data.items.filter((i) => i.category.toLowerCase() === cat.name.toLowerCase()).length;
          return (
            <button
              key={cat.name}
              onClick={() => setFilterCategory(cat.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                filterCategory === cat.name
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-fintech-border space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-slate-500 dark:text-slate-400">
            <Target className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Financial Goals Found</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            {filterCategory === 'All'
              ? 'Start mapping your financial freedom. Create milestone goals like House Downpayment, Emergency Reserve, or Retirement.'
              : `No goals found under the ${filterCategory} category.`}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => {
            const catMeta = getCategoryMeta(goal.category);
            const CatIcon = catMeta.icon;

            const isCompleted = goal.status === 'completed';
            const isOnTrack = goal.status === 'on_track';
            const isOverdue = goal.status === 'overdue';
            const isOffTrack = goal.status === 'off_track';

            const statusBadge = isCompleted ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed</span>
              </span>
            ) : isOnTrack ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                <span>On Track</span>
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-3 h-3" />
                <span>Overdue Date</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" />
                <span>Off Track</span>
              </span>
            );

            const progressBarColor = isCompleted
              ? 'bg-indigo-500'
              : isOnTrack
              ? 'bg-emerald-500'
              : isOverdue
              ? 'bg-rose-500'
              : 'bg-amber-500';

            return (
              <div
                key={goal.id}
                className="glass-panel rounded-3xl p-5 sm:p-6 border border-fintech-border flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Top Bar: Category & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`p-1.5 rounded-lg border text-xs ${catMeta.color}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{goal.category}</span>
                    </div>
                    {statusBadge}
                  </div>

                  {/* Goal Name & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-1">
                      {goal.goal_name}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Progress</span>
                      <span className="font-mono text-slate-900 dark:text-white">{goal.progress_percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Metrics 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Accumulated</span>
                      <span className="text-sm font-bold font-mono text-emerald-500 dark:text-emerald-400 mt-0.5 block">
                        ₹{goal.current_saved.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">of ₹{goal.target_amount.toLocaleString()}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Remaining</span>
                      <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                        ₹{goal.amount_remaining.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">to completion</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Horizon</span>
                      <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-300 mt-0.5 block">
                        {goal.months_remaining} Mo
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{goal.target_date}</span>
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block">Monthly Req.</span>
                      <span className={`text-sm font-bold font-mono mt-0.5 block ${isOnTrack || isCompleted ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'}`}>
                        ₹{goal.monthly_required.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Surplus: ₹{goal.user_monthly_surplus.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setQuickAddGoal(goal);
                      setQuickAddAmount('');
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Funds</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(goal)}
                      title="Edit Goal"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingGoal(goal)}
                      title="Delete Goal"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-900 dark:hover:bg-rose-500/20 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 hover:border-rose-200 dark:border-slate-800 dark:hover:border-rose-500/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-fintech-border shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {editingGoal ? 'Edit Financial Goal' : 'Create New Financial Goal'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Deterministic calculations will track monthly allocation requirements.
            </p>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Goal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Home Downpayment, Emergency Cushion, Tesla Model 3"
                  value={formData.goal_name}
                  onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Target Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 500000"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Current Saved (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 100000"
                    value={formData.current_saved}
                    onChange={(e) => setFormData({ ...formData, current_saved: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Target Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
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
                    {CATEGORIES.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Optional motivations or strategy details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
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
                  {formSubmitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD FUNDS MODAL */}
      {quickAddGoal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-fintech-border shadow-2xl relative">
            <button
              onClick={() => setQuickAddGoal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <PiggyBank className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Add Funds to Goal</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Contribute capital toward <span className="font-semibold text-slate-900 dark:text-white">{quickAddGoal.goal_name}</span>.
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Current Saved:</span>
              <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">₹{quickAddGoal.current_saved.toLocaleString('en-IN')}</span>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contribution Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  autoFocus
                  required
                  placeholder="e.g. 5000"
                  value={quickAddAmount}
                  onChange={(e) => setQuickAddAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick shortcut pills */}
              <div className="flex items-center space-x-2">
                {[1000, 2500, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuickAddAmount(String(preset))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-300 text-[11px] font-mono transition-colors"
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setQuickAddGoal(null)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-400 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAddSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  {quickAddSubmitting ? 'Updating...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingGoal)}
        onClose={() => {
          if (!deleteSubmitting) setDeletingGoal(null);
        }}
        onConfirm={handleDeleteSubmit}
        loading={deleteSubmitting}
        title="Delete Financial Goal"
        message={
          deletingGoal
            ? `Are you sure you want to permanently remove "${deletingGoal.goal_name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Goal"
        confirmVariant="danger"
      />
    </div>
  );
};
