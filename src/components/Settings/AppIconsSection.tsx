import React, { useState } from 'react';
import { Download, Check, Sparkles, ExternalLink, Smartphone } from 'lucide-react';

export interface GeneratedAppIcon {
  id: string;
  name: string;
  badge: string;
  description: string;
  src: string;
  recommendedFor: string;
}

export const GENERATED_APP_ICONS: GeneratedAppIcon[] = [
  {
    id: 'flame-cylinder',
    name: '3D Emerald & Cyan Flame Cylinder',
    badge: 'Recommended for APK',
    description: 'Glossy 3D LPG cylinder with energetic clean blue-emerald flame on dark teal squircle.',
    src: '/src/assets/images/lpg_app_icon_flame_1791535047620.jpg',
    recommendedFor: 'Android launcher icon (mipmap-xxxhdpi), Google Play Store 512x512',
  },
  {
    id: 'vector-flame',
    name: 'Modern Dual-Flame Vector',
    badge: 'Clean & Minimalist',
    description: 'Bold amber and cyan flame embracing a modern gas bottle silhouette on navy background.',
    src: '/src/assets/images/cooking_gas_icon_1791535059565.jpg',
    recommendedFor: 'Brand identity, PWA 192x192, splash screen, high-contrast displays',
  },
  {
    id: 'scale-cylinder',
    name: 'Metallic Digital Scale Cylinder',
    badge: 'Hardware & Tech',
    description: 'Hyper-detailed metallic teal cylinder with digital scale display and crisp burner flame.',
    src: '/src/assets/images/gas_station_logo_1791535070605.jpg',
    recommendedFor: 'POS kiosk launcher, Android tablet app, premium retail branding',
  },
  {
    id: 'refill-cycle',
    name: 'Neon Refill Loop & Flame',
    badge: 'Dynamic Refill Flow',
    description: 'Glowing electric cyan arrows forming a refill circle around a vibrant flame and cylinder.',
    src: '/src/assets/images/lpg_refill_symbol_1791535082213.jpg',
    recommendedFor: 'Subscription app, delivery tracker, modern cyber aesthetic',
  },
];

export const AppIconsSection: React.FC = () => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<GeneratedAppIcon | null>(null);

  const downloadIcon = async (icon: GeneratedAppIcon) => {
    setDownloadingId(icon.id);
    try {
      const response = await fetch(icon.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lpg-app-icon-${icon.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Fallback direct link download
      const link = document.createElement('a');
      link.href = icon.src;
      link.download = `lpg-app-icon-${icon.id}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  const handleDownloadAll = async () => {
    for (const icon of GENERATED_APP_ICONS) {
      await downloadIcon(icon);
      await new Promise((r) => setTimeout(r, 400));
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
            Generated App Icons (For APK / PWA)
          </h3>
        </div>
        <button
          type="button"
          onClick={handleDownloadAll}
          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
        >
          <Download className="w-3 h-3" />
          Save All 4
        </button>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        High-resolution 1:1 square app launcher icons tailored for LPG Cooking Gas applications. Tap any icon to preview in full size or download directly for your Android APK or PWA build.
      </p>

      {/* Grid of Icons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {GENERATED_APP_ICONS.map((icon) => {
          const isDownloading = downloadingId === icon.id;
          return (
            <div
              key={icon.id}
              className="group relative bg-slate-50 hover:bg-slate-100/80 rounded-xl p-2.5 border border-slate-200 transition-all flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div
                onClick={() => setSelectedPreview(icon)}
                className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-900 cursor-pointer shadow-inner mb-2 border border-slate-200/60"
              >
                <img
                  src={icon.src}
                  alt={icon.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-1.5 left-1.5 bg-slate-950/75 backdrop-blur-sm text-[9px] font-bold text-emerald-400 px-1.5 py-0.5 rounded-md">
                  {icon.badge}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mb-2.5 flex-1">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {icon.name}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {icon.description}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => downloadIcon(icon)}
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-xs"
                >
                  {isDownloading ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Saved</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPreview(icon)}
                  className="p-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                  title="Full size preview"
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 border border-slate-200 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-600">
                  {selectedPreview.badge}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {selectedPreview.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* High Res Preview */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 shadow-lg border border-slate-800">
              <img
                src={selectedPreview.src}
                alt={selectedPreview.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-slate-500" />
                Target Usage:
              </div>
              <div className="text-slate-600 text-[10px] leading-relaxed">
                {selectedPreview.recommendedFor}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedPreview(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => downloadIcon(selectedPreview)}
                className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                Download (JPG)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
