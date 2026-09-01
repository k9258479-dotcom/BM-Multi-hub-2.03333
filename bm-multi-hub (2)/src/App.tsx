import React, { useState, useEffect } from 'react';
import { 
  User, 
  AdAccount, 
  PixelConfig, 
  Client, 
  BudgetAlert, 
  NotificationSettings, 
  ApiKeyItem, 
  WebhookSubscription 
} from './types';
import { 
  loadUsers, 
  saveUsers, 
  loadClients, 
  saveClients, 
  loadAccounts, 
  saveAccounts, 
  loadPixels, 
  savePixels, 
  loadAlerts, 
  saveAlerts, 
  loadNotificationSettings, 
  saveNotificationSettings, 
  loadApiKeys, 
  saveApiKeys, 
  loadWebhooks, 
  saveWebhooks, 
  getCurrentUser, 
  setCurrentUser, 
  getTheme, 
  setTheme as saveTheme,
  DEFAULT_ADMIN,
  logAuditEvent
} from './lib/storage';
import {
  subscribeUsers,
  subscribeClients,
  subscribeAdAccounts,
  subscribePixels,
  subscribeAlerts,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveAccountToFirestore,
  deleteAccountFromFirestore,
  savePixelToFirestore,
  deletePixelFromFirestore,
  saveClientToFirestore,
  deleteClientFromFirestore,
  saveAlertToFirestore,
  deleteAlertFromFirestore
} from './lib/firestoreService';
import { testFirestoreConnection } from './lib/firebase';
import { syncAllAccounts } from './lib/pixelSyncEngine';

import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { ConnectAssetModal } from './components/ConnectAssetModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

import { DashboardView } from './components/DashboardView';
import { AdAccountsView } from './components/AdAccountsView';
import { PixelMonitorView } from './components/PixelMonitorView';
import { TeamRBACView } from './components/TeamRBACView';
import { AlertsNotificationsView } from './components/AlertsNotificationsView';
import { ReportsView } from './components/ReportsView';
import { RestApiView } from './components/RestApiView';
import { SecurityGdprBackupView } from './components/SecurityGdprBackupView';

