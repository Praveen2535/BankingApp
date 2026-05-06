/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Users, 
  Activity, 
  AlertTriangle, 
  ShieldCheck,
  TrendingUp,
  Search,
  MoreVertical
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatCurrency } from '../types';

interface AdminPanelProps {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { transactions } = useBank();
  const [stats, setStats] = useState<{ totalUsers: number, totalTransactions: number, activeAlerts: number } | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8" id="admin-panel">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 bg-slate-900 hover:bg-slate-800 rounded-2xl text-slate-400 transition-all border border-slate-800"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">System Core Admin</h1>
              <p className="text-slate-500 text-sm">Real-time XGBoost Monitoring Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <ShieldCheck size={18} />
            <span className="text-xs font-bold uppercase">System Healthy</span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<Users size={24} />} 
            label="Total Users" 
            value={stats?.totalUsers || 0} 
            trend="+0%" 
          />
          <StatCard 
            icon={<Activity size={24} />} 
            label="Total Transactions" 
            value={stats?.totalTransactions || 0} 
            trend="+12%" 
          />
          <StatCard 
            icon={<AlertTriangle size={24} />} 
            label="Fraud Alerts" 
            value={stats?.activeAlerts || 0} 
            trend="Stable"
            warning={!!stats?.activeAlerts}
          />
        </div>

        {/* System Logs / Transactions */}
        <section className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Global Transaction Ledger</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search ledger..." 
                className="bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest leading-loose">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Risk Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{tx.recipient}</td>
                    <td className="px-6 py-4 text-sm font-bold">{formatCurrency(tx.amount)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(tx.date).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        tx.status === 'flagged' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {tx.status === 'flagged' ? 'Critical' : 'Certified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-500 hover:text-white p-1">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, warning = false }: { icon: React.ReactNode, label: string, value: number | string, trend: string, warning?: boolean }) {
  return (
    <div className={`p-6 rounded-3xl border shadow-xl ${warning ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-900 border-slate-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${warning ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
          <TrendingUp size={12} />
          {trend}
        </div>
      </div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-white">{value}</h3>
    </div>
  );
}
