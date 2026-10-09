import React, { useRef, useState, useEffect } from 'react';
import { BulkBottle, RefillTransaction, StationSettings } from '../../types';
import { formatDateTime, formatKg, formatNaira, truncateTo2Decimals, formatTruncated2 } from '../../utils/formatters';
import { toPng } from 'html-to-image';
import { Download, Printer, Share2, X, Check, Flame, ShieldCheck, RefreshCw, Image } from 'lucide-react';

interface DailySalesPngModalProps {
  selectedDate: string; // YYYY-MM-DD
  transactions: RefillTransaction[];
  bottles: BulkBottle[];
  activeBottle: BulkBottle;
  settings: StationSettings;
  onClose: () => void;
}

export const DailySalesPngModal: React.FC<DailySalesPngModalProps> = ({
  selectedDate,
  transactions,
  bottles,
  activeBottle,
  settings,
  onClose,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(true);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Filter transactions for this day
  const dayTransactions = transactions.filter((t) => t.timestamp.startsWith(selectedDate));

  const totalRevenue = dayTransactions.reduce((acc, t) => acc + (t.amountPaid || t.totalAmount), 0);
  const totalKg = truncateTo2Decimals(dayTransactions.reduce((acc, t) => acc + t.refillKg, 0));
  const totalCount = dayTransactions.length;

  const cashTotal = dayTransactions.filter((t) => t.paymentMethod === 'Cash').reduce((acc, t) => acc + (t.amountPaid || t.totalAmount), 0);
  const transferTotal = dayTransactions.filter((t) => t.paymentMethod === 'Transfer').reduce((acc, t) => acc + (t.amountPaid || t.totalAmount), 0);
  const posTotal = dayTransactions.filter((t) => t.paymentMethod === 'POS').reduce((acc, t) => acc + (t.amountPaid || t.totalAmount), 0);

  // Robust HTML5 Canvas 2D fallback generator (100% immune to CSS CORS / SecurityErrors)
  const drawCanvasReport = (): string => {
    const width = 800;
    // Calculate required height based on transaction count
    const baseHeight = 360;
    const rowHeight = 32;
    const tableHeight = Math.max(60, dayTransactions.length * rowHeight + 24);
    const height = baseHeight + tableHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // @2x for crisp retina output
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Top Header Banner
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(settings.stationName.toUpperCase(), 36, 52);

    if (settings.stationPhone) {
      ctx.fillStyle = '#64748B';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Tel: ${settings.stationPhone}`, 36, 72);
    }

    // Right-aligned official tag
    ctx.textAlign = 'right';
    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('OFFICIAL DAILY SALES REPORT', width - 36, 50);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(selectedDate, width - 36, 72);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(36, 88);
    ctx.lineTo(width - 36, 88);
    ctx.stroke();

    // Scorecards (4 cards)
    const cardY = 104;
    const cardW = 168;
    const cardH = 76;
    const gap = 16;

    const cards = [
      { label: 'TOTAL SALES', value: formatNaira(totalRevenue), color: '#0F172A' },
      { label: 'GAS DISPENSED', value: formatKg(totalKg), color: '#047857' },
      { label: 'TOTAL REFILLS', value: `${totalCount} Fills`, color: '#0F172A' },
      { label: 'ACTIVE BOTTLE', value: `${formatTruncated2(activeBottle.remainingKg)}kg left`, color: '#D97706', sub: activeBottle.name },
    ];

    cards.forEach((c, i) => {
      const cx = 36 + i * (cardW + gap);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(cx, cardY, cardW, cardH);
      ctx.strokeStyle = '#E2E8F0';
      ctx.strokeRect(cx, cardY, cardW, cardH);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
      ctx.fillText(c.label, cx + 12, cardY + 22);

      ctx.fillStyle = c.color;
      ctx.font = 'bold 16px monospace';
      ctx.fillText(c.value, cx + 12, cardY + 48);

      if (c.sub) {
        ctx.fillStyle = '#64748B';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.fillText(c.sub, cx + 12, cardY + 65);
      }
    });

    // Payment Summary Strip
    const payY = 196;
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(36, payY, width - 72, 40);
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(36, payY, width - 72, 40);

    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Cash: `, 50, payY + 25);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(formatNaira(cashTotal), 88, payY + 25);

    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Transfer: `, 280, payY + 25);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(formatNaira(transferTotal), 340, payY + 25);

    ctx.fillStyle = '#475569';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`POS / Card: `, 520, payY + 25);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(formatNaira(posTotal), 595, payY + 25);

    // Table Header
    const tableY = 254;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`CUSTOMER REFILL TRANSACTIONS LOG (${dayTransactions.length})`, 36, tableY);

    const thY = tableY + 12;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(36, thY, width - 72, 24);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.fillText('TIME', 46, thY + 16);
    ctx.fillText('RECEIPT #', 110, thY + 16);
    ctx.fillText('CUSTOMER', 220, thY + 16);
    ctx.fillText('INITIAL', 370, thY + 16);
    ctx.fillText('DISPENSED', 450, thY + 16);
    ctx.fillText('FINAL', 545, thY + 16);
    ctx.fillText('AMOUNT', 625, thY + 16);
    ctx.fillText('PAY', 710, thY + 16);

    // Table Rows
    let curY = thY + 24;
    if (dayTransactions.length === 0) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('No refills logged for this date.', 46, curY + 24);
      curY += 40;
    } else {
      dayTransactions.forEach((tx, idx) => {
        if (idx % 2 === 1) {
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(36, curY, width - 72, rowHeight);
        }

        ctx.strokeStyle = '#F1F5F9';
        ctx.strokeRect(36, curY, width - 72, rowHeight);

        const timeStr = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        ctx.fillStyle = '#64748B';
        ctx.font = '11px monospace';
        ctx.fillText(timeStr, 46, curY + 20);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(tx.receiptNumber, 110, curY + 20);

        ctx.fillStyle = '#334155';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        const nameTrunc = tx.customerName.length > 18 ? tx.customerName.slice(0, 16) + '..' : tx.customerName;
        ctx.fillText(nameTrunc, 220, curY + 20);

        ctx.fillStyle = '#475569';
        ctx.font = '11px monospace';
        ctx.fillText(formatKg(tx.initialScaleReadingKg), 370, curY + 20);

        ctx.fillStyle = '#047857';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`+${formatKg(tx.refillKg)}`, 450, curY + 20);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(formatKg(tx.targetScaleReadingKg), 545, curY + 20);

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(formatNaira(tx.totalAmount), 625, curY + 20);

        ctx.fillStyle = '#64748B';
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
        ctx.fillText(tx.paymentMethod, 710, curY + 20);

        curY += rowHeight;
      });
    }

    return canvas.toDataURL('image/png');
  };

  // Generate PNG from report element with safe fallback
  const generatePng = async () => {
    setGenerating(true);
    try {
      if (reportRef.current) {
        // Attempt DOM-to-PNG with skipFonts: true to prevent SecurityError on remote google fonts
        const url = await toPng(reportRef.current, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          skipFonts: true,
          cacheBust: false,
        });
        setPngDataUrl(url);
      } else {
        const fallbackUrl = drawCanvasReport();
        setPngDataUrl(fallbackUrl);
      }
    } catch (err) {
      // In case of any browser CSS rules security restrictions, seamlessly render via canvas 2D
      console.warn('DOM capture restricted, using direct HTML5 canvas renderer:', err);
      const fallbackUrl = drawCanvasReport();
      setPngDataUrl(fallbackUrl);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    generatePng();
  }, [selectedDate, dayTransactions.length]);

  // Download PNG file
  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    const link = document.createElement('a');
    link.download = `Daily_Sales_Report_${selectedDate}_${settings.stationName.replace(/\s+/g, '_')}.png`;
    link.href = pngDataUrl;
    link.click();
  };

  // Share PNG via Web Share API or download for WhatsApp
  const handleSharePng = async () => {
    if (!pngDataUrl) return;
    try {
      const res = await fetch(pngDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Daily_Sales_${selectedDate}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Daily Sales Summary - ${selectedDate}`,
          text: `Official Daily Sales Report for ${settings.stationName} (${selectedDate}). Total Revenue: ${formatNaira(totalRevenue)}, Gas Dispensed: ${formatKg(totalKg)}.`,
        });
      } else {
        handleDownloadPng();
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 3000);
      }
    } catch (err) {
      console.error('Error sharing PNG:', err);
      handleDownloadPng();
    }
  };

  // Print PNG
  const handlePrintPng = () => {
    if (!pngDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Sales Report - ${selectedDate}</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <img src="${pngDataUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formattedDateHeader = new Date(selectedDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daily Sales PNG Report
              </h3>
              <p className="text-[11px] text-slate-500">
                Non-editable image format for sharing & printing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Uneditable PNG</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPng}
              disabled={generating || !pngDataUrl}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handleSharePng}
              disabled={generating || !pngDataUrl}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share (WhatsApp)</span>
            </button>

            <button
              onClick={handlePrintPng}
              disabled={generating || !pngDataUrl}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {copiedShare && (
          <div className="bg-emerald-50 text-emerald-800 px-4 py-2 text-xs font-semibold text-center border-b border-emerald-100 flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>PNG downloaded! Attach directly into your WhatsApp chat or email.</span>
          </div>
        )}

        {/* Content Viewport */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100">
          {generating ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-700" />
              <span>Generating tamper-proof PNG report...</span>
            </div>
          ) : pngDataUrl ? (
            <div className="space-y-2">
              <div className="text-[11px] text-center text-slate-500">
                Preview of the rendered non-editable PNG image:
              </div>
              <img
                src={pngDataUrl}
                alt="Rendered Daily Sales PNG Report"
                className="w-full rounded-2xl shadow-md border border-slate-200"
              />
            </div>
          ) : null}

          {/* Hidden Offscreen DOM Node for HTML-to-Image Capture */}
          <div className="overflow-hidden h-0 w-0 pointer-events-none opacity-0">
            <div
              ref={reportRef}
              style={{ width: '680px', minHeight: '800px', backgroundColor: '#ffffff', fontFamily: 'system-ui, sans-serif' }}
              className="p-8 text-slate-900 border border-slate-300"
            >
              {/* Report Header */}
              <div className="border-b-2 border-slate-900 pb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                      <Flame className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        {settings.stationName}
                      </h1>
                      {settings.stationPhone && (
                        <p className="text-xs text-slate-600 font-medium">
                          Tel: {settings.stationPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      OFFICIAL DAILY REPORT
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-800">
                      {selectedDate}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{formattedDateHeader}</span>
                  <span className="font-mono">Gas Rate: <strong>{formatNaira(settings.currentGasPricePerKg)}/kg</strong></span>
                </div>
              </div>

              {/* Summary Scorecards Grid */}
              <div className="grid grid-cols-4 gap-3 my-5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    TOTAL SALES
                  </span>
                  <div className="text-lg font-black font-mono text-slate-900 mt-1 tabular-nums">
                    {formatNaira(totalRevenue)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    GAS DISPENSED
                  </span>
                  <div className="text-lg font-black font-mono text-emerald-700 mt-1 tabular-nums">
                    {formatKg(totalKg)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    TOTAL REFILLS
                  </span>
                  <div className="text-lg font-black font-mono text-slate-900 mt-1 tabular-nums">
                    {totalCount} Fills
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    BULK BOTTLE
                  </span>
                  <div className="text-xs font-bold font-mono text-slate-900 mt-1 truncate">
                    {activeBottle.name}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {formatTruncated2(activeBottle.remainingKg)}kg left
                  </span>
                </div>
              </div>

              {/* Payment Methods Breakdown Strip */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-5 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Cash Sales</span>
                  <span className="font-bold text-slate-900">{formatNaira(cashTotal)}</span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-500 block text-[10px] uppercase">Bank Transfer</span>
                  <span className="font-bold text-slate-900">{formatNaira(transferTotal)}</span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-500 block text-[10px] uppercase">POS / Card</span>
                  <span className="font-bold text-slate-900">{formatNaira(posTotal)}</span>
                </div>
              </div>

              {/* Detailed Transactions Table */}
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Customer Refill Transactions Log ({dayTransactions.length})
                </div>

                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase border-y border-slate-300">
                      <th className="py-2 px-2">Time</th>
                      <th className="py-2 px-2">Receipt #</th>
                      <th className="py-2 px-2 text-right">Initial</th>
                      <th className="py-2 px-2 text-right">Dispensed</th>
                      <th className="py-2 px-2 text-right">Final</th>
                      <th className="py-2 px-2 text-right">Amount (₦)</th>
                      <th className="py-2 px-2 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {dayTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400">
                          No refills logged for this date.
                        </td>
                      </tr>
                    ) : (
                      dayTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-1.5 px-2 text-slate-500">
                            {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-1.5 px-2 font-bold text-slate-800">
                            {tx.receiptNumber}
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-600 tabular-nums">
                            {formatKg(tx.initialScaleReadingKg)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-emerald-700 tabular-nums">
                            +{formatKg(tx.refillKg)}
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-900 font-bold tabular-nums">
                            {formatKg(tx.targetScaleReadingKg)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-slate-900 tabular-nums">
                            {formatNaira(tx.totalAmount)}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-600 uppercase text-[10px]">
                            {tx.paymentMethod}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
