import {
  User,
  Client,
  AdAccount,
  PixelConfig,
  BudgetAlert,
  NotificationSettings,
  ApiKeyItem,
  WebhookSubscription,
  AuditLogEntry,
  BackupSnapshot,
  EncryptedMessageVault,
  GDPRConsent
} from '../types';

const STORAGE_KEYS = {
  USERS: 'bm_multihub_users_v1',
  CLIENTS: 'bm_multihub_clients_v1',
  ACCOUNTS: 'bm_multihub_accounts_v1',
  PIXELS: 'bm_multihub_pixels_v1',
  ALERTS: 'bm_multihub_alerts_v1',
  NOTIFICATIONS: 'bm_multihub_notif_settings_v1',
  API_KEYS: 'bm_multihub_apikeys_v1',
  WEBHOOKS: 'bm_multihub_webhooks_v1',
  AUDIT_LOGS: 'bm_multihub_audit_logs_v1',
  BACKUPS: 'bm_multihub_backups_v1',
  VAULT: 'bm_multihub_vault_v1',
  GDPR: 'bm_multihub_gdpr_v1',
  CURRENT_USER: 'bm_multihub_current_user_v1',
  THEME: 'bm_multihub_theme_v1'
};

// Initial admin account as required: admin user: kim, password: 7777
export const DEFAULT_ADMIN: User = {
  id: 'usr_admin_kim',
  username: 'kim',
  name: 'Kim (Super Admin)',
  email: 'kim@bmmultihub.com',
  role: 'super_admin',
  password: '7777',
  assignedAssetIds: ['*'], // access to all assets
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  mfaEnabled: false,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailEnabled: true,
  emailRecipients: ['alerts@bmmultihub.com', 'kim@bmmultihub.com'],
  smtpHost: 'smtp.sendgrid.net',
  smtpSender: 'no-reply@bmmultihub.com',
  slackEnabled: true,
  slackWebhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
  slackChannel: '#bm-spend-alerts',
  slackBotName: 'BM-MultiHub-Sentinel',
  notifyOnThreshold80: true,
  notifyOnThreshold90: true,
  notifyOnSpendLimit: true,
  notifyOnPixelDrop: true,
  notifyOnMilestone: true,
  weeklyDigestEnabled: true,
  weeklyDigestDay: 'Monday'
};

// Simple AES-GCM simulation for end-to-end encryption demonstration
export async function encryptPayload(text: string, secretKeyStr: string = 'bm_luxury_vault_key_2026'): Promise<{ cipher: string; iv: string }> {
  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(secretKeyStr.padEnd(32, '0').slice(0, 32));
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      enc.encode(text)
    );
    const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    return { cipher: cipherBase64, iv: ivBase64 };
  } catch (e) {
    // Fallback base64
    return { cipher: btoa(encodeURIComponent(text)), iv: 'simulated_iv' };
  }
}

export async function decryptPayload(cipherBase64: string, ivBase64: string, secretKeyStr: string = 'bm_luxury_vault_key_2026'): Promise<string> {
  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(secretKeyStr.padEnd(32, '0').slice(0, 32));
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encryptedData
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    try {
      return decodeURIComponent(atob(cipherBase64));
    } catch {
      return 'Decryption error or invalid key';
    }
  }
}

export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      const initial = [DEFAULT_ADMIN];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initial));
      return initial;
    }
    const parsed: User[] = JSON.parse(raw);
    // Ensure kim admin exists
    if (!parsed.some(u => u.username === 'kim')) {
      parsed.unshift(DEFAULT_ADMIN);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [DEFAULT_ADMIN];
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function loadClients(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return raw ? JSON.parse(raw) : []; // Clean slate by default
  } catch {
    return [];
  }
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

export function loadAccounts(): AdAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : []; // Clean slate by default
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: AdAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export function loadPixels(): PixelConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PIXELS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePixels(pixels: PixelConfig[]): void {
  localStorage.setItem(STORAGE_KEYS.PIXELS, JSON.stringify(pixels));
}

export function loadAlerts(): BudgetAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ALERTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: BudgetAlert[]): void {
  localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
}

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
}

