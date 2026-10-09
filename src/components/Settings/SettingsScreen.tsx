import React, { useState } from 'react';
import { StationSettings } from '../../types';
import { formatNaira } from '../../utils/formatters';
import {
  Settings,
  Save,
  Check,
  RefreshCw,
  MessageCircle,
  Copy,
  Heart,
  ExternalLink,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: StationSettings;
  onUpdateSettings: (settings: StationSettings) => void;
  onResetAllData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  const [rate, setRate] = useState(settings.currentGasPricePerKg.toString());
  const [stationName, setStationName] = useState(settings.stationName);
  const [phone, setPhone] = useState(settings.stationPhone);
  const [saved, setSaved] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [opayLaunched, setOpayLaunched] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...settings,
      currentGasPricePerKg: parseFloat(rate) || 1600,
      stationName: stationName.trim() || 'LPG Refill Station',
      stationPhone: phone.trim() || '',
    };
    onUpdateSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText('+2347079080719');
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('7079080719');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleOpenOPay = () => {
    // 1. Always copy account number immediately
    try {
      navigator.clipboard.writeText('7079080719');
      setCopiedAccount(true);
      setOpayLaunched(true);
      setTimeout(() => setCopiedAccount(false), 3000);
      setTimeout(() => setOpayLaunched(false), 4500);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }

    // 2. Open OPay app (package: team.opay.pay)
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      // Direct intent to launch OPay on Android device
      window.location.href =
        'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=team.opay.pay;end';
      // Fallback in case OPay is not installed or user cancels intent
      setTimeout(() => {
        window.location.href =
          'https://play.google.com/store/apps/details?id=team.opay.pay';
      }, 1500);
    } else {
      // On desktop / non-Android browser, open Play Store / app page
      window.open(
        'https://play.google.com/store/apps/details?id=team.opay.pay',
        '_blank'
      );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-3.5 pt-2 pb-24 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-1 py-1">
        <Settings className="w-5 h-5 text-slate-800" />
        <h2 className="text-sm font-bold tracking-tight text-slate-900">
          Station Settings
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        {/* Price Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Gas Rate Per Kg
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Active Price Per 1kg (₦)
            </label>
            <input
              type="number"
              required
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-lg font-bold font-mono text-slate-900 outline-none focus:border-slate-800"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Currently set to {formatNaira(parseFloat(rate) || 1600)} / kg
            </span>
          </div>
        </div>

        {/* Station Details Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Station Profile
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Station Name
            </label>
            <input
              type="text"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Contact Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-800"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>

        {/* Contact Dev & Show Love Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm space-y-3.5 border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white tracking-wide">Developer & Creator</span>
            <span className="text-[10px] text-slate-400 font-mono">+2347079080719</span>
          </div>

          {/* Contact Dev */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Contact Dev
            </span>
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/2347079080719?text=Hello%20Developer,%20I%20am%20using%20the%20LPG%20Refill%20Station%20app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp: +234 707 908 0719</span>
              </a>
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                title="Copy WhatsApp Number"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
              >
                {copiedWhatsApp ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Donate / Show Love */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                Donate / Show Love
              </span>
              <span className="text-[11px] font-semibold text-slate-300">
                Bank: <strong className="text-white">OPay</strong>
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-800/90 rounded-xl px-3 py-2 border border-slate-700/80">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">OPay Account</span>
                <span className="font-mono text-base font-black tracking-wider text-emerald-400">7079080719</span>
              </div>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedAccount ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenOPay}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              {opayLaunched ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Account Copied! Opening OPay...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 text-slate-950" />
                  <span>Open OPay App</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reset Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset all demo data to default initial state?')) {
                onResetAllData();
              }
            }}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {/* Subtle Footer Note */}
        <div className="text-center pt-2 pb-1 text-[11px] text-slate-400">
          WhatsApp: <a href="https://wa.me/2347079080719" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-emerald-600 font-semibold font-mono underline">+2347079080719</a> • OPay: <span className="font-mono font-bold text-slate-600">7079080719</span>
        </div>
      </form>
    </div>
  );
};
