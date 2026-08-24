import React, { useMemo } from 'react';
import { Vessel } from '../types';
import { RiskBadge } from './RiskBadge';
import { MapPin, Compass, ChevronRight } from 'lucide-react';
import { normalizePortName } from '../constants/ports';

interface RiskMatrixViewProps {
  vessels: Vessel[];
  onSelectVessel: (vessel: Vessel) => void;
  onFilterPort: (port: string) => void;
}

export const RiskMatrixView: React.FC<RiskMatrixViewProps> = ({
  vessels,
  onSelectVessel,
  onFilterPort
}) => {
  // Group vessels by Port with normalized naming
  const portGroups = useMemo(() => {
    const map = new Map<string, Vessel[]>();
    vessels.forEach((v) => {
      const port = normalizePortName(v.homePort);
      if (!map.has(port)) {
        map.set(port, []);
      }
      map.get(port)!.push(v);
    });

    return Array.from(map.entries()).map(([portName, list]) => {
      const highRisk = list.filter(v => v.riskLevel === 'HIGH').length;
      const medRisk = list.filter(v => v.riskLevel === 'MEDIUM').length;
      const lowRisk = list.filter(v => v.riskLevel === 'LOW').length;
      const avgScore = Math.round(list.reduce((acc, v) => acc + (v.riskScore || 0), 0) / list.length);

      return {
        portName,
        vessels: list,
        total: list.length,
        highRisk,
        medRisk,
        lowRisk,
        avgScore
      };
    }).sort((a, b) => b.highRisk - a.highRisk || b.total - a.total);
  }, [vessels]);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Intro Banner */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Matriks Persebaran Risiko Kepatuhan Berdasarkan Pelabuhan Pangkalan</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Pemetaan tingkat kepatuhan dan konsentrasi armada berisiko tinggi di pelabuhan perikanan Indonesia
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-slate-600 font-medium">Tinggi ({vessels.filter(v => v.riskLevel === 'HIGH').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <span className="text-slate-600 font-medium">Sedang ({vessels.filter(v => v.riskLevel === 'MEDIUM').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span className="text-slate-600 font-medium">Patuh ({vessels.filter(v => v.riskLevel === 'LOW').length})</span>
          </div>
        </div>
      </div>

      {/* Grid of Ports */}
      {portGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Compass className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-slate-700 text-sm">Belum Ada Data Kapal Terdaftar</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Matriks persebaran risiko pelabuhan akan terisi otomatis setelah Anda mendaftarkan kapal atau melakukan checklist inspeksi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {portGroups.map((group) => (
            <div
              key={group.portName}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col overflow-hidden"
            >
              {/* Port Card Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <MapPin className="w-4 h-4 shrink-0 text-blue-600 mt-0.5 self-start" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2" title={group.portName}>
                      {group.portName}
                    </h4>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-5.5">
                    {group.total} Kapal Terdaftar • Skor Rata-rata: <strong className="font-mono text-slate-700">{group.avgScore}</strong>
                  </div>
                </div>

                {group.highRisk > 0 && (
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold shrink-0">
                    {group.highRisk} Kritis
                  </span>
                )}
              </div>

              {/* Visual Risk Distribution Bar */}
              <div className="p-3.5 sm:p-4 flex-1 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1.5">
                    <span>Komposisi Armada:</span>
                    <span className="font-semibold text-slate-700">{group.lowRisk} Patuh • {group.medRisk} Sedang • {group.highRisk} Tinggi</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div className="bg-green-500 h-full" style={{ width: `${(group.lowRisk / group.total) * 100}%` }} />
                    <div className="bg-orange-400 h-full" style={{ width: `${(group.medRisk / group.total) * 100}%` }} />
                    <div className="bg-red-500 h-full" style={{ width: `${(group.highRisk / group.total) * 100}%` }} />
                  </div>
                </div>

                {/* Vessel Quick Items in Port */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sampel Armada di Pelabuhan Ini:
                  </div>
                  {group.vessels.slice(0, 3).map((v) => (
                    <div
                      key={v.id}
                      onClick={() => onSelectVessel(v)}
                      className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors flex items-center justify-between cursor-pointer text-xs active:bg-slate-200"
                    >
                      <span className="font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[150px]">{v.name}</span>
                      <RiskBadge level={v.riskLevel} score={v.riskScore} size="sm" showIcon={false} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Action */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onFilterPort(group.portName)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Filter kapal pelabuhan ini</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
