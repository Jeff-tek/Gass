import React, { useState } from 'react';
import { ExpenditureRecord, RefillTransaction, StationSettings } from '../../types';
import { formatDateTime, formatKg, formatNaira, truncateTo2Decimals, formatTruncated2 } from '../../utils/formatters';
import { 
  BarChart3, 
  Coins, 
  Fuel, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

interface StatsScreenProps {
  transactions: RefillTransaction[];
  expenditures: ExpenditureRecord[];
  settings: StationSettings;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  transactions,
  expenditures,
  settings,
}) => {
  // Current month key (YYYY-MM) e.g. "2026-10"
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Helper to convert "2026-10" into "October 2026"
  const formatMonthLabel = (monthKey: string): string => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const d = new Date(year, month, 1);
    if (isNaN(d.getTime())) return monthKey;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // State to track expanded monthly cards in the Monthly Summary
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({
    [currentMonthKey]: true, // Default open current month
  });

  const toggleMonthExpand = (key: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 1. Collect all distinct months from transactions and expenditures
  const allMonthsSet = new Set<string>();
  allMonthsSet.add(currentMonthKey);

  transactions.forEach((t) => {
    if (t.timestamp && t.timestamp.length >= 7) {
      allMonthsSet.add(t.timestamp.slice(0, 7));
    }
  });

  expenditures.forEach((e) => {
    if (e.timestamp && e.timestamp.length >= 7) {
      allMonthsSet.add(e.timestamp.slice(0, 7));
    }
  });

  // Sort months chronologically descending (newest month first)
  const sortedMonths = Array.from(allMonthsSet).sort((a, b) => b.localeCompare(a));

  // Compute stats helper for any month
  const getMonthStats = (monthKey: string) => {
    const monthTxs = transactions.filter((t) => t.timestamp && t.timestamp.startsWith(monthKey));
    const monthExps = expenditures.filter((e) => e.timestamp && e.timestamp.startsWith(monthKey));

    const revenue = truncateTo2Decimals(
      monthTxs.reduce((sum, t) => sum + (t.amountPaid || t.totalAmount), 0)
    );
    const kg = truncateTo2Decimals(
      monthTxs.reduce((sum, t) => sum + t.refillKg, 0)
    );
    const fillsCount = monthTxs.length;

    const expensesTotal = truncateTo2Decimals(
      monthExps.reduce((sum, e) => sum + e.amount, 0)
    );
    const expensesCount = monthExps.length;

    const netProfit = truncateTo2Decimals(revenue - expensesTotal);

    // Payment methods breakdown for this month
    const cash = truncateTo2Decimals(
      monthTxs
        .filter((t) => t.paymentMethod === 'Cash')
        .reduce((sum, t) => sum + (t.amountPaid || t.totalAmount), 0)
    );
    const transfer = truncateTo2Decimals(
      monthTxs
        .filter((t) => t.paymentMethod === 'Transfer')
        .reduce((sum, t) => sum + (t.amountPaid || t.totalAmount), 0)
    );
    const pos = truncateTo2Decimals(
      monthTxs
        .filter((t) => t.paymentMethod === 'POS')
        .reduce((sum, t) => sum + (t.amountPaid || t.totalAmount), 0)
    );

    // Expenditures by category in this month
    const expenseCategories: Record<string, number> = {};
    monthExps.forEach((e) => {
      expenseCategories[e.category] = truncateTo2Decimals(
        (expenseCategories[e.category] || 0) + e.amount
      );
    });

    const avgKgPerFill = fillsCount > 0 ? formatTruncated2(kg / fillsCount) : '0.00';

    return {
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      isCurrentMonth: monthKey === currentMonthKey,
      revenue,
      kg,
      fillsCount,
      avgKgPerFill,
      expensesTotal,
      expensesCount,
      netProfit,
      paymentBreakdown: { cash, transfer, pos },
      expenseCategories,
      expensesList: monthExps,
      transactionsList: monthTxs,
    };
  };

  // Current Month Data
  const currentMonthData = getMonthStats(currentMonthKey);

  // All Months Summary Data
  const monthlySummaries = sortedMonths.map((mKey) => getMonthStats(mKey));

  return (
    <div className="w-full max-w-md mx-auto px-3.5 pt-2 pb-24 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-5 h-5 text-slate-800" />
          <h2 className="text-sm font-bold tracking-tight text-slate-900">
            Station Stats & Summary
          </h2>
        </div>
        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-[11px] font-bold text-emerald-700">
          <Calendar className="w-3 h-3 text-emerald-600" />
          <span>{currentMonthData.monthLabel}</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: CURRENT MONTH STATS (Replaces daily stats)            */}
      {/* ============================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Current Month Stats
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {currentMonthData.fillsCount} fills recorded
          </span>
        </div>

        {/* 4-Card Primary Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Month Sales */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold text-slate-600">Month's Sales</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black font-mono text-slate-900 tabular-nums">
              {formatNaira(currentMonthData.revenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{currentMonthData.fillsCount} customer fills</span>
            </div>
          </div>

          {/* Card 2: Month Gas Dispensed */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold text-slate-600">Gas Dispensed</span>
              <Fuel className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black font-mono text-slate-900 tabular-nums">
              {formatKg(currentMonthData.kg)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Avg {currentMonthData.avgKgPerFill} kg / fill
            </div>
          </div>

          {/* Card 3: Month Expenditures */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold text-slate-600">Month's Expenses</span>
              <Wallet className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-black font-mono text-rose-600 tabular-nums">
              {formatNaira(currentMonthData.expensesTotal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-rose-500 shrink-0" />
              <span>
                {currentMonthData.expensesCount}{' '}
                {currentMonthData.expensesCount === 1 ? 'expense entry' : 'expense entries'}
              </span>
            </div>
          </div>

          {/* Card 4: Net Cash Flow / Profit */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold text-slate-600">Net Balance</span>
              {currentMonthData.netProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div
              className={`text-xl font-black font-mono tabular-nums ${
                currentMonthData.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatNaira(currentMonthData.netProfit)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Sales minus expenses
            </div>
          </div>
        </div>

        {/* Current Month Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Current Month Payment Channels</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {formatNaira(currentMonthData.revenue)}
            </span>
          </div>

          {/* Proportion bar */}
          {currentMonthData.revenue > 0 && (
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${(currentMonthData.paymentBreakdown.cash / currentMonthData.revenue) * 100}%`,
                }}
                className="bg-emerald-500 h-full"
                title="Cash"
              />
              <div
                style={{
                  width: `${(currentMonthData.paymentBreakdown.transfer / currentMonthData.revenue) * 100}%`,
                }}
                className="bg-blue-500 h-full"
                title="Transfer"
              />
              <div
                style={{
                  width: `${(currentMonthData.paymentBreakdown.pos / currentMonthData.revenue) * 100}%`,
                }}
                className="bg-purple-500 h-full"
                title="POS"
              />
            </div>
          )}

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-700 font-sans">Cash</span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums">
                {formatNaira(currentMonthData.paymentBreakdown.cash)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-slate-700 font-sans">Bank Transfer</span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums">
                {formatNaira(currentMonthData.paymentBreakdown.transfer)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span className="text-slate-700 font-sans">POS / Card</span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums">
                {formatNaira(currentMonthData.paymentBreakdown.pos)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Month Expenses Breakdown (if any) */}
        {currentMonthData.expensesCount > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-rose-500" />
                <span>Current Month Expenses Breakdown</span>
              </div>
              <span className="text-xs font-bold font-mono text-rose-600">
                -{formatNaira(currentMonthData.expensesTotal)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {Object.entries(currentMonthData.expenseCategories).map(([cat, amount]) => (
                <div
                  key={cat}
                  className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0"
                >
                  <span className="text-slate-600 truncate max-w-[200px]">{cat}</span>
                  <span className="font-bold font-mono text-slate-900 tabular-nums">
                    {formatNaira(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: MONTHLY SUMMARY (Replaces All-Time Performance)       */}
      {/* ============================================================== */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            Monthly Summary
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {monthlySummaries.length} {monthlySummaries.length === 1 ? 'month' : 'months'}
          </span>
        </div>

        {/* List of Monthly Summary Cards */}
        <div className="space-y-3">
          {monthlySummaries.map((m) => {
            const isExpanded = !!expandedMonths[m.monthKey];

            return (
              <div
                key={m.monthKey}
                className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
                  m.isCurrentMonth
                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Monthly Card Header */}
                <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {m.monthLabel}
                    </span>
                    {m.isCurrentMonth && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md">
                        Current Month
                      </span>
                    )}
                  </div>

                  {/* Net badge on header */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded-lg ${
                        m.netProfit >= 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      Net {m.netProfit >= 0 ? '+' : ''}{formatNaira(m.netProfit)}
                    </span>
                    <button
                      onClick={() => toggleMonthExpand(m.monthKey)}
                      aria-label="Toggle month details"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 4-Item Grid for this Month */}
                <div className="p-3.5 grid grid-cols-2 gap-2 text-xs">
                  {/* Sales */}
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-slate-500 text-[11px] block font-medium">Sales Revenue</span>
                    <span className="text-sm font-black font-mono text-slate-900 tabular-nums block mt-0.5">
                      {formatNaira(m.revenue)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {m.fillsCount} fills
                    </span>
                  </div>

                  {/* Gas Dispensed */}
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-slate-500 text-[11px] block font-medium">Gas Dispensed</span>
                    <span className="text-sm font-black font-mono text-slate-900 tabular-nums block mt-0.5">
                      {formatKg(m.kg)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Avg {m.avgKgPerFill} kg / fill
                    </span>
                  </div>

                  {/* Expenditures for this specific month */}
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-slate-500 text-[11px] block font-medium">
                      Expenditure ({m.monthLabel.split(' ')[0]})
                    </span>
                    <span className="text-sm font-black font-mono text-rose-600 tabular-nums block mt-0.5">
                      {formatNaira(m.expensesTotal)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {m.expensesCount} {m.expensesCount === 1 ? 'expense' : 'expenses'}
                    </span>
                  </div>

                  {/* Net Margin */}
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-slate-500 text-[11px] block font-medium">Net Profit</span>
                    <span
                      className={`text-sm font-black font-mono tabular-nums block mt-0.5 ${
                        m.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {formatNaira(m.netProfit)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Revenue - Expenses
                    </span>
                  </div>
                </div>

                {/* Expanded Month Breakdown (Shows Payment details and itemized expenditures for this month) */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 space-y-3">
                    {/* Payment methods for this month */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                        <span>Payment Breakdown</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          Cash / Transfer / POS
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                        <div className="bg-slate-50 p-2 rounded-lg text-center">
                          <span className="text-[10px] text-slate-500 font-sans block">Cash</span>
                          <span className="font-bold text-slate-800">
                            {formatNaira(m.paymentBreakdown.cash)}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg text-center">
                          <span className="text-[10px] text-slate-500 font-sans block">Transfer</span>
                          <span className="font-bold text-slate-800">
                            {formatNaira(m.paymentBreakdown.transfer)}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg text-center">
                          <span className="text-[10px] text-slate-500 font-sans block">POS</span>
                          <span className="font-bold text-slate-800">
                            {formatNaira(m.paymentBreakdown.pos)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Itemized Expenditures for this specific month */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                        <span className="flex items-center gap-1 text-rose-700">
                          <Wallet className="w-3 h-3 text-rose-500" />
                          <span>{m.monthLabel} Expenditures ({m.expensesList.length})</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-rose-600">
                          Total: -{formatNaira(m.expensesTotal)}
                        </span>
                      </div>

                      {m.expensesList.length === 0 ? (
                        <div className="text-center py-3 bg-slate-50 rounded-xl text-slate-400 text-xs">
                          No expenditures recorded in {m.monthLabel}.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {m.expensesList.map((exp) => (
                            <div
                              key={exp.id}
                              className="bg-slate-50/90 rounded-xl p-2.5 flex items-center justify-between text-xs border border-slate-100"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-semibold text-slate-800 truncate">
                                  {exp.description}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {exp.category} · {formatDateTime(exp.timestamp)}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-rose-600 tabular-nums shrink-0">
                                -{formatNaira(exp.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