export default function App() {
  // Global State
  const [currentUser, setUser] = useState<User | null>(getCurrentUser() || DEFAULT_ADMIN);
  const [theme, setThemeState] = useState<'dark' | 'light'>(getTheme());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Core Data
  const [users, setUsers] = useState<User[]>(loadUsers());
  const [clients, setClients] = useState<Client[]>(loadClients());
  const [accounts, setAccounts] = useState<AdAccount[]>(loadAccounts());
  const [pixels, setPixels] = useState<PixelConfig[]>(loadPixels());
  const [alerts, setAlerts] = useState<BudgetAlert[]>(loadAlerts());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(loadNotificationSettings());
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(loadApiKeys());
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>(loadWebhooks());
  const [firebaseStatus, setFirebaseStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');

  // UI Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Firestore Realtime Subscriptions & Connection Test
  useEffect(() => {
    let isMounted = true;
    testFirestoreConnection().then((connected) => {
      if (isMounted) {
        setFirebaseStatus(connected ? 'connected' : 'offline');
      }
    });

    const unsubUsers = subscribeUsers((firestoreUsers) => {
      if (firestoreUsers && firestoreUsers.length > 0) {
        setUsers(firestoreUsers);
        saveUsers(firestoreUsers);
      }
    });

    const unsubClients = subscribeClients((firestoreClients) => {
      if (firestoreClients) {
        setClients(firestoreClients);
        saveClients(firestoreClients);
      }
    });

    const unsubAccounts = subscribeAdAccounts((firestoreAccounts) => {
      if (firestoreAccounts) {
        setAccounts(firestoreAccounts);
        saveAccounts(firestoreAccounts);
      }
    });

    const unsubPixels = subscribePixels((firestorePixels) => {
      if (firestorePixels) {
        setPixels(firestorePixels);
        savePixels(firestorePixels);
      }
    });

    const unsubAlerts = subscribeAlerts((firestoreAlerts) => {
      if (firestoreAlerts) {
        setAlerts(firestoreAlerts);
        saveAlerts(firestoreAlerts);
      }
    });

    return () => {
      isMounted = false;
      unsubUsers();
      unsubClients();
      unsubAccounts();
      unsubPixels();
      unsubAlerts();
    };
  }, []);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = theme === 'dark' 
      ? 'bg-[#0A0A0A] text-[#F0F0F0] antialiased selection:bg-[#D4AF37] selection:text-black min-h-screen'
      : 'bg-[#F8F9FC] text-gray-800 antialiased selection:bg-[#D4AF37] selection:text-black min-h-screen';
  }, [theme]);

  // Global Cmd+K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Automated Background Sync Engine (Evaluates spend velocity & budget thresholds every 45 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (accounts.length > 0) {
        const result = await syncAllAccounts(accounts, pixels);
        if (result.syncedAccountsCount > 0) {
          setAccounts([...accounts]);
          saveAccounts(accounts);
          accounts.forEach(acc => saveAccountToFirestore(acc).catch(() => {}));
          if (result.newAlertsCount > 0) {
            const currentAlerts = loadAlerts();
            setAlerts(currentAlerts);
            currentAlerts.forEach(al => saveAlertToFirestore(al).catch(() => {}));
          }
        }
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [accounts, pixels]);

  // Handler: Manual Sync Now
  const handleSyncNow = async () => {
    setIsSyncing(true);
    const result = await syncAllAccounts(accounts, pixels);
    setAccounts([...accounts]);
    saveAccounts(accounts);
    accounts.forEach(acc => saveAccountToFirestore(acc).catch(() => {}));
    
    const freshAlerts = loadAlerts();
    setAlerts(freshAlerts);
    freshAlerts.forEach(al => saveAlertToFirestore(al).catch(() => {}));

    setPixels([...pixels]);
    savePixels(pixels);
    pixels.forEach(px => savePixelToFirestore(px).catch(() => {}));

    setIsSyncing(false);
  };

  // Handler: Toggle Theme
  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    saveTheme(next);
  };

  // Handler: User Login & Logout
  const handleLoginSuccess = (user: User) => {
    setUser(user);
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Handler: Connect New Asset & Pixel
  const handleSaveNewAccount = (newAccount: AdAccount, newPixel?: PixelConfig, newClient?: Client) => {
    const updatedAccounts = [newAccount, ...accounts];
    setAccounts(updatedAccounts);
    saveAccounts(updatedAccounts);
    saveAccountToFirestore(newAccount).catch(() => {});

    if (newPixel) {
      const updatedPixels = [newPixel, ...pixels];
      setPixels(updatedPixels);
      savePixels(updatedPixels);
      savePixelToFirestore(newPixel).catch(() => {});
    }

    if (newClient && !clients.some(c => c.id === newClient.id)) {
      const updatedClients = [newClient, ...clients];
      setClients(updatedClients);
      saveClients(updatedClients);
      saveClientToFirestore(newClient).catch(() => {});
    }
  };

  // Handler: Update Account
  const handleUpdateAccount = (updated: AdAccount) => {
    const updatedList = accounts.map(a => a.id === updated.id ? updated : a);
    setAccounts(updatedList);
    saveAccounts(updatedList);
    saveAccountToFirestore(updated).catch(() => {});
  };

  // Handler: Delete Account
  const handleDeleteAccount = (accountId: string) => {
    const updated = accounts.filter(a => a.id !== accountId);
    setAccounts(updated);
    saveAccounts(updated);
    deleteAccountFromFirestore(accountId).catch(() => {});
  };

  // Handler: Users CRUD
  const handleCreateUser = (newUser: User) => {
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    saveUserToFirestore(newUser).catch(() => {});
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    saveUsers(updated);
    saveUserToFirestore(updatedUser).catch(() => {});
    if (currentUser?.id === updatedUser.id) {
      setUser(updatedUser);
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);
    deleteUserFromFirestore(userId).catch(() => {});
  };

  // Handler: Alerts
  const handleAcknowledgeAlert = (alertId: string) => {
    const alertToUpdate = alerts.find(a => a.id === alertId);
    const updated = alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a);
    setAlerts(updated);
    saveAlerts(updated);
    if (alertToUpdate) {
      saveAlertToFirestore({ ...alertToUpdate, isRead: true }).catch(() => {});
    }
  };

  const handleClearAllAlerts = () => {
    alerts.forEach(al => deleteAlertFromFirestore(al.id).catch(() => {}));
    setAlerts([]);
    saveAlerts([]);
  };

  // Handler: Notification Settings
  const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
    setNotifSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  // Handler: API Keys & Webhooks
  const handleCreateApiKey = (newKey: ApiKeyItem) => {
    const updated = [newKey, ...apiKeys];
    setApiKeys(updated);
    saveApiKeys(updated);
  };

  const handleRevokeApiKey = (keyId: string) => {
    const updated = apiKeys.filter(k => k.id !== keyId);
    setApiKeys(updated);
    saveApiKeys(updated);
  };

  const handleCreateWebhook = (newWebhook: WebhookSubscription) => {
    const updated = [newWebhook, ...webhooks];
    setWebhooks(updated);
    saveWebhooks(updated);
  };

  const handleDeleteWebhook = (webhookId: string) => {
    const updated = webhooks.filter(w => w.id !== webhookId);
    setWebhooks(updated);
    saveWebhooks(updated);
  };

  // Refresh entire app state after backup restore / clean slate
  const handleRefreshAppState = () => {
    setAccounts(loadAccounts());
    setClients(loadClients());
    setPixels(loadPixels());
    setUsers(loadUsers());
    setAlerts(loadAlerts());
    setApiKeys(loadApiKeys());
    setWebhooks(loadWebhooks());
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        theme={theme}
        alerts={alerts}
        isSyncing={isSyncing}
        onSyncNow={handleSyncNow}
        onToggleTheme={handleToggleTheme}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenAlerts={() => setActiveTab('alerts')}
        onLogout={handleLogout}
        onOpenMfaModal={() => setActiveTab('security')}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={currentUser?.role}
          theme={theme}
          alertCount={alerts.filter(a => !a.isRead).length}
          accountsCount={accounts.length}
        />

        {/* Dynamic Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              accounts={accounts}
              pixels={pixels}
              alerts={alerts}
              clients={clients}
              theme={theme}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
              onSelectAccount={(accId) => {
                setActiveTab('accounts');
              }}
              onNavigateTab={setActiveTab}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          )}

          {activeTab === 'accounts' && (
            <AdAccountsView
              accounts={accounts}
              clients={clients}
              users={users}
              theme={theme}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
              onUpdateAccount={handleUpdateAccount}
              onDeleteAccount={handleDeleteAccount}
            />
          )}

          {activeTab === 'pixels' && (
            <PixelMonitorView
              pixels={pixels}
              accounts={accounts}
              theme={theme}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
            />
          )}

          {activeTab === 'team' && (
            <TeamRBACView
              users={users}
              accounts={accounts}
              clients={clients}
              currentUser={currentUser}
              theme={theme}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsNotificationsView
              alerts={alerts}
              settings={notifSettings}
              theme={theme}
              onUpdateSettings={handleUpdateNotificationSettings}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onClearAllAlerts={handleClearAllAlerts}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              accounts={accounts}
              clients={clients}
              theme={theme}
            />
          )}

          {activeTab === 'api' && (
            <RestApiView
              apiKeys={apiKeys}
              webhooks={webhooks}
              accounts={accounts}
              pixels={pixels}
              theme={theme}
              onCreateApiKey={handleCreateApiKey}
              onRevokeApiKey={handleRevokeApiKey}
              onCreateWebhook={handleCreateWebhook}
              onDeleteWebhook={handleDeleteWebhook}
            />
          )}

          {activeTab === 'security' && (
            <SecurityGdprBackupView
              currentUser={currentUser}
              theme={theme}
              onUpdateCurrentUser={handleUpdateUser}
              onRefreshAppState={handleRefreshAppState}
            />
          )}

        </main>
      </div>

      {/* Auth Modal (if logged out or explicitly invoked) */}
      <AuthModal
        isOpen={isAuthModalOpen || !currentUser}
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
      />

      {/* Connect Asset Modal */}
      <ConnectAssetModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSaveAccount={handleSaveNewAccount}
        existingClients={clients}
        existingUsers={users}
        theme={theme}
      />

      {/* Global Search (Cmd+K) Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        accounts={accounts}
        pixels={pixels}
        users={users}
        alerts={alerts}
        onNavigate={(tab) => setActiveTab(tab)}
        theme={theme}
      />

    </div>
  );
}
