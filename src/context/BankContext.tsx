/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Transaction, User, AppNotification } from '../types';
import { supabase } from '../lib/supabase';

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

// Checking if keys are real
const isSupabaseLive = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

// Mock "Backend" Database
const MOCK_RECIPIENTS: Record<string, string> = {
  // --- AUTHORIZED PERSONS (LOW RISK) ---
  '1122334455': 'Aarav Sharma (Verified Investor)',
  '2233445566': 'Sara Khan (Premium Merchant)',
  '3344556677': 'City Heights (Lease Utilities)',
  '2220502205': 'Reliance Retail (Verified)',
  '3789678934': 'Karan Malhotra (Family)',
  
  // --- FLAG / BLOCKED PERSONS (HIGH/MEDIUM RISK) ---
  '8888888888': 'Global Shell Corp (Blocked Entity)',
  '7777777777': 'Unverified Crypto Gateway',
  '6666666666': 'Offshore Travel Agent (Review Req)',
  '3456723452': 'New Tech Logistics (Review)',
  '5432167890': 'Flagged Suspicious Node',
  
  // Legacy support
  '9988776655': 'Priya Singh',
  '5544332211': 'Vikram Mehra',
  '1234567890': 'Ananya Reddy',
  '1212121212': 'Anonymous Entity (Flagged)',
  '5555555555': 'High-Velocity Merchant',
};

