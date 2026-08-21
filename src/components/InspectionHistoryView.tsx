import React, { useState } from 'react';
import { InspectionRecord, Vessel } from '../types';
import { RiskBadge } from './RiskBadge';
import { Search, Calendar, FileText, ChevronRight, MapPin } from 'lucide-react';

interface InspectionHistoryViewProps {
  inspections: InspectionRecord[];
  vessels: Vessel[];
  onSelectVessel: (vessel: Vessel) => void;
  selectedPort: string;
}

export const InspectionHistoryView: React.FC<InspectionHistoryViewProps> = ({
  inspections,
  vessels,
  onSelectVessel,
  selectedPort
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  const filteredInspections = inspections.filter((insp) => {
    if (selectedPort !== 'Semua Pelabuhan' && !insp.inspectionPort.toLowerCase().includes(selectedPort.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'ALL' && insp.followUpStatus !== statusFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = insp.vesselName.toLowerCase().includes(q);
      const matchReg = insp.registrationNumber.toLowerCase().includes(q);
      const matchPort = insp.inspectionPort.toLowerCase().includes(q);
      const matchInspectors = insp.inspectors.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchPort && !matchInspectors) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-3.5 sm:p-5">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Log Riwayat Hasil Inspeksi Bersama di Pelabuhan</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Dokumentasi pengawasan ketenagakerjaan dan status tindak lanjut temuan kepatuhan awak kapal
          </p>
        </div>

        {/* Filter Badges with horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs font-medium shrink-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({inspections.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs cursor-pointer ${
                statusFilter === 'PENDING' ? 'bg-red-600 text-white font-bold shadow-2xs' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              Pending ({inspections.filter(i => i.followUpStatus === 'PENDING').length})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs cursor-pointer ${
                statusFilter === 'IN_PROGRESS' ? 'bg-orange-500 text-white font-bold shadow-2xs' : 'text-orange-700 hover:bg-orange-50'
              }`}
            >
              Proses
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs cursor-pointer ${
                statusFilter === 'RESOLVED' ? 'bg-green-600 text-white font-bold shadow-2xs' : 'text-green-700 hover:bg-green-50'
              }`}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Search Field */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari log kapal, nomor SIPI, pelabuhan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white min-h-[40px]"
        />
      </div>

      {/* Timeline List */}
      <div className="space-y-3 pt-1">
        {filteredInspections.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Tidak ada log inspeksi yang cocok dengan kriteria filter.
          </div>
        ) : (
          filteredInspections.map((insp) => {
            const matchedVessel = vessels.find(v => v.id === insp.vesselId);
            const crewPklCount = insp.crewData.crewWithPklCount ?? (insp.crewData.hasPklContracts ? insp.crewData.totalCrew : 0);
            return (
              <div
                key={insp.id}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-2xs transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          onClick={() => matchedVessel && onSelectVessel(matchedVessel)}
                          className="font-bold text-slate-900 text-xs sm:text-sm hover:text-blue-600 cursor-pointer transition-colors truncate"
                        >
                          {insp.vesselName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">({insp.registrationNumber})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>{insp.inspectionDate} • {insp.inspectionPort}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <RiskBadge level={insp.riskEvaluation.riskLevel} score={insp.riskEvaluation.score} size="sm" />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      insp.followUpStatus === 'RESOLVED'
                        ? 'bg-green-100 text-green-800'
                        : insp.followUpStatus === 'IN_PROGRESS'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {insp.followUpStatus === 'RESOLVED' ? 'Selesai' : (insp.followUpStatus === 'IN_PROGRESS' ? 'Proses' : 'Pending')}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg space-y-1.5 border border-slate-100">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    <span><strong>Tim:</strong> {insp.inspectors}</span>
                    <span>•</span>
                    <span><strong>ABK Ber-PKL:</strong> {crewPklCount} / {insp.crewData.totalCrew}</span>
                    <span>•</span>
                    <span><strong>Temuan:</strong> {insp.violations.length} catatan</span>
                    {insp.checklistData && (
                      <>
                        <span>•</span>
                        <span className="text-blue-700 font-semibold">
                          <strong>Checklist Terisi:</strong> 22 Indikator
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-slate-700 font-medium text-[11px]">
                    <strong>Rekomendasi:</strong> {insp.riskEvaluation.recommendation}
                  </div>
                  {insp.officialNotes && (
                    <div className="text-slate-500 italic text-[11px] pt-0.5">
                      Catatan: "{insp.officialNotes}"
                    </div>
                  )}
                </div>

                {/* Quick link & Data status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Tersinkron di Supabase & Firestore</span>
                  </div>

                  {matchedVessel && (
                    <button
                      onClick={() => onSelectVessel(matchedVessel)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Buka Profil Lengkap Kapal</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
