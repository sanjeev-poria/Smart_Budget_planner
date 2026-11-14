import apiClient from './api';

const REPORTS_API_PREFIX = '/api/v1/reports';

export const reportService = {
  /**
   * Generate monthly report from actual user data and save metadata in MongoDB.
   * @param {number|null} month - 1 to 12
   * @param {number|null} year - e.g. 2026
   */
  async generateReport(month = null, year = null) {
    const response = await apiClient.post(
      `${REPORTS_API_PREFIX}/generate`,
      {
        month: month ? parseInt(month, 10) : null,
        year: year ? parseInt(year, 10) : null,
      },
      { timeout: 35000 }
    );
    return response.data;
  },

  /**
   * Get list of all previously generated reports.
   */
  async getReportHistory() {
    const response = await apiClient.get(`${REPORTS_API_PREFIX}/history`);
    return response.data;
  },

  /**
   * Get metadata for a specific report.
   * @param {string} reportId
   */
  async getReportDetails(reportId) {
    const response = await apiClient.get(`${REPORTS_API_PREFIX}/${reportId}`);
    return response.data;
  },

  /**
   * Download the official ReportLab PDF statement as a file blob.
   * @param {string} reportId
   * @param {string} fileName
   */
  async downloadReportPdf(reportId, fileName = 'smartfin_statement.pdf') {
    const response = await apiClient.get(`${REPORTS_API_PREFIX}/${reportId}/download`, {
      responseType: 'blob',
      timeout: 30000,
    });

    // Create a local blob URL and trigger browser download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Delete a report record from history.
   * @param {string} reportId
   */
  async deleteReport(reportId) {
    const response = await apiClient.delete(`${REPORTS_API_PREFIX}/${reportId}`);
    return response.data;
  },

  /**
   * Get live structured preview across all 11 sections without creating a saved record.
   * @param {number|null} month
   * @param {number|null} year
   */
  async getLivePreview(month = null, year = null) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;

    const response = await apiClient.get(`${REPORTS_API_PREFIX}/preview/live`, {
      params,
      timeout: 30000,
    });
    return response.data;
  },
};

export default reportService;
