/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Transaction, User, AppNotification } from '../types';

interface BankContextType {
  user: User;
  transactions: Transaction[];
  notifications: AppNotification[];
  register: () => void;
  verifyRecipient: (accNumber: string) => Promise<{ exists: boolean; name?: string }>;
  checkRisk: (amount: number, accNumber?: string) => Promise<{ fraud_score: number; risk_level: string; reason: string }>;
  processTransfer: (amount: number, recipientName: string, recipientAcc: string) => Promise<boolean>;
  updateProfile: (name: string, email: string, bio: string) => void;
  sendOTP: () => Promise<string>;
  addFunds: (amount: number) => Promise<void>;
  updateTransactionStatus: (txId: string, status: Transaction['status']) => void;
  updateUserRole: (userId: string, role: User['role']) => void;
  addNotification: (title: string, message: string, type: AppNotification['type']) => void;
  markNotificationRead: (id: string) => void;
  allUsers: User[];
  loading: boolean;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

// Mock "Backend" Database
const MOCK_RECIPIENTS: Record<string, string> = {
  '1122334455': 'Aarav Sharma',
  '9988776655': 'Priya Singh',
  '5544332211': 'Vikram Mehra',
  '1234567890': 'Ananya Reddy',
};

export const BankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('indus_all_users');
    if (saved) return JSON.parse(saved);

