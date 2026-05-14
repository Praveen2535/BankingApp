/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BankProvider, useBank } from './context/BankContext';
import BiometricRegistration from './components/BiometricRegistration';
import Dashboard from './components/Dashboard';
import TransactionsPage from './components/TransactionsPage';
import AdminPanel from './components/AdminPanel';
import TransferFlow from './components/TransferFlow';
import AddFundsModal from './components/AddFundsModal';
import ProfileModal from './components/ProfileModal';
import NotificationDrawer from './components/NotificationDrawer';
import { AnimatePresence } from 'motion/react';

function AppContent() {
  const { user } = useBank();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [view, setView] = useState<'dashboard' | 'transactions' | 'admin'>('dashboard');

  if (!user.isRegistered) {
    return <BiometricRegistration />;
  }

  return (
    <>
      {view === 'dashboard' ? (
        <Dashboard 
          onTransfer={() => setShowTransfer(true)} 
          onViewAll={() => setView('transactions')}
          onAddFunds={() => setShowAddFunds(true)}
          onProfile={() => setShowProfile(true)}
          onAdmin={() => setView('admin')}
          onShowNotifications={() => setShowNotifications(true)}
        />
      ) : view === 'transactions' ? (
        <TransactionsPage onBack={() => setView('dashboard')} />
      ) : (
        <AdminPanel onBack={() => setView('dashboard')} />
      )}
      
      <AnimatePresence>
        {showTransfer && <TransferFlow onClose={() => setShowTransfer(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAddFunds && <AddFundsModal onClose={() => setShowAddFunds(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showNotifications && <NotificationDrawer onClose={() => setShowNotifications(false)} />}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BankProvider>
      <AppContent />
    </BankProvider>
  );
}

