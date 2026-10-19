import React from 'react';
import { Menu, Calculator, Trash2, Zap, Sparkles } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setMobileMenuOpen: (open: boolean) => void;
  setIsMethodologyModalOpen: (open: boolean) => void;
  handleOpenAddWaste: () => void;
  handleOpenAddEnergy: () => void;
  setIsLogModalOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setMobileMenuOpen,
  setIsMethodologyModalOpen,
  handleOpenAddWaste,
  handleOpenAddEnergy,
  setIsLogModalOpen
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-emerald-100/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="text-emerald-700 font-bold uppercase tracking-wider text-[11px]">{activeTab}</span>
          <span>/</span>
          <span className="text-slate-700 font-medium">Small changes, visible impact</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setIsMethodologyModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
          title="Inspect transparent carbon audit formulas & interactive calculator"
        >
          <Calculator className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Audit Methodology &amp; Calculator</span>
        </button>

        <button
          onClick={handleOpenAddWaste}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Log Waste</span>
        </button>

        <button
          onClick={handleOpenAddEnergy}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>Log Energy</span>
        </button>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Smart Action</span>
        </button>
      </div>
    </header>
  );
};
