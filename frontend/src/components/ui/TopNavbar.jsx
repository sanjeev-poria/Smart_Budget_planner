import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  Check,
  X,
  Cpu,
  Receipt,
  FileText,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import { Badge } from './Badge';

const ROUTE_NAMES = {
  '/dashboard': 'Executive Command Center',
  '/transactions': 'Ledger & Transactions',
  '/health-score': 'Financial Health Diagnostic',
  '/emergency-fund': 'Emergency Fund Reserve',
  '/goals': 'Milestone Goals & Target SIPs',
  '/investments': 'Portfolio & Asset Allocation',
  '/debts': 'Liability Management & Snowball',
  '/budgets': 'Category Budget Allocations',
  '/net-worth': 'Net Worth Statement',
  '/assets': 'Asset Inventory',
  '/liabilities': 'Liabilities & Obligations',
  '/tax': 'Tax Optimization Center',
  '/what-if': 'What-If Scenario Simulator',
  '/ai-chat': 'Gemini AI Assistant',
  '/reports': 'Monthly Financial Reports',
  '/profile': 'Financial Profile & Settings',
  '/status': 'System Diagnostics',
};

export const TopNavbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { alerts, unreadCount, markAsRead, markAllAsRead, dismissAlert } = useNotifications();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentRouteName = ROUTE_NAMES[location.pathname] || 'Financial Vault';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 bg-white/90 dark:bg-fintech-bg/85 backdrop-blur-xl border-b border-slate-200 dark:border-fintech-border/70 transition-colors">
      {/* Left: Mobile Menu + Breadcrumbs */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
          <Link
            to="/dashboard"
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors hidden sm:inline font-semibold"
          >
            SMARTFIN
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 hidden sm:inline" />
          <span className="text-slate-900 dark:text-white font-semibold truncate text-xs sm:text-sm">
            {currentRouteName}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Live Engine Status Pill */}
        <Link
          to="/status"
          className="hidden md:inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Engine Active</span>
        </Link>

        {/* AI Quick Assistant Pill */}
        <Link
          to="/ai-chat"
          className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-600/25 text-xs font-semibold transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Ask AI Advisor</span>
        </Link>

        {/* Quick Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 transition-all shadow-sm flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="View notifications"
            className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold shadow-glow-rose">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-slate-700/90 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Financial Alerts
                  </h4>
                  {unreadCount > 0 && (
                    <Badge variant="rose" size="xs">
                      {unreadCount} unread
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center">
                    <ShieldCheck className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">All Clear</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      No active alerts or critical warnings.
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const isCrit = alert.type === 'critical';
                    const isWarn = alert.type === 'warning';
                    return (
                      <div
                        key={alert.id}
                        className={`p-3.5 transition-colors relative group ${
                          alert.read
                            ? 'bg-slate-50/50 dark:bg-slate-900/40'
                            : 'bg-white dark:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                              isCrit
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : isWarn
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                            }`}
                          >
                            {isCrit ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <Info className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {alert.title}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              {alert.message}
                            </p>
                            {alert.link && (
                              <Link
                                to={alert.link}
                                onClick={() => {
                                  markAsRead(alert.id);
                                  setNotificationsOpen(false);
                                }}
                                className="inline-block mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                              >
                                View Details &rarr;
                              </Link>
                            )}
                          </div>

                          <button
                            onClick={() => dismissAlert(alert.id)}
                            title="Dismiss alert"
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            aria-label="User profile menu"
            className="flex items-center space-x-2.5 p-1.5 pl-2 rounded-xl bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-900 dark:text-white block max-w-[120px] truncate leading-tight">
                {user?.name || 'Account'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Profile Dropdown */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-white dark:bg-fintech-card border border-slate-200 dark:border-slate-700/90 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                {user?.city && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Location: {user.city}
                  </p>
                )}
              </div>

              <div className="py-1">
                {/* Theme Toggle in Dropdown */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    {isDark ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>Theme</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {isDark ? '🌙 Dark' : '☀️ Light'}
                  </span>
                </button>

                <Link
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Financial Profile</span>
                </Link>

                <Link
                  to="/tax"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Tax Center (80C / NPS)</span>
                </Link>

                <Link
                  to="/reports"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Monthly PDF Reports</span>
                </Link>

                <Link
                  to="/status"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <Cpu className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>System Diagnostics</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
