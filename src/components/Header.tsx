import React from 'react';
import { Anchor, ShieldCheck, Plus, RefreshCw, LogIn, LogOut, User, Compass, Layers, AlertOctagon, History } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'dashboard' | 'vessels' | 'matrix' | 'history';
  setActiveTab: (tab: 'dashboard' | 'vessels' | 'matrix' | 'history') => void;
  currentUser: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenNewInspection: () => void;
  onOpenNewVessel: () => void;
  selectedPort: string;
  setSelectedPort: (port: string) => void;
  ports: string[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogin,
  onLogout,
  onOpenNewInspection,
  onOpenNewVessel,
  selectedPort,
  setSelectedPort,
  ports
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & NGO Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-cyan-600 flex items-center justify-center text-white shadow-xs">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">Sistem Inpeksi Kapal</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Inspeksi Bersama
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Sistem Inpeksi Bersama Ketenagakerjaan di Kapal Perikanan
              </p>
            </div>
          </div>

          {/* Port Selector & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Port Filter Dropdown */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <Compass className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="font-medium text-slate-500">Pangkalan:</span>
              <select
                id="port-selector"
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {ports.map((port) => (
                  <option key={port} value={port}>
                    {port}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Sync Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Sync</span>
            </div>

            {/* CTA Buttons */}
            <button
              id="btn-new-vessel"
              onClick={onOpenNewVessel}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftarkan Kapal</span>
            </button>

            <button
              id="btn-new-inspection"
              onClick={onOpenNewInspection}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>+ Catat Inspeksi Bersama</span>
            </button>

            {/* Auth / Inspector State */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'P'}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-medium text-slate-800 max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email || 'Pengawas'}
                  </div>
                  <div className="text-[10px] text-teal-600 font-semibold">Pengawas Terverifikasi</div>
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Keluar"
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-header"
                onClick={onLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login Pengawas</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation (Asana-style sub-header) */}
        <div className="flex items-center gap-1 border-t border-slate-100 overflow-x-auto py-1 scrollbar-none">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'dashboard'
                ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ringkasan Pengawasan</span>
          </button>

          <button
            id="tab-vessels"
            onClick={() => setActiveTab('vessels')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'vessels'
                ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>Database Kapal & Skor Risiko</span>
          </button>

          <button
            id="tab-matrix"
            onClick={() => setActiveTab('matrix')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'matrix'
                ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Matriks Risiko & Kepatuhan Pelabuhan</span>
          </button>

          <button
            id="tab-history"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'history'
                ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Log Inspeksi Real-Time</span>
          </button>
        </div>
      </div>
    </header>
  );
};
