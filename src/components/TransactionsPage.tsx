/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatCurrency, Transaction } from '../types';

interface TransactionsPageProps {
  onBack: () => void;
}

export default function TransactionsPage({ onBack }: TransactionsPageProps) {
  const { transactions } = useBank();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'processing'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(tx => 
        tx.recipient.toLowerCase().includes(lowerSearch) || 
        tx.category.toLowerCase().includes(lowerSearch) ||
        tx.accountNumber.includes(searchTerm)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(tx => tx.status === statusFilter);
    }

    // Type Filter
    if (typeFilter !== 'all') {
      result = result.filter(tx => tx.type === typeFilter);
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      switch (sortOrder) {
        case 'newest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'amount-high': return b.amount - a.amount;
        case 'amount-low': return a.amount - b.amount;
        default: return 0;
      }
    });

    return result;
  }, [transactions, searchTerm, statusFilter, typeFilter, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" id="transactions-page">
      <div className="max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 bg-slate-900 hover:bg-slate-800 rounded-2xl text-slate-400 transition-all border border-slate-800"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-white tracking-tight">Transactions</h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold text-sm hover:bg-emerald-500/20 transition-all">
            <Download size={18} />
            Export
          </button>
        </header>

        {/* Filters and Controls */}
        <section className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text"
                placeholder="Search by recipient, category, or account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative group">
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="appearance-none bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-10 text-white font-medium focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <Filter size={16} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase">Filters:</span>
            </div>
            
            {/* Type Filter Chips */}
            <FilterChip 
              active={typeFilter === 'all'} 
              onClick={() => setTypeFilter('all')} 
              label="All Types" 
            />
            <FilterChip 
              active={typeFilter === 'credit'} 
              onClick={() => setTypeFilter('credit')} 
              label="Credits" 
              color="emerald"
            />
            <FilterChip 
              active={typeFilter === 'debit'} 
              onClick={() => setTypeFilter('debit')} 
              label="Debits" 
              color="rose"
            />

            <div className="h-4 w-px bg-slate-800 mx-2 hidden sm:block" />

            {/* Status Filter Chips */}
            <FilterChip 
              active={statusFilter === 'all'} 
              onClick={() => setStatusFilter('all')} 
              label="All Status" 
            />
            <FilterChip 
              active={statusFilter === 'completed'} 
              onClick={() => setStatusFilter('completed')} 
              label="Completed" 
            />
            <FilterChip 
              active={statusFilter === 'failed'} 
              onClick={() => setStatusFilter('failed')} 
              label="Failed" 
            />
          </div>
        </section>

        {/* Results List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-semibold text-slate-500">
              Showing {filteredAndSortedTransactions.length} transactions
            </span>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="divide-y divide-slate-800/50">
              {filteredAndSortedTransactions.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center space-y-4 text-slate-500">
                  <div className="p-4 bg-slate-950 rounded-full">
                    <Calendar size={48} className="opacity-20" />
                  </div>
                  <p className="font-medium">No results match your criteria</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setTypeFilter('all');
                    }}
                    className="text-emerald-500 font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                filteredAndSortedTransactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function FilterChip({ 
  active, 
  onClick, 
  label, 
  color = 'slate' 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string;
  color?: 'slate' | 'emerald' | 'rose';
}) {
  const colorClasses = {
    slate: active ? 'bg-white text-slate-950 border-white' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700',
    emerald: active ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-950 text-emerald-500/70 border-emerald-500/20 hover:border-emerald-500/40',
    rose: active ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-950 text-rose-500/70 border-rose-500/20 hover:border-rose-500/40'
  };

  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${colorClasses[color]}`}
    >
      {label}
    </button>
  );
}

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-800/30 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
          tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
        }`}>
          {tx.type === 'credit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
        </div>
        <div>
          <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{tx.recipient}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-slate-400 font-medium">{tx.category}</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500">{new Date(tx.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-0 text-left sm:text-right flex items-center sm:flex-col justify-between sm:justify-center gap-2">
        <p className={`text-xl font-bold font-mono ${tx.type === 'credit' ? 'text-emerald-500' : 'text-white'}`}>
          {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
        </p>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
          tx.status === 'completed' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 
          tx.status === 'failed' ? 'bg-rose-500/5 text-rose-500 border-rose-500/20' : 
          'bg-amber-500/5 text-amber-500 border-amber-500/20'
        }`}>
          {tx.status}
        </span>
      </div>
    </motion.div>
  );
}
