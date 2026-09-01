import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Radio, 
  Users, 
  BellRing, 
  FileSpreadsheet, 
  Code2, 
  ShieldCheck, 
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab = 
  | 'dashboard' 
  | 'accounts' 
  | 'pixels' 
  | 'team' 
  | 'alerts' 
  | 'reports' 
  | 'api' 
  | 'security';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole?: UserRole;
  theme: 'dark' | 'light';
  alertCount: number;
  accountsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole = 'super_admin',
  theme,
  alertCount,
  accountsCount
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Executive Hub',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Portfolio overview & trends'
    },
    {
      id: 'accounts' as NavTab,
      label: 'Ad Accounts & Spends',
      icon: BarChart3,
      badge: accountsCount > 0 ? `${accountsCount}` : null,
      desc: 'Multi-client spend limits'
    },
    {
      id: 'pixels' as NavTab,
      label: 'Pixel Sentinel',
      icon: Radio,
      badge: 'Live',
      desc: 'Tokens & event health'
    },
    {
      id: 'team' as NavTab,
      label: 'Asset RBAC & Users',
      icon: Users,
      badge: userRole === 'super_admin' ? 'Admin' : userRole === 'account_manager' ? 'Delegate' : null,
      desc: userRole === 'super_admin' ? 'Create IDs & assign assets' : userRole === 'account_manager' ? 'Delegate client assets' : 'Directory & assigned access'
    },
    {
      id: 'alerts' as NavTab,
      label: 'Thresholds & Slack',
      icon: BellRing,
      badge: alertCount > 0 ? `${alertCount}` : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/40',
      desc: 'Automated 80/90/100% alerts'
    },
    {
      id: 'reports' as NavTab,
      label: 'Custom Reports & Export',
      icon: FileSpreadsheet,
      badge: 'CSV/PDF',
      desc: 'Weekly digests & metrics'
    },
    {
      id: 'api' as NavTab,
      label: 'REST API & Webhooks',
      icon: Code2,
      badge: 'v1.0',
      desc: 'Third-party tool sync'
    },
    {
      id: 'security' as NavTab,
      label: 'Security & Cloud Backup',
      icon: ShieldCheck,
      badge: 'GDPR',
      desc: 'MFA, E2E vault, snapshots'
    }
  ];

  return (
    <aside className={`w-full lg:w-64 flex-shrink-0 border-r transition-colors ${
      theme === 'dark'
        ? 'bg-[#111111] border-[#262626] text-gray-300'
        : 'bg-white border-gray-200 text-gray-700'
    }`}>
      <div className="p-4 space-y-6">
        
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
            SENTINEL MODULES
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-[#1A1A1A] text-[#F3E5AB] border border-[#D4AF37]/50 shadow-sm font-semibold'
                      : 'bg-amber-100/70 text-amber-950 border border-amber-300 font-semibold'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:bg-[#1A1A1A] hover:text-gray-100 border border-transparent'
                      : 'text-gray-600 hover:bg-amber-50/50 hover:text-gray-900 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]' 
                      : 'bg-black/30 text-gray-400 group-hover:text-[#D4AF37]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{item.label}</div>
                    <div className="text-[10px] text-gray-500 truncate hidden sm:block">
                      {item.desc}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    item.badgeColor 
                      ? item.badgeColor 
                      : isActive
                        ? 'bg-[#D4AF37] text-black'
                        : 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sentinel Live Status Card */}
        <div className={`p-3.5 rounded-xl border relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#1A1A1A] border-[#262626] text-gray-300'
            : 'bg-gray-50 border-gray-200 text-gray-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#D4AF37] tracking-wider uppercase flex items-center space-x-1">
              <Zap className="w-3 h-3 text-[#D4AF37] animate-pulse" />
              <span>LIVE SENTINEL</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed mb-2.5">
            Auto-evaluating spend velocity and pixel event drop-offs every 30s.
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-2 border-t border-gray-800">
            <span>E2E ENCRYPTED</span>
            <span className="text-emerald-400 font-bold">AES-256-GCM</span>
          </div>
        </div>

      </div>
    </aside>
  );
};
