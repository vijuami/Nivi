// Utility functions for localStorage operations with error handling

export const STORAGE_KEYS = {
  FINANCE_STATE: 'nivi-finance-state',
  VOICE_DIARY_ENTRIES: 'nivi-voice-diary-entries',
  NOTIFICATION_STATE: 'nivi-notification-state',
  DOCUMENTS: 'nivi-documents'
} as const;

// Generic localStorage utilities
export const saveToLocalStorage = <T>(key: string, data: T): boolean => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
};

// Finance-specific utilities
export const saveFinanceState = (financeState: any): boolean => {
  // Convert Date objects to ISO strings for serialization
  const serializedState = {
    ...financeState,
    incomeTransactions: financeState.incomeTransactions.map((transaction: any) => ({
      ...transaction,
      date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date
    })),
    transactions: financeState.transactions.map((transaction: any) => ({
      ...transaction,
      date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date
    })),
    debts: financeState.debts.map((debt: any) => ({
      ...debt,
      reminderDate: debt.reminderDate instanceof Date ? debt.reminderDate.toISOString() : debt.reminderDate
    }))
  };
  
  return saveToLocalStorage(STORAGE_KEYS.FINANCE_STATE, serializedState);
};

export const loadFinanceState = (defaultState: any): any => {
  const loadedState = loadFromLocalStorage(STORAGE_KEYS.FINANCE_STATE, defaultState);
  
  // Convert ISO strings back to Date objects
  return {
    ...loadedState,
    incomeTransactions: loadedState.incomeTransactions.map((transaction: any) => ({
      ...transaction,
      date: typeof transaction.date === 'string' ? new Date(transaction.date) : transaction.date
    })),
    transactions: loadedState.transactions.map((transaction: any) => ({
      ...transaction,
      date: typeof transaction.date === 'string' ? new Date(transaction.date) : transaction.date
    })),
    debts: loadedState.debts.map((debt: any) => ({
      ...debt,
      reminderDate: debt.reminderDate && typeof debt.reminderDate === 'string' 
        ? new Date(debt.reminderDate) 
        : debt.reminderDate
    }))
  };
};

// Voice Diary specific utilities
export const saveVoiceDiaryEntries = (entries: any[]): boolean => {
  // Convert Date objects to ISO strings for serialization
  const serializedEntries = entries.map(entry => ({
    ...entry,
    date: entry.date instanceof Date ? entry.date.toISOString() : entry.date
  }));
  
  return saveToLocalStorage(STORAGE_KEYS.VOICE_DIARY_ENTRIES, serializedEntries);
};

export const loadVoiceDiaryEntries = (): any[] => {
  const loadedEntries = loadFromLocalStorage(STORAGE_KEYS.VOICE_DIARY_ENTRIES, []);
  
  // Convert ISO strings back to Date objects
  return loadedEntries.map((entry: any) => ({
    ...entry,
    date: typeof entry.date === 'string' ? new Date(entry.date) : entry.date
  }));
};

// Documents specific utilities
export const saveDocuments = (documents: any[]): boolean => {
  // Convert Date objects and File objects to serializable format
  const serializedDocuments = documents.map(doc => ({
    ...doc,
    uploadDate: typeof doc.uploadDate === 'string' ? doc.uploadDate : doc.uploadDate,
    // Don't serialize the actual File object, just keep the metadata
    file: undefined,
    // Keep fileUrl for display purposes
    fileUrl: doc.fileUrl
  }));
  
  return saveToLocalStorage(STORAGE_KEYS.DOCUMENTS, serializedDocuments);
};

export const loadDocuments = (): any[] => {
  const loadedDocuments = loadFromLocalStorage(STORAGE_KEYS.DOCUMENTS, []);
  
  // Documents are already in the correct format since we don't store File objects
  return loadedDocuments;
};

// Notification state specific utilities
export const saveNotificationState = (notificationState: any): boolean => {
  // Convert Date objects to ISO strings for serialization
  const serializedState = {
    ...notificationState,
    lastSync: notificationState.lastSync instanceof Date ? notificationState.lastSync.toISOString() : notificationState.lastSync,
    notifications: notificationState.notifications.map((notification: any) => ({
      ...notification,
      receivedAt: notification.receivedAt instanceof Date ? notification.receivedAt.toISOString() : notification.receivedAt,
      extractedTransaction: notification.extractedTransaction ? {
        ...notification.extractedTransaction,
        date: notification.extractedTransaction.date instanceof Date ? notification.extractedTransaction.date.toISOString() : notification.extractedTransaction.date
      } : notification.extractedTransaction
    })),
    settings: {
      ...notificationState.settings,
      connectedEmails: notificationState.settings.connectedEmails.map((email: any) => ({
        ...email,
        connectedAt: email.connectedAt instanceof Date ? email.connectedAt.toISOString() : email.connectedAt,
        lastSync: email.lastSync instanceof Date ? email.lastSync.toISOString() : email.lastSync
      }))
    }
  };
  
  return saveToLocalStorage(STORAGE_KEYS.NOTIFICATION_STATE, serializedState);
};

export const loadNotificationState = (defaultState: any): any => {
  const loadedState = loadFromLocalStorage(STORAGE_KEYS.NOTIFICATION_STATE, defaultState);
  
  // Convert ISO strings back to Date objects
  return {
    ...loadedState,
    lastSync: loadedState.lastSync && typeof loadedState.lastSync === 'string' ? new Date(loadedState.lastSync) : loadedState.lastSync,
    notifications: loadedState.notifications.map((notification: any) => ({
      ...notification,
      receivedAt: typeof notification.receivedAt === 'string' ? new Date(notification.receivedAt) : notification.receivedAt,
      extractedTransaction: notification.extractedTransaction ? {
        ...notification.extractedTransaction,
        date: typeof notification.extractedTransaction.date === 'string' ? new Date(notification.extractedTransaction.date) : notification.extractedTransaction.date
      } : notification.extractedTransaction
    })),
    settings: {
      ...loadedState.settings,
      connectedEmails: loadedState.settings.connectedEmails.map((email: any) => ({
        ...email,
        connectedAt: typeof email.connectedAt === 'string' ? new Date(email.connectedAt) : email.connectedAt,
        lastSync: email.lastSync && typeof email.lastSync === 'string' ? new Date(email.lastSync) : email.lastSync
      }))
    }
  };
};