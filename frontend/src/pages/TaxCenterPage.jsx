import React, { useState, useEffect, useMemo } from 'react';
import {
  getTaxConfig,
  getTaxOverview,
  createTaxInvestment,
  updateTaxInvestment,
  deleteTaxInvestment,
  compareTaxRegimes,
} from '../services/taxService';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  Receipt,
  Plus,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Edit2,
  Trash2,
  Loader2,
  X,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Info,
  Scale,
  Award,
  Layers,
  FileCheck,
} from 'lucide-react';

const FINANCIAL_YEARS = ['2025-26', '2024-25', '2026-27'];

export const TaxCenterPage = () => {
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core Data State
  const [taxConfig, setTaxConfig] = useState(null);
  const [taxOverview, setTaxOverview] = useState(null);

  // Interactive Custom Income Simulator State
  const [customIncomeInput, setCustomIncomeInput] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simulationComparison, setSimulationComparison] = useState(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    financial_year: '2025-26',
    category: 'PPF',
    section: '80C',
    name: '',
    amount: '',
    notes: '',
  });

  // Fetch Tax Configuration & Overview
  const loadTaxData = async (fy, income = null) => {
    try {
      setLoading(true);
      setError(null);

      const [cfg, overview] = await Promise.all([
        getTaxConfig(),
        getTaxOverview(fy, income),
      ]);

      setTaxConfig(cfg);
      setTaxOverview(overview);
      if (!customIncomeInput) {
        setCustomIncomeInput(overview.gross_annual_income.toString());
      }
      setSimulationComparison(null);
    } catch (err) {
      console.error('Failed to load tax data:', err);
      setError(err.response?.data?.detail || 'Unable to retrieve tax planning information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxData(financialYear);
  }, [financialYear]);

  // Handle Scenario Simulation with Custom Income
  const handleSimulateCustomIncome = async (e) => {
    e.preventDefault();
    const incVal = parseFloat(customIncomeInput);
    if (isNaN(incVal) || incVal <= 0) return;

    try {
      setSimulating(true);
      const comp = await compareTaxRegimes(incVal, financialYear);
      setSimulationComparison(comp);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = (defaultCategory = 'PPF') => {
    setEditingItem(null);
    // Find section for this category from backend config
    const catObj = taxConfig?.supported_categories?.find((c) => c.id === defaultCategory);
    const sec = catObj ? catObj.section : '80C';

    setFormData({
      financial_year: financialYear,
      category: defaultCategory,
      section: sec,
      name: '',
      amount: '',
      notes: '',
    });
    setModalError(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      financial_year: item.financial_year,
      category: item.category,
      section: item.section,
      name: item.name,
      amount: item.amount,
      notes: item.notes || '',
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setModalError(null);
  };

  // Category change in Form -> automatically updates section
  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    const catObj = taxConfig?.supported_categories?.find((c) => c.id === selectedCat);
    const sec = catObj ? catObj.section : '80C';
    setFormData({
      ...formData,
      category: selectedCat,
      section: sec,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid investment amount greater than zero.');
      return;
    }
    if (!formData.name.trim()) {
      setModalError('Please enter an account or scheme name.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await updateTaxInvestment(editingItem.id, {
          financial_year: formData.financial_year,
          category: formData.category,
          section: formData.section,
          name: formData.name,
          amount: amt,
          notes: formData.notes,
        });
      } else {
        await createTaxInvestment({
          financial_year: formData.financial_year,
          category: formData.category,
          section: formData.section,
          name: formData.name,
          amount: amt,
          notes: formData.notes,
        });
      }
      handleCloseModal();
      await loadTaxData(financialYear);
    } catch (err) {
      console.error('Failed to save tax investment:', err);
      setModalError(err.response?.data?.detail || 'Failed to save record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmId) return;
    try {
      setDeleting(true);
      await deleteTaxInvestment(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadTaxData(financialYear);
    } catch (err) {
      console.error('Failed to delete tax record:', err);
      setError(err.response?.data?.detail || 'Failed to delete record.');
    } finally {
      setDeleting(false);
    }
  };

  const activeComparison = simulationComparison || taxOverview?.comparison;
  const summary80c = taxOverview?.summary_80c;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Financial Year Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 rounded-xl border border-amber-500/30 text-amber-500 dark:text-amber-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Tax Center & 80C Planner
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                India-oriented tax-saving deductions, Section 80C headroom, and deterministic Old vs. New Regime analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Financial Year Selector */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
            <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Financial Year:</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {FINANCIAL_YEARS.map((fy) => (
                <option key={fy} value={fy} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  FY {fy}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleOpenAddModal('PPF')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-amber-500/20 transition transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Tax Investment</span>
          </button>
        </div>
      </div>

      {/* Prominent Legal / Informational Disclaimer Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-3.5 shadow-md">
        <Info className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950 dark:text-amber-200">
            Statutory Informational Disclaimer (Non-Advisory Notice)
          </p>
          <p className="text-amber-900/90 dark:text-amber-300/90 leading-relaxed text-xs">
            {taxConfig?.disclaimer ||
              'Calculations, deductions, and regime comparisons provided by SMARTFIN are strictly for informational and illustrative purposes only. They do not constitute formal tax or certified investment advice. Tax provisions and slab rates are subject to amendments under the Finance Act. Consult a certified Chartered Accountant (CA) or tax advisor before filing statutory returns.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 dark:text-amber-400 mb-3" />
          <p className="text-sm">Assembling tax profile and statutory deductions...</p>
        </div>
      ) : (
        <>
          {/* Section 80C Hero Utilization Hub */}
          {summary80c && (
            <div className="glass-panel border border-slate-200 dark:border-slate-800/90 p-6 rounded-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      Section 80C Cap: ₹{summary80c.cap_80c.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">FY {financialYear}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Section 80C Tax-Saving Progress
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                    Eligible instruments (PPF, ELSS, EPF, LIC, NSC, etc.) qualify for up to ₹1,50,000 in deductions under Section 80C of the Income Tax Act.
                  </p>
                </div>

                {/* KPI Pills */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl">
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Eligible Claimed
                    </span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      ₹{summary80c.total_eligible_80c.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl">
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Allowable Deduction
                    </span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{summary80c.allowable_deduction_80c.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl">
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      Remaining Headroom
                    </span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      ₹{summary80c.remaining_80c_limit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Milestone Callout */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">
                    {summary80c.utilization_percentage}% of ₹1,50,000 limit utilized
                  </span>
                  <span
                    className={
                      summary80c.remaining_80c_limit === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {summary80c.remaining_80c_limit === 0
                      ? '✓ 80C Limit Fully Maximized'
                      : `₹${summary80c.remaining_80c_limit.toLocaleString('en-IN')} headroom left to invest`}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-400 transition-all duration-700"
                    style={{ width: `${Math.min(100, summary80c.utilization_percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* New vs. Old Tax Regime Comparator */}
          {activeComparison && (
            <div className="glass-panel border border-slate-200 dark:border-slate-800/90 p-6 rounded-2xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <Scale className="w-4 h-4" />
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      New vs. Old Tax Regime Deterministic Comparison
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Computed based on annual gross income of ₹
                    {activeComparison.gross_annual_income.toLocaleString('en-IN')} and verified deductions.
                  </p>
                </div>

                {/* Scenario Tester Form */}
                <form
                  onSubmit={handleSimulateCustomIncome}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5"
                >
                  <span className="text-xs text-slate-600 dark:text-slate-400">Test Income (₹):</span>
                  <input
                    type="number"
                    step="10000"
                    min="100000"
                    value={customIncomeInput}
                    onChange={(e) => setCustomIncomeInput(e.target.value)}
                    placeholder="e.g. 1200000"
                    className="w-28 sm:w-32 bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={simulating}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simulate'}
                  </button>
                </form>
              </div>

              {/* Recommendation Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                      Recommended Regime: {activeComparison.recommended_regime}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {activeComparison.savings_recommendation}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Tax Difference</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{activeComparison.tax_difference.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Comparison Table / Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* New Regime Card */}
                <div
                  className={`p-5 rounded-xl border ${
                    activeComparison.recommended_regime === 'New Regime'
                      ? 'bg-slate-50 dark:bg-slate-950/80 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">New Tax Regime</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Default Regime (FY 2024-25+)</p>
                    </div>
                    {activeComparison.recommended_regime === 'New Regime' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                        WINNER
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Gross Annual Income:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        ₹{activeComparison.new_regime.gross_income.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Standard Deduction:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        -₹{activeComparison.new_regime.standard_deduction.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Taxable Net Income:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        ₹{activeComparison.new_regime.taxable_income.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Section 87A Rebate:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {activeComparison.new_regime.rebate_87a > 0
                          ? `-₹${activeComparison.new_regime.rebate_87a.toLocaleString('en-IN')} (Nil Tax up to 7L)`
                          : '₹0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Health & Education Cess (4%):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-300">
                        ₹{activeComparison.new_regime.cess.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-sm font-bold">
                      <span className="text-slate-900 dark:text-white">Net Tax Payable:</span>
                      <span className="text-cyan-600 dark:text-cyan-400">
                        ₹{activeComparison.new_regime.total_tax_payable.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Effective Tax Rate:</span>
                      <span>{activeComparison.new_regime.effective_tax_rate}%</span>
                    </div>
                  </div>
                </div>

                {/* Old Regime Card */}
                <div
                  className={`p-5 rounded-xl border ${
                    activeComparison.recommended_regime === 'Old Regime'
                      ? 'bg-slate-50 dark:bg-slate-950/80 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">Old Tax Regime</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">With 80C/80D itemized deductions</p>
                    </div>
                    {activeComparison.recommended_regime === 'Old Regime' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        WINNER
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Gross Annual Income:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        ₹{activeComparison.old_regime.gross_income.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Standard Deduction:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        -₹{activeComparison.old_regime.standard_deduction.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Allowable Deductions Claimed:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        -₹{taxOverview?.total_allowable_deductions?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Taxable Net Income:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        ₹{activeComparison.old_regime.taxable_income.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Section 87A Rebate:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {activeComparison.old_regime.rebate_87a > 0
                          ? `-₹${activeComparison.old_regime.rebate_87a.toLocaleString('en-IN')} (Nil Tax up to 5L)`
                          : '₹0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Health & Education Cess (4%):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-300">
                        ₹{activeComparison.old_regime.cess.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-sm font-bold">
                      <span className="text-slate-900 dark:text-white">Net Tax Payable:</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        ₹{activeComparison.old_regime.total_tax_payable.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Effective Tax Rate:</span>
                      <span>{activeComparison.old_regime.effective_tax_rate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configurable Categories Showcase (PPF, ELSS, LIC, NSC, EPF, etc.) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eligible Tax-Saving Instruments</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Configurable investment categories with statutory lock-in periods and tax profiles
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {taxConfig?.supported_categories?.slice(0, 6).map((cat) => {
                const totalInvestedInCat = summary80c?.category_breakdown?.[cat.id] || 0;
                return (
                  <div
                    key={cat.id}
                    className="p-5 glass-panel border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl flex flex-col justify-between transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {cat.section}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {cat.lock_in_years > 0 ? `${cat.lock_in_years}-Yr Lock-in` : 'No Lock-in'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{cat.name}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{cat.description}</p>
                      <div className="text-[11px] text-slate-600 dark:text-slate-500 space-y-0.5">
                        <p>
                          <span className="text-slate-500 dark:text-slate-400">Risk:</span> {cat.risk_level}
                        </p>
                        <p>
                          <span className="text-slate-500 dark:text-slate-400">Taxability:</span> {cat.tax_status}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block">Your Investment</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          ₹{totalInvestedInCat.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenAddModal(cat.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-cyan-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-cyan-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User-Entered Tax Investments Ledger */}
          <div className="glass-panel border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Your Tax Investments ({taxOverview?.investments?.length || 0})
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  User-recorded investment items for FY {financialYear}
                </p>
              </div>
              <button
                onClick={() => handleOpenAddModal('PPF')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-cyan-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-cyan-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>

            {taxOverview?.investments?.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
                No tax-saving investments recorded for FY {financialYear} yet.
                <button
                  onClick={() => handleOpenAddModal('PPF')}
                  className="block mx-auto mt-2 text-cyan-600 dark:text-cyan-400 underline font-semibold"
                >
                  Record your first PPF, ELSS, or EPF contribution
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Scheme / Account</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Section</th>
                      <th className="py-3 px-4 text-right">Eligible Amount</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {taxOverview?.investments?.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{inv.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            {inv.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-cyan-600 dark:text-cyan-400">{inv.section}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white text-sm">
                          ₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {inv.notes || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(inv)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(inv.id)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add / Edit Tax Investment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 dark:text-amber-400 border border-amber-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Tax Investment' : 'Record Tax Investment'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Financial Year {financialYear}</p>
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
                  onChange={handleCategoryChange}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 transition"
                >
                  {taxConfig?.supported_categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Scheme / Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India PPF, Mirae Asset ELSS"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Eligible Amount (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500 font-semibold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 50000.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Policy number, maturity remarks, or employer deduction note"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Record Investment'}</span>
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
        onConfirm={handleDeleteItem}
        loading={deleting}
        title="Delete Tax Investment Record"
        message="Are you sure you want to delete this tax-saving investment record? Your 80C calculation will update immediately."
        confirmText="Delete Record"
        confirmVariant="danger"
      />
    </div>
  );
};
