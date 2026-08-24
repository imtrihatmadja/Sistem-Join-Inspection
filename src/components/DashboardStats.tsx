import React, { useState, useMemo } from 'react';
import { InspectionStats, Vessel } from '../types';
import { ShieldAlert, AlertTriangle, Anchor, ChevronRight, ClipboardCheck, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';
import { RiskBadge } from './RiskBadge';

interface DashboardStatsProps {
  stats: InspectionStats;
  vessels: Vessel[];
  onSelectVessel: (vessel: Vessel) => void;
  onFilterRisk: (risk: string) => void;
  onOpenChecklist?: () => void;
}

type SortField = 'name' | 'gt' | 'port' | 'risk' | 'recommendation';

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  vessels,
  onSelectVessel,
  onFilterRisk,
  onOpenChecklist
}) => {
  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const highRiskVessels = vessels.filter((v) => v.riskLevel === 'HIGH');

  // Filter ONLY vessels with MEDIUM and HIGH risk (exclude LOW risk)
  const mediumAndHighRiskVessels = useMemo(() => {
    return vessels.filter((v) => v.riskLevel === 'HIGH' || v.riskLevel === 'MEDIUM');
  }, [vessels]);

  // Sort vessels based on selected column
  const sortedVessels = useMemo(() => {
    const list = [...mediumAndHighRiskVessels];
    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'id', { sensitivity: 'base' });
      } else if (sortField === 'gt') {
        comparison = (a.grossTonnage || 0) - (b.grossTonnage || 0);
      } else if (sortField === 'port') {
        comparison = (a.homePort || '').localeCompare(b.homePort || '', 'id', { sensitivity: 'base' });
      } else if (sortField === 'risk') {
        comparison = (a.riskScore || 0) - (b.riskScore || 0);
      } else if (sortField === 'recommendation') {
        comparison = (a.lastRecommendation || '').localeCompare(b.lastRecommendation || '', 'id', { sensitivity: 'base' });
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [mediumAndHighRiskVessels, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default to descending for risk and GT, ascending for text
      setSortOrder(field === 'risk' || field === 'gt' ? 'desc' : 'asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 font-bold" />
    );
  };

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
        
        {/* Left 8 Cols: Kapal Berisiko Sedang & Tinggi (Scrollable with sorting) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xs">
          
          <div className="px-4 py-3 sm:py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Kapal Berisiko Sedang & Tinggi
                </h4>
                <p className="text-[10px] text-slate-500">
                  Prioritas pemantauan kepatuhan & tindakan korektif
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {sortedVessels.length} Kapal Perlu Atensi
              </span>
            </div>
          </div>

          {/* Mobile list for medium & high risk vessels (Scrollable) */}
          <div className="block sm:hidden max-h-[380px] overflow-y-auto divide-y divide-slate-100 p-1">
            {sortedVessels.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Tidak Ada Kapal Berisiko Sedang / Tinggi</p>
                <p className="text-[11px] text-slate-400">Seluruh armada yang terdata saat ini berkategori patuh (risiko rendah).</p>
              </div>
            ) : (
              sortedVessels.map((v) => (
                <div
                  key={`mob-risk-${v.id}`}
                  onClick={() => onSelectVessel(v)}
                  className="p-3 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-1.5 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 truncate block">{v.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{v.registrationNumber} • {v.homePort}</span>
                    </div>
                    <RiskBadge level={v.riskLevel} score={v.riskScore} size="sm" />
                  </div>
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 line-clamp-2">
                    {v.lastRecommendation || 'Pemeriksaan berkala / tindakan perbaikan'}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>{v.grossTonnage} GT • {v.gearType}</span>
                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                      Detail <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table for medium & high risk vessels with Scrollable container and Sortable headers */}
          <div className="hidden sm:block flex-1 max-h-[420px] overflow-y-auto overflow-x-auto">
            {sortedVessels.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Tidak Ada Kapal Berisiko Sedang / Tinggi</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Seluruh armada yang terdaftar saat ini berada dalam kategori kepatuhan penuh (risiko rendah).
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 text-[11px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider shadow-xs">
                  <tr>
                    {/* Sortable Header: Nama Kapal */}
                    <th
                      onClick={() => handleSort('name')}
                      className="px-4 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Klik untuk mengurutkan berdasarkan Nama Kapal"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={sortField === 'name' ? 'text-blue-600 font-extrabold' : ''}>Nama Kapal</span>
                        {renderSortIcon('name')}
                      </div>
                    </th>

                    {/* Sortable Header: GT & Alat Tangkap */}
                    <th
                      onClick={() => handleSort('gt')}
                      className="px-4 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Klik untuk mengurutkan berdasarkan Gross Tonnage (GT)"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={sortField === 'gt' ? 'text-blue-600 font-extrabold' : ''}>GT & Alat Tangkap</span>
                        {renderSortIcon('gt')}
                      </div>
                    </th>

                    {/* Sortable Header: Pelabuhan */}
                    <th
                      onClick={() => handleSort('port')}
                      className="px-4 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Klik untuk mengurutkan berdasarkan Pelabuhan Pangkalan"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={sortField === 'port' ? 'text-blue-600 font-extrabold' : ''}>Pelabuhan</span>
                        {renderSortIcon('port')}
                      </div>
                    </th>

                    {/* Sortable Header: Skor Risiko */}
                    <th
                      onClick={() => handleSort('risk')}
                      className="px-4 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Klik untuk mengurutkan berdasarkan Skor Risiko"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={sortField === 'risk' ? 'text-blue-600 font-extrabold' : ''}>Skor Risiko</span>
                        {renderSortIcon('risk')}
                      </div>
                    </th>

                    {/* Sortable Header: Evaluasi / Tindakan */}
                    <th
                      onClick={() => handleSort('recommendation')}
                      className="px-4 py-3 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Klik untuk mengurutkan berdasarkan Evaluasi / Tindakan"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={sortField === 'recommendation' ? 'text-blue-600 font-extrabold' : ''}>Evaluasi / Tindakan</span>
                        {renderSortIcon('recommendation')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {sortedVessels.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => onSelectVessel(v)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{v.name}</span>
                        </div>
                        <span className="block text-[10px] font-mono text-slate-400">
                          {v.registrationNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="font-semibold text-slate-800">{v.grossTonnage} GT</span>
                        <span className="block text-[10px] text-slate-400">{v.gearType}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {v.homePort}
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={v.riskLevel} score={v.riskScore} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        <p className="line-clamp-2 text-[11px] leading-relaxed">
                          {v.lastRecommendation || (v.riskLevel === 'HIGH' ? 'Rekomendasi Penundaan SPB & Pemanggilan Pemilik' : 'Penerbitan Nota Pemeriksaan Kepatuhan')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer of Table */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Menampilkan <strong>{sortedVessels.length}</strong> kapal berisiko sedang & tinggi</span>
            <span className="text-[10px] text-slate-400 italic">Gunakan scroll untuk menavigasi daftar lengkap</span>
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
