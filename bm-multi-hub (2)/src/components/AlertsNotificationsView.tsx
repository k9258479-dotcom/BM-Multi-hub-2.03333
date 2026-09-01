import React, { useState } from 'react';
import { 
  BellRing, 
  Slack, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Settings2, 
  Trash2, 
  ShieldAlert, 
  Radio, 
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { BudgetAlert, NotificationSettings } from '../types';
import { dispatchExternalNotifications } from '../lib/pixelSyncEngine';
import { logAuditEvent } from '../lib/storage';

interface AlertsNotificationsViewProps {
  alerts: BudgetAlert[];
  settings: NotificationSettings;
  theme: 'dark' | 'light';
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onClearAllAlerts: () => void;
}

export const AlertsNotificationsView: React.FC<AlertsNotificationsViewProps> = ({
  alerts,
  settings,
  theme,
  onUpdateSettings,
  onAcknowledgeAlert,
  onClearAllAlerts
}) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
  const [newEmail, setNewEmail] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [alertFilter, setAlertFilter] = useState<string>('ALL');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
    logAuditEvent({
      userId: 'admin',
      userName: 'Admin User',
      action: 'UPDATE_NOTIFICATION_CHANNELS',
      resource: 'SLACK_EMAIL_CONFIG',
      details: `Updated Slack (${localSettings.slackEnabled ? 'ON' : 'OFF'}) & Email (${localSettings.emailEnabled ? 'ON' : 'OFF'}) triggers`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
    setTestResult('Notification routing settings saved successfully.');
  };

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) return;
    if (!localSettings.emailRecipients.includes(newEmail)) {
      setLocalSettings(prev => ({
        ...prev,
        emailRecipients: [...prev.emailRecipients, newEmail]
      }));
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setLocalSettings(prev => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter(e => e !== emailToRemove)
    }));
  };

  const handleTestSlack = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    const testAlert: BudgetAlert = {
      id: 'test_alert_' + Date.now(),
      adAccountId: 'act_demo_sentinel',
      accountName: 'Meta BM - Global Flagship',
      clientName: 'Emirates Luxury Retail',
      type: 'threshold_reached',
      severity: 'critical',
      title: '🚨 Sentinel Test Alert: 90% Daily Budget Threshold Reached',
      message: 'This is a live test notification from BM Multi-hub Sentinel verifying Slack & Email webhook routing.',
      timestamp: new Date().toISOString(),
      isRead: false,
      currentSpend: 450,
      budgetLimit: 500
    };

    const res = await dispatchExternalNotifications([testAlert], localSettings);
    setTestResult(`Test dispatched! ${res.log}`);
    setIsSendingTest(false);

    logAuditEvent({
      userId: 'admin',
      userName: 'Admin User',
      action: 'DISPATCH_TEST_ALERT',
      resource: 'SLACK_EMAIL',
      details: `Dispatched test alert to Slack webhook and ${localSettings.emailRecipients.length} email recipients.`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS'
    });
  };

  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === 'ALL') return true;
    if (alertFilter === 'UNREAD') return !a.isRead;
    return a.severity === alertFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-xl font-extrabold gold-text-gradient">
            AUTOMATED BUDGET THRESHOLDS & WEBHOOKS
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure automated budget threshold triggers (80%, 90%, 100%) and instant Slack/Email dispatching.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onClearAllAlerts}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-950/30 text-red-400 border border-red-800/40 hover:bg-red-900/40"
          >
            Clear All Alerts
          </button>
          <button
            onClick={handleTestSlack}
            disabled={isSendingTest}
            className="px-4 py-2 rounded-xl gold-btn text-xs font-bold flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingTest ? 'Testing...' : 'Send Test Alert'}</span>
          </button>
        </div>
      </div>

      {testResult && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Settings Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Slack Webhook Card */}
        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' ? 'dream-card' : 'dream-card-light'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#4A154B] flex items-center justify-center text-white">
                <Slack className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Slack Webhook Sentinel</h3>
                <p className="text-[11px] text-gray-400">Post instant spending limit alerts to channel</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.slackEnabled}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, slackEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]"></div>
            </label>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-[11px] font-sans font-semibold text-gray-300 mb-1">
                Slack Incoming Webhook URL
              </label>
              <input
                type="text"
                value={localSettings.slackWebhookUrl}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, slackWebhookUrl: e.target.value }))}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2 rounded-xl bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-sans font-semibold text-gray-300 mb-1">
                  Slack Channel
                </label>
                <input
                  type="text"
                  value={localSettings.slackChannel}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, slackChannel: e.target.value }))}
                  placeholder="#bm-spend-alerts"
                  className="w-full px-3 py-2 rounded-xl bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans font-semibold text-gray-300 mb-1">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={localSettings.slackBotName}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, slackBotName: e.target.value }))}
                  placeholder="Sentinel-Bot"
                  className="w-full px-3 py-2 rounded-xl bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Email Notifications Card */}
        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' ? 'dream-card' : 'dream-card-light'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-900/60 border border-blue-500/40 flex items-center justify-center text-blue-300">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Email Dispatcher</h3>
                <p className="text-[11px] text-gray-400">Weekly digests and critical milestone alerts</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.emailEnabled}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]"></div>
            </label>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-[11px] font-sans font-semibold text-gray-300 mb-1">
                Recipient Email Addresses
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@agency.com"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#121722] border border-gray-700 text-white focus:border-[#D4AF37] focus:outline-none text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-3 py-2 rounded-xl bg-[#D4AF37] text-black font-bold text-xs hover:bg-[#F3E5AB]"
                >
                  + Add
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {localSettings.emailRecipients.map((em) => (
                  <span key={em} className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#121722] border border-gray-700 text-gray-300 text-[11px]">
                    <span>{em}</span>
                    <button onClick={() => handleRemoveEmail(em)} className="text-gray-500 hover:text-red-400">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Threshold Rules Selector Box */}
      <div className={`p-6 rounded-2xl border ${
        theme === 'dark' ? 'dream-card' : 'dream-card-light'
      }`}>
        <h3 className="font-cinzel text-sm font-bold text-white mb-4 flex items-center space-x-2">
          <Settings2 className="w-4 h-4 text-[#D4AF37]" />
          <span>Automated Alert Rules & Triggers</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#080B10] border border-gray-800 cursor-pointer hover:border-[#D4AF37]/40">
            <input
              type="checkbox"
              checked={localSettings.notifyOnThreshold80}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, notifyOnThreshold80: e.target.checked }))}
              className="mt-1 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <div>
              <div className="text-xs font-bold text-white">80% Velocity Notice</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Trigger when daily spend reaches 80% pacing</p>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#080B10] border border-gray-800 cursor-pointer hover:border-[#D4AF37]/40">
            <input
              type="checkbox"
              checked={localSettings.notifyOnThreshold90}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, notifyOnThreshold90: e.target.checked }))}
              className="mt-1 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <div>
              <div className="text-xs font-bold text-amber-300">90% Warning Threshold</div>
              <p className="text-[10px] text-gray-400 mt-0.5">High priority warning before budget exhaustion</p>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#080B10] border border-gray-800 cursor-pointer hover:border-[#D4AF37]/40">
            <input
              type="checkbox"
              checked={localSettings.notifyOnSpendLimit}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, notifyOnSpendLimit: e.target.checked }))}
              className="mt-1 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <div>
              <div className="text-xs font-bold text-red-400">100% Hard Cap Alert</div>
              <p className="text-[10px] text-gray-400 mt-0.5">Critical alert to pause or scale budget limits</p>
            </div>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-6 py-2 rounded-xl gold-btn text-xs font-bold uppercase tracking-wider"
          >
            Save Notification Triggers
          </button>
        </div>
      </div>

      {/* Live System Alerts Feed */}
      <div className={`p-6 rounded-2xl border ${
        theme === 'dark' ? 'dream-card' : 'dream-card-light'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-cinzel text-base font-bold text-white flex items-center space-x-2">
            <BellRing className="w-4 h-4 text-[#D4AF37]" />
            <span>Triggered Alert Audit History ({alerts.length})</span>
          </h3>

          <div className="flex items-center space-x-2">
            {['ALL', 'UNREAD', 'critical', 'warning', 'milestone'].map((f) => (
              <button
                key={f}
                onClick={() => setAlertFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase font-mono border ${
                  alertFilter === f
                    ? 'bg-[#D4AF37] text-black border-[#F3E5AB]'
                    : 'bg-[#121722] text-gray-400 border-gray-800 hover:border-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 font-mono">
            No alerts matching current filter. Sentinel is pacing normally.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-red-950/25 border-red-600/40 text-red-200'
                    : alert.severity === 'warning'
                      ? 'bg-amber-950/25 border-amber-600/40 text-amber-200'
                      : alert.severity === 'milestone'
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#F3E5AB]'
                        : 'bg-[#121722] border-gray-800 text-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                    alert.severity === 'warning' ? 'bg-amber-400' :
                    'bg-[#D4AF37]'
                  }`} />
                  <div>
                    <div className="font-bold text-xs text-white">{alert.title}</div>
                    <div className="text-[11px] text-gray-300 mt-0.5">{alert.message}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">
                      Account: {alert.accountName} ({alert.clientName}) • {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-auto">
                  {!alert.isRead && (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="px-3 py-1 text-[10px] font-bold rounded-lg bg-[#D4AF37] text-black hover:bg-[#F3E5AB]"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
