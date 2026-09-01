export type UserRole = 'super_admin' | 'media_buyer' | 'account_manager' | 'client_viewer';

export type AdPlatform = 'meta' | 'google' | 'tiktok' | 'snapchat';

export type AccountStatus = 'ACTIVE' | 'PAUSED' | 'SPEND_LIMIT_REACHED' | 'WARNING_THRESHOLD' | 'DISABLED';

export type PixelStatus = 'healthy' | 'warning' | 'error' | 'syncing';

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'milestone';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // stored for demo auth
  assignedAssetIds: string[]; // ad account or client IDs
  createdAt: string;
  lastLogin?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  avatarUrl?: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  contactEmail: string;
  assignedManagerId?: string;
  monthlyBudgetCap: number;
  currency: string;
  createdAt: string;
  tags: string[];
}

export interface PixelConfig {
  id: string;
  adAccountId: string;
  clientId: string;
  pixelId: string;
  pixelName: string;
  platform: AdPlatform;
  accessToken: string; // encrypted or masked
  tokenExpiryDays: number;
  status: PixelStatus;
  lastEventTime: string;
  events24hCount: number;
  verifiedAt: string;
  lastError?: string;
}

export interface Campaign {
  id: string;
  adAccountId: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  dailyBudget: number;
  dailySpend: number;
  lifetimeSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  cpm: number;
  ctr: number;
}

export interface AdAccount {
  id: string;
  clientId: string;
  clientName: string;
  accountName: string;
  platform: AdPlatform;
  accountId: string; // e.g. act_8928318239
  pixelId?: string;
  accessToken?: string;
  currency: string;
  status: AccountStatus;
  dailyBudget: number;
  dailySpend: number;
  spendLimitThreshold: number; // percentage (e.g. 80%, 90%, 100%)
  totalSpendCap?: number;
  lifetimeSpend: number;
  activeAdsCount: number;
  roas: number;
  lastSyncedAt: string;
  campaigns: Campaign[];
  assignedUserIds: string[];
  notes?: string;
  isEncrypted?: boolean;
}

export interface BudgetAlert {
  id: string;
  adAccountId: string;
  accountName: string;
  clientName: string;
  type: 'threshold_reached' | 'spend_cap_exceeded' | 'pixel_error' | 'milestone_reached' | 'unusual_velocity';
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  acknowledgedBy?: string;
  budgetPercentage?: number;
  currentSpend: number;
  budgetLimit: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  emailRecipients: string[];
  smtpHost?: string;
  smtpSender?: string;
  slackEnabled: boolean;
  slackWebhookUrl: string;
  slackChannel: string;
  slackBotName: string;
  notifyOnThreshold80: boolean;
  notifyOnThreshold90: boolean;
  notifyOnSpendLimit: boolean;
  notifyOnPixelDrop: boolean;
  notifyOnMilestone: boolean;
  weeklyDigestEnabled: boolean;
  weeklyDigestDay: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  fullKey?: string;
  createdAt: string;
  lastUsedAt?: string;
  scopes: string[];
  status: 'active' | 'revoked';
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'paused';
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface EncryptedMessageVault {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  encryptedPayload: string;
  iv: string;
  createdAt: string;
  createdBy: string;
  isDecrypted?: boolean;
}

export interface BackupSnapshot {
  id: string;
  createdAt: string;
  sizeBytes: number;
  version: string;
  accountsCount: number;
  usersCount: number;
  snapshotType: 'automated_daily' | 'manual' | 'pre_sync';
  dataChecksum: string;
}

export interface GDPRConsent {
  id: string;
  userId: string;
  userEmail: string;
  consentType: 'data_processing' | 'cookie_analytics' | 'third_party_sync' | 'marketing_alerts';
  accepted: boolean;
  timestamp: string;
  ipAddress: string;
}
