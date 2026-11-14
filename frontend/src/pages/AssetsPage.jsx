import React, { useState, useEffect } from 'react';
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../services/netWorthService';
import {
  TrendingUp,
  Plus,
  Landmark,
  Home,
  LineChart,
  ShieldCheck,
  Car,
  Bitcoin,
  Package,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Cash & Bank', icon: Landmark, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { name: 'Real Estate', icon: Home, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  { name: 'Investments', icon: LineChart, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { name: 'Retirement', icon: ShieldCheck, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  { name: 'Vehicles', icon: Car, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { name: 'Crypto', icon: Bitcoin, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { name: 'Other', icon: Package, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
];

export const AssetsPage = () => {
  const [data, setData] = useState({ items: [], total_value: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [deletingAsset, setDeletingAsset] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Investments',
    value: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAssets();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingAsset(null);
    setFormError('');
    setFormData({ name: '', category: 'Investments', value: '' });
    setIsFormOpen(true);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setFormError('');
    setFormData({
      name: asset.name,
      category: asset.category,
      value: String(asset.value),
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const val = parseFloat(formData.value);
    if (!formData.name.trim()) {
      setFormError('Asset name is required.');
      return;
    }
    if (isNaN(val) || val < 0) {
      setFormError('Value must be a non-negative number.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        value: val,
      };

      if (editingAsset) {
        await updateAsset(editingAsset.id, payload);
      } else {
        await createAsset(payload);
      }
      setIsFormOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(err.message || 'Error saving asset.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingAsset) return;
    setDeleteSubmitting(true);
    try {
      await deleteAsset(deletingAsset.id);
      setDeletingAsset(null);
      await fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete asset.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const getCategoryMeta = (catName) => {
    return CATEGORIES.find((c) => c.name.toLowerCase() === (catName || '').toLowerCase()) || CATEGORIES[6];
  };

  const filteredAssets = data.items.filter((item) => {
    if (filterCategory === 'All') return true;
    return item.category === filterCategory;
  });

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Loading asset ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-fintech-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <span>Asset Valuation Ledger</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Balance Sheet
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track liquid cash, investment portfolios, real estate, and tangible holdings.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Asset</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-fintech-border">
          <span className="text-xs text-slate-600 dark:text-slate-400">Total Asset Valuation</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{data.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Sum of all liquid & illiquid assets</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-fintech-border">
          <span className="text-xs text-slate-600 dark:text-slate-400">Total Holdings Count</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {data.count}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Recorded asset positions</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-fintech-border">
          <span className="text-xs text-slate-600 dark:text-slate-400">Average Position Size</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-600 dark:text-indigo-300 mt-1">
            ₹{(data.count > 0 ? data.total_value / data.count : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Mean capital per asset</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilterCategory('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filterCategory === 'All'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-white dark:border-slate-800'
          }`}
        >
          All Assets ({data.items.length})
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
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:text-white dark:border-slate-800'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-fintech-border space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Assets Recorded</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Record your liquid bank savings, retirement accounts, brokerage holdings, or physical real estate to calculate Net Worth.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Asset</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const cat = getCategoryMeta(asset.category);
            const CatIcon = cat.icon;
            const pctOfTotal = data.total_value > 0 ? ((asset.value / data.total_value) * 100).toFixed(1) : '0';

            return (
              <div
                key={asset.id}
                className="glass-panel rounded-3xl p-5 border border-fintech-border flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`p-1.5 rounded-lg border text-xs ${cat.color}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{asset.category}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{pctOfTotal}% of portfolio</span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight line-clamp-1">
                      {asset.name}
                    </h4>
                    <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                      ₹{asset.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Added {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(asset)}
                      title="Edit Asset"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white dark:border-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingAsset(asset)}
                      title="Delete Asset"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/10 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-500/30 dark:bg-slate-900 dark:hover:bg-rose-500/20 dark:text-slate-400 dark:hover:text-rose-400 dark:border-slate-800 transition-colors cursor-pointer"
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
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-fintech-border shadow-2xl relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {editingAsset ? 'Edit Asset Record' : 'Record New Asset'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Recorded holdings immediately update your consolidated Net Worth.
            </p>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus High Yield Savings, Vanguard VOO ETF, Primary Residence"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Asset Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Current Fair Market Value (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 25000"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
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
                  {formSubmitting ? 'Saving...' : editingAsset ? 'Update Asset' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-rose-500/30 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Asset Record?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Are you sure you want to remove <span className="font-semibold text-slate-900 dark:text-white">"{deletingAsset.name}"</span>?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAsset(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold disabled:opacity-50"
              >
                {deleteSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
