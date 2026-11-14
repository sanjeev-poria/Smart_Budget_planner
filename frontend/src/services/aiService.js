import apiClient from './api';

const AI_API_PREFIX = '/api/v1/ai';

export const aiService = {
  /**
   * Send a chat message to the AI Financial Assistant.
   * @param {string} message - The user question or prompt.
   * @param {string|null} sessionId - Optional existing session ID.
   */
  async sendMessage(message, sessionId = null) {
    const response = await apiClient.post(
      `${AI_API_PREFIX}/chat`,
      {
        message,
        session_id: sessionId || null,
      },
      { timeout: 35000 }
    );
    return response.data;
  },

  /**
   * List all chat sessions for the authenticated user.
   */
  async getSessions() {
    const response = await apiClient.get(`${AI_API_PREFIX}/sessions`);
    return response.data;
  },

  /**
   * Fetch full message history for a specific session.
   * @param {string} sessionId
   */
  async getSessionMessages(sessionId) {
    const response = await apiClient.get(`${AI_API_PREFIX}/sessions/${sessionId}/messages`);
    return response.data;
  },

  /**
   * Delete a chat session and its messages.
   * @param {string} sessionId
   */
  async deleteSession(sessionId) {
    const response = await apiClient.delete(`${AI_API_PREFIX}/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Retrieve proactive, personalized financial insights.
   */
  async getInsights() {
    const response = await apiClient.get(`${AI_API_PREFIX}/insights`, { timeout: 30000 });
    return response.data;
  },

  /**
   * Explain 5-pillar health score components.
   * @param {Object} scoreData - { score, risk_level, components }
   */
  async explainHealthScore(scoreData) {
    const response = await apiClient.post(`${AI_API_PREFIX}/explain-score`, scoreData, { timeout: 30000 });
    return response.data;
  },

  /**
   * Explain What-If simulation differences and trade-offs.
   * @param {Object} scenarioData - { baseline, what_if, deltas }
   */
  async explainScenario(scenarioData) {
    const response = await apiClient.post(`${AI_API_PREFIX}/explain-scenario`, scenarioData, { timeout: 30000 });
    return response.data;
  },

  /**
   * Generate executive monthly report summary.
   */
  async getMonthlySummary() {
    const response = await apiClient.get(`${AI_API_PREFIX}/monthly-summary`, { timeout: 30000 });
    return response.data;
  },
};

export default aiService;
