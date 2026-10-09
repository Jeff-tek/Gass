import React from 'react';
import { TabType } from '../../types';
import { Flame, Box, Receipt, BarChart3, Wallet, Settings } from 'lucide-react';

interface BottomNavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'fill', label: 'Fill', icon: Flame },
    { id: 'bottles', label: 'Bottles', icon: Box },
    { id: 'log', label: 'Log', icon: Receipt },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto px-1 h-14 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-0.5 transition-all ${
                isActive
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-400 hover:text-slate-600 font-normal'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4.5 h-4.5 transition-transform ${
                    isActive ? 'scale-105 text-slate-900 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span className={`text-[10px] mt-0.5 transition-colors ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
