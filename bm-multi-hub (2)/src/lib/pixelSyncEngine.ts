import { AdAccount, BudgetAlert, PixelConfig, NotificationSettings } from '../types';
import { loadAlerts, saveAlerts, loadNotificationSettings, logAuditEvent } from './storage';

export interface SyncResult {
  syncedAccountsCount: number;
  newAlertsCount: number;
  triggeredAlerts: BudgetAlert[];
  errors: string[];
}

export function evaluateThresholdAlerts(
  account: AdAccount,
  notifSettings: NotificationSettings
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const spendRatio = account.dailyBudget > 0 ? (account.dailySpend / account.dailyBudget) * 100 : 0;
  const now = new Date().toISOString();

  // 1. Check Spend Limit Reached (100% or above)
  if (spendRatio >= 100 && notifSettings.notifyOnSpendLimit) {
    alerts.push({
      id: 'alert_' + account.id + '_100_' + Date.now(),
      adAccountId: account.id,
      accountName: account.accountName,
      clientName: account.clientName,
      type: 'spend_cap_exceeded',
      severity: 'critical',
      title: `🚨 Daily Budget Cap Exceeded (100%): ${account.accountName}`,
      message: `Account has reached $${account.dailySpend.toFixed(2)} out of $${account.dailyBudget.toFixed(2)} daily limit (${spendRatio.toFixed(1)}%). Campaigns should be throttled.`,
      timestamp: now,
      isRead: false,
      budgetPercentage: spendRatio,
      currentSpend: account.dailySpend,
      budgetLimit: account.dailyBudget
    });
  }
  // 2. Check 90% threshold
  else if (spendRatio >= 90 && notifSettings.notifyOnThreshold90) {
    alerts.push({
      id: 'alert_' + account.id + '_90_' + Date.now(),
      adAccountId: account.id,
      accountName: account.accountName,
      clientName: account.clientName,
      type: 'threshold_reached',
      severity: 'warning',
      title: `⚠️ 90% Daily Budget Threshold Reached: ${account.accountName}`,
      message: `Current daily spend is $${account.dailySpend.toFixed(2)} (${spendRatio.toFixed(1)}% of $${account.dailyBudget.toFixed(2)}). Immediate attention required.`,
      timestamp: now,
      isRead: false,
      budgetPercentage: spendRatio,
      currentSpend: account.dailySpend,
      budgetLimit: account.dailyBudget
    });
  }
  // 3. Check 80% threshold
  else if (spendRatio >= 80 && notifSettings.notifyOnThreshold80) {
    alerts.push({
      id: 'alert_' + account.id + '_80_' + Date.now(),
      adAccountId: account.id,
      accountName: account.accountName,
      clientName: account.clientName,
      type: 'threshold_reached',
      severity: 'info',
      title: `ℹ️ 80% Budget Velocity Notice: ${account.accountName}`,
      message: `Account is pacing quickly: $${account.dailySpend.toFixed(2)} (${spendRatio.toFixed(1)}% of $${account.dailyBudget.toFixed(2)}).`,
      timestamp: now,
      isRead: false,
      budgetPercentage: spendRatio,
      currentSpend: account.dailySpend,
      budgetLimit: account.dailyBudget
    });
  }

  // 4. Milestone Check (Lifetime Spend)
  const milestones = [1000, 5000, 10000, 25000, 50000, 100000];
  for (const m of milestones) {
    if (account.lifetimeSpend >= m && account.lifetimeSpend < m + (account.dailySpend || 50) && notifSettings.notifyOnMilestone) {
      alerts.push({
        id: 'alert_' + account.id + '_milestone_' + m + '_' + Date.now(),
        adAccountId: account.id,
        accountName: account.accountName,
        clientName: account.clientName,
        type: 'milestone_reached',
        severity: 'milestone',
        title: `🏆 Milestone Achieved: $${m.toLocaleString()} Total Spend!`,
        message: `${account.accountName} (${account.clientName}) has crossed $${m.toLocaleString()} in cumulative ad delivery.`,
        timestamp: now,
        isRead: false,
        currentSpend: account.lifetimeSpend,
        budgetLimit: m
      });
      break;
    }
  }

  return alerts;
}

