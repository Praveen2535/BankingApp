/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Transaction, User } from '../types';

interface BankContextType {
  user: User;
  transactions: Transaction[];
  register: () => void;
  verifyRecipient: (accNumber: string) => Promise<{ exists: boolean; name?: string }>;
  checkRisk: (amount: number, accNumber?: string) => Promise<{ fraud_score: number; risk_level: string; reason: string }>;
  processTransfer: (amount: number, recipientName: string, recipientAcc: string) => Promise<boolean>;
  updateProfile: (name: string, email: string, bio: string) => void;
  sendOTP: () => Promise<string>;
  addFunds: (amount: number) => Promise<void>;
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
      isRegistered: false,
      role: 'admin',
    };
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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('indus_user', JSON.stringify(user));
    localStorage.setItem('indus_txs', JSON.stringify(transactions));
  }, [user, transactions]);

  const register = useCallback(() => {
    setUser(prev => ({ ...prev, isRegistered: true }));
  }, []);

  const updateProfile = useCallback((name: string, email: string, bio: string) => {
    setUser(prev => ({ ...prev, name, email, bio }));
  }, []);

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
      const resp = await fetch(`/api/users/check/${accNumber}`);
      const result = await resp.json();
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      return { exists: false };
    }
  };

  const checkRisk = async (amount: number, accNumber?: string) => {
    try {
      const resp = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, accNumber }),
      });
      return await resp.json();
    } catch (error) {
      return { fraud_score: 0.1, risk_level: 'LOW', reason: 'System offline' };
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
    setTransactions(prev => [newTx, ...prev]);
    setLoading(false);
  };

  return (
    <BankContext.Provider value={{ user, transactions, register, verifyRecipient, processTransfer, checkRisk, updateProfile, sendOTP, addFunds, loading }}>
      {children}
    </BankContext.Provider>
  );
};

export const useBank = () => {
  const context = useContext(BankContext);
  if (!context) throw new Error('useBank must be used within a BankProvider');
  return context;
};
