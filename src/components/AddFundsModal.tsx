/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Wallet, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatCurrency } from '../types';

interface AddFundsModalProps {
  onClose: () => void;
}

export default function AddFundsModal({ onClose }: AddFundsModalProps) {
  const { addFunds, addNotification } = useBank();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'input' | 'processing' | 'success'>('input');

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    setStatus('processing');
    await addFunds(val);
    setStatus('success');
    addNotification(
      'Funds Added',
      `Successfully deposited ${formatCurrency(val)} into your account.`,
      'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="add-funds-modal">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">Add Funds</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {status === 'input' && (
              <motion.div 
                key="input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet size={32} />
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Enter Amount to Deposit</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-slate-400">₹</span>
                    <input 
                      autoFocus
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-transparent text-white text-5xl font-bold w-full text-center focus:outline-none placeholder:text-slate-800"
                    />
                  </div>
                </div>

                <button 
                  disabled={!amount || parseFloat(amount) <= 0}
                  onClick={handleSubmit}
                  className="w-full bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  Deposit Funds <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                <div className="text-center">
                  <h3 className="text-white font-bold text-lg">Authorizing Deposit</h3>
                  <p className="text-slate-500 text-sm">Securing your transaction...</p>
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-6"
              >
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Funds Added!</h3>
                  <p className="text-slate-400 text-sm mt-1">Successfully deposited {formatCurrency(parseFloat(amount))}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-full bg-white text-slate-950 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
