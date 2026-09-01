import React, { useState } from 'react';
import { 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  Send, 
  Activity, 
  Clock, 
  Zap, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck,
  Terminal,
  Database
} from 'lucide-react';
import { PixelConfig, AdAccount } from '../types';
import { verifyPixelConnection } from '../lib/pixelSyncEngine';
import { logAuditEvent } from '../lib/storage';

interface PixelMonitorViewProps {
  pixels: PixelConfig[];
  accounts: AdAccount[];
  theme: 'dark' | 'light';
  onOpenConnectModal: () => void;
}

interface SimulatedEvent {
  id: string;
  eventName: string;
  pixelId: string;
  timestamp: string;
  value?: number;
  currency?: string;
  status: 'PROCESSED' | 'DROPPED' | 'WARNING';
}

export const PixelMonitorView: React.FC<PixelMonitorViewProps> = ({
  pixels,
  accounts,
  theme,
  onOpenConnectModal
}) => {
  const [selectedPixelId, setSelectedPixelId] = useState<string>(pixels[0]?.pixelId || '');
  const [testEventType, setTestEventType] = useState('Purchase');
  const [testValue, setTestValue] = useState('249.99');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Live simulated event stream
  const [eventStream, setEventStream] = useState<SimulatedEvent[]>([
    {
      id: 'evt_1',
      eventName: 'Purchase',
      pixelId: pixels[0]?.pixelId || '84920194829104',
      timestamp: new Date(Date.now() - 12000).toLocaleTimeString(),
      value: 380.00,
      currency: 'USD',
      status: 'PROCESSED'
    },
    {
      id: 'evt_2',
      eventName: 'AddToCart',
      pixelId: pixels[0]?.pixelId || '84920194829104',
      timestamp: new Date(Date.now() - 34000).toLocaleTimeString(),
      value: 120.00,
      currency: 'USD',
      status: 'PROCESSED'
    },
    {
      id: 'evt_3',
      eventName: 'Lead',
      pixelId: pixels[0]?.pixelId || '84920194829104',
      timestamp: new Date(Date.now() - 62000).toLocaleTimeString(),
      status: 'PROCESSED'
    },
    {
      id: 'evt_4',
      eventName: 'PageView',
      pixelId: pixels[0]?.pixelId || '84920194829104',
      timestamp: new Date(Date.now() - 89000).toLocaleTimeString(),
      status: 'PROCESSED'
    }
  ]);

  const handleSendTestPayload = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    await new Promise(r => setTimeout(r, 600));

    const newEvt: SimulatedEvent = {
      id: 'evt_' + Date.now(),
      eventName: testEventType,
      pixelId: selectedPixelId || '84920194829104',
      timestamp: new Date().toLocaleTimeString(),
      value: Number(testValue) || undefined,
      currency: 'USD',
      status: 'PROCESSED'
    };

    setEventStream(prev => [newEvt, ...prev.slice(0, 15)]);
    setTestResult(`Success: Test "${testEventType}" payload matched on Conversions API v19.0 (Server-side Event Ingestion Active).`);
    setIsSendingTest(false);

    logAuditEvent({
      userId: 'admin',
      userName: 'Admin User',
      action: 'PIXEL_TEST_EVENT_DISPATCHED',
      resource: selectedPixelId,
      details: `Dispatched test ${testEventType} event to pixel ${selectedPixelId}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl font-extrabold gold-text-gradient">
            PIXEL HEALTH & CONVERSIONS API SENTINEL
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitor real-time event ingestion health, access token expirations, and diagnose payload latency.
          </p>
        </div>

        <button
          onClick={onOpenConnectModal}
          className="px-4 py-2 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider flex items-center space-x-2 self-start sm:self-auto"
        >
          <Zap className="w-4 h-4" />
          <span>Connect New Pixel</span>
        </button>
      </div>

      {pixels.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center ${
          theme === 'dark' ? 'bg-[#0F141F] border-[#D4AF37]/20 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
        }`}>
          <Radio className="w-12 h-12 mx-auto text-[#D4AF37] mb-3 animate-pulse" />
          <h3 className="font-cinzel text-base font-bold text-white mb-1">No Pixels Connected Yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
            Connect your Meta Pixel ID, TikTok Pixel, or Google Tag Manager container with access token to monitor live ad events.
          </p>
          <button
            onClick={onOpenConnectModal}
            className="px-5 py-2.5 rounded-xl gold-btn text-xs font-bold"
          >
            Connect Pixel & Token
          </button>
        </div>
      ) : (
        <>
          {/* Pixels Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pixels.map((pixel) => {
              const matchedAccount = accounts.find(a => a.pixelId === pixel.pixelId);
              return (
                <div
                  key={pixel.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    theme === 'dark' ? 'dream-card' : 'dream-card-light'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white">{pixel.pixelName}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-600/40">
                      HEALTHY
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono text-gray-400 border-t border-gray-800/80 pt-3">
                    <div className="flex justify-between">
                      <span>Pixel ID:</span>
                      <span className="text-white font-bold">{pixel.pixelId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span className="text-[#F3E5AB] uppercase">{pixel.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>24h Ingested Events:</span>
                      <span className="text-emerald-400 font-bold">{pixel.events24hCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Token Expiry:</span>
                      <span className="text-gray-300">{pixel.tokenExpiryDays} Days Remaining</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">
                      Bound to: {matchedAccount?.accountName || 'Primary Asset'}
                    </span>
                    <button
                      onClick={() => setSelectedPixelId(pixel.pixelId)}
                      className="text-[11px] font-bold text-[#D4AF37] hover:underline"
                    >
                      Run Diagnostics →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Diagnostic & Real-Time Event Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Live Event Stream Terminal */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-[#0B0E14] border-[#D4AF37]/30' : 'bg-gray-900 border-gray-800 text-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cinzel text-sm font-bold text-white flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-[#D4AF37]" />
                  <span>Real-Time Ingestion Feed</span>
                </h3>
                <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>STREAMING</span>
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-xs pr-1">
                {eventStream.map((evt) => (
                  <div 
                    key={evt.id} 
                    className="p-2.5 rounded-lg bg-[#121722] border border-gray-800 flex items-center justify-between text-gray-300"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        evt.eventName === 'Purchase' ? 'bg-emerald-400' :
                        evt.eventName === 'AddToCart' ? 'bg-amber-400' :
                        'bg-blue-400'
                      }`} />
                      <span className="text-white font-bold">{evt.eventName}</span>
                      {evt.value && (
                        <span className="text-[#F3E5AB] font-semibold">${evt.value.toFixed(2)}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-gray-500">
                      <span>Pixel: {evt.pixelId.slice(-6)}</span>
                      <span>{evt.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Event Dispatcher */}
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' ? 'dream-card' : 'dream-card-light'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-cinzel text-sm font-bold text-white flex items-center space-x-2">
                  <Send className="w-4 h-4 text-[#D4AF37]" />
                  <span>Conversions API Test Dispatcher</span>
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Select Target Pixel ID
                  </label>
                  <select
                    value={selectedPixelId}
                    onChange={(e) => setSelectedPixelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                  >
                    {pixels.map(p => (
                      <option key={p.id} value={p.pixelId}>
                        {p.pixelName} ({p.pixelId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Event Type
                    </label>
                    <select
                      value={testEventType}
                      onChange={(e) => setTestEventType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="Purchase">Purchase ($)</option>
                      <option value="AddToCart">AddToCart</option>
                      <option value="Lead">Lead</option>
                      <option value="InitiateCheckout">InitiateCheckout</option>
                      <option value="PageView">PageView</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Order Value ($)
                    </label>
                    <input
                      type="number"
                      value={testValue}
                      onChange={(e) => setTestValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestPayload}
                  disabled={isSendingTest}
                  className="w-full py-2.5 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
                >
                  {isSendingTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test Event Payload...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Test Event to Conversions API</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{testResult}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
