/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  recipient: string;
  accountNumber: string;
  date: string;
  status: 'completed' | 'processing' | 'failed' | 'flagged';
  category: 'Transfer' | 'Shopping' | 'Food' | 'Bills' | 'Investment' | 'Salary';
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  accountNumber: string;
  balance: number;
  pin: string;
  isRegistered: boolean;
  role: 'user' | 'admin';
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
