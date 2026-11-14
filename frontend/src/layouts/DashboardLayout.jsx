import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TopNavbar } from '../components/ui/TopNavbar';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Activity,
  ShieldAlert,
  Target,
  LineChart,
  CreditCard,
  PieChart,
  TrendingUp,
  Receipt,
  Sliders,
  Sparkles,
  FileText,
  User,
  ShieldCheck,
  LogOut,
  X,
  Cpu,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Main 14 Navigation Items
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Health Score', path: '/health-score', icon: Activity },
    { name: 'Emergency Fund', path: '/emergency-fund', icon: ShieldAlert },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Investments', path: '/investments', icon: LineChart },
    { name: 'Debts', path: '/debts', icon: CreditCard },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
    { name: 'Net Worth', path: '/net-worth', icon: TrendingUp },
    { name: 'Tax', path: '/tax', icon: Receipt },
    { name: 'What-If Simulator', path: '/what-if', icon: Sliders },
    { name: 'AI Assistant', path: '/ai-chat', icon: Sparkles, badge: 'AI' },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-fintech-bg text-slate-900 dark:text-fintech-text flex transition-colors">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop Fixed + Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-fintech-surface/95 backdrop-blur-xl border-r border-slate-200 dark:border-fintech-border/80 flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 dark:border-fintech-border/70 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-glow-emerald">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block">
                  SMARTFIN
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase block">
                  Fintech Platform
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Mini Badge in Sidebar */}
          <div className="p-3 mx-3 my-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Account'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.city ? `${user.city}` : user?.email}</p>
            </div>
          </div>

          {/* Navigation Items (All 14 requested links) */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Main Navigation
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 border-l-2 border-emerald-600 dark:bg-gradient-to-r dark:from-emerald-500/15 dark:via-indigo-500/10 dark:to-transparent dark:text-white dark:border-emerald-400 pl-2.5 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 dark:border-fintech-border/70 bg-white dark:bg-fintech-surface space-y-1">
            <NavLink
              to="/status"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-all"
            >
              <Cpu className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>System Status</span>
            </NavLink>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 dark:bg-slate-900 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-400 dark:border-slate-800 dark:hover:border-rose-500/30 text-xs font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navigation Bar with alerts and user profile menu */}
        <TopNavbar onToggleSidebar={() => setMobileMenuOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