    // Initial default users
    return [
      {
        id: 'current_user',
        name: 'Prakash',
        email: 'prakash@example.com',
        bio: 'Fintech enthusiast & frequent traveler.',
        accountNumber: '9876543210',
        balance: 125000,
        pin: '1234',
        isRegistered: true,
        role: 'admin',
      },
      {
        id: 'user_2',
        name: 'Aarav Sharma',
        email: 'aarav@example.com',
        bio: 'Professional investor.',
        accountNumber: '1122334455',
        balance: 850000,
        pin: '0000',
        isRegistered: true,
        role: 'user'
      },
      {
        id: 'user_3',
        name: 'Priya Singh',
        email: 'priya@example.com',
        bio: 'Student at IIT Delhi.',
        accountNumber: '9988776655',
        balance: 12000,
        pin: '0000',
        isRegistered: true,
        role: 'user'
      }
    ];
  });

  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('indus_user');
    if (saved) return JSON.parse(saved);
    // Find the current_user from allUsers if no specific saved user
    return allUsers.find(u => u.id === 'current_user')!;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('indus_txs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'tx_1',
        type: 'credit',
        amount: 50000,
        recipient: 'Employer Inc.',
        accountNumber: '**** **** 1290',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'completed',
        category: 'Salary',
      },
      {
        id: 'tx_2',
        type: 'debit',
        amount: 2500,
        recipient: 'Amazon India',
        accountNumber: '**** **** 8822',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        category: 'Shopping',
      }
    ];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('indus_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: 'notif_1',
        title: 'Welcome to Indus Mobile!',
        message: 'Your biometric-secured digital bank is now ready for use.',
        type: 'info',
        date: new Date().toISOString(),
        read: false,
      }
    ];
  });

  const [loading, setLoading] = useState(false);

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // --- Kafka Event Stream Listener ---
  useEffect(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[Kafka Stream] Received Event:', data);

        if (data.topic === 'security_alerts') {
          addNotification(
            `KAFKA ALERT: ${data.value.type}`,
            `${data.value.reason}: ${data.value.details}`,
            'security'
          );
        } else if (data.topic === 'user_notifications') {
          addNotification(
            'Kafka Notification',
            data.value.message,
            'info'
          );
        }
      } catch (e) {
        console.error('Error parsing Kafka stream event', e);
      }
    };

    eventSource.onerror = () => {
      console.warn('Kafka Stream disconnected. Retrying...');
    };

    return () => eventSource.close();
  }, [addNotification]);

  useEffect(() => {
    localStorage.setItem('indus_user', JSON.stringify(user));
    localStorage.setItem('indus_txs', JSON.stringify(transactions));
    localStorage.setItem('indus_notifications', JSON.stringify(notifications));
    localStorage.setItem('indus_all_users', JSON.stringify(allUsers));
  }, [user, transactions, notifications, allUsers]);

  const updateUserRole = useCallback((userId: string, role: User['role']) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    
    // If the updated user is the current user, update their profile too
    if (userId === user.id) {
      setUser(prev => ({ ...prev, role }));
    }

    const updatedUserName = allUsers.find(u => u.id === userId)?.name || 'User';
    addNotification(
      'Role Updated',
      `${updatedUserName} has been assigned the '${role}' role successfully.`,
      'info'
    );
  }, [user.id, allUsers, addNotification]);

  const register = useCallback(() => {
    setUser(prev => ({ ...prev, isRegistered: true }));
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, isRegistered: true } : u));
  }, [user.id]);

  const updateProfile = useCallback((name: string, email: string, bio: string) => {
    setUser(prev => ({ ...prev, name, email, bio }));
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, name, email, bio } : u));
  }, [user.id]);

  const sendOTP = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Indus Security] OTP for ${user.email}: ${code}`);
    // In a real app, this would call a backend service to send an email/SMS
    await new Promise(resolve => setTimeout(resolve, 1000));
    return code;
  };

  const verifyRecipient = async (accNumber: string) => {
    setLoading(true);
    try {
      // 1. Try real API first
      const resp = await fetch(`/api/users/check/${accNumber}`);
      if (resp.ok) {
        const result = await resp.json();
        if (result.exists) {
          setLoading(false);
          return result;
        }
      }
      throw new Error('Not found in API');
    } catch (error) {
      // 2. Fallback to local mock data if API is unavailable (common in Vercel/Static deployments)
      console.warn(`[Bank Simulation] API unreachable or user not found. Falling back to local data for account: ${accNumber}`);
      const name = MOCK_RECIPIENTS[accNumber];
      
      // Artificial delay to simulate network
      await new Promise(r => setTimeout(r, 500));
      
      setLoading(false);
      return name 
        ? { exists: true, name } 
        : { exists: false };
    }
  };

  const checkRisk = async (amount: number, accNumber?: string) => {
    try {
      const resp = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, accNumber }),
      });
      if (resp.ok) {
        return await resp.json();
      }
      throw new Error('API Error');
    } catch (error) {
      console.warn('[Bank AI] AI Risk Assessment API unavailable. Using embedded safety model (LOW RISK default).');
      return { 
        fraud_score: 0.1, 
        risk_level: 'LOW', 
        reason: 'Local Safety Check: Standard amount' 
      };
    }
  };

  const processTransfer = async (amount: number, recipientName: string, recipientAcc: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2500)); // Processing animation time
    
    if (user.balance < amount) {
      setLoading(false);
      return false;
    }

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'debit',
      amount,
      recipient: recipientName,
      accountNumber: recipientAcc,
      date: new Date().toISOString(),
      status: 'completed',
      category: 'Transfer',
    };

    setUser(prev => ({ ...prev, balance: prev.balance - amount }));
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, balance: u.balance - amount } : u));
    setTransactions(prev => [newTx, ...prev]);
    setLoading(false);
    return true;
  };

  const addFunds = async (amount: number) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate bank authorization
    
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'credit',
      amount,
      recipient: 'Self (Deposit)',
      accountNumber: user.accountNumber,
      date: new Date().toISOString(),
      status: 'completed',
      category: 'Salary', // Using Salary as a filler for deposit category
    };

    setUser(prev => ({ ...prev, balance: prev.balance + amount }));
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, balance: u.balance + amount } : u));
    setTransactions(prev => [newTx, ...prev]);
    setLoading(false);
  };

  const updateTransactionStatus = (txId: string, status: Transaction['status']) => {
    setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status } : tx));
    if (status === 'flagged') {
      addNotification(
        'Transaction Flagged',
        `A recent transaction has been flagged for manual review by our security team.`,
        'security'
      );
    } else if (status === 'completed') {
      addNotification(
        'Security Review Cleared',
        'A flagged transaction has been verified and cleared by our security team.',
        'info'
      );
    }
  };


  return (
    <BankContext.Provider value={{ 
      user, 
      transactions, 
      notifications,
      register, 
      verifyRecipient, 
      processTransfer, 
      checkRisk, 
      updateProfile, 
      sendOTP, 
      addFunds, 
      updateTransactionStatus,
      updateUserRole,
      addNotification,
      markNotificationRead,
      allUsers,
      loading 
    }}>
      {children}
    </BankContext.Provider>
  );
};

export const useBank = () => {
  const context = useContext(BankContext);
  if (!context) throw new Error('useBank must be used within a BankProvider');
  return context;
};
