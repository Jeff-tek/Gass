import React, { useState } from 'react';
import { BulkBottle, StationSettings } from '../../types';
import { formatDateTime, formatKg, formatNaira, truncateTo2Decimals, formatTruncated2 } from '../../utils/formatters';
import { Box, Plus, Check, Trash2, AlertTriangle, RefreshCw, Archive, Calendar, TrendingUp, Edit3, Settings2 } from 'lucide-react';

interface BottlesScreenProps {
  bottles: BulkBottle[];
  activeBottle: BulkBottle;
  settings: StationSettings;
  onSelectActiveBottle: (bottle: BulkBottle) => void;
  onAddBottle: (bottle: Omit<BulkBottle, 'id' | 'totalDispensedKg' | 'totalRevenueGenerated'>) => void;
  onDepleteBottle: (id: string) => void;
  onDeleteBottle: (id: string) => void;
  onRefillBottle: (id: string) => void;
  onUpdateBottle?: (bottle: BulkBottle) => void;
  onUpdateMonthlyOffset?: (monthKey: string, offset: number) => void;
}

export const BottlesScreen: React.FC<BottlesScreenProps> = ({
  bottles,
  activeBottle,
  settings,
  onSelectActiveBottle,
  onAddBottle,
  onDepleteBottle,
  onDeleteBottle,
  onRefillBottle,
  onUpdateBottle,
  onUpdateMonthlyOffset,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBottle, setEditingBottle] = useState<BulkBottle | null>(null);

  // Month selector for bottle counter (e.g. '2026-10')
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [showOffsetModal, setShowOffsetModal] = useState(false);
  const [manualOffsetInput, setManualOffsetInput] = useState<string>('');

  // Add bottle form states
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('55.00');
  const [tare, setTare] = useState('42.00');
  const [costPrice, setCostPrice] = useState('68750');
  const [notes, setNotes] = useState('');
  const [setAsActive, setSetAsActive] = useState(true);

  // Active bottle progress
  const activeRemainingPct = Math.round(
    (activeBottle.remainingKg / (activeBottle.totalCapacityKg || 55)) * 100
  );

  // Compute bottle counter for selected month
  // 1. Fully depleted bottles in this month
  const depletedThisMonth = bottles.filter((b) =>
    b.status === 'depleted' && b.depletedAt && b.depletedAt.startsWith(selectedMonth)
  );

  // 2. Active bottle contribution in this month
  const activeBottleGasThisMonth =
    activeBottle.startedAt && activeBottle.startedAt.startsWith(selectedMonth)
      ? activeBottle.totalDispensedKg || 0
      : activeBottle.totalDispensedKg || 0;

  // 3. Total gas dispensed from bottles in this month
  const totalGasFromFinishedBottles = depletedThisMonth.reduce((s, b) => s + (b.totalDispensedKg || 55), 0);
  const totalMonthGas = totalGasFromFinishedBottles + (selectedMonth === currentMonthKey ? activeBottleGasThisMonth : 0);

  // Standard 55kg bottles equivalent
  const recordedBottlesCount = truncateTo2Decimals(totalMonthGas / 55);

  // Manual pre-app or overlap offset for this month
  const currentOffset = settings.monthlyBottleOffsets?.[selectedMonth] || 0;
  const grandTotalMonthBottles = truncateTo2Decimals(recordedBottlesCount + currentOffset);

  // Profit estimation for active bottle
  const activeBottleProjectedRevenue = (activeBottle.totalCapacityKg || 55) * (settings.currentGasPricePerKg || 1600);
  const activeBottleProjectedProfit = activeBottleProjectedRevenue - (activeBottle.costPrice || 68750);
  const activeBottleCurrentProfit = (activeBottle.totalRevenueGenerated || 0) - (activeBottle.costPrice || 68750);

  const activeAndStandby = bottles.filter((b) => b.status !== 'depleted' && b.id !== activeBottle.id);
  const depletedBottles = bottles.filter((b) => b.status === 'depleted' || b.remainingKg <= 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const capNum = parseFloat(capacity) || 55.0;

    onAddBottle({
      name: name.trim(),
      totalCapacityKg: capNum,
      remainingKg: capNum,
      tareWeightKg: parseFloat(tare) || 42.0,
      status: setAsActive ? 'active' : 'standby',
      startedAt: new Date().toISOString(),
      costPrice: parseFloat(costPrice) || 68750,
      notes: notes.trim() || undefined,
    });

    setName('');
    setNotes('');
    setShowAddModal(false);
  };

  const handleSaveOffset = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualOffsetInput) || 0;
    if (onUpdateMonthlyOffset) {
      onUpdateMonthlyOffset(selectedMonth, val);
    }
    setShowOffsetModal(false);
  };

  const handleSaveEditBottle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBottle || !onUpdateBottle) return;
    onUpdateBottle(editingBottle);
    setEditingBottle(null);
  };

  const monthLabel = new Date(`${selectedMonth}-01`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-md mx-auto px-3.5 pt-2 pb-24 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-1.5">
          <Box className="w-5 h-5 text-slate-800" />
          <h2 className="text-sm font-bold tracking-tight text-slate-900">
            55kg Bulk Supply Bottles
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New 55kg Bottle</span>
        </button>
      </div>

      {/* MONTHLY BOTTLE COUNTER (Flexible for any start day / overlapping months) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              MONTHLY BOTTLE TRACKER
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-900">{monthLabel}</span>
            </div>
          </div>

          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-mono outline-none"
          />
        </div>

        {/* Big Counter Display */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block">Total 55kg Bottles Sold</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                {grandTotalMonthBottles}
              </span>
              <span className="text-xs font-bold font-mono text-slate-500">
                bottles ({totalMonthGas.toFixed(0)} kg)
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setManualOffsetInput(currentOffset.toString());
              setShowOffsetModal(true);
            }}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm"
            title="Adjust count or add bottles sold before app start"
          >
            <Settings2 className="w-3 h-3 text-slate-500" />
            <span>Adjust Count</span>
          </button>
        </div>

        {/* Counter Breakdown */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
          <span>Fully Depleted: <strong className="text-slate-800">{depletedThisMonth.length}</strong></span>
          <span>·</span>
          <span>In Progress: <strong className="text-slate-800">{(activeBottleGasThisMonth / 55).toFixed(1)}</strong></span>
          {currentOffset > 0 && (
            <>
              <span>·</span>
              <span>Manual Offset: <strong className="text-emerald-700">+{currentOffset}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* Card 2: Active Dispensing Bottle Details & Profit Tracker */}
      <div className="bg-white rounded-3xl p-5 border-2 border-slate-900 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">
              {activeBottle.name}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Dispensing Now
            </span>
          </div>
          <span className="text-xs font-bold font-mono text-slate-900">
            {formatTruncated2(activeBottle.remainingKg)} / {formatTruncated2(activeBottle.totalCapacityKg)} kg
          </span>
        </div>

        {/* Depletion Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Remaining Gas</span>
            <span className="font-bold text-slate-800">{activeRemainingPct}% left</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activeBottle.remainingKg <= 5
                  ? 'bg-rose-500'
                  : activeBottle.remainingKg <= 15
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(3, activeRemainingPct)}%` }}
            />
          </div>
        </div>

        {/* BOTTLE PROFIT & VARIANCE TRACKER (Number 3) */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bottle Financials & Margin</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Cost: {formatNaira(activeBottle.costPrice || 68750)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Revenue so far</span>
              <span className="font-bold text-slate-900">{formatNaira(activeBottle.totalRevenueGenerated || 0)}</span>
              <span className="text-[10px] text-slate-500 block">
                {formatKg(activeBottle.totalDispensedKg || 0)} dispensed
              </span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase block font-sans">Full Bottle Profit</span>
              <span className="font-bold text-emerald-700">+{formatNaira(activeBottleProjectedProfit)}</span>
              <span className="text-[10px] text-emerald-600 block">
                ~{Math.round((activeBottleProjectedProfit / (activeBottle.costPrice || 68750)) * 100)}% margin
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions on Active Bottle */}
        <div className="flex items-center gap-2 pt-1">
          {activeBottle.remainingKg <= 0 ? (
            <button
              onClick={() => onDepleteBottle(activeBottle.id)}
              className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors text-center shadow-sm"
            >
              Confirm Depleted & Switch
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm(`Mark "${activeBottle.name}" as depleted and archive it?`)) {
                  onDepleteBottle(activeBottle.id);
                }
              }}
              className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Mark Depleted
            </button>
          )}

          <button
            onClick={() => {
              if (confirm(`Top up "${activeBottle.name}" back to full 55.00 kg?`)) {
                onRefillBottle(activeBottle.id);
              }
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
            title="Refill back to 55kg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refill 55kg</span>
          </button>
        </div>
      </div>

      {/* Standby / Other Bottles */}
      {activeAndStandby.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block px-1">
            Standby Bottles ({activeAndStandby.length})
          </span>
          {activeAndStandby.map((bottle) => (
            <div
              key={bottle.id}
              className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-bold text-slate-900">{bottle.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  Remaining: <strong className="text-slate-800">{formatTruncated2(bottle.remainingKg)} kg</strong> / {formatTruncated2(bottle.totalCapacityKg)} kg
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectActiveBottle(bottle)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
                >
                  Set Active
                </button>
                <button
                  onClick={() => onDeleteBottle(bottle.id)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Depleted Bottles Archive with Profit & Variance Tracker */}
      {depletedBottles.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block px-1 flex items-center gap-1">
            <Archive className="w-3.5 h-3.5" />
            <span>Completed Bottles History & Net Profit ({depletedBottles.length})</span>
          </span>
          <div className="space-y-2">
            {depletedBottles.map((b) => {
              const bottleProfit = (b.totalRevenueGenerated || 0) - (b.costPrice || 68750);
              const variance = truncateTo2Decimals((b.totalDispensedKg || 55) - (b.totalCapacityKg || 55));
              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{b.name}</span>
                    <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Profit: +{formatNaira(bottleProfit)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono">
                    <div>
                      Cost: {formatNaira(b.costPrice || 68750)} · Sold: {formatNaira(b.totalRevenueGenerated || 0)}
                    </div>
                    <div className="text-right">
                      Yield: <strong className="text-slate-800">{formatKg(b.totalDispensedKg || 55)}</strong> / {formatTruncated2(b.totalCapacityKg || 55)}kg
                      {variance !== 0 && (
                        <span className={variance < 0 ? 'text-rose-600 block' : 'text-emerald-600 block'}>
                          Variance: {variance > 0 ? `+${formatTruncated2(variance)}` : formatTruncated2(variance)} kg
                        </span>
                      )}
                    </div>
                  </div>

                  {b.depletedAt && (
                    <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-100 flex items-center justify-between">
                      <span>Completed: {formatDateTime(b.depletedAt)}</span>
                      {onUpdateBottle && (
                        <button
                          onClick={() => setEditingBottle(b)}
                          className="text-slate-500 hover:text-slate-900 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Adjust Monthly Bottle Count Offset Modal */}
      {showOffsetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Adjust Monthly Bottle Count
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                For {monthLabel}. Add bottles sold before using the app or adjust for month overlaps.
              </p>
            </div>

            <form onSubmit={handleSaveOffset} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Manual Bottle Offset (+ bottles)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={manualOffsetInput}
                  onChange={(e) => setManualOffsetInput(e.target.value)}
                  placeholder="e.g. 3 or 5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-bold font-mono text-slate-900 outline-none focus:border-slate-800"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Example: If you sold 4 bottles earlier this month before recording on this app, enter 4.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOffsetModal(false)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bottle Details Modal */}
      {editingBottle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Edit Bottle Details
            </h3>

            <form onSubmit={handleSaveEditBottle} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Bottle Name</label>
                <input
                  type="text"
                  value={editingBottle.name}
                  onChange={(e) => setEditingBottle({ ...editingBottle, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Purchase Cost (₦)</label>
                <input
                  type="number"
                  value={editingBottle.costPrice}
                  onChange={(e) => setEditingBottle({ ...editingBottle, costPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Depleted Date</label>
                <input
                  type="datetime-local"
                  value={editingBottle.depletedAt ? editingBottle.depletedAt.slice(0, 16) : ''}
                  onChange={(e) => setEditingBottle({ ...editingBottle, depletedAt: new Date(e.target.value).toISOString() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBottle(null)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Bottle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add New 55kg Bulk Bottle
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bottle Name / Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. A white one, Bottle 3 (Silver 55kg)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Gas Capacity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="55.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:border-slate-800 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Standard bulk is 55 kg</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Empty Tare (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tare}
                    onChange={(e) => setTare(e.target.value)}
                    placeholder="42.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:border-slate-800 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Empty cylinder metal tare</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Purchase Cost Price (₦)
                </label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="68750"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:border-slate-800 outline-none"
                />
                <span className="text-[10px] text-slate-400">Wholesale cost paid to fill/buy this 55kg</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Notes / Supplier (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Nipco depot batch #41, new brass valve"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="setAsActive"
                  checked={setAsActive}
                  onChange={(e) => setSetAsActive(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-800 w-4 h-4"
                />
                <label htmlFor="setAsActive" className="text-xs font-medium text-slate-700">
                  Set as current Active Bottle right now
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm"
                >
                  Save & Add Bottle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
