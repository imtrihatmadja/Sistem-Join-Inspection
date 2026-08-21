import React from 'react';
import { InspectionStats, Vessel } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, FileText, Anchor, CheckCircle2, Clock, BarChart3, ChevronRight, ClipboardCheck, MapPin } from 'lucide-react';
import { RiskBadge } from './RiskBadge';

interface DashboardStatsProps {
  stats: InspectionStats;
  vessels: Vessel[];
  onSelectVessel: (vessel: Vessel) => void;
  onFilterRisk: (risk: string) => void;
  onOpenChecklist?: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  vessels,
  onSelectVessel,
  onFilterRisk,
  onOpenChecklist
}) => {
  const highRiskVessels = vessels.filter((v) => v.riskLevel === 'HIGH');
  const recentInspectedVessels = [...vessels]
    .filter(v => v.lastInspectionDate)
    .sort((a, b) => new Date(b.lastInspectionDate || '').getTime() - new Date(a.lastInspectionDate || '').getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Official Checklist Quick Action Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-xl border border-blue-700/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Formulir Daftar Periksa Ketenagakerjaan
              </h3>
              <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-400/30">
                Resmi I - VIII
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Standar Bersama ILO C188 / KKP / Kemnaker: Penilaian Risiko & Validasi Lapangan
            </p>
          </div>
        </div>

        {onOpenChecklist && (
          <button
            onClick={onOpenChecklist}
            className="w-full md:w-auto px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>📋 Isi Formulir Checklist Baru</span>
          </button>
        )}
      </div>

      {/* 4 Metric Cards - 2x2 on Mobile, 4x1 on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Card 1: Total Kapal */}
        <div className="bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total Kapal
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">
            {stats.totalVessels.toLocaleString('id-ID')}
          </h3>
          <p className="text-[9px] sm:text-[10px] text-blue-600 font-semibold mt-1 sm:mt-2 truncate">
            ↑ {stats.totalInspections} Terinspeksi
          </p>
        </div>

        {/* Card 2: Tindak Lanjut */}
        <div className="bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
            Tindak Lanjut
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">
            {stats.pendingFollowUps}
          </h3>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-1 sm:mt-2 truncate">
            Menunggu Tindakan
          </p>
        </div>

        {/* Card 3: Tingkat Kepatuhan */}
        <div className="bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
            Kepatuhan PKL
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 mt-0.5 sm:mt-1">
            {stats.averageComplianceRate}%
          </h3>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-1 sm:mt-2 truncate">
            PKL & Asuransi
          </p>
        </div>

        {/* Card 4: Vessel Risiko Tinggi */}
        <div
          onClick={() => onFilterRisk('HIGH')}
          className="bg-white p-3.5 sm:p-4.5 rounded-xl border border-slate-200 hover:border-red-300 shadow-xs cursor-pointer transition-all"
        >
          <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
            Risiko Tinggi
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-red-600 mt-0.5 sm:mt-1">
            {stats.highRiskCount}
          </h3>
          <p className="text-[9px] sm:text-[10px] text-red-600 font-bold mt-1 sm:mt-2 truncate">
            ⚠️ Tunda SPB
          </p>
        </div>

      </div>

      {/* Main Grid: 8 Cols (Table Preview) + 4 Cols (Risk Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left 8 Cols: Inspeksi Terakhir */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xs">
          
          <div className="px-4 py-3 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Anchor className="w-4 h-4 text-blue-600" />
              <span>Inspeksi Terakhir & Status Kepatuhan</span>
            </h4>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              Update Real-Time
            </span>
          </div>

          {/* Mobile list for recent inspections */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {recentInspectedVessels.map((v) => (
              <div
                key={`mob-recent-${v.id}`}
                onClick={() => onSelectVessel(v)}
                className="p-3 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 truncate block">{v.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{v.registrationNumber} • {v.homePort}</span>
                  </div>
                  <RiskBadge level={v.riskLevel} score={v.riskScore} size="sm" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>{v.grossTonnage} GT • {v.gearType}</span>
                  <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                    Detail <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table for recent inspections */}
          <div className="hidden sm:block flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Kapal</th>
                  <th className="px-4 py-3">GT & Alat Tangkap</th>
                  <th className="px-4 py-3">Pelabuhan</th>
                  <th className="px-4 py-3">Skor Risiko</th>
                  <th className="px-4 py-3">Evaluasi / Tindakan</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50">
                {recentInspectedVessels.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => onSelectVessel(v)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {v.name}
                      <span className="block text-[10px] font-mono text-slate-400">
                        {v.registrationNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {v.grossTonnage} GT • {v.gearType}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {v.homePort}
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={v.riskLevel} score={v.riskScore} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-xs">
                      {v.lastRecommendation || 'Pemeriksaan rutin berkala'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Kapal Butuh Atensi Segera */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 sm:pb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Prioritas Pengawasan (Merah)</span>
            </h4>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              {highRiskVessels.length} Kapal
            </span>
          </div>

          <div className="space-y-2">
            {highRiskVessels.slice(0, 4).map((vessel) => (
              <div
                key={vessel.id}
                onClick={() => onSelectVessel(vessel)}
                className="p-3 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50 active:bg-red-100 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate max-w-[160px]">{vessel.name}</span>
                  <RiskBadge level={vessel.riskLevel} score={vessel.riskScore} size="sm" />
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {vessel.lastRecommendation || 'Terindikasi pelanggaran norma PKL / jam istirahat.'}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>{vessel.homePort}</span>
                  <span className="text-red-700 font-semibold flex items-center gap-0.5">
                    Buka Detail <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
