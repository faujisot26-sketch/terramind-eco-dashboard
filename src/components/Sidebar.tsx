import React from 'react';
import {
  LayoutDashboard,
  Trash2,
  Zap,
  Bot,
  BarChart3,
  Target,
  Clock,
  Settings,
  Leaf,
  X,
  Flame,
  Users,
  MapPin
} from 'lucide-react';
import { ActiveTab, UserPreferences } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeStreakDays: number;
  earnedXp: number;
  activeJoinedCount: number;
  userPreferences: UserPreferences;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  activeStreakDays,
  earnedXp,
  activeJoinedCount,
  userPreferences
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'waste', label: 'Waste Tracker', icon: Trash2 },
    { id: 'energy', label: 'Energy Tracker', icon: Zap },
    { id: 'coach', label: 'AI Coach', icon: Bot },
    { id: 'analytics', label: 'Impact Analytics', icon: BarChart3 },
    { id: 'missions', label: 'Missions', icon: Target },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white/95 backdrop-blur-md border-r border-emerald-100/80 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out shadow-sm lg:shadow-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between pb-5 border-b border-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-500/20">
                <Leaf className="w-5 h-5 drop-shadow-xs" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-emerald-950 tracking-tight flex items-center gap-1">
                  Terra<span className="text-emerald-600">Mind</span>
                </span>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider -mt-0.5">Eco Intelligence</span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'text-emerald-600 scale-110' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.id === 'community' && (
                    <span className="ml-auto text-[10px] bg-emerald-600/10 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                  {item.id === 'coach' && (
                    <span className="ml-auto text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                      AI
                    </span>
                  )}
                  {item.id === 'missions' && activeJoinedCount > 0 && (
                    <span className="ml-auto text-[10px] bg-teal-600/10 text-teal-800 font-bold px-1.5 py-0.5 rounded-md">
                      {activeJoinedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Shared Streak & User mini profile */}
          <div className="pt-4 border-t border-emerald-50 space-y-3">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50/40 border border-emerald-100 rounded-xl p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-emerald-950">
                  {activeStreakDays > 0 ? `${activeStreakDays}-Day Logging Streak` : 'Streak Inactive'}
                </span>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200/50 shadow-2xs">
                +{120 + earnedXp} XP
              </span>
            </div>

            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-200 uppercase shadow-2xs">
                {userPreferences.displayName.slice(0, 2) || 'AL'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{userPreferences.displayName}</p>
                <p className="text-[10px] text-emerald-600 font-semibold truncate flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  {userPreferences.location || 'Local Champion'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};