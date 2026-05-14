/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Users, 
  Activity, 
  AlertTriangle, 
  ShieldCheck,
  TrendingUp,
  Search,
  MoreVertical,
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Shield,
  ShieldAlert,
  UserCog
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatCurrency, Transaction, User } from '../types';

interface AdminPanelProps {
  onBack: () => void;
}

type AdminTab = 'overview' | 'transactions' | 'users';

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { transactions, allUsers, user: currentUser, updateTransactionStatus, updateUserRole } = useBank();
  const [stats, setStats] = useState<{ totalUsers: number, totalTransactions: number, activeAlerts: number } | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    userId: string;
    userName: string;
    targetRole: User['role'];
  } | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats);
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    tx.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.accountNumber.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8" id="admin-panel">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 bg-slate-900 hover:bg-slate-800 rounded-2xl text-slate-400 transition-all border border-slate-800"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">System Console</h1>
              <p className="text-slate-500 text-sm">XGBoost Fraud Prediction Core v4.2</p>
            </div>
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
            <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} label="Transactions" />
            <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" />
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <ShieldCheck size={18} />
            <span className="text-xs font-bold uppercase">System Healthy</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  icon={<Users size={24} />} 
                  label="Total Network Users" 
                  value={allUsers.length} 
                  trend="+2% MoM" 
                />
                <StatCard 
                  icon={<Activity size={24} />} 
                  label="Total Volume" 
                  value={formatCurrency(transactions.reduce((acc, tx) => acc + tx.amount, 0))} 
                  trend="+12% today" 
                />
                <StatCard 
                  icon={<AlertTriangle size={24} />} 
                  label="XGBoost Alerts" 
                  value={transactions.filter(t => t.status === 'flagged').length} 
                  trend="Monitoring"
                  warning={transactions.some(t => t.status === 'flagged')}
                />
              </div>

              {/* Recent High-Risk Activity */}
              <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Real-time Risk Feed</h2>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${tx.status === 'flagged' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800 text-slate-400'}`}>
                          {tx.status === 'flagged' ? <AlertTriangle size={18} /> : <Clock size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{tx.recipient}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">{tx.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(tx.amount)}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${tx.status === 'flagged' ? 'text-rose-500' : 'text-slate-500'}`}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div 
              key="transactions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by ID or Recipient..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white">
                    <Filter size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest leading-loose">
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Recipient</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-sm">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="group hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              tx.status === 'flagged' ? 'bg-rose-500/10 text-rose-500' : 
                              tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              'bg-amber-500/10 text-amber-500'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 italic">#{tx.id.slice(-8)}</td>
                          <td className="px-6 py-4 font-semibold text-white uppercase tracking-tight">{tx.recipient}</td>
                          <td className="px-6 py-4 font-bold text-white">{formatCurrency(tx.amount)}</td>
                          <td className="px-6 py-4 text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {tx.status !== 'flagged' && (
                                <button 
                                  onClick={() => updateTransactionStatus(tx.id, 'flagged')}
                                  title="Flag as Suspicious"
                                  className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20"
                                >
                                  <Flag size={16} />
                                </button>
                              )}
                              {tx.status === 'flagged' && (
                                <button 
                                  onClick={() => updateTransactionStatus(tx.id, 'completed')}
                                  title="Clear Flag"
                                  className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              <button className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search users by name, email or account..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 font-bold text-lg">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate">{u.name}</h4>
                        <p className="text-slate-500 text-xs truncate">{u.email}</p>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800 text-slate-500'}`}>
                        {u.role}
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 italic">Account Number</span>
                        <span className="text-slate-300 font-mono tracking-tighter">{u.accountNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 italic">Balance</span>
                        <span className="text-sm font-bold text-white">{formatCurrency(u.balance)}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                      <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all">
                        View History
                      </button>
                      
                      {u.id !== currentUser.id && (
                        u.role === 'user' ? (
                          <button 
                            onClick={() => setConfirmModal({ show: true, userId: u.id, userName: u.name, targetRole: 'admin' })}
                            className="p-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all group/btn"
                            title="Promote to Admin"
                          >
                            <Shield size={16} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => setConfirmModal({ show: true, userId: u.id, userName: u.name, targetRole: 'user' })}
                            className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-all group/btn"
                            title="Demote to Regular User"
                          >
                            <ShieldAlert size={16} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                        )
                      )}

                      <button className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Role Change Confirmation Modal */}
        <AnimatePresence>
          {confirmModal?.show && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmModal(null)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden"
              >
                {/* Decorative background elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl" />

                <div className="relative space-y-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                    confirmModal.targetRole === 'admin' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {confirmModal.targetRole === 'admin' ? <Shield size={32} /> : <ShieldAlert size={32} />}
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white">Update User Role?</h3>
                    <p className="text-slate-400 leading-relaxed">
                      Are you sure you want to {confirmModal.targetRole === 'admin' ? 'promote' : 'demote'} <span className="text-white font-bold">{confirmModal.userName}</span> to <span className={confirmModal.targetRole === 'admin' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{confirmModal.targetRole}</span>?
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setConfirmModal(null)}
                      className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        updateUserRole(confirmModal.userId, confirmModal.targetRole);
                        setConfirmModal(null);
                      }}
                      className={`flex-1 px-6 py-3 font-bold rounded-2xl transition-all ${
                        confirmModal.targetRole === 'admin' 
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
                          : 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20'
                      }`}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
        active ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ icon, label, value, trend, warning = false }: { icon: React.ReactNode, label: string, value: number | string, trend: string, warning?: boolean }) {
  return (
    <div className={`p-6 rounded-3xl border shadow-xl transition-all ${warning ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-900 border-slate-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${warning ? 'bg-rose-500/10 text-rose-500 ring-4 ring-rose-500/5' : 'bg-emerald-500/10 text-emerald-500 ring-4 ring-emerald-500/5'}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${warning ? 'text-rose-500' : 'text-emerald-500'}`}>
          <TrendingUp size={12} />
          {trend}
        </div>
      </div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-white tabular-nums">{value}</h3>
    </div>
  );
}
