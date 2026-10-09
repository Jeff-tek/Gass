import { RefillTransaction, StationSettings } from '../types';

/**
 * Truncates any number to exactly 2 decimal places without rounding / approximating.
 * Example: 2.759 -> 2.75 (never 2.76 or 2.760)
 * Example: 2.860 -> 2.86 (never 2.90 or 2.900)
 */
export const truncateTo2Decimals = (value: number | string): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 0;
  const sign = num < 0 ? -1 : 1;
  const abs = Math.abs(num);
  const parts = abs.toFixed(10).split('.');
  const intPart = parts[0];
  const decPart = parts[1] || '00';
  const truncatedStr = `${intPart}.${decPart.slice(0, 2)}`;
  return sign * parseFloat(truncatedStr);
};

/**
 * Formats any number to always exactly 2 decimal points with truncation (never rounding).
 * Example: 2.759 -> "2.75"
 * Example: 2.860 -> "2.86"
 * Example: 5 -> "5.00"
 */
export const formatTruncated2 = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const parts = abs.toFixed(10).split('.');
  const intPart = parts[0];
  const decPart = parts[1] ? parts[1].slice(0, 2).padEnd(2, '0') : '00';
  return `${sign}${intPart}.${decPart}`;
};

export const formatNaira = (amount: number): string => {
  const truncated = truncateTo2Decimals(amount);
  const formattedStr = formatTruncated2(truncated);
  const [intPart, decPart] = formattedStr.split('.');
  const withCommas = Number(intPart).toLocaleString('en-US');
  if (decPart === '00') {
    return `₦${withCommas}`;
  }
  return `₦${withCommas}.${decPart}`;
};

export const formatKg = (kg: number): string => {
  return `${formatTruncated2(kg)} kg`;
};

export const formatDate = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (isoString: string): string => {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (isoString: string): string => {
  return `${formatDate(isoString)} at ${formatTime(isoString)}`;
};

export const generateReceiptText = (
  tx: RefillTransaction,
  settings: StationSettings
): string => {
  const lines = [
    `==============================`,
    `      ${settings.stationName.toUpperCase()}`,
    settings.stationPhone ? `   Tel: ${settings.stationPhone}` : null,
    `==============================`,
    `RECEIPT NO: ${tx.receiptNumber}`,
    `DATE: ${formatDateTime(tx.timestamp)}`,
    `CUSTOMER: ${tx.customerName || 'Walk-in'}`,
    tx.customerPhone ? `PHONE: ${tx.customerPhone}` : null,
    `------------------------------`,
    `SCALE READING (INITIAL): ${formatKg(tx.initialScaleReadingKg)}`,
    `GAS DISPENSED:           ${formatKg(tx.refillKg)}`,
    `TARGET SCALE WEIGHT:     ${formatKg(tx.targetScaleReadingKg)}`,
    `RATE PER KG:             ${formatNaira(tx.pricePerKg)}/kg`,
    `------------------------------`,
    `TOTAL AMOUNT:            ${formatNaira(tx.totalAmount)}`,
    `PAYMENT METHOD:          ${tx.paymentMethod}`,
    `==============================`,
  ].filter(Boolean);

  return lines.join('\n');
};
