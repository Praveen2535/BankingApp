/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, User, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { TwoFactorModal } from './TwoFactorModal';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, updateProfile } = useBank();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio);
  const [saved, setSaved] = useState(false);
  const [show2FA, setShow2FA] = useState(false);

  const handleSave = () => {
    setShow2FA(true);
  };

  const handleVerify = () => {
    updateProfile(name, email, bio);
    setSaved(true);
    setShow2FA(false);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">Edit Profile</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          {saved ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} />
              </div>
              <p className="text-white font-bold">Profile Updated!</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Bio</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-slate-500" size={20} />
                    <textarea 
                      rows={3}
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-emerald-600 transition-all"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {show2FA && (
          <TwoFactorModal 
            title="Profile Update Security"
            onVerify={handleVerify}
            onCancel={() => setShow2FA(false)}
          />
        )}
      </motion.div>
    </div>
  );
}
