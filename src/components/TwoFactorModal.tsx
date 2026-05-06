/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, ShieldEllipsis, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { useBank } from '../context/BankContext';

interface TwoFactorModalProps {
  onVerify: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ onVerify, onCancel, title = "Two-Factor Auth", description }) => {
  const { user, sendOTP } = useBank();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [actualCode, setActualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(true);

  const initOTP = async () => {
    setSending(true);
    const code = await sendOTP();
    setActualCode(code);
    setSending(false);
  };

  useEffect(() => {
    initOTP();
  }, []);

  const handleInput = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleVerify = () => {
    if (otp.join('') === actualCode) {
      onVerify();
    } else {
      setError("The verification code you entered is incorrect.");
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
      />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl"
      >
        <button onClick={onCancel} className="absolute top-6 right-6 text-slate-500 hover:text-white">
          <X size={20} />
        </button>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
            <ShieldEllipsis size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {description || `Sensitive action detected. We've sent a 6-digit code to ${user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex justify-between gap-1">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                autoFocus={i === 0}
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(e.target.value, i)}
                disabled={sending}
                className="w-11 h-14 bg-slate-800 border border-slate-700 rounded-xl text-center text-xl text-white font-bold focus:border-emerald-500 transition-all"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-xs justify-center italic">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              disabled={otp.some(d => !d) || sending}
              onClick={handleVerify}
              className="w-full bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg"
            >
              Verify & Complete
            </button>
            <button 
              onClick={initOTP}
              className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:text-slate-300"
            >
              <RefreshCcw size={12} className={sending ? 'animate-spin' : ''} />
              Resend Code
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
