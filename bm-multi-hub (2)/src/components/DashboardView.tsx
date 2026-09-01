import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Layers, 
  Radio, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  ArrowUpRight, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Zap,
  BarChart2,
  PieChart
} from 'lucide-react';
import { AdAccount, PixelConfig, BudgetAlert, Client } from '../types';

interface DashboardViewProps {
  accounts: AdAccount[];
  pixels: PixelConfig[];
  alerts: BudgetAlert[];
  clients: Client[];
  theme: 'dark' | 'light';
  onOpenConnectModal: () => void;
  onSelectAccount: (accountId: string) => void;
  onNavigateTab: (tab: any) => void;
  onAcknowledgeAlert: (alertId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  pixels,
  alerts,
  clients,
  theme,
  onOpenConnectModal,
  onSelectAccount,
  onNavigateTab,
  onAcknowledgeAlert
}) => {
  // Aggregate Metrics
  const totalDailySpend = accounts.reduce((acc, a) => acc + (a.dailySpend || 0), 0);
  const totalDailyBudget = accounts.reduce((acc, a) => acc + (a.dailyBudget || 0), 0);
  const totalLifetimeSpend = accounts.reduce((acc, a) => acc + (a.lifetimeSpend || 0), 0);
  const totalActiveAds = accounts.reduce((acc, a) => acc + (a.activeAdsCount || 0), 0);
  
  const healthyPixelsCount = pixels.filter(p => p.status === 'healthy').length;
  const criticalAccountsCount = accounts.filter(a => a.status === 'SPEND_LIMIT_REACHED' || (a.dailyBudget > 0 && (a.dailySpend / a.dailyBudget) >= 0.9)).length;
  const portfolioBudgetUtil = totalDailyBudget > 0 ? (totalDailySpend / totalDailyBudget) * 100 : 0;

  // Platform Breakdown
  const metaSpend = accounts.filter(a => a.platform === 'meta').reduce((acc, a) => acc + a.dailySpend, 0);
  const googleSpend = accounts.filter(a => a.platform === 'google').reduce((acc, a) => acc + a.dailySpend, 0);
  const tiktokSpend = accounts.filter(a => a.platform === 'tiktok').reduce((acc, a) => acc + a.dailySpend, 0);
  const snapSpend = accounts.filter(a => a.platform === 'snapchat').reduce((acc, a) => acc + a.dailySpend, 0);

  // Simulated 7-day historical trend data for visualization
  const trendDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
  const spendHistory = [
    Math.round(totalDailySpend * 0.72),
    Math.round(totalDailySpend * 0.81),
    Math.round(totalDailySpend * 0.78),
    Math.round(totalDailySpend * 0.94),
    Math.round(totalDailySpend * 0.88),
    Math.round(totalDailySpend * 0.96),
    Math.round(totalDailySpend)
  ];
  const maxHistorySpend = Math.max(...spendHistory, totalDailyBudget || 1000);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Executive Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-cinzel text-2xl font-extrabold gold-text-gradient">
              EXECUTIVE MONITORING HUB
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              REAL-TIME SENTINEL
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Simultaneous multi-client spend tracking, live pixel event monitoring, and budget cap enforcement.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="dash-add-asset-btn"
            onClick={onOpenConnectModal}
            className="px-4 py-2.5 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Ad Asset & Token</span>
          </button>
        </div>
      </div>

      {/* Clean Slate Initial State Warning if no accounts */}
      {accounts.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center transition-all ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-[#0F141F] to-[#080B10] border-[#D4AF37]/30 text-white'
            : 'bg-white border-amber-300 text-gray-900'
        }`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#F3E5AB] to-[#AA771C] p-0.5 shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#080B10] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#F3E5AB]" />
            </div>
          </div>
          <h3 className="font-cinzel text-lg font-bold text-white mb-1">
            Clean Slate Initialized
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            The platform is initialized in pristine state with zero pre-loaded test accounts as requested. Connect your client Meta Pixel, Google Ads, or TikTok token to start monitoring.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={onOpenConnectModal}
              className="px-6 py-3 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Connect First Ad Account / Pixel</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Daily Portfolio Spend */}
            <div className={`p-5 rounded-2xl border transition-all ${
              theme === 'dark' ? 'dream-card' : 'dream-card-light'
            }`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#D4AF37]">
                  Daily Portfolio Spend
                </span>
                <DollarSign className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="font-cinzel text-2xl font-extrabold text-white mb-1">
                ${totalDailySpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  of ${totalDailyBudget.toLocaleString()} Budget
                </span>
                <span className={`font-mono font-bold ${
                  portfolioBudgetUtil >= 90 ? 'text-red-400' : portfolioBudgetUtil >= 80 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {portfolioBudgetUtil.toFixed(1)}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-gray-800 mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    portfolioBudgetUtil >= 90 ? 'bg-red-500' : portfolioBudgetUtil >= 80 ? 'bg-amber-400' : 'bg-[#D4AF37]'
                  }`}
                  style={{ width: `${Math.min(100, portfolioBudgetUtil)}%` }}
                />
              </div>
            </div>

            {/* Card 2: Active Running Ads */}
            <div className={`p-5 rounded-2xl border transition-all ${
              theme === 'dark' ? 'dream-card' : 'dream-card-light'
            }`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#D4AF37]">
                  Active Running Ads
                </span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-cinzel text-2xl font-extrabold text-white mb-1">
                {totalActiveAds} <span className="text-xs font-normal text-gray-400">Ads</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Across {accounts.length} Connected Accounts</span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">100% Pacing</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-800 mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 w-full" />
              </div>
            </div>

            {/* Card 3: Pixel Health Sentinel */}
            <div className={`p-5 rounded-2xl border transition-all ${
              theme === 'dark' ? 'dream-card' : 'dream-card-light'
            }`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#D4AF37]">
                  Connected Pixels
                </span>
                <Radio className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="font-cinzel text-2xl font-extrabold text-white mb-1">
                {healthyPixelsCount} <span className="text-xs font-normal text-gray-400">/ {pixels.length} Healthy</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Event Ingestion Stream</span>
                <span className="text-emerald-400 font-mono text-[11px] font-bold">ONLINE</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-800 mt-3 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${pixels.length > 0 ? (healthyPixelsCount / pixels.length) * 100 : 100}%` }}
                />
              </div>
            </div>

            {/* Card 4: Spend Limit Alerts At-Risk */}
            <div className={`p-5 rounded-2xl border transition-all ${
              theme === 'dark' ? 'dream-card' : 'dream-card-light'
            }`}>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#D4AF37]">
                  Budget Cap Risks
                </span>
                <AlertTriangle className={`w-4 h-4 ${criticalAccountsCount > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
              </div>
              <div className="font-cinzel text-2xl font-extrabold text-white mb-1">
                {criticalAccountsCount} <span className="text-xs font-normal text-gray-400">At Risk (&ge;90%)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{alerts.filter(a => !a.isRead).length} Unread System Alerts</span>
                <span className="text-amber-400 font-mono text-[11px] font-bold">Auto-Throttling</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-800 mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${criticalAccountsCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${accounts.length > 0 ? (criticalAccountsCount / accounts.length) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>

          {/* Historical Trends & Spending Velocity Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Spend Trend Chart (2 Columns) */}
            <div className={`lg:col-span-2 p-6 rounded-2xl border ${
              theme === 'dark' ? 'dream-card' : 'dream-card-light'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-cinzel text-base font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                    <span>Portfolio Spend Velocity & Historical Trend</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    7-day daily spend pacing trajectory vs cumulative budget threshold
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-mono font-bold">
                    Avg ROAS: 3.84x
                  </span>
                </div>
              </div>

              {/* Interactive SVG / Bar Graph */}
              <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-gray-800/80">
                {trendDays.map((day, idx) => {
                  const spend = spendHistory[idx];
                  const heightPercent = maxHistorySpend > 0 ? (spend / maxHistorySpend) * 100 : 20;
                  const isToday = idx === trendDays.length - 1;

                  return (
                    <div key={day} className="flex-1 flex flex-col items-center group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 bg-[#161C28] text-white text-[10px] font-mono px-2 py-1 rounded border border-[#D4AF37]/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-10">
                        ${spend.toLocaleString()}
                      </div>

                      {/* Bar fill */}
                      <div className="w-full max-w-[36px] bg-gray-800/60 rounded-t-lg overflow-hidden flex items-end h-full">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-700 ${
                            isToday 
                              ? 'bg-gradient-to-t from-[#AA771C] via-[#D4AF37] to-[#F3E5AB] shadow-lg shadow-[#D4AF37]/30' 
                              : 'bg-gradient-to-t from-gray-700 to-gray-500 group-hover:from-[#D4AF37]/60 group-hover:to-[#F3E5AB]/60'
                          }`}
                          style={{ height: `${Math.max(15, heightPercent)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] mt-2 font-mono ${isToday ? 'text-[#D4AF37] font-bold' : 'text-gray-400'}`}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 mt-4 pt-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#D4AF37]" />
                    <span>Daily Spend</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-gray-600" />
                    <span>Historical Baseline</span>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigateTab('reports')}
                  className="text-xs text-[#D4AF37] hover:underline flex items-center space-x-1 font-semibold"
                >
                  <span>Detailed Analytics</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Platform Share Breakdown (1 Column) */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'dream-card' : 'dream-card-light'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cinzel text-base font-bold text-white flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-[#D4AF37]" />
                  <span>Platform Distribution</span>
                </h3>
              </div>

              <div className="space-y-3.5 mt-4">
                {/* Meta BM */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-blue-400">Meta Business Manager</span>
                    <span className="font-mono text-white font-bold">${metaSpend.toFixed(0)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${totalDailySpend > 0 ? (metaSpend / totalDailySpend) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Google Ads */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-red-400">Google Ads (Search & Display)</span>
                    <span className="font-mono text-white font-bold">${googleSpend.toFixed(0)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${totalDailySpend > 0 ? (googleSpend / totalDailySpend) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* TikTok Ads */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-emerald-400">TikTok Ads Manager</span>
                    <span className="font-mono text-white font-bold">${tiktokSpend.toFixed(0)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${totalDailySpend > 0 ? (tiktokSpend / totalDailySpend) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Snapchat Ads */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-amber-400">Snapchat Ads</span>
                    <span className="font-mono text-white font-bold">${snapSpend.toFixed(0)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${totalDailySpend > 0 ? (snapSpend / totalDailySpend) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                <span>Total Lifetime Portfolio Spend</span>
                <span className="font-mono font-bold text-[#F3E5AB] text-xs">
                  ${totalLifetimeSpend.toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          {/* Multi-Client Spend Limits & Threshold Pacing Grid */}
          <div className={`p-6 rounded-2xl border ${
            theme === 'dark' ? 'dream-card' : 'dream-card-light'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="font-cinzel text-base font-bold text-white flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Simultaneous Multi-Client Spend & Threshold Monitor</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Tracking daily spend pacing against budget limits across all connected clients
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('accounts')}
                className="text-xs text-[#D4AF37] hover:underline font-semibold flex items-center space-x-1"
              >
                <span>Manage All {accounts.length} Accounts</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Accounts with Spend Pacing Bar */}
            <div className="space-y-4">
              {accounts.slice(0, 5).map((account) => {
                const util = account.dailyBudget > 0 ? (account.dailySpend / account.dailyBudget) * 100 : 0;
                const isOver = util >= 100;
                const isWarning = util >= (account.spendLimitThreshold || 90);

                return (
                  <div 
                    key={account.id}
                    className={`p-4 rounded-xl border transition-all ${
                      theme === 'dark'
                        ? 'bg-[#121722]/80 border-gray-800 hover:border-[#D4AF37]/40'
                        : 'bg-gray-50 border-gray-200 hover:border-[#D4AF37]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                          account.platform === 'meta' ? 'bg-blue-900/60 text-blue-300' :
                          account.platform === 'google' ? 'bg-red-900/60 text-red-300' :
                          account.platform === 'tiktok' ? 'bg-emerald-900/60 text-emerald-300' :
                          'bg-amber-900/60 text-amber-300'
                        }`}>
                          {account.platform.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{account.accountName}</span>
                            <span className="text-[10px] text-[#D4AF37] font-mono font-semibold">({account.clientName})</span>
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            ID: {account.accountId} • Pixel: {account.pixelId || 'None'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-right">
                        <div>
                          <div className="text-xs font-mono font-bold text-white">
                            ${account.dailySpend.toFixed(2)} <span className="text-gray-400 font-normal">/ ${account.dailyBudget.toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Threshold: {account.spendLimitThreshold}%
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                          isOver 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                            : isWarning
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {isOver ? 'CAP EXCEEDED' : isWarning ? 'WARNING' : 'PACING OPTIMAL'}
                        </span>
                      </div>
                    </div>

                    {/* Spend Limit Pacing Bar with Threshold Marker */}
                    <div className="relative w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-[#D4AF37]'
                        }`}
                        style={{ width: `${Math.min(100, util)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Automated Alerts Strip */}
          {alerts.length > 0 && (
            <div className={`p-5 rounded-2xl border ${
              theme === 'dark' ? 'dream-card' : 'dream-card-light'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cinzel text-sm font-bold text-white flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-[#D4AF37]" />
                  <span>Recent Automated Budget Threshold Alerts</span>
                </h3>
                <button
                  onClick={() => onNavigateTab('alerts')}
                  className="text-xs text-[#D4AF37] hover:underline font-semibold"
                >
                  View All Alerts ({alerts.length})
                </button>
              </div>

              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
                      alert.severity === 'critical'
                        ? 'bg-red-950/20 border-red-600/30 text-red-200'
                        : alert.severity === 'warning'
                          ? 'bg-amber-950/20 border-amber-600/30 text-amber-200'
                          : 'bg-[#121722] border-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-2 h-2 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-500 animate-ping' : 'bg-[#D4AF37]'
                      }`} />
                      <div>
                        <div className="font-semibold text-white">{alert.title}</div>
                        <div className="text-[11px] text-gray-400">{alert.message}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!alert.isRead && (
                        <button
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#D4AF37] text-black hover:bg-[#F3E5AB]"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};