export const BankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('indus_user');
    return saved ? JSON.parse(saved) : {
      id: 'current_user',
      name: 'Prakash',
      email: 'prakash@example.com',
      bio: 'Fintech enthusiast & frequent traveler.',
      accountNumber: '9876543210',
      balance: 125000,
      pin: '1234',
      isRegistered: true,
      role: 'admin',
    };
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // 1. Initial Data Load (Supabase -> Local)
  useEffect(() => {
    const loadData = async () => {
      if (!isSupabaseLive) {
        // Load from LocalStorage if offline
        const savedUsers = localStorage.getItem('indus_all_users');
        const savedTxs = localStorage.getItem('indus_txs');
        const savedNotifs = localStorage.getItem('indus_notifications');

        if (savedUsers) setAllUsers(JSON.parse(savedUsers));
        else setAllUsers([
          user,
          { id: 'user_2', name: 'Aarav Sharma', email: 'aarav@example.com', bio: 'Investor', accountNumber: '1122334455', balance: 850000, pin: '0000', isRegistered: true, role: 'user' },
          { id: 'user_3', name: 'Priya Singh', email: 'priya@example.com', bio: 'Student', accountNumber: '9988776655', balance: 12000, pin: '0000', isRegistered: true, role: 'user' }
        ]);

        if (savedTxs) setTransactions(JSON.parse(savedTxs));
        else setTransactions([
          { id: 'tx_1', type: 'credit', amount: 50000, recipient: 'Employer Inc.', accountNumber: '**** 1290', date: new Date(Date.now() - 172800000).toISOString(), status: 'completed', category: 'Salary' },
          { id: 'tx_2', type: 'debit', amount: 2500, recipient: 'Amazon India', accountNumber: '**** 8822', date: new Date(Date.now() - 86400000).toISOString(), status: 'completed', category: 'Shopping' }
        ]);

        if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
        else setNotifications([{ id: 'notif_1', title: 'Welcome!', message: 'biometric bank ready.', type: 'info', date: new Date().toISOString(), read: false }]);

        return;
      }

      setLoading(true);
      try {
        // Fetch User and Stats
        const { data: profileData } = await supabase.from('profiles').select('*').eq('email', user.email).single();
        if (profileData) {
          const mappedUser: User = {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            bio: profileData.bio,
            accountNumber: profileData.account_number,
            balance: Number(profileData.balance),
            pin: profileData.pin,
            isRegistered: profileData.is_registered,
            role: profileData.role
          };
          setUser(mappedUser);
        }

        const { data: txs } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (txs) {
          setTransactions(txs.map(t => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            recipient: t.recipient,
            accountNumber: t.account_number,
            date: t.created_at,
            status: t.status,
            category: t.category
          })));
        }

        const { data: notifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (notifs) {
          setNotifications(notifs.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            date: n.created_at,
            read: n.read
          })));
        }

        const { data: users } = await supabase.from('profiles').select('*');
        if (users) {
          setAllUsers(users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            bio: u.bio,
            accountNumber: u.account_number,
            balance: Number(u.balance),
            pin: u.pin,
            isRegistered: u.is_registered,
            role: u.role
          })));
        }
      } catch (err) {
        console.error('Supabase fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.email]);

  const addNotification = useCallback(async (title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotif, ...prev]);

    if (isSupabaseLive) {
      await supabase.from('notifications').insert({
        title,
        message,
        type,
        user_id: user.id === 'current_user' ? null : user.id,
      });
    }
  }, [user.id]);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (isSupabaseLive) {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    }
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

  const updateUserRole = useCallback(async (userId: string, role: User['role']) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    
    // If the updated user is the current user, update their profile too
    if (userId === user.id) {
      setUser(prev => ({ ...prev, role }));
    }

    if (isSupabaseLive) {
      await supabase.from('profiles').update({ role }).eq('id', userId);
    }

    const updatedUserName = allUsers.find(u => u.id === userId)?.name || 'User';
    addNotification(
      'Role Updated',
      `${updatedUserName} has been assigned the '${role}' role successfully.`,
      'info'
    );
  }, [user.id, allUsers, addNotification]);

  const register = useCallback(async () => {
    setUser(prev => ({ ...prev, isRegistered: true }));
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, isRegistered: true } : u));
    
    if (isSupabaseLive) {
      await supabase.from('profiles').update({ is_registered: true }).eq('id', user.id);
    }
  }, [user.id]);

  const updateProfile = useCallback(async (name: string, email: string, bio: string) => {
    setUser(prev => ({ ...prev, name, email, bio }));
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, name, email, bio } : u));

    if (isSupabaseLive) {
      await supabase.from('profiles').update({ name, email, bio }).eq('id', user.id);
    }
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

    if (isSupabaseLive) {
      try {
        const { data } = await supabase.from('profiles').select('name').eq('account_number', accNumber).single();
        if (data) {
          setLoading(false);
          return { exists: true, name: data.name };
        }
      } catch (err) {
        console.error('Supabase recipient verify error:', err);
      }
    }

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
      // 2. Fallback to local mock data if API is unavailable
      console.warn(`[Bank Simulation] API unreachable or user not found. Falling back to local data for account: ${accNumber}`);
      const name = MOCK_RECIPIENTS[accNumber];
      
      await new Promise(r => setTimeout(r, 600));
      
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
      if (resp.ok) return await resp.json();
      throw new Error('API Error');
    } catch (error) {
      // ENHANCED SIMULATION FOR PRESENTATION & TESTING
      await new Promise(r => setTimeout(r, 800));

      // 1. HIGH RISK: BLOCKED PERSONS
      const highRiskAccounts = ['8888888888', '7777777777', '1212121212', '5432167890'];
      if (highRiskAccounts.includes(accNumber || '') || amount > 100000) {
        let reason = 'Entity detected in AML blacklist (High-Risk Flag).';
        if (accNumber === '7777777777') reason = 'Unauthorized Crypto Gateway: Potential capital flight risk.';
        if (accNumber === '8888888888') reason = 'Sanctioned Entity Trace: Transaction blocked by global compliance.';
        if (accNumber === '5432167890') reason = 'Associated with fraudulent activity in the last 24 hours.';
        
        console.warn('[Bank AI] HIGH RISK Triggered:', reason);
        return { fraud_score: 0.98, risk_level: 'HIGH', reason };
      }

      // 2. MEDIUM RISK: 2FA PERSONS (Review Required)
      const mediumRiskAccounts = ['6666666666', '5555555555', '3456723452'];
      if (mediumRiskAccounts.includes(accNumber || '') || amount > 25000) {
        let reason = 'Transaction exceeds typical user velocity patterns.';
        if (accNumber === '6666666666') reason = 'Unexpected geographic merchant location at this tier.';
        if (accNumber === '3456723452') reason = 'New first-time merchant pairing; additional verification requested.';
        
        console.warn('[Bank AI] MEDIUM RISK Triggered:', reason);
        return { fraud_score: 0.65, risk_level: 'MEDIUM', reason };
      }

      // 3. LOW RISK: AUTHORIZED PERSONS
      const lowRiskAccounts = ['1122334455', '2233445566', '3344556677', '2220502205', '3789678934'];
      if (lowRiskAccounts.includes(accNumber || '')) {
        return { 
          fraud_score: 0.02, 
          risk_level: 'LOW', 
          reason: 'Verified counterparty. Consistent with historical behavior.' 
        };
      }

      // Default
      return { 
        fraud_score: 0.05, 
        risk_level: 'LOW', 
        reason: 'Local Safety Check: Clean history.' 
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

    const newBalance = user.balance - amount;
    setUser(prev => ({ ...prev, balance: newBalance }));
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, balance: u.balance - amount } : u));
    setTransactions(prev => [newTx, ...prev]);

    if (isSupabaseLive) {
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
      await supabase.from('transactions').insert({
        user_id: user.id === 'current_user' ? null : user.id,
        type: 'debit',
        amount,
        recipient: recipientName,
        account_number: recipientAcc,
        category: 'Transfer'
      });
    }

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

    const newBalance = user.balance + amount;
    setUser(prev => ({ ...prev, balance: newBalance }));
    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, balance: u.balance + amount } : u));
    setTransactions(prev => [newTx, ...prev]);

    if (isSupabaseLive) {
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
      await supabase.from('transactions').insert({
        user_id: user.id === 'current_user' ? null : user.id,
        type: 'credit',
        amount,
        recipient: 'Self (Deposit)',
        account_number: user.accountNumber,
        category: 'Salary'
      });
    }

    setLoading(false);
  };

  const updateTransactionStatus = async (txId: string, status: Transaction['status']) => {
    setTransactions(prev => prev.map(tx => tx.id === txId ? { ...tx, status } : tx));
    
    if (isSupabaseLive) {
      await supabase.from('transactions').update({ status }).eq('id', txId);
    }

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
