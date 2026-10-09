import React, { useState, useEffect } from 'react';
import { BulkBottle, ExpenditureRecord, RefillTransaction, StationSettings, TabType } from './types';
import { loadStoredData, resetAllDataToDefaults, saveBulkBottles, saveExpenditures, saveSettings, saveTransactions } from './utils/storage';
import { truncateTo2Decimals } from './utils/formatters';
import { BottomNavigation } from './components/Navigation/BottomNavigation';
import { FillScreen } from './components/Fill/FillScreen';
import { BottlesScreen } from './components/Bottles/BottlesScreen';
import { LogScreen } from './components/Log/LogScreen';
import { StatsScreen } from './components/Stats/StatsScreen';
import { ExpensesScreen } from './components/Expenses/ExpensesScreen';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { ReceiptModal } from './components/Records/ReceiptModal';

export default function App() {
  const [tab, setTab] = useState<TabType>('fill');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Core state
  const [transactions, setTransactions] = useState<RefillTransaction[]>([]);
  const [bottles, setBottles] = useState<BulkBottle[]>([]);
  const [expenditures, setExpenditures] = useState<ExpenditureRecord[]>([]);
  const [settings, setSettings] = useState<StationSettings>(() => {
    const { settings: initialSettings } = loadStoredData();
    return initialSettings;
  });

  // Active bulk bottle for dispensing
  const [activeBottleId, setActiveBottleId] = useState<string>('');

  // Receipt modal state
  const [receiptTx, setReceiptTx] = useState<RefillTransaction | null>(null);

  // Initialize
  useEffect(() => {
    const loaded = loadStoredData();
    setTransactions(loaded.transactions);
    setBottles(loaded.bulkBottles);
    setExpenditures(loaded.expenditures);
    setSettings(loaded.settings);

    // Pick active bottle (or default first non-depleted)
    const active = loaded.bulkBottles.find((b) => b.status === 'active') || loaded.bulkBottles[0];
    if (active) {
      setActiveBottleId(active.id);
    }
    setDataLoaded(true);
  }, []);

  // Save changes
  useEffect(() => {
    if (!dataLoaded) return;
    saveTransactions(transactions);
  }, [transactions, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    saveBulkBottles(bottles);
  }, [bottles, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    saveExpenditures(expenditures);
  }, [expenditures, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    saveSettings(settings);
  }, [settings, dataLoaded]);

  // Active bottle object
  const activeBottle: BulkBottle =
    bottles.find((b) => b.id === activeBottleId) ||
    bottles.find((b) => b.status === 'active') ||
    bottles[0] || {
      id: 'BOTTLE-DEFAULT',
      name: 'A white one',
      totalCapacityKg: 55.0,
      remainingKg: 55.0,
      tareWeightKg: 42.0,
      status: 'active',
      totalDispensedKg: 0,
      totalRevenueGenerated: 0,
    };

  // Record a new fill (depletes the active 55kg bulk bottle!)
  const handleConfirmFill = (
    txData: Omit<RefillTransaction, 'id' | 'receiptNumber' | 'timestamp'>
  ) => {
    const now = new Date();
    const dateNum = now.toISOString().slice(0, 10).replace(/-/g, '');
    const id = `TX-${Date.now()}`;
    const receiptNumber = `REC-${dateNum}-${transactions.length + 1}`;

    const newTx: RefillTransaction = {
      ...txData,
      id,
      receiptNumber,
      timestamp: now.toISOString(),
    };

    setTransactions([newTx, ...transactions]);

    // Deplete gas from the active bottle!
    const newRemaining = Math.max(0, truncateTo2Decimals(activeBottle.remainingKg - txData.refillKg));
    const newDispensed = truncateTo2Decimals((activeBottle.totalDispensedKg || 0) + txData.refillKg);
    const newRevenue = truncateTo2Decimals((activeBottle.totalRevenueGenerated || 0) + txData.totalAmount);
    const isNowDepleted = newRemaining <= 0;

    const updatedBottles = bottles.map((b) =>
      b.id === activeBottle.id
        ? {
            ...b,
            remainingKg: newRemaining,
            totalDispensedKg: newDispensed,
            totalRevenueGenerated: newRevenue,
            status: isNowDepleted ? ('depleted' as const) : b.status,
            depletedAt: isNowDepleted ? now.toISOString() : b.depletedAt,
          }
        : b
    );
    setBottles(updatedBottles);

    // Deduct station bulk storage tank if enabled
    if (settings.autoDeductStockOnSale) {
      setSettings((prev) => ({
        ...prev,
        bulkStockRemainingKg: Math.max(0, truncateTo2Decimals(prev.bulkStockRemainingKg - txData.refillKg)),
      }));
    }
  };

  // Bottle Handlers
  const handleSelectActiveBottle = (bottle: BulkBottle) => {
    setActiveBottleId(bottle.id);
    setBottles((prev) =>
      prev.map((b) => ({
        ...b,
        status: b.id === bottle.id ? ('active' as const) : b.status === 'active' ? ('standby' as const) : b.status,
      }))
    );
  };

  const handleAddBottle = (
    bData: Omit<BulkBottle, 'id' | 'totalDispensedKg' | 'totalRevenueGenerated'>
  ) => {
    const newId = `BOTTLE-${Date.now()}`;
    const newBottle: BulkBottle = {
      ...bData,
      id: newId,
      totalDispensedKg: 0,
      totalRevenueGenerated: 0,
    };

    let updated = [newBottle, ...bottles];
    if (bData.status === 'active') {
      updated = updated.map((b) => ({
        ...b,
        status: b.id === newId ? ('active' as const) : b.status === 'active' ? ('standby' as const) : b.status,
      }));
      setActiveBottleId(newId);
    }
    setBottles(updated);
  };

  const handleDepleteBottle = (id: string) => {
    const updated = bottles.map((b) =>
      b.id === id
        ? {
            ...b,
            remainingKg: 0,
            status: 'depleted' as const,
            depletedAt: new Date().toISOString(),
          }
        : b
    );
    setBottles(updated);

    // If active bottle was depleted, switch to next standby bottle if any
    if (activeBottleId === id) {
      const nextAvailable = updated.find((b) => b.id !== id && b.remainingKg > 0);
      if (nextAvailable) {
        handleSelectActiveBottle(nextAvailable);
      }
    }
  };

  const handleRefillBottle = (id: string) => {
    const updated = bottles.map((b) =>
      b.id === id
        ? {
            ...b,
            remainingKg: b.totalCapacityKg || 55.0,
            status: 'active' as const,
          }
        : b
    );
    setBottles(updated);
  };

  const handleUpdateBottle = (updatedBottle: BulkBottle) => {
    setBottles(bottles.map((b) => (b.id === updatedBottle.id ? updatedBottle : b)));
  };

  const handleUpdateMonthlyOffset = (monthKey: string, offset: number) => {
    setSettings((prev) => ({
      ...prev,
      monthlyBottleOffsets: {
        ...(prev.monthlyBottleOffsets || {}),
        [monthKey]: offset,
      },
    }));
  };

  const handleDeleteBottle = (id: string) => {
    const updated = bottles.filter((b) => b.id !== id);
    setBottles(updated);
    if (activeBottleId === id && updated.length > 0) {
      setActiveBottleId(updated[0].id);
    }
  };

  // Expense Handlers
  const handleAddExpenditure = (expData: Omit<ExpenditureRecord, 'id'>) => {
    const newExp: ExpenditureRecord = {
      ...expData,
      id: `EXP-${Date.now()}`,
    };
    setExpenditures([newExp, ...expenditures]);
  };

  const handleDeleteExpenditure = (id: string) => {
    setExpenditures(expenditures.filter((e) => e.id !== id));
  };

  // Transaction Handlers
  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    const gasToReturn = truncateTo2Decimals(txToDelete.refillKg || 0);
    const revenueToDeduct = truncateTo2Decimals(txToDelete.totalAmount || 0);
    const targetBottleId = txToDelete.bottleId;

    // 1. Remove transaction from log
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // 2. Return gas back to the bulk bottle automatically
    if (gasToReturn > 0) {
      setBottles((prevBottles) => {
        // Resolve target bottle: match by bottleId, or fallback to active bottle, or first bottle
        const targetExists = prevBottles.some((b) => b.id === targetBottleId);
        const resolvedId = targetExists
          ? targetBottleId
          : (activeBottleId || prevBottles[0]?.id);

        if (!resolvedId) return prevBottles;

        return prevBottles.map((b) => {
          if (b.id !== resolvedId) return b;

          const maxCapacity = b.totalCapacityKg || 55.0;
          const newRemaining = Math.min(maxCapacity, truncateTo2Decimals(b.remainingKg + gasToReturn));
          const newDispensed = Math.max(0, truncateTo2Decimals((b.totalDispensedKg || 0) - gasToReturn));
          const newRevenue = Math.max(0, truncateTo2Decimals((b.totalRevenueGenerated || 0) - revenueToDeduct));
          const wasDepleted = b.status === 'depleted';

          return {
            ...b,
            remainingKg: newRemaining,
            totalDispensedKg: newDispensed,
            totalRevenueGenerated: newRevenue,
            // If the bottle was marked depleted, revive it now that gas has been returned
            status: wasDepleted && newRemaining > 0
              ? (b.id === activeBottleId || !prevBottles.some((other) => other.status === 'active' && other.id !== b.id)
                  ? ('active' as const)
                  : ('standby' as const))
              : b.status,
            depletedAt: newRemaining > 0 ? undefined : b.depletedAt,
          };
        });
      });

      // If current active bottle is empty/depleted, reactivate this bottle
      if (activeBottle.remainingKg <= 0 && targetBottleId) {
        setActiveBottleId(targetBottleId);
      }

      // 3. Return stock to station bulk storage tank if autoDeductStockOnSale is enabled
      if (settings.autoDeductStockOnSale) {
        setSettings((prev) => ({
          ...prev,
          bulkStockRemainingKg: truncateTo2Decimals(prev.bulkStockRemainingKg + gasToReturn),
        }));
      }
    }
  };

  // Reset
  const handleResetAllData = () => {
    const res = resetAllDataToDefaults();
    setTransactions(res.transactions);
    setBottles(res.bulkBottles);
    setExpenditures(res.expenditures);
    setSettings(res.settings);
    if (res.bulkBottles.length > 0) setActiveBottleId(res.bulkBottles[0].id);
  };

  return (
    <div className={`min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans ${tab === 'fill' ? 'h-screen h-[100dvh] overflow-hidden' : ''}`}>
      {/* Active Tab Screen */}
      <main className={`flex-1 ${tab === 'fill' ? 'overflow-hidden' : ''}`}>
        {tab === 'fill' && (
          <FillScreen
            settings={settings}
            activeBottle={activeBottle}
            bottles={bottles}
            onSelectActiveBottle={handleSelectActiveBottle}
            onConfirmFill={handleConfirmFill}
            onOpenBottleManager={() => setTab('bottles')}
          />
        )}

        {tab === 'bottles' && (
          <BottlesScreen
            bottles={bottles}
            activeBottle={activeBottle}
            settings={settings}
            onSelectActiveBottle={handleSelectActiveBottle}
            onAddBottle={handleAddBottle}
            onDepleteBottle={handleDepleteBottle}
            onDeleteBottle={handleDeleteBottle}
            onRefillBottle={handleRefillBottle}
            onUpdateBottle={handleUpdateBottle}
            onUpdateMonthlyOffset={handleUpdateMonthlyOffset}
          />
        )}

        {tab === 'log' && (
          <LogScreen
            transactions={transactions}
            bottles={bottles}
            activeBottle={activeBottle}
            settings={settings}
            onViewReceipt={(tx) => setReceiptTx(tx)}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {tab === 'stats' && (
          <StatsScreen
            transactions={transactions}
            expenditures={expenditures}
            settings={settings}
          />
        )}

        {tab === 'expenses' && (
          <ExpensesScreen
            expenditures={expenditures}
            settings={settings}
            onAddExpenditure={handleAddExpenditure}
            onDeleteExpenditure={handleDeleteExpenditure}
          />
        )}

        {tab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={setSettings}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Pinned Bottom Navigation Bar */}
      <BottomNavigation
        currentTab={tab}
        onTabChange={setTab}
      />

      {/* Individual Transaction Receipt Modal */}
      {receiptTx && (
        <ReceiptModal
          transaction={receiptTx}
          settings={settings}
          onClose={() => setReceiptTx(null)}
        />
      )}
    </div>
  );
}
