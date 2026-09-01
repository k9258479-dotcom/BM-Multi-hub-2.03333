import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  User,
  Client,
  AdAccount,
  PixelConfig,
  BudgetAlert,
  AuditLogEntry
} from '../types';
import { DEFAULT_ADMIN } from './storage';

// Real-time synchronization listeners

export function subscribeUsers(onUpdate: (users: User[]) => void): Unsubscribe {
  const collectionRef = collection(db, 'users');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Initialize default admin kim into Firestore
        setDoc(doc(db, 'users', DEFAULT_ADMIN.id), DEFAULT_ADMIN).catch((err) => {
          console.warn('Initial admin seed failed:', err);
        });
        onUpdate([DEFAULT_ADMIN]);
      } else {
        const usersList: User[] = [];
        snapshot.forEach((docSnap) => {
          usersList.push(docSnap.data() as User);
        });
        onUpdate(usersList);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    }
  );
}

export function subscribeClients(onUpdate: (clients: Client[]) => void): Unsubscribe {
  const collectionRef = collection(db, 'clients');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items: Client[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Client);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
    }
  );
}

export function subscribeAdAccounts(onUpdate: (accounts: AdAccount[]) => void): Unsubscribe {
  const collectionRef = collection(db, 'adAccounts');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items: AdAccount[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AdAccount);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'adAccounts');
    }
  );
}

export function subscribePixels(onUpdate: (pixels: PixelConfig[]) => void): Unsubscribe {
  const collectionRef = collection(db, 'pixels');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items: PixelConfig[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as PixelConfig);
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'pixels');
    }
  );
}

export function subscribeAlerts(onUpdate: (alerts: BudgetAlert[]) => void): Unsubscribe {
  const collectionRef = collection(db, 'alerts');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items: BudgetAlert[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as BudgetAlert);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'alerts');
    }
  );
}

export function subscribeAuditLogs(onUpdate: (logs: AuditLogEntry[]) => void): Unsubscribe {
  const collectionRef = collection(db, 'auditLogs');
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const items: AuditLogEntry[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as AuditLogEntry);
      });
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'auditLogs');
    }
  );
}

// User CRUD operations
export async function saveUserToFirestore(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Ad Account CRUD operations
export async function saveAccountToFirestore(account: AdAccount): Promise<void> {
  const path = `adAccounts/${account.id}`;
  try {
    await setDoc(doc(db, 'adAccounts', account.id), account);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAccountFromFirestore(accountId: string): Promise<void> {
  const path = `adAccounts/${accountId}`;
  try {
    await deleteDoc(doc(db, 'adAccounts', accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Pixel CRUD operations
export async function savePixelToFirestore(pixel: PixelConfig): Promise<void> {
  const path = `pixels/${pixel.id}`;
  try {
    await setDoc(doc(db, 'pixels', pixel.id), pixel);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePixelFromFirestore(pixelId: string): Promise<void> {
  const path = `pixels/${pixelId}`;
  try {
    await deleteDoc(doc(db, 'pixels', pixelId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Client CRUD operations
export async function saveClientToFirestore(client: Client): Promise<void> {
  const path = `clients/${client.id}`;
  try {
    await setDoc(doc(db, 'clients', client.id), client);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClientFromFirestore(clientId: string): Promise<void> {
  const path = `clients/${clientId}`;
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Budget Alert CRUD operations
export async function saveAlertToFirestore(alert: BudgetAlert): Promise<void> {
  const path = `alerts/${alert.id}`;
  try {
    await setDoc(doc(db, 'alerts', alert.id), alert);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAlertFromFirestore(alertId: string): Promise<void> {
  const path = `alerts/${alertId}`;
  try {
    await deleteDoc(doc(db, 'alerts', alertId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Audit Log Write
export async function saveAuditLogToFirestore(log: AuditLogEntry): Promise<void> {
  const path = `auditLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'auditLogs', log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
