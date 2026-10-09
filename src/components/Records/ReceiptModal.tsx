import React, { useRef, useState } from 'react';
import { RefillTransaction, StationSettings } from '../../types';
import { formatDateTime, formatKg, formatNaira, formatTruncated2 } from '../../utils/formatters';
import { toPng } from 'html-to-image';
import { Download, Printer, Share2, X, Flame, Check, Loader2 } from 'lucide-react';

interface ReceiptModalProps {
  transaction: RefillTransaction | null;
  settings: StationSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  if (!transaction) return null;

  // HTML5 Canvas 2D fallback generator - 100% immune to sandbox/CSS restrictions
  const drawReceiptCanvas = (tx: RefillTransaction, st: StationSettings): string => {
    const width = 480;
    const height = 660;
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.scale(2, 2);

    // Clean receipt paper background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Outer border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    let y = 38;

    // Station Branding
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(st.stationName.toUpperCase(), width / 2, y);

    if (st.stationPhone) {
      y += 18;
      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText(`TEL: ${st.stationPhone}`, width / 2, y);
    }

    y += 14;
    // Dashed divider
    ctx.strokeStyle = '#CBD5E1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Receipt Meta
    y += 20;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const drawMetaRow = (label: string, value: string, boldVal = false, isEmerald = false) => {
      ctx.fillStyle = '#64748B';
      ctx.font = '12px monospace';
      ctx.fillText(label, 24, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = isEmerald ? '#047857' : boldVal ? '#0F172A' : '#334155';
      ctx.font = boldVal ? 'bold 12px monospace' : '12px monospace';
      ctx.fillText(value, width - 24, y);
      ctx.textAlign = 'left';
      y += 18;
    };

    drawMetaRow('RECEIPT NO:', tx.receiptNumber, true);
    drawMetaRow('DATE & TIME:', formatDateTime(tx.timestamp));
    drawMetaRow('CUSTOMER:', tx.customerName || 'Walk-in Customer');
    if (tx.customerPhone) {
      drawMetaRow('PHONE:', tx.customerPhone);
    }
    if (tx.cylinderLabel) {
      drawMetaRow('CYLINDER:', tx.cylinderLabel);
    }

    y += 4;
    ctx.strokeStyle = '#CBD5E1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Technical weights & dispensing
    y += 20;
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('SCALE READINGS & GAS DISPENSED', 24, y);
    y += 18;

    drawMetaRow('Initial Scale Reading:', `${formatTruncated2(tx.initialScaleReadingKg)} kg`);
    drawMetaRow('Gas Dispensed:', `+${formatKg(tx.refillKg)}`, true, true);
    drawMetaRow('Final Scale Reading:', `${formatTruncated2(tx.targetScaleReadingKg)} kg`, true);
    if (tx.bottleName) {
      drawMetaRow('Supply Bottle:', tx.bottleName);
    }

    y += 4;
    ctx.strokeStyle = '#CBD5E1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Financial breakdown
    y += 20;
    drawMetaRow('Gas Rate:', `${formatNaira(tx.pricePerKg)} / kg`);

    // Total Amount highlight
    y += 4;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('TOTAL AMOUNT:', 24, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(formatNaira(tx.totalAmount), width - 24, y);
    ctx.textAlign = 'left';
    y += 22;

    drawMetaRow('Amount Paid:', formatNaira(tx.amountPaid), true);
    drawMetaRow('Payment Method:', tx.paymentMethod);
    drawMetaRow('Status:', (tx.paymentStatus || 'PAID').toUpperCase(), true, true);

    y += 6;
    ctx.strokeStyle = '#CBD5E1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Footer message
    y += 26;
    ctx.fillStyle = '#64748B';
    ctx.font = 'italic 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(st.receiptFooterMessage || 'Thank you for your patronage! Safe cooking.', width / 2, y);

    y += 16;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px monospace';
    ctx.fillText('POWERED BY GASFLOW • OFFICIAL RECEIPT', width / 2, y);

    return canvas.toDataURL('image/png');
  };

  const generateReceiptPngUrl = async (): Promise<string> => {
    try {
      if (receiptRef.current) {
        const url = await toPng(receiptRef.current, {
          quality: 0.98,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          skipFonts: true,
        });
        if (url && url.length > 100) return url;
      }
    } catch (err) {
      console.warn('DOM capture restricted, using direct HTML5 canvas renderer:', err);
    }
    return drawReceiptCanvas(transaction, settings);
  };

  // Direct PNG Sharing
  const handleShareReceiptPng = async () => {
    setIsSharing(true);
    setShareFeedback(null);
    try {
      const pngUrl = await generateReceiptPngUrl();
      if (!pngUrl) return;

      const res = await fetch(pngUrl);
      const blob = await res.blob();
      const filename = `Receipt_${transaction.receiptNumber}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // Direct Image/PNG Sharing via Web Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt ${transaction.receiptNumber}`,
          text: `Gas refill receipt from ${settings.stationName}: ${formatKg(transaction.refillKg)} (${formatNaira(transaction.totalAmount)})`,
        });
      } else {
        // Fallback for browsers without file sharing support: download PNG directly
        const link = document.createElement('a');
        link.download = filename;
        link.href = pngUrl;
        link.click();
        setShareFeedback('Receipt PNG downloaded! Ready to share.');
        setTimeout(() => setShareFeedback(null), 3500);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing receipt PNG:', err);
        // Fallback to downloading image file
        try {
          const pngUrl = await generateReceiptPngUrl();
          const link = document.createElement('a');
          link.download = `Receipt_${transaction.receiptNumber}.png`;
          link.href = pngUrl;
          link.click();
          setShareFeedback('Receipt PNG downloaded! Ready to share.');
          setTimeout(() => setShareFeedback(null), 3500);
        } catch {
          // ignore
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Direct PNG Download
  const handleDownloadPng = async () => {
    setIsDownloading(true);
    try {
      const pngUrl = await generateReceiptPngUrl();
      const link = document.createElement('a');
      link.download = `Receipt_${transaction.receiptNumber}.png`;
      link.href = pngUrl;
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (e) {
      console.error('Failed to download PNG', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-200">
              Receipt • #{transaction.receiptNumber}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {shareFeedback && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 px-4 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
        )}

        {/* Printable & Capture Receipt Paper Container */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="bg-white text-neutral-900 p-5 sm:p-6 rounded-xl shadow-lg font-mono text-xs sm:text-sm border border-neutral-200 selection:bg-amber-200"
          >
            {/* Station Branding */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-300">
              <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wide">
                {settings.stationName}
              </h2>
              {settings.stationPhone && (
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  Tel: {settings.stationPhone}
                </p>
              )}
            </div>

            {/* Receipt Meta */}
            <div className="py-3 border-b border-dashed border-neutral-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Receipt No:</span>
                <span className="font-semibold text-neutral-900">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Date & Time:</span>
                <span>{formatDateTime(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Customer:</span>
                <span className="font-semibold">{transaction.customerName || 'Walk-in'}</span>
              </div>
              {transaction.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Phone:</span>
                  <span>{transaction.customerPhone}</span>
                </div>
              )}
              {transaction.cylinderLabel && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Cylinder:</span>
                  <span>{transaction.cylinderLabel}</span>
                </div>
              )}
            </div>

            {/* Technical Scale & Dispensing Data */}
            <div className="py-3 border-b border-dashed border-neutral-300 space-y-1.5">
              <div className="text-[11px] font-bold uppercase text-neutral-500 tracking-wider">
                Scale Weights & Dispensing
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Initial Scale Reading:</span>
                <span className="font-semibold tabular-nums">
                  {formatTruncated2(transaction.initialScaleReadingKg)} kg
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Gas Dispensed:</span>
                <span className="tabular-nums">+{formatKg(transaction.refillKg)}</span>
              </div>
              <div className="flex justify-between bg-neutral-100 p-1.5 rounded font-bold">
                <span className="text-neutral-800">Final Scale Reading:</span>
                <span className="tabular-nums text-neutral-950">
                  {formatTruncated2(transaction.targetScaleReadingKg)} kg
                </span>
              </div>
              {transaction.bottleName && (
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Supply Bottle:</span>
                  <span className="font-medium text-neutral-700">{transaction.bottleName}</span>
                </div>
              )}
              {transaction.residualGasKg !== undefined && transaction.residualGasKg > 0 && (
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Residual Gas in Bottle:</span>
                  <span className="tabular-nums">{formatKg(transaction.residualGasKg)}</span>
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="py-3 border-b border-dashed border-neutral-300 space-y-1.5">
              <div className="flex justify-between text-neutral-600">
                <span>Current Gas Rate:</span>
                <span className="tabular-nums">{formatNaira(transaction.pricePerKg)} / kg</span>
              </div>
              <div className="flex justify-between text-base font-bold text-neutral-950 pt-1">
                <span>TOTAL AMOUNT:</span>
                <span className="tabular-nums text-lg font-black">{formatNaira(transaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-700">
                <span>Amount Paid:</span>
                <span className="font-semibold tabular-nums">
                  {formatNaira(transaction.amountPaid)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Payment Method:</span>
                <span>{transaction.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Status:</span>
                <span className="font-semibold uppercase tracking-wide text-emerald-700">
                  {transaction.paymentStatus}
                </span>
              </div>
            </div>

            {/* Receipt Footer Message */}
            <div className="pt-3 text-center text-[11px] text-neutral-500 italic">
              {settings.receiptFooterMessage || 'Thank you for your patronage! Safe cooking.'}
            </div>
          </div>
        </div>

        {/* Modal Actions - Share Image / Download Image directly */}
        <div className="p-3.5 sm:p-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center gap-2">
          {/* Primary Action: Share PNG Direct */}
          <button
            type="button"
            disabled={isSharing}
            onClick={handleShareReceiptPng}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl shadow-md transition-all disabled:opacity-60"
            title="Share receipt image directly to WhatsApp, Telegram, etc."
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing PNG...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Receipt (PNG)</span>
              </>
            )}
          </button>

          {/* Secondary Action: Save / Download PNG */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadPng}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-all"
            title="Download receipt PNG image"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-neutral-300" />
                <span>Save PNG</span>
              </>
            )}
          </button>

          {/* Tertiary Action: Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 text-neutral-400 hover:text-neutral-100 bg-neutral-800/80 hover:bg-neutral-800 rounded-xl transition-colors"
            title="Print Receipt"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
