import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  RefreshCw, 
  Bell, 
  Sun, 
  Moon, 
  UserCheck, 
  LogOut, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { User, BudgetAlert } from '../types';

interface NavbarProps {
  currentUser: User | null;
  theme: 'dark' | 'light';
  alerts: BudgetAlert[];
  isSyncing: boolean;
  onSyncNow: () => void;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenAlerts: () => void;
  onLogout: () => void;
  onOpenMfaModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  theme,
  alerts,
  isSyncing,
  onSyncNow,
  onToggleTheme,
  onOpenSearch,
  onOpenAlerts,
  onLogout,
  onOpenMfaModal
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertPreview, setShowAlertPreview] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const criticalCount = unreadAlerts.filter(a => a.severity === 'critical').length;

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-colors ${
      theme === 'dark' 
        ? 'bg-[#111111]/95 backdrop-blur-md border-[#262626] text-[#F0F0F0]' 
        : 'bg-white/95 backdrop-blur-md border-gray-200 text-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo - Sleek Interface */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F3E5AB] via-[#D4AF37] to-[#996515] p-0.5 shadow-md shadow-[#D4AF37]/15 flex items-center justify-center">
            <div className="w-full h-full bg-[#111111] rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-cinzel text-lg font-bold tracking-wider gold-text-gradient">
                BM MULTI-HUB
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                SENTINEL
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium tracking-tight">
              Ad Asset & Multi-Client Spend Sentinel
            </p>
          </div>
        </div>

        {/* Search Bar / Trigger */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <button
            id="nav-search-trigger"
            onClick={onOpenSearch}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium border transition-all ${
              theme === 'dark'
                ? 'bg-[#1A1A1A] border-[#262626] text-gray-400 hover:border-[#D4AF37]/50 hover:text-gray-200'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-[#D4AF37]/60 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-[#D4AF37]" />
              <span>Search clients, ad accounts, pixel IDs, tokens...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/40 rounded border border-gray-700/50 text-[#D4AF37]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Quick Sync Button */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono border bg-emerald-950/30 border-emerald-600/30 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Firestore: Connected</span>
          </div>

          <button
            id="nav-sync-btn"
            onClick={onSyncNow}
            disabled={isSyncing}
            title="Trigger Live Spend & Pixel Check"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSyncing
                ? 'opacity-75 cursor-not-allowed bg-[#D4AF37]/20 text-[#F3E5AB] border-[#D4AF37]/40'
                : theme === 'dark'
                  ? 'bg-[#1A1A1A] border-[#262626] text-[#F3E5AB] hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/50'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Pacing'}</span>
          </button>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              id="nav-alerts-btn"
              onClick={() => {
                setShowAlertPreview(!showAlertPreview);
                onOpenAlerts();
              }}
              className={`relative p-2 rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'bg-[#1A1A1A] border-[#262626] text-gray-300 hover:text-[#F3E5AB] hover:border-[#D4AF37]/50'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:text-black hover:border-[#D4AF37]'
              }`}
            >
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              {unreadAlerts.length > 0 && (
                <span className={`absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center text-white ${
                  criticalCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-[#D4AF37] text-black font-extrabold'
                }`}>
                  {unreadAlerts.length}
                </span>
              )}
            </button>
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <button
            id="nav-theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`p-2 rounded-lg border transition-all ${
              theme === 'dark'
                ? 'bg-[#1A1A1A] border-[#262626] text-[#F3E5AB] hover:border-[#D4AF37]/60'
                : 'bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-400'
            }`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#F3E5AB]" />
            ) : (
              <Moon className="w-4 h-4 text-amber-800" />
            )}
          </button>

          {/* Current User Profile Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                id="nav-user-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center space-x-2 pl-2 pr-3 py-1 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#262626] hover:border-[#D4AF37]'
                    : 'bg-gray-50 border-gray-200 hover:border-[#D4AF37]'
                }`}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden border border-[#D4AF37] bg-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#F3E5AB]">
                  {currentUser.avatarUrl ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    currentUser.username.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-bold text-[#F3E5AB] flex items-center space-x-1">
                    <span>{currentUser.username}</span>
                    {currentUser.role === 'super_admin' && (
                      <span className="text-[9px] px-1 py-0.2 bg-[#D4AF37]/20 text-[#D4AF37] rounded font-mono">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl p-2 z-50 border ${
                  theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#262626] text-gray-200'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}>
                  <div className="px-3 py-2 border-b border-gray-700/30">
                    <p className="text-xs font-semibold text-[#D4AF37]">{currentUser.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center space-x-1 text-[10px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Authenticated ({currentUser.role})</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      id="menu-mfa-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenMfaModal();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>MFA Security (2FA)</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        currentUser.mfaEnabled ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'
                      }`}>
                        {currentUser.mfaEnabled ? 'Active' : 'Setup'}
                      </span>
                    </button>

                    <button
                      id="menu-logout-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
