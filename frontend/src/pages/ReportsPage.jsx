import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Eye,
  X,
  Zap,
  ArrowRight,
  Sliders,
  IndianRupee,
  PiggyBank,
  CreditCard,
  PieChart,
  ShieldAlert,
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import reportService from '../services/reportService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function ReportsPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Reports state
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Live preview state
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load report history
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getReportHistory();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load report history:', err);
      setError('Could not load report history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle generating a new statement
  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccessMsg(null);
      const newReport = await reportService.generateReport(selectedMonth, selectedYear);
      setSuccessMsg(`Successfully compiled statement for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}!`);
      setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError(err.message || 'Error compiling monthly report.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle downloading official PDF
  const handleDownloadPdf = async (reportId, fileName) => {
    try {
      setDownloadingId(reportId);
      setError(null);
      await reportService.downloadReportPdf(reportId, fileName);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setError('Failed to download PDF statement.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle deleting a report with accessible modal
  const promptDeleteReport = (report) => {
    setReportToDelete(report);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    try {
      setDeleteLoading(true);
      setError(null);
      await reportService.deleteReport(reportToDelete.id);
      setReports((prev) => prev.filter((r) => r.id !== reportToDelete.id));
      setDeleteModalOpen(false);
      setReportToDelete(null);
      setSuccessMsg('Statement removed from archive.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to delete report:', err);
      setError('Could not delete report.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open Live Preview
  const handleOpenLivePreview = async (month = selectedMonth, year = selectedYear) => {
    try {
      setPreviewLoading(true);
      setShowPreviewModal(true);
      setError(null);
      const data = await reportService.getLivePreview(month, year);
      setPreviewData(data);
    } catch (err) {
      console.error('Failed to fetch live preview:', err);
      setError('Could not load live preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Latest report for hero card preview
  const latestReport = reports.length > 0 ? reports[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 p-4 sm:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Monthly Financial Reports</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ReportLab Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Generate publication-quality PDF financial statements compiling actual user ledger data, health scores, and AI insights.
          </p>
        </div>

        {/* Month & Year Selector & Trigger Button */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50 cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Compiling Statement...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Official PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Featured Latest Report Banner */}
      {latestReport && (
        <div className="rounded-3xl border border-emerald-500/30 bg-white dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-900/60 dark:to-emerald-950/20 p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                  Latest Generated Statement
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Generated {new Date(latestReport.generated_at).toLocaleDateString()} at{' '}
                  {new Date(latestReport.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{latestReport.report_title}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Authoritative multi-page financial statement rendered via Python ReportLab.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleOpenLivePreview(latestReport.month, latestReport.year)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-white flex items-center gap-2 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>View Full Data Breakdown</span>
              </button>

              <button
                onClick={() => handleDownloadPdf(latestReport.id, latestReport.file_name)}
                disabled={downloadingId === latestReport.id}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {downloadingId === latestReport.id ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF Statement</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                Health Score
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {latestReport.summary_metrics?.health_score || 0}/100
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  ({latestReport.summary_metrics?.risk_level || 'Good'})
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                Net Monthly Surplus
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                ₹{(latestReport.summary_metrics?.surplus || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                Net Worth Posture
              </span>
              <span className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400">
                ₹{(latestReport.summary_metrics?.net_worth || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                Emergency Runway
              </span>
              <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {(latestReport.summary_metrics?.emergency_months || 0).toFixed(1)} Months
              </span>
            </div>
          </div>

          {/* AI Narrative Quote */}
          {latestReport.ai_insights_summary && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 dark:bg-slate-950/40 border border-emerald-500/20 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  Gemini AI Executive Takeaway
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {latestReport.ai_insights_summary}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statement History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Statement History & Archives
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Access and download official financial statements compiled from your historical data.
            </p>
          </div>
          <button
            onClick={loadHistory}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <SkeletonLoader type="table" rows={4} cols={6} />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Statements Generated Yet"
            description="Generate your first comprehensive monthly statement using the action button above to compile your financial records into a professional PDF."
            actionText="Generate Current Statement"
            onAction={handleGenerateReport}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 font-semibold">Statement Period</th>
                    <th className="py-3.5 px-4 font-semibold">Title</th>
                    <th className="py-3.5 px-4 font-semibold">Health Score</th>
                    <th className="py-3.5 px-4 font-semibold">Surplus</th>
                    <th className="py-3.5 px-4 font-semibold">Generated On</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {reports.map((r) => {
                    const monthLabel = MONTH_NAMES[r.month - 1] || 'Month';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {monthLabel} {r.year}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {r.report_title}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="emerald" size="xs">
                            {r.summary_metrics?.health_score || 0}/100
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                          ₹{(r.summary_metrics?.surplus || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {new Date(r.generated_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenLivePreview(r.month, r.year)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors"
                              title="Preview Report Data"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(r.id, r.file_name)}
                              disabled={downloadingId === r.id}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Download PDF file"
                            >
                              {downloadingId === r.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => promptDeleteReport(r)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Live Statement Data Breakdown
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {previewData?.report_title || 'Compiled Statement Data'}
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {previewLoading ? (
                <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mb-3" />
                  Compiling 11-section statement data...
                </div>
              ) : previewData ? (
                <div className="space-y-6 text-xs text-slate-700 dark:text-slate-200">
                  {/* Executive Cashflow Grid */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">1. Cashflow & Health Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Income</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ₹{(previewData.financial_summary?.income || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Expenses</span>
                        <span className="font-bold text-slate-800 dark:text-slate-300 text-sm">
                          ₹{(previewData.financial_summary?.expenses || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Net Surplus</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ₹{(previewData.financial_summary?.surplus || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Savings Rate</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                          {(previewData.financial_summary?.savings_rate || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Strategic Narrative */}
                  {previewData.ai_insights && (
                    <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-500/30">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs block mb-1">
                        2. Gemini AI Executive Commentary
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                        {previewData.ai_insights.summary}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-500/20">
                        <div>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">Key Milestones:</span>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                            {previewData.ai_insights.highlights?.map((h, i) => (
                              <li key={i}>• {h}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-1">Areas for Focus:</span>
                          <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                            {previewData.ai_insights.areas_for_improvement?.map((a, i) => (
                              <li key={i}>• {a}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spending & Budgets */}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">3. Outflows & Spending Categories</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {previewData.spending_analysis?.categories?.slice(0, 6).map((c, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{c.category}</span>
                          <span className="font-bold text-slate-900 dark:text-white">₹{c.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emergency & Goals */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <h5 className="font-bold text-slate-900 dark:text-white mb-2">Emergency Fund Status</h5>
                      <p className="text-slate-600 dark:text-slate-400">
                        Current: <strong className="text-slate-900 dark:text-white">₹{(previewData.emergency_fund?.current_savings || 0).toLocaleString()}</strong>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Runway: <strong className="text-amber-600 dark:text-amber-400">{(previewData.emergency_fund?.months_covered || 0).toFixed(1)} Months</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <h5 className="font-bold text-slate-900 dark:text-white mb-2">Balance Sheet & Net Worth</h5>
                      <p className="text-slate-600 dark:text-slate-400">
                        Total Assets: <strong className="text-emerald-600 dark:text-emerald-400">₹{(previewData.net_worth?.total_assets || 0).toLocaleString()}</strong>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Total Liabilities: <strong className="text-rose-600 dark:text-rose-400">₹{(previewData.net_worth?.total_liabilities || 0).toLocaleString()}</strong>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Net Worth: <strong className="text-cyan-600 dark:text-cyan-400 text-sm">₹{(previewData.net_worth?.net_worth || 0).toLocaleString()}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Official statement will be compiled into a multi-page PDF document.
              </span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Educational Disclaimer Footer */}
      <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 text-center">
        <p className="text-xs text-slate-500">
          This monthly financial report is compiled for educational and personal financial tracking purposes only,
          and does not constitute formal legal, accounting, tax, or investment advice.
        </p>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleteLoading) setDeleteModalOpen(false);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Delete Financial Statement"
        message={`Are you sure you want to permanently remove "${reportToDelete?.report_title || 'this statement'}" from your historical records? This action cannot be undone.`}
        confirmText="Delete Statement"
        confirmVariant="danger"
      />
    </div>
  );
}

export default ReportsPage;
