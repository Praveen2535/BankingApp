/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Plus, 
  Search,
  Bell,
  ArrowUpDown,
  LayoutDashboard,
  User as UserIcon,
  CreditCard,
  Settings
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatCurrency } from '../types';

interface DashboardProps {
  onTransfer: () => void;
  onViewAll: () => void;
  onAddFunds: () => void;
  onProfile: () => void;
  onAdmin: () => void;
}

export default function Dashboard({ onTransfer, onViewAll, onAddFunds, onProfile, onAdmin }: DashboardProps) {
  const { user, transactions } = useBank();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex" id="dashboard">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-slate-900 flex-col p-6 space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white">I</div>
          <span className="text-xl font-bold text-white tracking-tight">Indus</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavItem icon={<ArrowUpDown size={20} />} label="Transactions" onClick={onViewAll} />
          <NavItem icon={<CreditCard size={20} />} label="My Cards" />
          <NavItem icon={<UserIcon size={20} />} label="Profile" onClick={onProfile} />
          <NavItem icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <ShieldCheck size={16} />
            </div>
            <span className="text-sm font-semibold text-white">Safe Mode</span>
          </div>
          <p className="text-xs text-slate-500">Your account is secured with Biometric ID.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Hello, {user.name}</h2>
            <p className="text-slate-500 text-sm">Account: {user.accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}</p>
          </div>
          <div className="flex items-center gap-4">
            {user.role === 'admin' && (
              <button 
                onClick={onAdmin}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-bold uppercase"
              >
                Admin Panel
              </button>
            )}
            <button className="p-2 hover:bg-slate-900 rounded-full text-slate-400 transition-colors">
              <Search size={22} />
            </button>
            <button className="p-2 hover:bg-slate-900 rounded-full text-slate-400 transition-colors relative">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950" />
            </button>
          </div>
        </header>

        {/* Balance Card Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl"
            id="balance-card"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <p className="text-emerald-100 text-sm font-medium tracking-wide uppercase">Available Balance</p>
                <Wallet size={24} className="text-emerald-200" />
              </div>
              <h3 className="text-5xl font-bold tracking-tight mb-2">
                {formatCurrency(user.balance)}
              </h3>
              <p className="text-emerald-100/60 text-sm">+2.4% from last month</p>
            </div>
            {/* Abstract Background element */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <QuickAction 
              onClick={onTransfer} 
              icon={<ArrowUpRight size={24} />} 
              label="Send Money" 
              color="bg-emerald-500" 
              id="send-money-btn"
            />
            <QuickAction 
              onClick={onAddFunds}
              icon={<Plus size={24} />} 
              label="Add Funds" 
              color="bg-slate-800" 
            />
            <div className="col-span-2 bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Active Cards</p>
                  <p className="text-xs text-slate-500">2 Physical, 1 Virtual</p>
                </div>
              </div>
              <button className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Manage</button>
            </div>
          </div>
        </section>

        {/* Transactions Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
            <button 
              onClick={onViewAll}
              className="text-sm text-emerald-500 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="divide-y divide-slate-800">
              {transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No transactions yet</div>
              ) : (
                transactions.map((tx) => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={tx.id} 
                    className="p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-white">{tx.recipient}</p>
                        <p className="text-xs text-slate-500">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className={`font-bold ${tx.type === 'credit' ? 'text-emerald-500' : 'text-white'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        tx.status === 'failed' ? 'bg-rose-500/10 text-rose-500' : 
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
      active ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'
    }`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function QuickAction({ icon, label, color, onClick, id }: { icon: React.ReactNode; label: string; color: string; onClick?: () => void; id?: string }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className={`${color} text-white p-4 rounded-3xl flex flex-col justify-between h-32 hover:opacity-90 transform active:scale-95 transition-all shadow-lg overflow-hidden group relative`}
    >
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="font-semibold text-sm text-left leading-tight">{label}</span>
      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/5 rounded-full" />
    </button>
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
