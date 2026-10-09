import React, { useState } from 'react';
import { ExpenseCategory, ExpenditureRecord, StationSettings } from '../../types';
import { formatDateTime, formatNaira, truncateTo2Decimals } from '../../utils/formatters';
import { Wallet, Plus, Trash2, Calendar } from 'lucide-react';

interface ExpensesScreenProps {
  expenditures: ExpenditureRecord[];
  settings: StationSettings;
  onAddExpenditure: (exp: Omit<ExpenditureRecord, 'id'>) => void;
  onDeleteExpenditure: (id: string) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Bulk Gas (Depot/Tanker)',
  'Generator Fuel & Diesel',
  'Power / NEPA Bill',
  'Staff Wages / Allowance',
  'Station Rent & Levies',
  'Maintenance & Spares',
  'Scale Calibration & Weights',
  'Station Consumables',
  'Other Expenses',
];

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
  expenditures,
  settings,
  onAddExpenditure,
  onDeleteExpenditure,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('Generator Fuel & Diesel');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const totalExpense = truncateTo2Decimals(expenditures.reduce((sum, e) => sum + e.amount, 0));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !desc.trim()) return;

    // Build timestamp with chosen date and current time
    let timestamp = new Date().toISOString();
    if (expenseDate) {
      const now = new Date();
      const [year, month, day] = expenseDate.split('-').map(Number);
      const chosenDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
      if (!isNaN(chosenDate.getTime())) {
        timestamp = chosenDate.toISOString();
      }
    }

    onAddExpenditure({
      timestamp,
      category,
      description: desc.trim(),
      amount: truncateTo2Decimals(amt),
      paymentMethod: 'Cash',
      recordedBy: settings.operatorName,
    });

    setDesc('');
    setAmount('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setShowAddModal(false);
  };

  return (
    <div className="w-full max-w-md mx-auto px-3.5 pt-2 pb-24 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-1.5">
          <Wallet className="w-5 h-5 text-slate-800" />
          <h2 className="text-sm font-bold tracking-tight text-slate-900">
            Expenditure ({expenditures.length})
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-xl shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Summary Total Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium block">Total Recorded Expenses</span>
          <span className="text-xl font-black font-mono text-rose-600 tabular-nums">
            {formatNaira(totalExpense)}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {expenditures.length} entries
        </span>
      </div>

      {/* Expenses List */}
      <div className="space-y-2">
        {expenditures.map((exp) => (
          <div
            key={exp.id}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-slate-900">
                {exp.description}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {exp.category} · {formatDateTime(exp.timestamp)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-rose-600 tabular-nums">
                -{formatNaira(exp.amount)}
              </span>
              <button
                onClick={() => onDeleteExpenditure(exp.id)}
                className="p-1 text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Record Station Expense
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
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. Generator diesel or rubber seals"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Amount (₦) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Expense Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
