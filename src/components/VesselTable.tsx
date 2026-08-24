import React, { useState, useMemo } from 'react';
import { Vessel, RiskLevel } from '../types';
import { RiskBadge } from './RiskBadge';
import { Search, ArrowUpDown, ChevronRight, Ship, ClipboardCheck, Trash2, Loader2, MapPin } from 'lucide-react';
import { deleteVessel } from '../services/vesselService';

interface VesselTableProps {
  vessels: Vessel[];
  onSelectVessel: (vessel: Vessel) => void;
  onInspectVessel: (vessel: Vessel) => void;
  onOpenChecklist?: (vessel?: Vessel) => void;
  onDeleteVessel?: (vessel: Vessel) => void;
  selectedPort: string;
}

export const VesselTable: React.FC<VesselTableProps> = ({
  vessels,
  onSelectVessel,
  onInspectVessel,
  onOpenChecklist,
  onDeleteVessel,
  selectedPort
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'date' | 'name' | 'gt'>('risk');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [vesselToDelete, setVesselToDelete] = useState<Vessel | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const filteredVessels = useMemo(() => {
    return vessels.filter((v) => {
      // Port filter
      if (selectedPort !== 'Semua Pelabuhan' && !v.homePort.toLowerCase().includes(selectedPort.toLowerCase())) {
        return false;
      }
      // Risk filter
      if (riskFilter !== 'ALL' && v.riskLevel !== riskFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = v.name.toLowerCase().includes(query);
        const matchReg = v.registrationNumber.toLowerCase().includes(query);
        const matchOwner = v.ownerName.toLowerCase().includes(query);
        const matchAgent = v.agentName.toLowerCase().includes(query);
        const matchCallSign = v.callSign.toLowerCase().includes(query);
        if (!matchName && !matchReg && !matchOwner && !matchAgent && !matchCallSign) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'risk') {
        comparison = (a.riskScore || 0) - (b.riskScore || 0);
      } else if (sortBy === 'date') {
        comparison = new Date(a.lastInspectionDate || 0).getTime() - new Date(b.lastInspectionDate || 0).getTime();
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'gt') {
        comparison = (a.grossTonnage || 0) - (b.grossTonnage || 0);
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [vessels, selectedPort, riskFilter, searchTerm, sortBy, sortDirection]);

  const handleSortChange = (newSort: 'risk' | 'date' | 'name' | 'gt') => {
    if (sortBy === newSort) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSort);
      setSortDirection('desc');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Control & Search Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/70">
        
        {/* Top row: Search input & CTA */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="vessel-search-input"
              type="text"
              placeholder="Cari nama kapal, SIPI, pemilik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 placeholder-slate-400 min-h-[40px]"
            />
          </div>

          {onOpenChecklist && (
            <button
              onClick={() => onOpenChecklist()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0 min-h-[40px]"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>+ Formulir Checklist</span>
            </button>
          )}
        </div>

        {/* Filter Badges with horizontal swipe on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs font-medium shrink-0">
            <button
              id="filter-risk-all"
              onClick={() => setRiskFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs cursor-pointer ${
                riskFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({vessels.length})
            </button>
            <button
              id="filter-risk-high"
              onClick={() => setRiskFilter('HIGH')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs cursor-pointer ${
                riskFilter === 'HIGH' ? 'bg-red-600 text-white font-bold shadow-2xs' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              Tinggi ({vessels.filter(v => v.riskLevel === 'HIGH').length})
            </button>
            <button
              id="filter-risk-medium"
              onClick={() => setRiskFilter('MEDIUM')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs cursor-pointer ${
                riskFilter === 'MEDIUM' ? 'bg-orange-500 text-white font-bold shadow-2xs' : 'text-orange-700 hover:bg-orange-50'
              }`}
            >
              Sedang ({vessels.filter(v => v.riskLevel === 'MEDIUM').length})
            </button>
            <button
              id="filter-risk-low"
              onClick={() => setRiskFilter('LOW')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs cursor-pointer ${
                riskFilter === 'LOW' ? 'bg-green-600 text-white font-bold shadow-2xs' : 'text-green-700 hover:bg-green-50'
              }`}
            >
              Patuh ({vessels.filter(v => v.riskLevel === 'LOW').length})
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW: High-Contrast Card List (Visible on < 640px) */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {filteredVessels.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Ship className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600 text-xs">Tidak ada kapal yang sesuai filter</p>
            <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian.</p>
          </div>
        ) : (
          filteredVessels.map((vessel) => (
            <div
              key={`mob-${vessel.id}`}
              onClick={() => onSelectVessel(vessel)}
              className="p-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{vessel.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {vessel.registrationNumber} • {vessel.grossTonnage} GT
                  </p>
                </div>
                <RiskBadge level={vessel.riskLevel} score={vessel.riskScore} size="sm" />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[140px]">{vessel.homePort}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-600">
                  {vessel.lastInspectionDate ? `Insp: ${vessel.lastInspectionDate}` : 'Belum diperiksa'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <span className={`text-[11px] font-bold ${
                  vessel.riskLevel === 'HIGH' ? 'text-red-600' : vessel.riskLevel === 'MEDIUM' ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {vessel.riskLevel === 'HIGH' ? '⚠️ Tunda SPB' : vessel.riskLevel === 'MEDIUM' ? '⏱️ Perbaikan 14 Hari' : '✓ Patuh'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (onOpenChecklist) onOpenChecklist(vessel);
                      else onInspectVessel(vessel);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-transform"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Checklist</span>
                  </button>
                  <button
                    onClick={() => onSelectVessel(vessel)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP & TABLET VIEW: Full Data Table (Visible on >= 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-white sticky top-0 text-[11px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3">
                <button 
                  onClick={() => handleSortChange('name')}
                  className="flex items-center gap-1 hover:text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <span>Identitas Kapal</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button 
                  onClick={() => handleSortChange('gt')}
                  className="flex items-center gap-1 hover:text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <span>GT</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button 
                  onClick={() => handleSortChange('date')}
                  className="flex items-center gap-1 hover:text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <span>Inspeksi Terakhir</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button 
                  onClick={() => handleSortChange('risk')}
                  className="flex items-center gap-1 hover:text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <span>Skor Risiko</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">Status Evaluasi Lapangan</th>
              <th scope="col" className="px-4 py-3 text-right">Tindakan</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredVessels.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <Ship className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600 text-xs">Tidak ada kapal yang sesuai filter</p>
                  <p className="text-[11px]">Coba sesuaikan kata kunci pencarian atau ubah filter pangkalan.</p>
                </td>
              </tr>
            ) : (
              filteredVessels.map((vessel) => (
                <tr
                  key={vessel.id}
                  onClick={() => onSelectVessel(vessel)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  {/* Vessel Identity */}
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {vessel.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {vessel.registrationNumber} • {vessel.homePort}
                    </div>
                  </td>

                  {/* GT */}
                  <td className="px-4 py-3.5 text-slate-700 font-medium">
                    {vessel.grossTonnage} GT
                  </td>

                  {/* Last Inspection Date */}
                  <td className="px-4 py-3.5 text-slate-600">
                    {vessel.lastInspectionDate ? (
                      <div>
                        <span>{vessel.lastInspectionDate}</span>
                        <div className="text-[10px] text-slate-400">{vessel.totalInspections}x inspeksi</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Belum diperiksa</span>
                    )}
                  </td>

                  {/* Risk Score */}
                  <td className="px-4 py-3.5">
                    <RiskBadge level={vessel.riskLevel} score={vessel.riskScore} size="sm" />
                  </td>

                  {/* Compliance Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-xs font-semibold ${
                        vessel.riskLevel === 'HIGH'
                          ? 'text-red-600'
                          : vessel.riskLevel === 'MEDIUM'
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {vessel.riskLevel === 'HIGH'
                        ? 'Pelanggaran Berat / Tunda SPB'
                        : vessel.riskLevel === 'MEDIUM'
                        ? 'Perbaikan Berkas 14 Hari'
                        : 'Patuh Sepenuhnya'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={`btn-table-checklist-${vessel.id}`}
                        onClick={() => {
                          if (onOpenChecklist) {
                            onOpenChecklist(vessel);
                          } else {
                            onInspectVessel(vessel);
                          }
                        }}
                        title="Isi Formulir Checklist Resmi"
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Checklist</span>
                      </button>

                      <button
                        id={`btn-table-delete-${vessel.id}`}
                        onClick={() => setVesselToDelete(vessel)}
                        title="Hapus Kapal dari Database"
                        className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus</span>
                      </button>

                      <button
                        id={`btn-table-detail-${vessel.id}`}
                        onClick={() => onSelectVessel(vessel)}
                        title="Detail Kapal"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Konfirmasi Hapus Kapal */}
      {vesselToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hapus Data Kapal?</h3>
                  <p className="text-xs text-slate-500 font-mono">{vesselToDelete.name} ({vesselToDelete.registrationNumber})</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-5">
                Apakah Anda yakin ingin menghapus kapal <strong>{vesselToDelete.name}</strong>? Tindakan ini akan menghapus data kapal dan seluruh log inspeksi terkait secara permanen dari Supabase, Firestore, dan penyimpanan lokal.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setVesselToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-vessel"
                  disabled={isDeleting}
                  onClick={async () => {
                    try {
                      setIsDeleting(true);
                      await deleteVessel(vesselToDelete.id);
                      if (onDeleteVessel) {
                        onDeleteVessel(vesselToDelete);
                      }
                      setVesselToDelete(null);
                    } catch (err) {
                      console.error('Gagal menghapus kapal:', err);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ya, Hapus Kapal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Footer */}
      <div className="px-3.5 sm:px-4 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1">
        <span>Menampilkan <strong>{filteredVessels.length}</strong> dari {vessels.length} armada kapal perikanan</span>
        <span className="text-slate-400">Sinkronisasi Cloud Firestore Aktif</span>
      </div>
    </div>
  );
};