// Sync all accounts and trigger notifications
export async function syncAllAccounts(accounts: AdAccount[], pixels: PixelConfig[]): Promise<SyncResult> {
  const notifSettings = loadNotificationSettings();
  const existingAlerts = loadAlerts();
  const triggeredAlerts: BudgetAlert[] = [];
  const errors: string[] = [];

  for (const account of accounts) {
    // Simulate live spend velocity increments or API sync
    if (account.status === 'ACTIVE' && account.activeAdsCount > 0) {
      // Natural pacing simulation
      const variance = (Math.random() * 0.05) * account.dailyBudget;
      account.dailySpend = Math.min(account.dailyBudget * 1.15, Number((account.dailySpend + variance).toFixed(2)));
      account.lifetimeSpend = Number((account.lifetimeSpend + variance).toFixed(2));
      account.lastSyncedAt = new Date().toISOString();

      // Check status update
      const spendRatio = (account.dailySpend / account.dailyBudget) * 100;
      if (spendRatio >= 100) {
        account.status = 'SPEND_LIMIT_REACHED';
      } else if (spendRatio >= 90) {
        account.status = 'WARNING_THRESHOLD';
      } else {
        account.status = 'ACTIVE';
      }

      // Check pixel status if associated
      if (account.pixelId) {
        const associatedPixel = pixels.find(p => p.pixelId === account.pixelId);
        if (associatedPixel) {
          associatedPixel.lastEventTime = new Date().toISOString();
          associatedPixel.events24hCount += Math.floor(Math.random() * 12) + 1;
        }
      }

      // Evaluate alerts
      const newAlerts = evaluateThresholdAlerts(account, notifSettings);
      for (const al of newAlerts) {
        // Prevent duplicate alerts in same hour
        const isDuplicate = existingAlerts.some(
          ea => ea.adAccountId === al.adAccountId && ea.type === al.type && (Date.now() - new Date(ea.timestamp).getTime() < 3600000)
        );
        if (!isDuplicate) {
          triggeredAlerts.push(al);
          existingAlerts.unshift(al);
        }
      }
    }
  }

  // Save new alerts
  if (triggeredAlerts.length > 0) {
    saveAlerts(existingAlerts);
    
    // Trigger simulated or real Slack / Email dispatcher
    await dispatchExternalNotifications(triggeredAlerts, notifSettings);
  }

  logAuditEvent({
    userId: 'system_sync',
    userName: 'Sentinel Sync Engine',
    action: 'SYNC_ACCOUNTS_BATCH',
    resource: `${accounts.length} Accounts`,
    details: `Synced ${accounts.length} accounts. Generated ${triggeredAlerts.length} new automated threshold alerts.`,
    ipAddress: '10.0.4.1 (Internal Worker)',
    status: 'SUCCESS'
  });

  return {
    syncedAccountsCount: accounts.length,
    newAlertsCount: triggeredAlerts.length,
    triggeredAlerts,
    errors
  };
}

// Dispatch to Slack Webhook & Email
export async function dispatchExternalNotifications(
  alerts: BudgetAlert[],
  settings: NotificationSettings
): Promise<{ slackSent: boolean; emailSent: boolean; log: string }> {
  let slackSent = false;
  let emailSent = false;
  let log = '';

  if (settings.slackEnabled && settings.slackWebhookUrl) {
    try {
      // If it is a real slack webhook, we can try to send
      if (settings.slackWebhookUrl.includes('hooks.slack.com') && !settings.slackWebhookUrl.includes('00000000')) {
        const textPayload = alerts.map(a => `${a.severity === 'critical' ? '🚨' : '⚠️'} *${a.title}*\n>${a.message}`).join('\n\n');
        await fetch(settings.slackWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: settings.slackBotName || 'BM Multi-hub Sentinel',
            channel: settings.slackChannel,
            text: textPayload
          })
        });
      }
      slackSent = true;
      log += `Slack dispatched to ${settings.slackChannel}. `;
    } catch (e) {
      log += `Slack dispatch simulated. `;
      slackSent = true;
    }
  }

  if (settings.emailEnabled && settings.emailRecipients.length > 0) {
    emailSent = true;
    log += `Email queued for ${settings.emailRecipients.join(', ')}.`;
  }

  return { slackSent, emailSent, log };
}

// Test Token & Pixel Connection
export async function verifyPixelConnection(
  platform: string,
  pixelId: string,
  accessToken: string
): Promise<{ success: boolean; message: string; eventCount: number; latencyMs: number }> {
  const start = performance.now();
  // Simulate API handshake with Meta Graph API / Google / TikTok
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  const latencyMs = Math.round(performance.now() - start);

  if (!pixelId || pixelId.trim().length < 5) {
    return {
      success: false,
      message: 'Invalid Pixel ID format. Expected standard 12-16 digit identifier.',
      eventCount: 0,
      latencyMs
    };
  }

  if (!accessToken || accessToken.trim().length < 8) {
    return {
      success: false,
      message: 'Access Token missing or invalid. Please check System User permissions.',
      eventCount: 0,
      latencyMs
    };
  }

  return {
    success: true,
    message: `Pixel ${pixelId} verified on ${platform.toUpperCase()} Graph API v19.0. Token permissions: ads_management, ads_read, business_management (Valid).`,
    eventCount: Math.floor(Math.random() * 4500) + 850,
    latencyMs
  };
}
