import React, { useState } from 'react';
import { BulkBottle, RefillTransaction, StationSettings } from '../../types';
import { formatDateTime, formatKg, formatNaira, generateReceiptText, truncateTo2Decimals, formatTruncated2 } from '../../utils/formatters';
import { Receipt, Search, Eye, Trash2, Image, Check, X, AlertTriangle } from 'lucide-react';
import { DailySalesPngModal } from './DailySalesPngModal';

interface LogScreenProps {
  transactions: RefillTransaction[];
  bottles: BulkBottle[];
  activeBottle: BulkBottle;
  settings: StationSettings;
  onViewReceipt: (tx: RefillTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const LogScreen: React.FC<LogScreenProps> = ({
  transactions,
  bottles,
  activeBottle,
  settings,
  onViewReceipt,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletedToast, setDeletedToast] = useState<{ kg: number; bottleName: string } | null>(null);
  const [txPendingDelete, setTxPendingDelete] = useState<RefillTransaction | null>(null);

  // Selected date for daily report (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [showPngModal, setShowPngModal] = useState<boolean>(false);

  // Day specific calculations
  const dayTransactions = transactions.filter((t) => t.timestamp.startsWith(selectedDate));
  const dayRevenue = dayTransactions.reduce((acc, t) => acc + (t.amountPaid || t.totalAmount), 0);
  const dayKg = truncateTo2Decimals(dayTransactions.reduce((acc, t) => acc + t.refillKg, 0));

  // Filtered for search
  const filtered = transactions.filter((t) =>
    t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customerPhone.includes(searchTerm)
  );

  return (
    <div className="w-full max-w-md mx-auto px-3.5 pt-2 pb-24 space-y-3.5 relative">
      {/* Floating Toast Notification on Gas Returned to Bottle */}
      {deletedToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-white">Fill Deleted & Gas Returned</div>
            <div className="text-slate-300 font-mono text-[11px] mt-0.5">
              +{formatKg(deletedToast.kg)} gas returned to {deletedToast.bottleName}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-1.5">
          <Receipt className="w-5 h-5 text-slate-800" />
          <h2 className="text-sm font-bold tracking-tight text-slate-900">
            Filling Logs
          </h2>
        </div>

        {/* Date Selector */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-mono shadow-sm outline-none"
        />
      </div>

      {/* Daily Sales Summary Card with PNG Button */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              DAILY SALES SUMMARY
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="text-right">
            <span className="text-base font-black font-mono text-slate-900 tabular-nums">
              {formatNaira(dayRevenue)}
            </span>
            <span className="text-[11px] text-emerald-700 font-mono block font-semibold">
              {formatKg(dayKg)} · {dayTransactions.length} {dayTransactions.length === 1 ? 'fill' : 'fills'}
            </span>
          </div>
        </div>

        {/* Action Button: Generate / Share Uneditable PNG */}
        <button
          onClick={() => setShowPngModal(true)}
          className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Image className="w-4 h-4 text-amber-400" />
          <span>Print / Share Daily Sales (PNG Format)</span>
        </button>
      </div>

      {/* Search Input (only shown if there are transactions) */}
      {transactions.length > 5 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fills..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-slate-800 shadow-sm"
          />
        </div>
      )}

      {/* Minimal & Scannable Customer Refill Logs List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>Customer Fills ({filtered.length})</span>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-200">
            No customer fills recorded yet.
          </div>
        ) : (
          filtered.map((tx) => {
            const timeStr = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                {/* Left: Time & Dispensed KG */}
                <div className="flex items-center gap-3">
                  <div className="text-xs font-mono text-slate-400 shrink-0">
                    {timeStr}
                  </div>
                  <div>
                    <div className="text-sm font-black font-mono text-emerald-700">
                      +{formatKg(tx.refillKg)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                      <span>Scale: {formatTruncated2(tx.initialScaleReadingKg)} → {formatTruncated2(tx.targetScaleReadingKg)} kg</span>
                      {tx.bottleName && (
                        <span className="text-[10px] text-slate-500 font-sans bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                          {tx.bottleName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount, Payment, & Quick Actions */}
                <div className="flex items-center gap-2.5">
                  <div className="text-right font-mono">
                    <div className="text-sm font-black text-slate-900 tabular-nums">
                      {formatNaira(tx.totalAmount)}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {tx.paymentMethod}
                    </span>
                  </div>

                  <button
                    onClick={() => onViewReceipt(tx)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                    title="View Receipt"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setTxPendingDelete(tx)}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                    title={`Delete fill and return ${formatKg(tx.refillKg)} gas to bottle`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal (Native In-App Modal - 100% Reliable in All Browsers) */}
      {txPendingDelete && (() => {
        const bottle = bottles.find((b) => b.id === txPendingDelete.bottleId) || activeBottle;
        const bottleName = txPendingDelete.bottleName || bottle?.name || 'bulk bottle';
        const gasToReturn = truncateTo2Decimals(txPendingDelete.refillKg || 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-rose-950 leading-tight">Delete Fill Record?</h3>
                    <p className="text-[11px] text-rose-700 font-medium">Automatic gas restoration</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTxPendingDelete(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-100/60 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Transaction Summary Card */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Receipt No:</span>
                    <span className="font-bold text-slate-900">{txPendingDelete.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Customer:</span>
                    <span className="text-slate-800">{txPendingDelete.customerName || 'Walk-in'}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Gas Dispensed:</span>
                    <span className="font-black text-emerald-700">+{formatKg(gasToReturn)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Amount:</span>
                    <span className="font-black text-slate-900">{formatNaira(txPendingDelete.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Date & Time:</span>
                    <span>{formatDateTime(txPendingDelete.timestamp)}</span>
                  </div>
                </div>

                {/* Gas return alert banner */}
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div className="leading-snug">
                    <p className="font-bold text-emerald-900">
                      Gas will be returned to bottle:
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      <strong>+{formatKg(gasToReturn)}</strong> will be credited directly back to <strong>"{bottleName}"</strong> immediately.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTxPendingDelete(null)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idToDelete = txPendingDelete.id;
                      onDeleteTransaction(idToDelete);
                      setDeletedToast({
                        kg: gasToReturn,
                        bottleName,
                      });
                      setTxPendingDelete(null);
                      setTimeout(() => setDeletedToast(null), 3500);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete & Return Gas</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Daily Sales PNG Report Modal */}
      {showPngModal && (
        <DailySalesPngModal
          selectedDate={selectedDate}
          transactions={transactions}
          bottles={bottles}
          activeBottle={activeBottle}
          settings={settings}
          onClose={() => setShowPngModal(false)}
        />
      )}
    </div>
  );
};
