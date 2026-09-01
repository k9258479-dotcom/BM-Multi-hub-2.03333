import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Radio, 
  Key, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Building,
  Sparkles,
  Zap
} from 'lucide-react';
import { AdAccount, AdPlatform, PixelConfig, Client, User } from '../types';
import { verifyPixelConnection } from '../lib/pixelSyncEngine';
import { logAuditEvent } from '../lib/storage';

interface ConnectAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAccount: (account: AdAccount, pixel?: PixelConfig, client?: Client) => void;
  existingClients: Client[];
  existingUsers: User[];
  theme: 'dark' | 'light';
}

export const ConnectAssetModal: React.FC<ConnectAssetModalProps> = ({
  isOpen,
  onClose,
  onSaveAccount,
  existingClients,
  existingUsers,
  theme
}) => {
  const [platform, setPlatform] = useState<AdPlatform>('meta');
  const [clientName, setClientName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dailyBudget, setDailyBudget] = useState('500');
  const [spendLimitThreshold, setSpendLimitThreshold] = useState('90');
  const [totalSpendCap, setTotalSpendCap] = useState('10000');
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestToken = async () => {
    if (!pixelId || !accessToken) {
      setVerificationResult({
        success: false,
        message: 'Please provide both a Pixel ID and Access Token to test connection.'
      });
      return;
    }
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const result = await verifyPixelConnection(platform, pixelId, accessToken);
      setVerificationResult({
        success: result.success,
        message: result.message + ` (Latency: ${result.latencyMs}ms, 24h Events: ${result.eventCount})`
      });
    } catch (e: any) {
      setVerificationResult({
        success: false,
        message: e.message || 'Handshake failed.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanClientId = 'client_' + (clientName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'brand_' + Date.now());
    const newClient: Client = {
      id: cleanClientId,
      name: clientName || 'New Client Entity',
      companyName: clientName || 'Client Brand Corp',
      contactEmail: `media@${cleanClientId.replace('client_', '')}.com`,
      monthlyBudgetCap: Number(dailyBudget) * 30,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      tags: [platform.toUpperCase(), 'ACTIVE']
    };

    const newAdAccountId = 'act_' + (accountId.replace(/[^a-z0-9]/gi, '') || Math.floor(1000000000 + Math.random() * 9000000000));
    
    // Sample running campaigns for the newly connected account
    const sampleCampaigns = [
      {
        id: 'cmp_retarget_' + Math.random().toString(36).substring(2, 7),
        adAccountId: newAdAccountId,
        name: `[${platform.toUpperCase()}] TOF - High Intent Conversion`,
        status: 'ACTIVE' as const,
        dailyBudget: Number(dailyBudget) * 0.6,
        dailySpend: Number(dailyBudget) * 0.25,
        lifetimeSpend: Number(dailyBudget) * 1.5,
        impressions: 48200,
        clicks: 1450,
        conversions: 88,
        roas: 3.42,
        cpm: 12.80,
        ctr: 3.01
      },
      {
        id: 'cmp_prospect_' + Math.random().toString(36).substring(2, 7),
        adAccountId: newAdAccountId,
        name: `[${platform.toUpperCase()}] BOF - Dynamic Catalog Retargeting`,
        status: 'ACTIVE' as const,
        dailyBudget: Number(dailyBudget) * 0.4,
        dailySpend: Number(dailyBudget) * 0.15,
        lifetimeSpend: Number(dailyBudget) * 0.8,
        impressions: 21400,
        clicks: 890,
        conversions: 42,
        roas: 4.15,
        cpm: 18.20,
        ctr: 4.16
      }
    ];

    const newAccount: AdAccount = {
      id: newAdAccountId,
      clientId: cleanClientId,
      clientName: clientName || 'Client Entity',
      accountName: accountName || `${clientName} ${platform.toUpperCase()} Primary`,
      platform,
      accountId: newAdAccountId,
      pixelId: pixelId || undefined,
      accessToken: accessToken || undefined,
      currency: 'USD',
      status: 'ACTIVE',
      dailyBudget: Number(dailyBudget) || 500,
      dailySpend: Number(dailyBudget) * 0.4, // Initial realistic spend
      spendLimitThreshold: Number(spendLimitThreshold) || 90,
      totalSpendCap: Number(totalSpendCap) || 10000,
      lifetimeSpend: Number(dailyBudget) * 2.3,
      activeAdsCount: 8,
      roas: 3.75,
      lastSyncedAt: new Date().toISOString(),
      campaigns: sampleCampaigns,
      assignedUserIds: assignedUserId ? [assignedUserId] : ['*'],
      notes: `Connected on ${new Date().toLocaleDateString()} via Sentinel token handshake.`
    };

    let pixelConfig: PixelConfig | undefined = undefined;
    if (pixelId) {
      pixelConfig = {
        id: 'px_' + pixelId,
        adAccountId: newAdAccountId,
        clientId: cleanClientId,
        pixelId,
        pixelName: `${clientName} ${platform.toUpperCase()} Pixel`,
        platform,
        accessToken: accessToken ? accessToken.slice(0, 10) + '...' + accessToken.slice(-6) : '',
        tokenExpiryDays: 60,
        status: 'healthy',
        lastEventTime: new Date().toISOString(),
        events24hCount: Math.floor(Math.random() * 8000) + 1200,
        verifiedAt: new Date().toISOString()
      };
    }

    logAuditEvent({
      userId: assignedUserId || 'admin',
      userName: 'Admin/Manager',
      action: 'CONNECT_AD_ASSET',
      resource: newAdAccountId,
      details: `Connected ${platform.toUpperCase()} ad account for ${clientName}. Pixel: ${pixelId || 'None'}. Threshold: ${spendLimitThreshold}%`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });

    onSaveAccount(newAccount, pixelConfig, newClient);
    onClose();
  };

  const fillDemoPreset = (presetPlatform: AdPlatform) => {
    setPlatform(presetPlatform);
    if (presetPlatform === 'meta') {
      setClientName('Emirates Luxury Retail');
      setAccountName('Meta BM - Global Luxury Flagship');
      setAccountId('act_98247192837');
      setPixelId('84920194829104');
      setAccessToken('EAAKpZCZBz...v19LiveSentinelToken...9977');
      setDailyBudget('1200');
      setSpendLimitThreshold('90');
      setTotalSpendCap('25000');
    } else if (presetPlatform === 'google') {
      setClientName('Dubai Premier Properties');
      setAccountName('Google Ads - High Net Worth Real Estate');
      setAccountId('act_4829104820');
      setPixelId('TAG-GTM-99201');
      setAccessToken('ya29.a0AfH6SM...GoogleAdsOauthRefreshToken');
      setDailyBudget('2500');
      setSpendLimitThreshold('85');
      setTotalSpendCap('50000');
    } else if (presetPlatform === 'tiktok') {
      setClientName('Oasis Haute Couture');
      setAccountName('TikTok Ads - Viral Fashion Drop');
      setAccountId('act_7739104829');
      setPixelId('C92049182910');
      setAccessToken('tt_live_access_tok_88921849');
      setDailyBudget('800');
      setSpendLimitThreshold('95');
      setTotalSpendCap('15000');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className={`w-full max-w-2xl my-8 rounded-2xl overflow-hidden shadow-2xl border transition-all ${
        theme === 'dark'
          ? 'bg-[#0B0E14] border-[#D4AF37]/30 text-white'
          : 'bg-white border-amber-300 text-gray-900'
      }`}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-[#161C28] to-[#0B0E14] border-b border-[#D4AF37]/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F3E5AB] to-[#AA771C] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#080B10] rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-[#F3E5AB]" />
              </div>
            </div>
            <div>
              <h3 className="font-cinzel text-base font-bold text-white flex items-center space-x-2">
                <span>Connect Ad Account & Pixel Token</span>
              </h3>
              <p className="text-xs text-gray-400">
                Bind Graph API tokens, live pixel tracking, and automated spend limits
              </p>
            </div>
          </div>
          <button
            id="close-connect-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Row */}
        <div className="px-6 pt-4 flex items-center justify-between border-b border-gray-800 pb-3">
          <span className="text-xs text-gray-400 font-medium">Quick Template Presets:</span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fillDemoPreset('meta')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-900/40 text-blue-300 border border-blue-700/50 hover:bg-blue-800/60"
            >
              + Meta BM
            </button>
            <button
              type="button"
              onClick={() => fillDemoPreset('google')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-900/40 text-red-300 border border-red-700/50 hover:bg-red-800/60"
            >
              + Google Ads
            </button>
            <button
              type="button"
              onClick={() => fillDemoPreset('tiktok')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800/60"
            >
              + TikTok Ads
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Advertising Platform
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['meta', 'google', 'tiktok', 'snapchat'] as AdPlatform[]).map((plt) => (
                <button
                  type="button"
                  key={plt}
                  onClick={() => setPlatform(plt)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                    platform === plt
                      ? 'bg-[#D4AF37] text-black border-[#F3E5AB] shadow-md shadow-[#D4AF37]/20'
                      : 'bg-[#121722] text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {plt === 'meta' ? 'Meta BM' : plt === 'google' ? 'Google Ads' : plt === 'tiktok' ? 'TikTok' : 'Snapchat'}
                </button>
              ))}
            </div>
          </div>

          {/* Client & Account Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Client / Brand Entity Name *
              </label>
              <input
                id="connect-client-name"
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Royal Mirage Holdings"
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Ad Account Name *
              </label>
              <input
                id="connect-account-name"
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Meta BM - Scale Q3"
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* Account ID & Pixel ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Ad Account ID / Customer ID *
              </label>
              <input
                id="connect-account-id"
                type="text"
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. act_8928318239"
                className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Pixel / Dataset ID (Optional)
              </label>
              <input
                id="connect-pixel-id"
                type="text"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="e.g. 192847291048291"
                className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* Access Token with Handshake Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>System User Access Token / API Key</span>
              </label>
              <button
                type="button"
                id="btn-verify-token"
                onClick={handleTestToken}
                disabled={isVerifying}
                className="text-[11px] font-bold text-[#F3E5AB] bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-0.5 rounded hover:bg-[#D4AF37]/30 flex items-center space-x-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-[#D4AF37]" />
                    <span>Test API Handshake</span>
                  </>
                )}
              </button>
            </div>
            <input
              id="connect-access-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAK... or Bearer Token with ads_read, ads_management scope"
              className="w-full px-3 py-2.5 rounded-xl text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
            />
            {verificationResult && (
              <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-start space-x-2 border ${
                verificationResult.success
                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-600/40 text-red-300'
              }`}>
                {verificationResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <span>{verificationResult.message}</span>
              </div>
            )}
          </div>

          {/* Budget Limits & Automated Alert Thresholds */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-[#080B10] border border-[#D4AF37]/20">
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                Daily Budget Limit ($) *
              </label>
              <input
                id="connect-daily-budget"
                type="number"
                required
                min={1}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                Alert Threshold (%) *
              </label>
              <select
                id="connect-threshold"
                value={spendLimitThreshold}
                onChange={(e) => setSpendLimitThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="80">80% of Daily Budget</option>
                <option value="90">90% of Daily Budget</option>
                <option value="95">95% of Daily Budget</option>
                <option value="100">100% Hard Spending Cap</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                Total Account Cap ($)
              </label>
              <input
                id="connect-total-cap"
                type="number"
                value={totalSpendCap}
                onChange={(e) => setTotalSpendCap(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* Asset Assignment to Team Member */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Assign Asset Access to Team Member (RBAC)
            </label>
            <select
              id="connect-assigned-user"
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value="">All Administrators (Default)</option>
              {existingUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace('_', ' ')}) - {u.username}
                </option>
              ))}
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-connect-asset-btn"
              className="px-6 py-2.5 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Connect & Activate Sentinel</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
