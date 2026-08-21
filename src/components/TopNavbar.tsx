import React, { useState, useEffect } from 'react';
import { Menu, ShieldCheck, ClipboardCheck, Clock } from 'lucide-react';

interface TopNavbarProps {
  activeTab: 'dashboard' | 'vessels' | 'matrix' | 'history' | 'storage';
  onOpenMobileMenu: () => void;
  onOpenChecklist: () => void;
  onOpenNewVessel: () => void;
  onOpenNewInspection?: () => void;
}


export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenChecklist,
  onOpenNewVessel
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) + ' - ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          full: 'Ringkasan Kepatuhan Real-Time',
          short: 'Dasbor Kepatuhan'
        };
      case 'vessels':
        return {
          full: 'Database Kapal & Skor Kepatuhan',
          short: 'Database Kapal'
        };
      case 'matrix':
        return {
          full: 'Matriks Risiko Pelabuhan & Armada',
          short: 'Matriks Risiko'
        };
      case 'history':
        return {
          full: 'Log Riwayat Inspeksi Ketenagakerjaan',
          short: 'Riwayat Inspeksi'
        };
      case 'storage':
        return {
          full: 'Pusat Cloud Storage & Supabase',
          short: 'Cloud & Database'
        };
      default:
        return {
          full: 'Monev Hub Pengawasan Kapal',
          short: 'Monev Hub'
        };
    }
  };

  const titleObj = getTitle();

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer shrink-0"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 tracking-tight truncate">
              <span className="hidden sm:inline">{titleObj.full}</span>
              <span className="sm:hidden">{titleObj.short}</span>
            </h2>
            <div className="sm:hidden flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">DFW • ILO C188 / KKP</span>
            </div>
          </div>

          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sync Aktif
          </span>
        </div>
      </div>

      {/* Right: Actions & Checklist CTA */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <div className="hidden xl:block text-right">
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            Waktu Server (WIB)
          </p>
          <p className="text-xs font-mono font-semibold text-slate-700">
            {timeStr || 'Memuat...'}
          </p>
        </div>

        {/* Quick Add Vessel Button on Tablet & Desktop */}
        <button
          onClick={onOpenNewVessel}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200 cursor-pointer"
        >
          <span>+ Kapal Baru</span>
        </button>

        {/* Primary Checklist CTA Button */}
        <button
          onClick={onOpenChecklist}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 min-h-[36px]"
        >
          <ClipboardCheck className="w-4 h-4 text-blue-100" />
          <span className="hidden sm:inline">Isi Formulir Checklist</span>
          <span className="sm:hidden">Checklist</span>
        </button>
      </div>
    </header>
  );
};
