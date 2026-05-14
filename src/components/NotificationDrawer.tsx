/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, ShieldAlert, Info, AlertTriangle, Check, Trash2 } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { AppNotification } from '../types';

interface NotificationDrawerProps {
  onClose: () => void;
}

export default function NotificationDrawer({ onClose }: NotificationDrawerProps) {
  const { notifications, markNotificationRead } = useBank();

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Bell size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Notifications</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <Bell size={48} className="opacity-20" />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationItem 
                  key={notif.id} 
                  notif={notif} 
                  onRead={() => markNotificationRead(notif.id)} 
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const NotificationItem: React.FC<{ 
  notif: AppNotification; 
  onRead: () => void; 
}> = ({ notif, onRead }) => {
  const icons = {
    security: <ShieldAlert className="text-rose-500" size={20} />,
    alert: <AlertTriangle className="text-amber-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-2xl border transition-all ${
        notif.read ? 'bg-slate-900/50 border-slate-800/50 opacity-60' : 'bg-slate-800/50 border-slate-700 shadow-lg ring-1 ring-white/5'
      }`}
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0 mt-1">
          {icons[notif.type]}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-start">
            <h4 className={`text-sm font-bold ${notif.read ? 'text-slate-400' : 'text-white'}`}>{notif.title}</h4>
            <span className="text-[10px] text-slate-500 font-medium">
              {new Date(notif.date).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
          {!notif.read && (
            <button 
              onClick={onRead}
              className="mt-3 text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-400"
            >
              <Check size={12} /> Mark as Read
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
