import React, { useState, useEffect } from 'react';
import { Search, X, BarChart3, Radio, Users, BellRing, ChevronRight, Sparkles } from 'lucide-react';
import { AdAccount, PixelConfig, User, BudgetAlert } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AdAccount[];
  pixels: PixelConfig[];
  users: User[];
  alerts: BudgetAlert[];
  onNavigate: (tab: any, targetId?: string) => void;
  theme: 'dark' | 'light';
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  accounts,
  pixels,
  users,
  alerts,
  onNavigate,
  theme
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredAccounts = accounts.filter(a => 
    a.accountName.toLowerCase().includes(query.toLowerCase()) ||
    a.clientName.toLowerCase().includes(query.toLowerCase()) ||
    a.accountId.includes(query)
  );

  const filteredPixels = pixels.filter(p =>
    p.pixelName.toLowerCase().includes(query.toLowerCase()) ||
    p.pixelId.includes(query)
  );

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.username.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAlerts = alerts.filter(al =>
    al.title.toLowerCase().includes(query.toLowerCase()) ||
    al.accountName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border ${
        theme === 'dark' ? 'bg-[#0B0E14] border-[#D4AF37]/40 text-white' : 'bg-white border-amber-300 text-gray-900'
      }`}>
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-800 flex items-center space-x-3">
          <Search className="w-5 h-5 text-[#D4AF37]" />
          <input
            id="global-search-query-input"
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts, clients, pixel IDs, team members, alerts..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          <kbd className="px-2 py-1 text-[10px] font-mono bg-black/40 rounded border border-gray-700 text-gray-400">
            ESC
          </kbd>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
          
          {/* Ad Accounts Match */}
          {filteredAccounts.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-[#D4AF37] mb-2 flex items-center space-x-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Ad Accounts ({filteredAccounts.length})</span>
              </div>
              <div className="space-y-1">
                {filteredAccounts.slice(0, 4).map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      onNavigate('accounts', acc.id);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-[#121722] flex items-center justify-between transition-colors text-left"
                  >
                    <div>
                      <div className="font-bold text-white">{acc.accountName}</div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {acc.clientName} • Daily Spend: ${acc.dailySpend.toFixed(2)} / ${acc.dailyBudget.toFixed(2)}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pixels Match */}
          {filteredPixels.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-[#D4AF37] mb-2 flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Pixel Sentinels ({filteredPixels.length})</span>
              </div>
              <div className="space-y-1">
                {filteredPixels.slice(0, 3).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigate('pixels', p.pixelId);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-[#121722] flex items-center justify-between transition-colors text-left"
                  >
                    <div>
                      <div className="font-bold text-white">{p.pixelName}</div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        ID: {p.pixelId} • 24h Ingested: {p.events24hCount} events
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Team Members Match */}
          {filteredUsers.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-[#D4AF37] mb-2 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Team & RBAC Users ({filteredUsers.length})</span>
              </div>
              <div className="space-y-1">
                {filteredUsers.slice(0, 3).map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onNavigate('team');
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-[#121722] flex items-center justify-between transition-colors text-left"
                  >
                    <div>
                      <div className="font-bold text-white">{u.name} (<span className="text-[#F3E5AB] font-mono">{u.username}</span>)</div>
                      <div className="text-[11px] text-gray-400 capitalize">{u.role.replace('_', ' ')} • {u.email}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredAccounts.length === 0 && filteredPixels.length === 0 && filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No matching records found for "{query}".
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
