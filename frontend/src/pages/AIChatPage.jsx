import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Bot,
  User,
  Lightbulb,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import aiService from '../services/aiService';

const SUGGESTED_QUESTIONS = [
  {
    icon: ShieldCheck,
    title: 'Health Score',
    text: 'Why is my health score low?',
  },
  {
    icon: TrendingUp,
    title: 'Savings Boost',
    text: 'How can I improve my savings?',
  },
  {
    icon: Zap,
    title: 'Emergency Fund',
    text: 'Explain my emergency fund.',
  },
  {
    icon: AlertTriangle,
    title: 'Spending Analysis',
    text: 'Where am I spending the most?',
  },
  {
    icon: Lightbulb,
    title: 'Goal Strategy',
    text: 'How much should I save for my goal?',
  },
  {
    icon: AlertCircle,
    title: 'Debt Payoff',
    text: 'Explain my debt situation.',
  },
];

// Helper to render basic markdown without extra heavy dependencies
function renderFormattedMarkdown(content) {
  if (!content) return null;

  const lines = content.split('\n');
  return lines.map((line, idx) => {
    // Headers
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-base font-semibold text-emerald-600 dark:text-emerald-400 mt-3 mb-1.5 flex items-center gap-1.5">
          {line.replace('### ', '')}
        </h4>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 flex items-center gap-2">
          {line.replace('## ', '')}
        </h3>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h2 key={idx} className="text-xl font-extrabold text-slate-900 dark:text-white mt-4 mb-2">
          {line.replace('# ', '')}
        </h2>
      );
    }

    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const cleanLine = line.trim().substring(2);
      return (
        <div key={idx} className="flex items-start gap-2 my-1 text-slate-700 dark:text-slate-200 pl-2">
          <span className="text-emerald-500 dark:text-emerald-400 text-sm mt-0.5">•</span>
          <span className="flex-1 text-sm leading-relaxed">{formatBoldText(cleanLine)}</span>
        </div>
      );
    }

    // Numbered list (e.g. "1. ")
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1.5 text-slate-700 dark:text-slate-200 pl-2">
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <span className="flex-1 text-sm leading-relaxed">{formatBoldText(numMatch[2])}</span>
        </div>
      );
    }

    // Empty lines
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }

    // Normal paragraph
    return (
      <p key={idx} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 my-1">
        {formatBoldText(line)}
      </p>
    );
  });
}

