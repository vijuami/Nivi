import { supabase } from '../lib/supabase'
import { FinanceState } from '../types/finance'

// Finance data operations
export const saveUserFinanceData = async (userId: string, financeData: FinanceState): Promise<boolean> => {
  try {
    // Convert Date objects to ISO strings for database storage
    const serializedData = {
      ...financeData,
      incomeTransactions: financeData.incomeTransactions.map(transaction => ({
        ...transaction,
        date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date
      })),
      transactions: financeData.transactions.map(transaction => ({
        ...transaction,
        date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date
      })),
      debts: financeData.debts.map(debt => ({
        ...debt,
        reminderDate: debt.reminderDate instanceof Date ? debt.reminderDate.toISOString() : debt.reminderDate
      }))
    }

    const { error } = await supabase
      .from('user_finance_data')
      .upsert({
        user_id: userId,
        finance_data: serializedData,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving finance data:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in saveUserFinanceData:', error)
    return false
  }
}

export const loadUserFinanceData = async (userId: string, defaultState: FinanceState): Promise<FinanceState> => {
  try {
    const { data, error } = await supabase
      .from('user_finance_data')
      .select('finance_data')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.log('No finance data found for user, using default state')
      return defaultState
    }

    const financeData = data.finance_data as any

    // Convert ISO strings back to Date objects
    return {
      ...financeData,
      incomeTransactions: financeData.incomeTransactions.map((transaction: any) => ({
        ...transaction,
        date: typeof transaction.date === 'string' ? new Date(transaction.date) : transaction.date
      })),
      transactions: financeData.transactions.map((transaction: any) => ({
        ...transaction,
        date: typeof transaction.date === 'string' ? new Date(transaction.date) : transaction.date
      })),
      debts: financeData.debts.map((debt: any) => ({
        ...debt,
        reminderDate: debt.reminderDate && typeof debt.reminderDate === 'string' 
          ? new Date(debt.reminderDate) 
          : debt.reminderDate
      }))
    }
  } catch (error) {
    console.error('Error loading finance data:', error)
    return defaultState
  }
}

// Voice diary operations
export const saveUserVoiceDiaryEntries = async (userId: string, entries: any[]): Promise<boolean> => {
  try {
    // Convert Date objects to ISO strings for database storage
    const serializedEntries = entries.map(entry => ({
      ...entry,
      date: entry.date instanceof Date ? entry.date.toISOString() : entry.date
    }))

    const { error } = await supabase
      .from('user_voice_diary')
      .upsert({
        user_id: userId,
        diary_entries: serializedEntries,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving voice diary entries:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in saveUserVoiceDiaryEntries:', error)
    return false
  }
}

export const loadUserVoiceDiaryEntries = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('user_voice_diary')
      .select('diary_entries')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.log('No voice diary entries found for user')
      return []
    }

    const entries = data.diary_entries as any[]

    // Convert ISO strings back to Date objects
    return entries.map((entry: any) => ({
      ...entry,
      date: typeof entry.date === 'string' ? new Date(entry.date) : entry.date
    }))
  } catch (error) {
    console.error('Error loading voice diary entries:', error)
    return []
  }
}

// Documents operations
export const saveUserDocuments = async (userId: string, documents: any[]): Promise<boolean> => {
  try {
    // Serialize documents (excluding File objects)
    const serializedDocuments = documents.map(doc => ({
      ...doc,
      file: undefined, // Don't store File objects
      fileUrl: doc.fileUrl
    }))

    const { error } = await supabase
      .from('user_documents')
      .upsert({
        user_id: userId,
        documents: serializedDocuments,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving documents:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in saveUserDocuments:', error)
    return false
  }
}

export const loadUserDocuments = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('user_documents')
      .select('documents')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.log('No documents found for user')
      return []
    }

    return data.documents as any[]
  } catch (error) {
    console.error('Error loading documents:', error)
    return []
  }
}

// Notification state operations
export const saveUserNotificationState = async (userId: string, notificationState: any): Promise<boolean> => {
  try {
    // Convert Date objects to ISO strings for database storage
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
    }

    const { error } = await supabase
      .from('user_notification_state')
      .upsert({
        user_id: userId,
        notification_state: serializedState,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving notification state:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in saveUserNotificationState:', error)
    return false
  }
}

export const loadUserNotificationState = async (userId: string, defaultState: any): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('user_notification_state')
      .select('notification_state')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      console.log('No notification state found for user, using default state')
      return defaultState
    }

    const notificationState = data.notification_state as any

    // Convert ISO strings back to Date objects
    return {
      ...notificationState,
      lastSync: notificationState.lastSync && typeof notificationState.lastSync === 'string' ? new Date(notificationState.lastSync) : notificationState.lastSync,
      notifications: notificationState.notifications.map((notification: any) => ({
        ...notification,
        receivedAt: typeof notification.receivedAt === 'string' ? new Date(notification.receivedAt) : notification.receivedAt,
        extractedTransaction: notification.extractedTransaction ? {
          ...notification.extractedTransaction,
          date: typeof notification.extractedTransaction.date === 'string' ? new Date(notification.extractedTransaction.date) : notification.extractedTransaction.date
        } : notification.extractedTransaction
      })),
      settings: {
        ...notificationState.settings,
        connectedEmails: notificationState.settings.connectedEmails.map((email: any) => ({
          ...email,
          connectedAt: typeof email.connectedAt === 'string' ? new Date(email.connectedAt) : email.connectedAt,
          lastSync: email.lastSync && typeof email.lastSync === 'string' ? new Date(email.lastSync) : email.lastSync
        }))
      }
    }
  } catch (error) {
    console.error('Error loading notification state:', error)
    return defaultState
  }
}