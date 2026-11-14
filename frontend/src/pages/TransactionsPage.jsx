import React, { useState, useEffect, useCallback } from 'react';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactionService';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/formatters';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  IndianRupee,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  Receipt,
  Utensils,
  Car,
  ShoppingBag,
  Home,
  GraduationCap,
  HeartPulse,
  Tv,
  Briefcase,
  Layers,
  FileText,
} from 'lucide-react';

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Rent',
  'Education',
  'Healthcare',
  'Entertainment',
  'Investment',
  'Salary',
  'Other',
];

const CATEGORY_ICONS = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Rent: Home,
  Education: GraduationCap,
  Healthcare: HeartPulse,
  Entertainment: Tv,
  Investment: TrendingUp,
  Salary: Briefcase,
  Other: Tag,
};

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
    transaction_count: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [modalForm, setModalForm] = useState({
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [modalError, setModalError] = useState('');

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Notification banners
  const [bannerSuccess, setBannerSuccess] = useState('');
  const [bannerError, setBannerError] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setBannerError('');
    try {
      const data = await getTransactions({
        page,
        limit,
        type: selectedType,
        category: selectedCategory,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
      });

      setTransactions(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      setBannerError(err.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedType, selectedCategory, startDate, endDate, searchTerm]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setModalForm({
      amount: '',
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTransaction(tx);
    setModalForm({
      amount: String(tx.amount),
      type: tx.type,
      category: tx.category,
      date: tx.date,
      description: tx.description,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    setModalError('');

    const amt = parseFloat(modalForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Amount must be a positive number strictly greater than 0.');
      return;
    }
    if (!modalForm.description.trim()) {
      setModalError('Please enter a description for the transaction.');
      return;
    }
    if (!modalForm.date) {
      setModalError('Please select a valid date.');
      return;
    }

    setActionLoading(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          amount: amt,
          type: modalForm.type,
          category: modalForm.category,
          date: modalForm.date,
          description: modalForm.description.trim(),
        });
        setBannerSuccess('Transaction updated successfully.');
      } else {
        await createTransaction({
          amount: amt,
          type: modalForm.type,
          category: modalForm.category,
          date: modalForm.date,
          description: modalForm.description.trim(),
        });
        setBannerSuccess('New transaction recorded successfully.');
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err) {
      setModalError(err.message || 'Failed to save transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteTransaction(deleteTarget.id);
      setBannerSuccess('Transaction deleted successfully.');
      setDeleteTarget(null);
      fetchTransactions();
    } catch (err) {
      setBannerError(err.message || 'Failed to delete transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-fintech-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time cashflow management, categorized spending & verified balance history.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="add-transaction-btn"
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-emerald transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Notification Banners */}
      {bannerSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="font-semibold">{bannerSuccess}</span>
          </div>
          <button onClick={() => setBannerSuccess('')} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {bannerError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span className="font-semibold">{bannerError}</span>
          </div>
          <button onClick={() => setBannerError('')} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="glass-panel p-5 rounded-2xl border border-fintech-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Total Inflow
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(summary.total_income)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Total recorded income credits</p>
        </div>

        {/* Total Outflow */}
        <div className="glass-panel p-5 rounded-2xl border border-fintech-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Total Outflow
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            -{formatCurrency(summary.total_expense)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Total recorded debits & expenses</p>
        </div>

        {/* Net Balance */}
        <div className="glass-panel p-5 rounded-2xl border border-fintech-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Net Balance
            </span>
            <div className={`p-2 rounded-xl border ${summary.net_balance >= 0 ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono ${summary.net_balance >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {summary.net_balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(summary.net_balance))}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Inflows minus total outflows</p>
        </div>

        {/* Total Count */}
        <div className="glass-panel p-5 rounded-2xl border border-fintech-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Records
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary.transaction_count}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Matching transactions found</p>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="glass-panel rounded-2xl p-5 border border-fintech-border space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="transaction-search"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search description or category..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Toggle Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200 dark:border-slate-800">
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedType(t);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedType === t
                    ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">Category:</span>
            <select
              id="transaction-category-filter"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Selectors */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {(startDate || endDate || selectedCategory !== 'all' || selectedType !== 'all' || searchTerm) && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium ml-auto"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table View */}
      <div className="glass-panel rounded-2xl border border-fintech-border overflow-hidden">
        {loading ? (
          <SkeletonLoader type="table" rows={6} cols={6} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Transactions Found"
            description={
              searchTerm || selectedType !== 'all' || selectedCategory !== 'all' || startDate || endDate
                ? 'No transactions match the selected filter criteria. Try clearing filters.'
                : 'Your transaction register is currently empty. Record your first income or expense.'
            }
            actionText="Record Transaction"
            onAction={handleOpenAddModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Date</th>
                  <th className="py-3.5 px-4 sm:px-6">Description</th>
                  <th className="py-3.5 px-4 sm:px-6">Category</th>
                  <th className="py-3.5 px-4 sm:px-6">Type</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Amount</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const CategoryIcon = CATEGORY_ICONS[tx.category] || Tag;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono">
                        {tx.date}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 sm:px-6 text-slate-900 dark:text-white font-medium">
                        {tx.description}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 text-[11px] font-medium">
                          <CategoryIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          <span>{tx.category}</span>
                        </span>
                      </td>

                      {/* Type Pill */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right font-mono font-bold">
                        <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(tx)}
                          title="Edit Transaction"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(tx)}
                          title="Delete Transaction"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/10 text-slate-600 hover:text-rose-600 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{total}</span> records
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-slate-800">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-fintech-border shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingTransaction ? 'Edit Transaction' : 'Record New Transaction'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-4 mt-5">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalForm({ ...modalForm, type: 'expense' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      modalForm.type === 'expense'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40 shadow-sm'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                    }`}
                  >
                    Expense Outflow
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalForm({ ...modalForm, type: 'income' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      modalForm.type === 'income'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                    }`}
                  >
                    Income Inflow
                  </button>
                </div>
              </div>

              {/* Amount & Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    id="tx-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={modalForm.amount}
                    onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Date
                  </label>
                  <input
                    id="tx-date"
                    type="date"
                    required
                    value={modalForm.date}
                    onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  id="tx-category"
                  value={modalForm.category}
                  onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description / Merchant
                </label>
                <input
                  id="tx-description"
                  type="text"
                  required
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  placeholder="e.g. Whole Foods Market, Salary Direct Deposit..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="tx-submit-save"
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingTransaction ? 'Update Transaction' : 'Record Transaction'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (!actionLoading) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
        title="Delete Transaction"
        message={
          deleteTarget
            ? `Are you sure you want to remove "${deleteTarget.description || deleteTarget.title}" for ${formatCurrency(deleteTarget.amount)} (${deleteTarget.category})? This will immediately recalculate your balances.`
            : ''
        }
        confirmText="Delete Transaction"
        confirmVariant="danger"
      />
    </div>
  );
};