// Convert **bold** tokens into strong elements
function formatBoldText(text) {
  if (!text.includes('**')) return text;

  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="text-slate-900 dark:text-white font-semibold">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export function AIChatPage() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'insights' | 'summary'

  // Sessions and Chat State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Insights & Summary State
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load chat sessions on mount
  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const data = await aiService.getSessions();
      setSessions(data || []);
      if (data && data.length > 0 && !currentSessionId) {
        // Load the most recent session
        loadSessionMessages(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }, [currentSessionId]);

  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages for a specific session
  const loadSessionMessages = async (sessionId) => {
    try {
      setError(null);
      setCurrentSessionId(sessionId);
      const data = await aiService.getSessionMessages(sessionId);
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load session messages:', err);
      setError('Failed to load message history.');
    }
  };

  // Start a new conversation
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Delete a session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await aiService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Could not delete session.');
    }
  };

  // Send message
  const handleSendMessage = async (customPrompt = null) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    setInputMessage('');

    // Optimistically append user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage(textToSend, currentSessionId);
      if (response && response.message) {
        setCurrentSessionId(response.session_id);
        setMessages((prev) => [...prev, response.message]);

        // Refresh sessions sidebar if it was a new session
        if (!currentSessionId) {
          loadSessions();
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Unable to generate response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy response text
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Load Proactive Insights
  const loadInsights = async () => {
    try {
      setInsightsLoading(true);
      setError(null);
      const data = await aiService.getInsights();
      setInsights(data.insights || []);
    } catch (err) {
      console.error('Failed to load insights:', err);
      setError('Could not load AI insights.');
    } finally {
      setInsightsLoading(false);
    }
  };

  // Load Monthly Summary
  const loadMonthlySummary = async () => {
    try {
      setSummaryLoading(true);
      setError(null);
      const data = await aiService.getMonthlySummary();
      setMonthlySummary(data);
    } catch (err) {
      console.error('Failed to load monthly summary:', err);
      setError('Could not load monthly summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights' && insights.length === 0) {
      loadInsights();
    } else if (activeTab === 'summary' && !monthlySummary) {
      loadMonthlySummary();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Banner Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">SMARTFIN AI Advisor</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Gemini Grounded
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Personalized guidance grounded in your live financial engine
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Advisor Chat
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Proactive Insights
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Monthly Report
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* TAB 1: CONVERSATIONAL CHAT */}
        {activeTab === 'chat' && (
          <>
            {/* Left Sidebar: Session History */}
            <aside className="hidden md:flex w-72 lg:w-80 flex-col border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-sm">
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Conversation
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-10 text-xs text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Loading history...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-12 px-4 text-xs text-slate-500 dark:text-slate-400">
                    <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                    No previous chats.
                    <br />
                    Start a conversation with SMARTFIN AI!
                  </div>
                ) : (
                  sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => loadSessionMessages(sess.id)}
                      className={`group relative flex items-center justify-between p-2.5 rounded-xl text-left cursor-pointer transition-all ${
                        currentSessionId === sess.id
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-6">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${currentSessionId === sess.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className="text-xs truncate">{sess.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(e, sess.id)}
                        title="Delete conversation"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all absolute right-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Ground Truth Status Card */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950/40">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-white dark:bg-slate-900/60">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Ground Truth Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                    All numbers (Health Score, Runway, Goals) are computed in Python backend. Gemini strictly explains your verified data.
                  </p>
                </div>
              </div>
            </aside>

            {/* Chat Conversation Area */}
            <main className="flex-1 flex flex-col bg-slate-50/50 dark:bg-[#0B0F19] relative overflow-hidden">
              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="max-w-2xl mx-auto py-8">
                    {/* Welcome Hero */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-3 shadow-xl shadow-emerald-500/10">
                        <Bot className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">How can I assist your financial journey?</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
                        I am your personalized SMARTFIN Advisor. I analyze your live health score, emergency runway,
                        debts, and budgets to provide clear, actionable guidance.
                      </p>
                    </div>

                    {/* Starter Suggestions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SUGGESTED_QUESTIONS.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(item.text)}
                            className="group flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-emerald-500/40 text-left transition-all cursor-pointer shadow-sm"
                          >
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                                {item.title}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                "{item.text}"
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex gap-3 max-w-3xl ${
                          isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                        }`}
                      >
                        {!isUser && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-1 shadow-md">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        <div
                          className={`relative group rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                            isUser
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white max-w-lg rounded-tr-sm'
                              : 'bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 max-w-2xl rounded-tl-sm'
                          }`}
                        >
                          {!isUser && (
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">SMARTFIN AI Advisor</span>
                              </div>
                              <button
                                onClick={() => handleCopy(msg.content, index)}
                                title="Copy answer"
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded transition-colors"
                              >
                                {copiedIndex === index ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}

                          <div className="prose dark:prose-invert max-w-none">
                            {isUser ? (
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              renderFormattedMarkdown(msg.content)
                            )}
                          </div>
                        </div>

                        {isUser && (
                          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 mt-1">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex gap-3 max-w-3xl mr-auto">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-1 shadow-md">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="text-xs text-slate-600 dark:text-slate-400 ml-1">Analyzing financial metrics & formulating advice...</span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span>{error}</span>
                    </div>
                    <button
                      onClick={() => handleSendMessage()}
                      className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-200 font-medium transition-colors cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input Section */}
              <div className="p-4 sm:px-8 border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
                <div className="max-w-3xl mx-auto">
                  <div className="relative flex items-center rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/80 focus-within:border-emerald-500/60 shadow-lg">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask SMARTFIN: 'Why is my health score low?', 'How can I save more?'..."
                      rows={1}
                      className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none max-h-32"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() || isLoading}
                      className="mr-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold transition-all shadow-md cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Responsible Finance Disclaimer */}
                  <p className="text-[11px] text-slate-500 text-center mt-2.5">
                    These insights are for educational purposes and are not a substitute for professional financial advice.
                  </p>
                </div>
              </div>
            </main>
          </>
        )}

        {/* TAB 2: PROACTIVE INSIGHTS */}
        {activeTab === 'insights' && (
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-[#0B0F19]">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    Proactive Financial Insights
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Calculated from your live cashflow, emergency runway, and active debt obligations.
                  </p>
                </div>
                <button
                  onClick={loadInsights}
                  disabled={insightsLoading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
                  Refresh Insights
                </button>
              </div>

              {insightsLoading ? (
                <div className="py-20 text-center text-slate-600 dark:text-slate-400 text-sm flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 dark:text-emerald-400 mb-3" />
                  Generating personalized recommendations from live financial metrics...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((item, idx) => {
                    const isHigh = item.priority === 'high';
                    const isMed = item.priority === 'medium';
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-5 bg-white dark:bg-slate-900/60 backdrop-blur-sm flex flex-col justify-between transition-all hover:border-emerald-500/40 ${
                          isHigh
                            ? 'border-rose-500/30 shadow-lg shadow-rose-950/20'
                            : isMed
                            ? 'border-amber-500/30'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.category}
                            </span>
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isHigh
                                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                  : isMed
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {item.priority} Priority
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{item.insight}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
                          <div className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-3">
                            <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Action: {item.action_item}</span>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab('chat');
                              handleSendMessage(`Tell me more about how to address: ${item.title}`);
                            }}
                            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Consult AI Advisor</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500">
                  These insights are for educational purposes and are not a substitute for professional financial advice.
                </p>
              </div>
            </div>
          </main>
        )}

        {/* TAB 3: MONTHLY SUMMARY */}
        {activeTab === 'summary' && (
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-[#0B0F19]">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Executive Monthly Financial Report
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Synthesizing cashflow velocity, budget discipline, and net worth posture.
                  </p>
                </div>
                <button
                  onClick={loadMonthlySummary}
                  disabled={summaryLoading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>

              {summaryLoading ? (
                <div className="py-20 text-center text-slate-600 dark:text-slate-400 text-sm flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 dark:text-emerald-400 mb-3" />
                  Generating executive report from your monthly financial data...
                </div>
              ) : monthlySummary ? (
                <div className="space-y-6">
                  {/* Executive Overview Card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {monthlySummary.month || 'Current Month'} Report
                      </span>
                    </div>
                    <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {renderFormattedMarkdown(monthlySummary.summary)}
                    </div>
                  </div>

                  {/* Highlights & Areas for Improvement Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Positive Highlights */}
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 p-5">
                      <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3">
                        <Check className="w-4 h-4" />
                        Key Positive Milestones
                      </h4>
                      <div className="space-y-2.5">
                        {monthlySummary.highlights?.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <span className="text-emerald-500 dark:text-emerald-400 font-bold">•</span>
                            <span className="leading-relaxed">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Areas for Improvement */}
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 p-5">
                      <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4" />
                        Areas Requiring Attention
                      </h4>
                      <div className="space-y-2.5">
                        {monthlySummary.areas_for_improvement?.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                            <span className="text-amber-500 dark:text-amber-400 font-bold">•</span>
                            <span className="leading-relaxed">{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 text-center">
                    <p className="text-xs text-slate-500">
                      These insights are for educational purposes and are not a substitute for professional financial advice.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-slate-500 dark:text-slate-400">
                  Click 'Regenerate' to formulate your monthly report.
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default AIChatPage;