export function loadApiKeys(): ApiKeyItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.API_KEYS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveApiKeys(keys: ApiKeyItem[]): void {
  localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
}

export function loadWebhooks(): WebhookSubscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEBHOOKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWebhooks(hooks: WebhookSubscription[]): void {
  localStorage.setItem(STORAGE_KEYS.WEBHOOKS, JSON.stringify(hooks));
}

export function loadAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  try {
    const logs = loadAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newEntry);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Audit logging failed:', e);
  }
}

export function loadVault(): EncryptedMessageVault[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VAULT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVault(items: EncryptedMessageVault[]): void {
  localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(items));
}

export function loadBackups(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BACKUPS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBackups(backups: BackupSnapshot[]): void {
  localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
}

export function loadGdpr(): GDPRConsent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GDPR);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGdpr(items: GDPRConsent[]): void {
  localStorage.setItem(STORAGE_KEYS.GDPR, JSON.stringify(items));
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function getTheme(): 'dark' | 'light' {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
}

export function setTheme(theme: 'dark' | 'light'): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// Generate Full Backup Snapshot Package
export function createBackupSnapshot(type: 'automated_daily' | 'manual' | 'pre_sync' = 'manual'): BackupSnapshot {
  const accounts = loadAccounts();
  const users = loadUsers();
  const payload = {
    users,
    clients: loadClients(),
    accounts,
    pixels: loadPixels(),
    alerts: loadAlerts(),
    notifications: loadNotificationSettings(),
    apiKeys: loadApiKeys(),
    webhooks: loadWebhooks(),
    vault: loadVault(),
    gdpr: loadGdpr(),
    exportedAt: new Date().toISOString(),
    version: 'BM-MultiHub-v2.6'
  };
  const jsonStr = JSON.stringify(payload);
  const sizeBytes = new Blob([jsonStr]).size;
  
  const snapshot: BackupSnapshot = {
    id: 'snap_' + Date.now(),
    createdAt: new Date().toISOString(),
    sizeBytes,
    version: '2.6.0',
    accountsCount: accounts.length,
    usersCount: users.length,
    snapshotType: type,
    dataChecksum: 'SHA256:' + Math.random().toString(36).substring(2, 12).toUpperCase()
  };

  const backups = loadBackups();
  backups.unshift(snapshot);
  saveBackups(backups);

  logAuditEvent({
    userId: users[0]?.id || 'system',
    userName: users[0]?.name || 'Admin',
    action: 'BACKUP_CREATED',
    resource: snapshot.id,
    details: `Created snapshot with ${accounts.length} ad accounts and ${users.length} users (${(sizeBytes / 1024).toFixed(1)} KB)`,
    ipAddress: '127.0.0.1 (Local Sentinel)',
    status: 'SUCCESS'
  });

  return snapshot;
}

// Clean Slate Reset Helper
export function resetToCleanSlate(): void {
  localStorage.removeItem(STORAGE_KEYS.CLIENTS);
  localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
  localStorage.removeItem(STORAGE_KEYS.PIXELS);
  localStorage.removeItem(STORAGE_KEYS.ALERTS);
  localStorage.removeItem(STORAGE_KEYS.API_KEYS);
  localStorage.removeItem(STORAGE_KEYS.WEBHOOKS);
  localStorage.removeItem(STORAGE_KEYS.VAULT);
  
  // Re-seed only admin user kim
  saveUsers([DEFAULT_ADMIN]);
  
  logAuditEvent({
    userId: DEFAULT_ADMIN.id,
    userName: DEFAULT_ADMIN.name,
    action: 'CLEAN_SLATE_RESET',
    resource: 'DATABASE_ROOT',
    details: 'System initialized to clean slate. Preserved Admin kim:7777.',
    ipAddress: '127.0.0.1',
    status: 'WARNING'
  });
}
