import React, { useState } from 'react';
import { 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Pause, 
  Play, 
  Trash2, 
  Edit3, 
  Radio, 
  Key, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Layers,
  Sparkles,
  Users,
  ShieldAlert
} from 'lucide-react';
import { AdAccount, Client, User, AdPlatform } from '../types';
import { logAuditEvent } from '../lib/storage';

interface AdAccountsViewProps {
  accounts: AdAccount[];
  clients: Client[];
  users: User[];
  theme: 'dark' | 'light';
  onOpenConnectModal: () => void;
  onUpdateAccount: (account: AdAccount) => void;
  onDeleteAccount: (accountId: string) => void;
}

export const AdAccountsView: React.FC<AdAccountsViewProps> = ({
  accounts,
  clients,
  users,
  theme,
  onOpenConnectModal,
  onUpdateAccount,
  onDeleteAccount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);

  // Edit budget modal state
  const [editingAccount, setEditingAccount] = useState<AdAccount | null>(null);
  const [editBudget, setEditBudget] = useState('');
  const [editThreshold, setEditThreshold] = useState('90');

  // Filter accounts
  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = 
      a.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.pixelId && a.pixelId.includes(searchQuery));
    
    const matchesPlatform = selectedPlatform === 'ALL' || a.platform === selectedPlatform;
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const toggleAccountStatus = (account: AdAccount) => {
    const newStatus = account.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const updated: AdAccount = { ...account, status: newStatus };
    onUpdateAccount(updated);
    logAuditEvent({
      userId: 'admin',
      userName: 'Admin User',
      action: 'UPDATE_ACCOUNT_STATUS',
      resource: account.id,
      details: `Changed account ${account.accountName} status to ${newStatus}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
  };

  const handleSaveBudgetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    const updated: AdAccount = {
      ...editingAccount,
      dailyBudget: Number(editBudget) || editingAccount.dailyBudget,
      spendLimitThreshold: Number(editThreshold) || editingAccount.spendLimitThreshold
    };
    onUpdateAccount(updated);
    logAuditEvent({
      userId: 'admin',
      userName: 'Admin User',
      action: 'UPDATE_BUDGET_CAP',
      resource: editingAccount.id,
      details: `Updated daily budget to $${editBudget} and threshold to ${editThreshold}% for ${editingAccount.accountName}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
    setEditingAccount(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl font-extrabold gold-text-gradient">
            MULTI-CLIENT AD ACCOUNTS & SPEND LIMITS
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitor real-time daily spend pacing, manage budget limits, and inspect connected pixel tokens.
          </p>
        </div>

        <button
          id="btn-add-ad-account"
          onClick={onOpenConnectModal}
          className="px-4 py-2.5 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Ad Asset</span>
        </button>
      </div>

      {/* Search & Filtering Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center gap-3 ${
        theme === 'dark' ? 'bg-[#0F141F] border-[#D4AF37]/20' : 'bg-white border-gray-200'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="accounts-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account name, client, account ID, or pixel ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#080B10] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto">
          {/* Platform Filter */}
          <select
            id="accounts-platform-filter"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#080B10] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="ALL">All Platforms</option>
            <option value="meta">Meta Business Manager</option>
            <option value="google">Google Ads</option>
            <option value="tiktok">TikTok Ads</option>
            <option value="snapchat">Snapchat Ads</option>
          </select>

          {/* Status Filter */}
          <select
            id="accounts-status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#080B10] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Running</option>
            <option value="PAUSED">Paused</option>
            <option value="SPEND_LIMIT_REACHED">Cap Reached (100%)</option>
            <option value="WARNING_THRESHOLD">Warning (90%+)</option>
          </select>
        </div>
      </div>

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <div className={`p-10 rounded-2xl border text-center ${
          theme === 'dark' ? 'bg-[#0F141F] border-[#D4AF37]/20 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
        }`}>
          <BarChart3 className="w-10 h-10 mx-auto text-[#D4AF37]/60 mb-2" />
          <p className="text-xs font-semibold">No ad accounts found matching your query.</p>
          <button
            onClick={onOpenConnectModal}
            className="mt-3 px-4 py-2 rounded-xl gold-btn text-xs font-bold"
          >
            + Connect New Asset
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAccounts.map((account) => {
            const isExpanded = expandedAccountId === account.id;
            const spendRatio = account.dailyBudget > 0 ? (account.dailySpend / account.dailyBudget) * 100 : 0;
            const isCapExceeded = spendRatio >= 100;
            const isWarning = spendRatio >= (account.spendLimitThreshold || 90);

            return (
              <div
                key={account.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  theme === 'dark'
                    ? 'bg-[#0F141F] border-[#D4AF37]/25 hover:border-[#D4AF37]/50'
                    : 'bg-white border-gray-200 hover:border-[#D4AF37]'
                }`}
              >
                {/* Account Card Main Bar */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Platform icon & names */}
                  <div className="flex items-start space-x-3 min-w-[280px]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 shadow-md ${
                      account.platform === 'meta' ? 'bg-blue-900/60 text-blue-300 border border-blue-600/40' :
                      account.platform === 'google' ? 'bg-red-900/60 text-red-300 border border-red-600/40' :
                      account.platform === 'tiktok' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/40' :
                      'bg-amber-900/60 text-amber-300 border border-amber-600/40'
                    }`}>
                      {account.platform.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-white">{account.accountName}</h4>
                        <span className="text-[10px] font-mono text-[#D4AF37] font-semibold bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                          {account.clientName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-gray-400 font-mono mt-1">
                        <span>ID: {account.accountId}</span>
                        {account.pixelId && (
                          <span className="flex items-center space-x-1 text-emerald-400">
                            <Radio className="w-3 h-3" />
                            <span>Pixel: {account.pixelId}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Spend Pacing & Progress */}
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="font-mono">
                        <span className="text-white font-bold">${account.dailySpend.toFixed(2)}</span>
                        <span className="text-gray-400"> / ${account.dailyBudget.toFixed(2)} Daily Budget</span>
                      </div>
                      <span className={`font-mono font-bold text-xs ${
                        isCapExceeded ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {spendRatio.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCapExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-[#D4AF37]'
                        }`}
                        style={{ width: `${Math.min(100, spendRatio)}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                      <span>Threshold Alert at {account.spendLimitThreshold}%</span>
                      <span>Lifetime Spend: ${account.lifetimeSpend.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Right: Actions & Expand Button */}
                  <div className="flex items-center space-x-2">
                    
                    {/* Pause/Resume button */}
                    <button
                      onClick={() => toggleAccountStatus(account)}
                      title={account.status === 'ACTIVE' ? 'Pause Ads' : 'Resume Ads'}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        account.status === 'ACTIVE'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-600/40 hover:bg-emerald-900/60'
                          : 'bg-amber-950/40 text-amber-400 border-amber-600/40 hover:bg-amber-900/60'
                      }`}
                    >
                      {account.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Edit Budget button */}
                    <button
                      onClick={() => {
                        setEditingAccount(account);
                        setEditBudget(String(account.dailyBudget));
                        setEditThreshold(String(account.spendLimitThreshold || 90));
                      }}
                      title="Adjust Budget Cap & Threshold"
                      className="p-2 rounded-xl text-xs font-semibold bg-[#121722] text-[#F3E5AB] border border-gray-700 hover:border-[#D4AF37]"
                    >
                      <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                    </button>

                    {/* Delete account button */}
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      title="Disconnect Account"
                      className="p-2 rounded-xl text-xs font-semibold bg-red-950/20 text-red-400 border border-red-800/40 hover:bg-red-900/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Expand Details button */}
                    <button
                      onClick={() => setExpandedAccountId(isExpanded ? null : account.id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#121722] text-gray-300 border border-gray-700 hover:border-[#D4AF37] flex items-center space-x-1"
                    >
                      <span>{account.campaigns?.length || 0} Campaigns</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#D4AF37]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </button>

                  </div>

                </div>

                {/* Expanded Campaigns Breakdown Table */}
                {isExpanded && (
                  <div className="p-5 bg-[#080B10]/95 border-t border-gray-800/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center space-x-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Running Campaigns Breakdown</span>
                      </h5>
                      <span className="text-[11px] font-mono text-gray-400">
                        Total ROAS: <strong className="text-emerald-400">{account.roas}x</strong> • Active Ads: <strong className="text-white">{account.activeAdsCount}</strong>
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase">
                            <th className="pb-2">Campaign Name</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Daily Budget</th>
                            <th className="pb-2">Daily Spend</th>
                            <th className="pb-2">Impressions</th>
                            <th className="pb-2">Clicks</th>
                            <th className="pb-2">ROAS</th>
                            <th className="pb-2">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                          {account.campaigns && account.campaigns.length > 0 ? (
                            account.campaigns.map((cmp) => (
                              <tr key={cmp.id} className="hover:bg-white/5">
                                <td className="py-2.5 font-sans font-medium text-white">{cmp.name}</td>
                                <td className="py-2.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-700/40">
                                    {cmp.status}
                                  </span>
                                </td>
                                <td className="py-2.5 text-gray-300">${cmp.dailyBudget.toFixed(2)}</td>
                                <td className="py-2.5 text-[#F3E5AB] font-bold">${cmp.dailySpend.toFixed(2)}</td>
                                <td className="py-2.5 text-gray-400">{cmp.impressions.toLocaleString()}</td>
                                <td className="py-2.5 text-gray-400">{cmp.clicks.toLocaleString()}</td>
                                <td className="py-2.5 text-emerald-400 font-bold">{cmp.roas}x</td>
                                <td className="py-2.5 text-gray-300">{cmp.ctr}%</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-4 text-center text-gray-500 font-sans">
                                No active child campaigns reported for this asset.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Edit Budget Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0B0E14] border border-[#D4AF37]/40 p-6 text-white shadow-2xl">
            <h3 className="font-cinzel text-base font-bold text-white mb-1">
              Adjust Spend Limit & Thresholds
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Target Account: <strong className="text-[#F3E5AB]">{editingAccount.accountName}</strong>
            </p>

            <form onSubmit={handleSaveBudgetEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Daily Budget Cap ($)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Alert Trigger Threshold (%)
                </label>
                <select
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="80">80% of Daily Budget</option>
                  <option value="90">90% of Daily Budget</option>
                  <option value="95">95% of Daily Budget</option>
                  <option value="100">100% Hard Cap</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-btn text-xs font-bold"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
