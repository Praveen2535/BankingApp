/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Lock,
  ArrowRight,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatCurrency } from '../types';
import { TwoFactorModal } from './TwoFactorModal';

interface TransferFlowProps {
  onClose: () => void;
}

type Step = 'search' | 'amount' | 'pin' | 'processing' | 'success' | '2fa';

export default function TransferFlow({ onClose }: TransferFlowProps) {
  const { verifyRecipient, processTransfer, user, checkRisk, addNotification } = useBank();
  
  const [step, setStep] = useState<Step>('search');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState<{ name: string; acc: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [riskData, setRiskData] = useState<{ score: number, level: string, reason: string } | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const handleSearch = async () => {
    if (accountNumber.length < 10) return;
    setError(null);
    setIsProcessing(true);
    
    const result = await verifyRecipient(accountNumber);
    
    setIsProcessing(false);
    if (result.exists && result.name) {
      setRecipient({ name: result.name, acc: accountNumber });
      setStep('amount');
    } else {
      setError("User not found. Please check the account number.");
    }
  };

  const handleAmountSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (val > user.balance) {
      setError("Insufficient balance");
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    setStep('pin');
    setIsProcessing(false);
  };

  const handlePinInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newPin = [...pin];
    newPin[index] = val.slice(-1);
    setPin(newPin);

    // Auto-focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleFinalize = async () => {
    if (pin.join('') !== user.pin) {
      setError("Incorrect security PIN");
      return;
    }

    setError(null);
    setStep('processing');
    
    // AI Real-time Risk Analysis
    const risk = await checkRisk(parseFloat(amount), recipient!.acc);
    setRiskData({ score: risk.fraud_score, level: risk.risk_level, reason: risk.reason });

    if (risk.risk_level === 'HIGH') {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Dramatic pause
      setIsBlocked(true);
      setStep('amount');
      setError(`ACTION BLOCKED: ${risk.reason}. Our AI core (XGBoost) flagged this transaction as potentially fraudulent.`);
      addNotification(
        'Transaction Blocked',
        `An attempt to transfer ${formatCurrency(parseFloat(amount))} was blocked by AI Security: ${risk.reason}`,
        'security'
      );
      return;
    }

    // MANDATORY 2FA for Medium Risk or large transfers
    if (risk.risk_level === 'MEDIUM' || parseFloat(amount) > 15000) {
      setStep('2fa');
      return;
    }

    await executeTransfer();
  };

  const executeTransfer = async () => {
    const success = await processTransfer(parseFloat(amount), recipient!.name, recipient!.acc);
    
    if (success) {
      setStep('success');
      addNotification(
        'Transfer Successful',
        `Successfully transferred ${formatCurrency(parseFloat(amount))} to ${recipient!.name}.`,
        'info'
      );
    } else {
      setStep('amount');
      setError("Transaction failed. Try again.");
      addNotification(
        'Transfer Failed',
        `The transfer of ${formatCurrency(parseFloat(amount))} to ${recipient!.name} was unsuccessful.`,
        'alert'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="transfer-modal">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">Send Money</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* Step: Search */}
            {step === 'search' && (
              <motion.div 
                key="step-search"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Recipient Account Number</label>
                  <div className="relative">
                    <input 
                      autoFocus
                      type="text"
                      id="acc-number-input"
                      placeholder="e.g. 1122334455"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm animate-shake">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button 
                  disabled={accountNumber.length < 10 || isProcessing}
                  onClick={handleSearch}
                  className="w-full bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  id="search-btn"
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <>Find Recipient <ChevronRight size={18} /></>}
                </button>
              </motion.div>
            )}

            {/* Step: Amount */}
            {step === 'amount' && recipient && (
              <motion.div 
                key="step-amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {recipient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{recipient.name}</h3>
                    <p className="text-slate-500 text-xs tracking-tight">Acc: {recipient.acc}</p>
                  </div>
                </div>

                <div className="text-center py-8">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Amount (INR)</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-slate-400">₹</span>
                    <input 
                      autoFocus
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (isBlocked) setIsBlocked(false);
                        if (error) setError(null);
                      }}
                      className="bg-transparent text-white text-5xl font-bold w-full text-center focus:outline-none placeholder:text-slate-800"
                    />
                  </div>
                  <p className="mt-4 text-slate-500 text-sm">Balance: {formatCurrency(user.balance)}</p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button 
                  onClick={isBlocked ? () => setStep('search') : handleAmountSubmit}
                  className={`w-full ${isBlocked ? 'bg-slate-800 hover:bg-slate-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg`}
                  id="confirm-amount-btn"
                >
                  {isBlocked ? (
                    <><ArrowLeft size={20} /> Back to Search</>
                  ) : (
                    <>Continue <ArrowRight size={20} /></>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step: PIN */}
            {step === 'pin' && (
              <motion.div 
                key="step-pin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500 shadow-inner">
                    <Lock size={28} />
                  </div>
                  <h3 className="text-white font-bold text-xl tracking-tight">Security Verification</h3>
                  <p className="text-slate-400 text-sm">Enter your 4-digit PIN to authorize</p>
                </div>

                <div className="flex justify-between gap-3 max-w-[240px] mx-auto">
                  {pin.map((digit, i) => (
                    <input 
                      key={i}
                      id={`pin-${i}`}
                      type="password"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinInput(e, i)}
                      className="w-14 h-16 bg-slate-800 border border-slate-700 rounded-2xl text-center text-2xl text-white font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  ))}
                </div>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-sm justify-center mb-4">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button 
                  disabled={pin.some(p => !p)}
                  onClick={handleFinalize}
                  className="w-full bg-white text-slate-950 font-bold py-4 rounded-2xl shadow-lg hover:bg-slate-200 transition-all text-lg"
                  id="authorize-tx-btn"
                >
                  Authorize Payment
                </button>
              </motion.div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <motion.div 
                key="step-processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-8"
              >
                <div className="relative w-24 h-24">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                    <ShieldCheck size={32} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-white font-bold text-xl">Processing Payment</h3>
                  <p className="text-slate-500 text-sm animate-pulse">Communicating with banking servers...</p>
                </div>
              </motion.div>
            )}

            {/* Step: Success */}
            {step === 'success' && recipient && (
              <motion.div 
                key="step-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                  >
                    <CheckCircle2 size={48} />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Payment Successful</h3>
                
                {riskData && riskData.level === 'MEDIUM' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs text-left mb-4">
                    <p className="font-bold flex items-center gap-2 mb-1">
                      <AlertCircle size={14} /> AI Risk Advisory
                    </p>
                    <p>Transaction scrutinized: {riskData.reason}. Score: {riskData.score}</p>
                  </div>
                )}
                
                <p className="text-slate-400 text-sm">Transferred successfully to {recipient.name}</p>

                <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-800 text-left space-y-4">
                  <div className="flex justify-between items-center pb-3 border-bottom-dashed">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Transaction ID</span>
                    <span className="text-white text-xs font-mono">TXN-492019482</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Amount Paid</span>
                    <span className="text-white font-bold text-lg">{formatCurrency(parseFloat(amount))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Status</span>
                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">Settled</span>
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 transition-all"
                  id="close-success-btn"
                >
                  Back to Dashboard
                </button>
              </motion.div>
            )}

            {step === '2fa' && (
              <TwoFactorModal 
                key="step-2fa"
                title={riskData?.level === 'MEDIUM' ? "AI Security Verification" : "Verify Transfer"}
                description={
                  riskData?.level === 'MEDIUM' 
                    ? `Our AI detected a potential risk (${riskData.reason}). Please enter the security code sent to your email to continue.`
                    : `A security code has been sent to your email to authorize the transfer of ${formatCurrency(parseFloat(amount))}.`
                }
                onVerify={executeTransfer}
                onCancel={() => setStep('pin')}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function ShieldCheck({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
