import React from 'react';
import {
  Anchor,
  Layers,
  Ship,
  AlertOctagon,
  History,
  Compass,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  Plus,
  ClipboardCheck,
  Database
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { PORT_GROUPS } from '../constants/ports';
import { AgencyLogo } from './AgencyLogos';

interface SidebarProps {
  activeTab: 'dashboard' | 'vessels' | 'matrix' | 'history' | 'storage';
  setActiveTab: (tab: 'dashboard' | 'vessels' | 'matrix' | 'history' | 'storage') => void;
  currentUser: FirebaseUser | null;
  onLogin: () => void;
  onLogout: () => void;
  selectedPort: string;
  setSelectedPort: (port: string) => void;
  ports: string[];
  onOpenChecklist: () => void;
  onOpenNewInspection: () => void;
  onOpenNewVessel: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}


export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogin,
  onLogout,
  selectedPort,
  setSelectedPort,
  ports,
  onOpenChecklist,
  onOpenNewInspection,
  onOpenNewVessel,
  isMobileOpen,
  setIsMobileOpen
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          {/* 3 Logos Secara Horizontal: KKP, Kemnaker, DFW Indonesia */}
          <div className="flex items-center justify-between gap-1.5 p-2 bg-white rounded-lg border border-slate-700/60 shadow-xs">
            <div className="flex-1 flex items-center justify-center h-7.5 px-0.5">
              <AgencyLogo agency="kkp" size="sm" />
            </div>
            <div className="w-px h-6 bg-slate-300 shrink-0"></div>
            <div className="flex-1 flex items-center justify-center h-7.5 px-0.5">
              <AgencyLogo agency="kemnaker" size="sm" />
            </div>
            <div className="w-px h-6 bg-slate-300 shrink-0"></div>
            <div className="flex-1 flex items-center justify-center h-7.5 px-0.5">
              <AgencyLogo agency="dfw" size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-0.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold shrink-0">
              <Anchor className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                Sistem Inspeksi Kapal
              </h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold leading-tight">
                Ketenagakerjaan Kapal Perikanan
              </p>
            </div>
          </div>
        </div>

        {/* Highlighted Primary CTA: FORMULIR DAFTAR PERIKSA (CHECKLIST) */}
        <div className="p-3 mx-3 mt-3 bg-blue-950/70 border border-blue-600/50 rounded-xl space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wider">
              Akses Cepat Pengawas
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <button
            onClick={() => {
              onOpenChecklist();
              setIsMobileOpen(false);
            }}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-white" />
            <span>📋 Isi Formulir Checklist</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center leading-tight">
            Standar Bersama TIm Pemeriksaan Bersama Kementerian
          </p>
        </div>

        {/* Quick Port Selector */}
        <div className="p-3 mx-3 mt-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Pangkalan Pelabuhan:</span>
          </div>
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md p-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="Semua Pelabuhan">Semua Pelabuhan</option>
            {PORT_GROUPS.map((group) => (
              <optgroup key={group.categoryName} label={group.categoryName}>
                {group.ports.map((port) => (
                  <option key={port} value={port}>
                    {port}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Dashboard Utama</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('vessels');
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'vessels'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Ship className="w-4 h-4 shrink-0" />
            <span>Database Kapal</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('matrix');
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>Laporan & Matriks Risiko</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Log Riwayat Inspeksi</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('storage');
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'storage'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Pusat Cloud & Database</span>
          </button>


          {/* Secondary Quick Action */}
          <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                onOpenNewVessel();
                setIsMobileOpen(false);
              }}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Daftarkan Kapal Baru</span>
            </button>
          </div>
        </nav>

        {/* User Card at bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'P'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200 truncate">
                    {currentUser.displayName || currentUser.email || 'Pengawas Lapangan'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {selectedPort !== 'Semua Pelabuhan' ? selectedPort : 'Pelabuhan Terpadu'}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Keluar"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onLogin();
                setIsMobileOpen(false);
              }}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Pengawas</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
