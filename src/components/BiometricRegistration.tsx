/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, ShieldCheck, ArrowRight } from 'lucide-react';
import { useBank } from '../context/BankContext';

export default function BiometricRegistration() {
  const { register } = useBank();
  const [scanning, setScanning] = useState(false);
  const [verified, setVerified] = useState(false);

  const startScan = async () => {
    setScanning(true);
    // Simulation of biometric processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setScanning(false);
    setVerified(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6" id="registration-page">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Indus Banking</h1>
          <p className="text-slate-400">Secure your account with biometric enrollment</p>
        </div>

        <div className="relative flex justify-center mb-12">
          {/* Fingerprint Scanner UI */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Background Rings */}
            <div className="absolute inset-0 border-2 border-slate-800 rounded-full" />
            <motion.div 
              animate={scanning ? { scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-2 border border-emerald-500/30 rounded-full"
            />

            <AnimatePresence mode="wait">
              {!verified ? (
                <motion.button
                  key="scan-button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startScan}
                  disabled={scanning}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                    scanning ? 'bg-slate-800 text-emerald-500' : 'bg-emerald-500 text-white'
                  }`}
                  id="scan-btn"
                >
                  <Fingerprint size={40} className={scanning ? 'animate-pulse' : ''} />
                  
                  {scanning && (
                    <motion.div
                      layoutId="scanner-line"
                      className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                      animate={{ top: ['20%', '80%', '20%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="verified-status"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative z-10 w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  id="verified-indicator"
                >
                  <ShieldCheck size={40} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {!verified ? (
              <p className="text-sm font-mono text-slate-500 uppercase tracking-widest h-5">
                {scanning ? 'Analyzing biometrics...' : 'Place finger on scanner'}
              </p>
            ) : (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-semibold text-emerald-400 uppercase tracking-widest h-5"
              >
                Identity Authenticated
              </motion.p>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => register()}
            disabled={!verified}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              verified 
                ? 'bg-white text-slate-950 hover:bg-slate-200' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            id="create-account-btn"
          >
            Create Account
            <ArrowRight size={18} />
          </button>
        </div>

        <p className="mt-8 text-xs text-slate-500 leading-relaxed">
          Your biometric data is encrypted and stored locally in accordance with regional financial security standards.
        </p>
      </motion.div>
    </div>
  );
}
