import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Briefcase,
  Receipt,
  FileEdit,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    city: '',
    monthly_income: '',
    monthly_expenses: '',
    current_savings: '',
    monthly_emi: '',
    monthly_investment: '',
    tax_regime: 'new',
    tax_deductions_80c: '',
    other_tax_deductions: '',
    notes: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Hydrate form from current user state
  useEffect(() => {
    if (user) {
      const p = user.financial_profile || {};
      setFormData({
        name: user.name || '',
        age: user.age ? String(user.age) : '',
        city: user.city || '',
        monthly_income: p.monthly_income !== undefined ? String(p.monthly_income) : '0',
        monthly_expenses: p.monthly_expenses !== undefined ? String(p.monthly_expenses) : '0',
        current_savings: p.current_savings !== undefined ? String(p.current_savings) : '0',
        monthly_emi: p.monthly_emi !== undefined ? String(p.monthly_emi) : '0',
        monthly_investment: p.monthly_investment !== undefined ? String(p.monthly_investment) : '0',
        tax_regime: p.tax_regime || 'new',
        tax_deductions_80c: p.tax_deductions_80c !== undefined ? String(p.tax_deductions_80c) : '0',
        other_tax_deductions: p.other_tax_deductions !== undefined ? String(p.other_tax_deductions) : '0',
        notes: p.notes || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setSuccessMessage('');
    setErrorMessage('');
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Deterministic live financial metrics
  const income = parseFloat(formData.monthly_income) || 0;
  const expenses = parseFloat(formData.monthly_expenses) || 0;
  const savings = parseFloat(formData.current_savings) || 0;
  const emi = parseFloat(formData.monthly_emi) || 0;
  const investment = parseFloat(formData.monthly_investment) || 0;

  const totalCommitted = expenses + emi + investment;
  const netCashflow = income - totalCommitted;
  const savingsRate = income > 0 ? (((savings * 0.05 + investment) / income) * 100).toFixed(1) : '0.0';
  const dtiRatio = income > 0 ? ((emi / income) * 100).toFixed(1) : '0.0';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    // Frontend validations
    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      setErrorMessage('Age must be between 18 and 120 years.');
      return;
    }

    if (income < 0) {
      setErrorMessage('Monthly income cannot be negative.');
      return;
    }
    if (expenses < 0) {
      setErrorMessage('Monthly expenses cannot be negative.');
      return;
    }
    if (savings < 0) {
      setErrorMessage('Current savings cannot be negative.');
      return;
    }
    if (emi < 0) {
      setErrorMessage('Monthly EMI cannot be negative.');
      return;
    }
    if (investment < 0) {
      setErrorMessage('Monthly investment cannot be negative.');
      return;
    }

    const ded80c = parseFloat(formData.tax_deductions_80c) || 0;
    const dedOther = parseFloat(formData.other_tax_deductions) || 0;
    if (ded80c < 0 || dedOther < 0) {
      setErrorMessage('Tax deductions cannot be negative.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        age: ageNum,
        city: formData.city.trim(),
        monthly_income: income,
        monthly_expenses: expenses,
        current_savings: savings,
        monthly_emi: emi,
        monthly_investment: investment,
        tax_regime: formData.tax_regime,
        tax_deductions_80c: ded80c,
        other_tax_deductions: dedOther,
        notes: formData.notes.trim(),
      });
      setSuccessMessage('Profile and financial data updated successfully!');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile. Please review your entries.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-fintech-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Profile & Identity
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your personal credentials and baseline numbers driving all deterministic calculations.
          </p>
        </div>

        {/* Live Calculation Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-700 dark:text-slate-300">Verified Deterministic Profile</span>
        </div>
      </div>

      {/* Notification Banners */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Live Financial Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-fintech-border">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Monthly Income
          </span>
          <span className="text-xl font-bold text-emerald-500 dark:text-emerald-400 mt-1 block">
            ₹{income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Gross inflow baseline</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-fintech-border">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Outflows
          </span>
          <span className="text-xl font-bold text-rose-500 dark:text-rose-400 mt-1 block">
            ₹{totalCommitted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Expenses + EMI + Investments</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-fintech-border">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Net Monthly Free Cashflow
          </span>
          <span className={`text-xl font-bold mt-1 block ${netCashflow >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'}`}>
            ₹{netCashflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Uncommitted surplus</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-fintech-border">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Debt-To-Income (DTI)
          </span>
          <span className={`text-xl font-bold mt-1 block ${parseFloat(dtiRatio) <= 36 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {dtiRatio}%
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{parseFloat(dtiRatio) <= 36 ? 'Healthy range (<= 36%)' : 'Caution: High debt load'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Demographics */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-fintech-border">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base">
            <User className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>Personal Identification & Demographics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                id="profile-name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Email (Read-Only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
              </div>
              <div className="relative">
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Age
              </label>
              <input
                id="profile-age"
                name="age"
                type="number"
                min="18"
                max="120"
                required
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                City / Region
              </label>
              <input
                id="profile-city"
                name="city"
                type="text"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Deterministic Financial Inflows, Outflows & Savings */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-fintech-border">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2.5 text-slate-900 dark:text-white font-bold text-base">
              <IndianRupee className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <span>Core Financial Baseline (Monthly Figures)</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">All inputs must be non-negative (&ge; ₹0.00)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {/* Monthly Income */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Inflow / Income (₹)
              </label>
              <div className="relative">
                <input
                  id="profile-income"
                  name="monthly_income"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.monthly_income}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Take-home post-tax salary or regular cash inflow</p>
            </div>

            {/* Monthly Expenses */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Living Expenses (₹)
              </label>
              <div className="relative">
                <input
                  id="profile-expenses"
                  name="monthly_expenses"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.monthly_expenses}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Rent, groceries, utilities, lifestyle & bills</p>
            </div>

            {/* Current Liquid Savings */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Liquid Savings (₹)
              </label>
              <div className="relative">
                <input
                  id="profile-savings"
                  name="current_savings"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.current_savings}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Bank checking, savings, money market accounts</p>
            </div>

            {/* Monthly Loan / EMI Payments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Debt Payments / EMI (₹)
              </label>
              <div className="relative">
                <input
                  id="profile-emi"
                  name="monthly_emi"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.monthly_emi}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Home loan, car loan, personal loans, education debt</p>
            </div>

            {/* Monthly Investments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Investments (₹)
              </label>
              <div className="relative">
                <input
                  id="profile-investment"
                  name="monthly_investment"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.monthly_investment}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Systematic investment plans (SIPs), PPF, ELSS, Mutual Funds</p>
            </div>

            {/* Tax Regime Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tax Regime Preference
              </label>
              <select
                id="profile-tax-regime"
                name="tax_regime"
                value={formData.tax_regime}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="new">New Tax Regime (Simplified Brackets)</option>
                <option value="old">Old Tax Regime (Exemptions & Deductions)</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Governs deterministic tax computation models</p>
            </div>
          </div>
        </div>

        {/* Section 3: Tax Deductions & Goals Notes */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-fintech-border">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-base">
            <Receipt className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>Tax Exemptions & Strategic Notes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Annual 80C / Retirement Deductions (₹)
              </label>
              <input
                id="profile-ded-80c"
                name="tax_deductions_80c"
                type="number"
                step="0.01"
                min="0"
                value={formData.tax_deductions_80c}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Other Tax Deductions / Health Insurance (₹)
              </label>
              <input
                id="profile-ded-other"
                name="other_tax_deductions"
                type="number"
                step="0.01"
                min="0"
                value={formData.other_tax_deductions}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Financial Goals & Context Notes
              </label>
              <textarea
                id="profile-notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Planning to buy a home in 3 years, building a 6-month emergency reserve..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">This context is used by the Gemini AI Assistant when interpreting your numbers.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            id="save-profile-btn"
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-glow-emerald transition-all transform active:scale-[0.99] disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Deterministic Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
