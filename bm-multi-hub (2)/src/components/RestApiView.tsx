import React, { useState } from 'react';
import { 
  Code2, 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Send, 
  Radio, 
  Globe, 
  Terminal, 
  Play, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Lock
} from 'lucide-react';
import { ApiKeyItem, WebhookSubscription, AdAccount, PixelConfig } from '../types';
import { logAuditEvent } from '../lib/storage';

interface RestApiViewProps {
  apiKeys: ApiKeyItem[];
  webhooks: WebhookSubscription[];
  accounts: AdAccount[];
  pixels: PixelConfig[];
  theme: 'dark' | 'light';
  onCreateApiKey: (newKey: ApiKeyItem) => void;
  onRevokeApiKey: (keyId: string) => void;
  onCreateWebhook: (newWebhook: WebhookSubscription) => void;
  onDeleteWebhook: (webhookId: string) => void;
}

export const RestApiView: React.FC<RestApiViewProps> = ({
  apiKeys,
  webhooks,
  accounts,
  pixels,
  theme,
  onCreateApiKey,
  onRevokeApiKey,
  onCreateWebhook,
  onDeleteWebhook
}) => {
  // New API key modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // New webhook modal
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['budget.threshold', 'spend.limit_reached']);

  // Live Interactive API Console
  const [selectedEndpoint, setSelectedEndpoint] = useState<'accounts' | 'sync' | 'pixels' | 'alerts'>('accounts');
  const [consoleResponse, setConsoleResponse] = useState<string | null>(null);
  const [isExecutingApi, setIsExecutingApi] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const fullKey = 'bm_live_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
    const newKeyItem: ApiKeyItem = {
      id: 'key_' + Math.random().toString(36).substring(2, 9),
      name: keyName || 'Sentinel Production Key',
      keyPrefix: fullKey.slice(0, 12) + '...',
      fullKey,
      createdAt: new Date().toISOString(),
      scopes: ['accounts:read', 'accounts:write', 'pixels:read', 'alerts:stream'],
      status: 'active'
    };

    onCreateApiKey(newKeyItem);
    setGeneratedKey(fullKey);
    setKeyName('');

    logAuditEvent({
      userId: 'admin',
      userName: 'Admin User',
      action: 'GENERATE_REST_API_KEY',
      resource: newKeyItem.id,
      details: `Generated live API key: "${newKeyItem.name}"`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl || !webhookUrl.startsWith('http')) return;

    const newHook: WebhookSubscription = {
      id: 'wh_' + Math.random().toString(36).substring(2, 9),
      url: webhookUrl,
      events: selectedEvents,
      secret: 'whsec_' + Math.random().toString(36).substring(2, 14),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    onCreateWebhook(newHook);
    setWebhookUrl('');
    setShowWebhookModal(false);

    logAuditEvent({
      userId: 'admin',
      userName: 'Admin User',
      action: 'REGISTER_WEBHOOK_SUBSCRIBER',
      resource: newHook.url,
      details: `Subscribed webhook URL to events: ${selectedEvents.join(', ')}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
  };

  const executeApiCall = async () => {
    setIsExecutingApi(true);
    setConsoleResponse(null);
    await new Promise(r => setTimeout(r, 450));

    let payload: any = {};
    if (selectedEndpoint === 'accounts') {
      payload = {
        status: 200,
        success: true,
        data: {
          totalAccounts: accounts.length,
          accounts: accounts.map(a => ({
            id: a.accountId,
            name: a.accountName,
            client: a.clientName,
            platform: a.platform,
            dailySpend: a.dailySpend,
            dailyBudget: a.dailyBudget,
            status: a.status,
            pixelId: a.pixelId
          }))
        },
        meta: {
          rateLimitRemaining: 998,
          timestamp: new Date().toISOString()
        }
      };
    } else if (selectedEndpoint === 'sync') {
      payload = {
        status: 200,
        success: true,
        message: 'Synchronized live spend pacing across all advertising channels.',
        syncedCount: accounts.length,
        velocityTriggerStatus: 'NORMAL'
      };
    } else if (selectedEndpoint === 'pixels') {
      payload = {
        status: 200,
        success: true,
        data: pixels.map(p => ({
          pixelId: p.pixelId,
          name: p.pixelName,
          platform: p.platform,
          healthStatus: p.status,
          events24h: p.events24hCount,
          lastIngestedEvent: p.lastEventTime
        }))
      };
    } else if (selectedEndpoint === 'alerts') {
      payload = {
        status: 200,
        success: true,
        event: 'budget.threshold',
        channel: '#bm-spend-alerts',
        deliveredTo: 2
      };
    }

    setConsoleResponse(JSON.stringify(payload, null, 2));
    setIsExecutingApi(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl font-extrabold gold-text-gradient">
            RESTFUL API & WEBHOOK SENTINEL
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Integrate third-party marketing tools (Zapier, Make, custom CRM) with Bearer token authentication and real-time webhook events.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-create-webhook"
            onClick={() => setShowWebhookModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#121722] text-[#F3E5AB] border border-[#D4AF37]/40 hover:bg-[#D4AF37]/20 text-xs font-bold flex items-center space-x-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>+ Add Webhook</span>
          </button>
          <button
            id="btn-create-api-key"
            onClick={() => setShowKeyModal(true)}
            className="px-4 py-2 rounded-xl gold-btn text-xs font-bold flex items-center space-x-1.5 uppercase tracking-wider"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Generate API Key</span>
          </button>
        </div>
      </div>

      {/* Generated Key Alert */}
      {generatedKey && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-[#D4AF37] text-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F3E5AB] flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>New API Key Generated - Copy Now</span>
            </span>
            <button
              onClick={() => setGeneratedKey(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              ✕ Done
            </button>
          </div>
          <p className="text-[11px] text-gray-300">
            For security, this secret token will never be displayed in plain text again.
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={generatedKey}
              className="w-full px-3 py-2 rounded-xl bg-[#080B10] border border-[#D4AF37] text-emerald-400 font-mono text-xs"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedKey);
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              }}
              className="px-4 py-2 rounded-xl gold-btn text-xs font-bold flex items-center space-x-1"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* API Keys Table & Webhook Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* API Keys List */}
        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' ? 'dream-card' : 'dream-card-light'
        }`}>
          <h3 className="font-cinzel text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Key className="w-4 h-4 text-[#D4AF37]" />
            <span>Active Bearer API Tokens ({apiKeys.length})</span>
          </h3>

          {apiKeys.length === 0 ? (
            <p className="text-xs text-gray-500 italic p-4 bg-[#080B10] rounded-xl border border-gray-800 text-center">
              No custom API keys created yet. Generate a key to connect external services.
            </p>
          ) : (
            <div className="space-y-2.5">
              {apiKeys.map((k) => (
                <div key={k.id} className="p-3 rounded-xl bg-[#121722] border border-gray-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="font-bold text-white font-sans">{k.name}</div>
                    <div className="text-[11px] text-emerald-400">{k.keyPrefix}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Created: {new Date(k.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => onRevokeApiKey(k.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/30"
                    title="Revoke Token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Webhook Subscriptions */}
        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' ? 'dream-card' : 'dream-card-light'
        }`}>
          <h3 className="font-cinzel text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-[#D4AF37]" />
            <span>Registered Webhooks ({webhooks.length})</span>
          </h3>

          {webhooks.length === 0 ? (
            <p className="text-xs text-gray-500 italic p-4 bg-[#080B10] rounded-xl border border-gray-800 text-center">
              No webhook endpoints registered. Add an endpoint to receive live spend notifications in real-time.
            </p>
          ) : (
            <div className="space-y-2.5">
              {webhooks.map((w) => (
                <div key={w.id} className="p-3 rounded-xl bg-[#121722] border border-gray-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="font-bold text-white truncate max-w-xs">{w.url}</div>
                    <div className="text-[10px] text-[#D4AF37] mt-0.5 font-sans">
                      Events: {w.events.join(', ')}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteWebhook(w.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-950/30"
                    title="Delete Webhook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Interactive REST API Explorer Console */}
      <div className={`p-6 rounded-2xl border ${
        theme === 'dark' ? 'dream-card' : 'dream-card-light'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-cinzel text-base font-bold text-white flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#D4AF37]" />
            <span>Interactive REST API Runner & Documentation</span>
          </h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedEndpoint('accounts')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                selectedEndpoint === 'accounts' ? 'bg-[#D4AF37] text-black' : 'bg-[#121722] text-gray-400'
              }`}
            >
              GET /accounts
            </button>
            <button
              onClick={() => setSelectedEndpoint('sync')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                selectedEndpoint === 'sync' ? 'bg-[#D4AF37] text-black' : 'bg-[#121722] text-gray-400'
              }`}
            >
              POST /sync
            </button>
            <button
              onClick={() => setSelectedEndpoint('pixels')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                selectedEndpoint === 'pixels' ? 'bg-[#D4AF37] text-black' : 'bg-[#121722] text-gray-400'
              }`}
            >
              GET /pixels
            </button>
          </div>
        </div>

        {/* cURL Display */}
        <div className="p-3.5 rounded-xl bg-[#080B10] border border-gray-800 text-xs font-mono text-gray-300 flex items-center justify-between mb-4">
          <code>
            curl -X {selectedEndpoint === 'sync' ? 'POST' : 'GET'} https://bmmultihub.agency/api/v1/{selectedEndpoint} \<br/>
            &nbsp;&nbsp;-H "Authorization: Bearer bm_live_99812498712..." \<br/>
            &nbsp;&nbsp;-H "Content-Type: application/json"
          </code>
          <button
            onClick={executeApiCall}
            disabled={isExecutingApi}
            className="px-4 py-2 rounded-xl gold-btn text-xs font-bold flex items-center space-x-1.5 flex-shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isExecutingApi ? 'Running...' : 'Execute'}</span>
          </button>
        </div>

        {/* JSON Response Window */}
        {consoleResponse && (
          <div className="mt-4">
            <div className="text-[10px] font-mono text-gray-400 uppercase mb-1">Response Payload (HTTP 200 OK):</div>
            <pre className="p-4 rounded-xl bg-[#080B10] border border-emerald-600/30 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60">
              {consoleResponse}
            </pre>
          </div>
        )}

      </div>

      {/* Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0B0E14] border border-[#D4AF37]/40 p-6 text-white shadow-2xl">
            <h3 className="font-cinzel text-base font-bold text-white mb-2">Generate Live API Key</h3>
            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">API Key Identifier / Name</label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Zapier Spend Sync"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 text-xs text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-btn text-xs font-bold"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0B0E14] border border-[#D4AF37]/40 p-6 text-white shadow-2xl">
            <h3 className="font-cinzel text-base font-bold text-white mb-2">Register Webhook Subscriber</h3>
            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">Destination Webhook URL</label>
                <input
                  type="url"
                  required
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-crm.com/api/ad-webhook"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 text-xs text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl gold-btn text-xs font-bold"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
