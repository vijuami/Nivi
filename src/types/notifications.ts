export interface BankTransaction {
  id: string;
  bankName: string;
  accountNumber: string;
  transactionType: 'debit' | 'credit';
  amount: number;
  balance: number;
  description: string;
  date: Date;
  referenceNumber: string;
  category?: string;
  isProcessed: boolean;
}

export interface EmailNotification {
  id: string;
  subject: string;
  sender: string;
  receivedAt: Date;
  content: string;
  isRead: boolean;
  isBankTransaction: boolean;
  extractedTransaction?: BankTransaction;
  processingStatus: 'pending' | 'processed' | 'failed' | 'ignored';
}

export interface NotificationSettings {
  emailIntegrationEnabled: boolean;
  autoProcessTransactions: boolean;
  supportedBanks: string[];
  connectedEmails: EmailAccount[];
  emailFilters: {
    senders: string[];
    keywords: string[];
    subjects: string[];
  };
  notificationPreferences: {
    showPopups: boolean;
    playSound: boolean;
    markAsRead: boolean;
  };
}

export interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'other';
  isConnected: boolean;
  connectedAt: Date;
  lastSync?: Date;
  displayName?: string;
}

export interface NotificationState {
  notifications: EmailNotification[];
  settings: NotificationSettings;
  isConnected: boolean;
  lastSync: Date | null;
  unreadCount: number;
}