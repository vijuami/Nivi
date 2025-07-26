import { BankTransaction, EmailNotification } from '../types/notifications';

// Common bank email patterns and parsers
const BANK_PATTERNS = {
  sbi: {
    senders: ['sbi@sbi.co.in', 'alerts@sbi.co.in'],
    patterns: {
      debit: /debited.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      credit: /credited.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      balance: /balance.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      account: /a\/c.*?(\d{4,})/i,
      reference: /ref.*?(\w+\d+)/i
    }
  },
  hdfc: {
    senders: ['alerts@hdfcbank.net', 'hdfcbank@hdfcbank.com'],
    patterns: {
      debit: /debited.*?inr\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      credit: /credited.*?inr\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      balance: /balance.*?inr\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      account: /a\/c.*?(\d{4,})/i,
      reference: /ref.*?(\w+\d+)/i
    }
  },
  icici: {
    senders: ['alerts@icicibank.com', 'noreply@icicibank.com'],
    patterns: {
      debit: /debited.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      credit: /credited.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      balance: /balance.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      account: /a\/c.*?(\d{4,})/i,
      reference: /ref.*?(\w+\d+)/i
    }
  },
  axis: {
    senders: ['alerts@axisbank.com', 'noreply@axisbank.com'],
    patterns: {
      debit: /debited.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      credit: /credited.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      balance: /balance.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      account: /a\/c.*?(\d{4,})/i,
      reference: /ref.*?(\w+\d+)/i
    }
  }
};

export const detectBankFromEmail = (sender: string, subject: string): string | null => {
  const senderLower = sender.toLowerCase();
  const subjectLower = subject.toLowerCase();
  
  for (const [bankName, config] of Object.entries(BANK_PATTERNS)) {
    if (config.senders.some(s => senderLower.includes(s.toLowerCase())) ||
        subjectLower.includes(bankName)) {
      return bankName.toUpperCase();
    }
  }
  
  // Generic bank detection
  if (senderLower.includes('bank') || subjectLower.includes('transaction') || 
      subjectLower.includes('debited') || subjectLower.includes('credited')) {
    return 'UNKNOWN_BANK';
  }
  
  return null;
};

export const parseTransactionFromEmail = (notification: EmailNotification): BankTransaction | null => {
  const { sender, subject, content } = notification;
  const bankName = detectBankFromEmail(sender, subject);
  
  if (!bankName) return null;
  
  const text = `${subject} ${content}`.toLowerCase();
  const bankConfig = BANK_PATTERNS[bankName.toLowerCase() as keyof typeof BANK_PATTERNS];
  
  try {
    // Determine transaction type
    let transactionType: 'debit' | 'credit' = 'debit';
    let amount = 0;
    
    if (bankConfig) {
      // Use bank-specific patterns
      const debitMatch = text.match(bankConfig.patterns.debit);
      const creditMatch = text.match(bankConfig.patterns.credit);
      
      if (creditMatch) {
        transactionType = 'credit';
        amount = parseFloat(creditMatch[1].replace(/,/g, ''));
      } else if (debitMatch) {
        transactionType = 'debit';
        amount = parseFloat(debitMatch[1].replace(/,/g, ''));
      }
    } else {
      // Generic patterns for unknown banks
      const genericDebit = text.match(/debited.*?(?:rs\.?|inr)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
      const genericCredit = text.match(/credited.*?(?:rs\.?|inr)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
      
      if (genericCredit) {
        transactionType = 'credit';
        amount = parseFloat(genericCredit[1].replace(/,/g, ''));
      } else if (genericDebit) {
        transactionType = 'debit';
        amount = parseFloat(genericDebit[1].replace(/,/g, ''));
      }
    }
    
    if (amount === 0) return null;
    
    // Extract other details
    const balanceMatch = text.match(/balance.*?(?:rs\.?|inr)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
    const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : 0;
    
    const accountMatch = text.match(/a\/c.*?(\d{4,})/i) || text.match(/account.*?(\d{4,})/i);
    const accountNumber = accountMatch ? accountMatch[1] : 'Unknown';
    
    const refMatch = text.match(/ref.*?(\w+\d+)/i) || text.match(/reference.*?(\w+\d+)/i);
    const referenceNumber = refMatch ? refMatch[1] : `REF${Date.now()}`;
    
    // Extract description (merchant/purpose)
    let description = 'Bank Transaction';
    const merchantMatch = text.match(/(?:at|to|from)\s+([^.]+?)(?:\s+on|\s+ref|\s+balance|$)/i);
    if (merchantMatch) {
      description = merchantMatch[1].trim();
    } else {
      // Try to extract from subject
      const subjectClean = subject.replace(/transaction|alert|notification|debited|credited/gi, '').trim();
      if (subjectClean.length > 5) {
        description = subjectClean;
      }
    }
    
    return {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bankName,
      accountNumber,
      transactionType,
      amount,
      balance,
      description: description.substring(0, 100), // Limit description length
      date: notification.receivedAt,
      referenceNumber,
      isProcessed: false
    };
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return null;
  }
};

export const categorizeTransaction = (transaction: BankTransaction): string => {
  const description = transaction.description.toLowerCase();
  
  // Categorization rules
  if (description.includes('salary') || description.includes('payroll')) {
    return 'Income';
  }
  
  if (description.includes('grocery') || description.includes('supermarket') || 
      description.includes('food') || description.includes('restaurant')) {
    return 'Food & Groceries';
  }
  
  if (description.includes('fuel') || description.includes('petrol') || 
      description.includes('gas') || description.includes('transport')) {
    return 'Transportation';
  }
  
  if (description.includes('electricity') || description.includes('water') || 
      description.includes('gas bill') || description.includes('utility')) {
    return 'Utilities';
  }
  
  if (description.includes('emi') || description.includes('loan') || 
      description.includes('mortgage')) {
    return 'EMI/Loans';
  }
  
  if (description.includes('medical') || description.includes('hospital') || 
      description.includes('pharmacy') || description.includes('doctor')) {
    return 'Healthcare';
  }
  
  if (description.includes('shopping') || description.includes('amazon') || 
      description.includes('flipkart') || description.includes('mall')) {
    return 'Shopping';
  }
  
  if (description.includes('entertainment') || description.includes('movie') || 
      description.includes('netflix') || description.includes('spotify')) {
    return 'Entertainment';
  }
  
  // Default categorization based on transaction type
  return transaction.transactionType === 'credit' ? 'Income' : 'Expense';
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};