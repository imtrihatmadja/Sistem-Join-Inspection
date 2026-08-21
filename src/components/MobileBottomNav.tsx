import React from 'react';
import { Layers, Ship, AlertOctagon, History, ClipboardCheck, Database } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'dashboard' | 'vessels' | 'matrix' | 'history' | 'storage';
  setActiveTab: (tab: 'dashboard' | 'vessels' | 'matrix' | 'history' | 'storage') => void;
  onOpenChecklist: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenChecklist
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
      {/* 1. Dashboard */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors cursor-pointer min-w-[48px] ${
          activeTab === 'dashboard'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Layers className={`w-4.5 h-4.5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[9px] mt-0.5">Dasbor</span>
      </button>

      {/* 2. Database Kapal */}
      <button
        onClick={() => setActiveTab('vessels')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors cursor-pointer min-w-[48px] ${
          activeTab === 'vessels'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Ship className={`w-4.5 h-4.5 ${activeTab === 'vessels' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[9px] mt-0.5">Kapal</span>
      </button>

      {/* 3. CENTER HIGHLIGHT: CHECKLIST BUTTON */}
      <div className="relative -top-2.5">
        <button
          onClick={onOpenChecklist}
          title="Isi Formulir Checklist"
          className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex flex-col items-center justify-center shadow-lg shadow-blue-900/50 border-2 border-slate-900 active:scale-95 transition-all cursor-pointer"
        >
          <ClipboardCheck className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Matriks Risiko */}
      <button
        onClick={() => setActiveTab('matrix')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors cursor-pointer min-w-[48px] ${
          activeTab === 'matrix'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <AlertOctagon className={`w-4.5 h-4.5 ${activeTab === 'matrix' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[9px] mt-0.5">Matriks</span>
      </button>

      {/* 5. Cloud & DB */}
      <button
        onClick={() => setActiveTab('storage')}
        className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg transition-colors cursor-pointer min-w-[48px] ${
          activeTab === 'storage'
            ? 'text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Database className={`w-4.5 h-4.5 ${activeTab === 'storage' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[9px] mt-0.5">Cloud</span>
      </button>
    </nav>
  );
};

