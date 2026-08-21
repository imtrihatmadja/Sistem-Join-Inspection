import React, { useState, useEffect } from 'react';
import { Vessel, InspectionRecord, VesselEvidence } from '../types';
import { RiskBadge } from './RiskBadge';
import {
  X,
  Ship,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  User,
  Printer,
  Plus,
  Clock,
  ExternalLink,
  ClipboardCheck,
  HardDrive
} from 'lucide-react';
import { getRiskColor } from '../services/riskEngine';
import { VesselEvidenceVault } from './VesselEvidenceVault';
import { getStoredEvidences } from '../services/googleDriveService';

interface VesselDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vessel: Vessel | null;
  inspections: InspectionRecord[];
  onOpenNewInspection: (vessel: Vessel) => void;
  onUpdateFollowUp: (inspectionId: string, newStatus: InspectionRecord['followUpStatus'], notes?: string) => Promise<void>;
  currentUserEmail?: string;
}

export const VesselDetailModal: React.FC<VesselDetailModalProps> = ({
  isOpen,
  onClose,
  vessel,
  inspections,
  onOpenNewInspection,
  onUpdateFollowUp,
  currentUserEmail
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'evidence' | 'history' | 'violations' | 'print'>('profile');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [evidences, setEvidences] = useState<VesselEvidence[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEvidences(getStoredEvidences());
    }
  }, [isOpen]);

  if (!isOpen || !vessel) return null;

  const vesselInspections = inspections.filter((i) => i.vesselId === vessel.id);
  const latestInspection = vesselInspections[0];
  const riskVisual = getRiskColor(vessel.riskLevel);
  const vesselEvidences = evidences.filter((e) => e.vesselId === vessel.id);

  const handleStatusChange = async (inspectionId: string, status: InspectionRecord['followUpStatus']) => {
    setUpdatingId(inspectionId);
    await onUpdateFollowUp(inspectionId, status);
    setUpdatingId(null);
  };

  const handlePrint = () => {
    window.print();
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] max-w-4xl bg-white rounded-none sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header Drawer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Ship className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-slate-900 truncate">{vessel.name}</h2>
                <RiskBadge level={vessel.riskLevel} score={vessel.riskScore} size="sm" />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-mono truncate">
                {vessel.registrationNumber} • {vessel.homePort}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="btn-vessel-inspect-now"
              onClick={() => {
                onClose();
                onOpenNewInspection(vessel);
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] sm:text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Isi Checklist</span>
              <span className="sm:hidden">Checklist</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar - Swipeable Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-slate-200 bg-white overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 sm:py-3 px-3 text-xs font-semibold border-b-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profil & Dokumen
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-2.5 sm:py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'evidence'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-600" />
            <span>Bukti Google Drive ({vesselEvidences.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 sm:py-3 px-3 text-xs font-semibold border-b-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'history'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Riwayat ({vesselInspections.length})
          </button>

          <button
            onClick={() => setActiveTab('violations')}
            className={`py-2.5 sm:py-3 px-3 text-xs font-semibold border-b-2 transition-colors shrink-0 cursor-pointer ${
              activeTab === 'violations'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Temuan Pelanggaran
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`py-2.5 sm:py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
              activeTab === 'print'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Berita Acara</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* TAB 1: Profil & Kepatuhan */}
          {activeTab === 'profile' && (

            <div className="space-y-4 sm:space-y-6">
              
              {/* Risk Status Banner */}
              <div className={`p-3.5 sm:p-4 rounded-xl border ${riskVisual.border} ${riskVisual.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                <div className="space-y-1">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-500">
                    Status Evaluasi Pengawasan
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {riskVisual.label} — Skor Kepatuhan Risiko: {vessel.riskScore}/100
                  </div>
                  <p className="text-xs text-slate-700">
                    {vessel.lastRecommendation || 'Kapal dalam pengawasan rutin pelabuhan.'}
                  </p>
                </div>
              </div>

              {/* Grid 2 Cols: Vessel Specs & Owner Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                
                {/* Specs */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                    Spesifikasi Kapal
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Gross Tonnage (GT):</span>
                      <span className="font-semibold text-slate-800">{vessel.grossTonnage} GT</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Tanda Selar / Call Sign:</span>
                      <span className="font-mono font-semibold text-slate-800">{vessel.callSign || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Jenis Alat Tangkap:</span>
                      <span className="font-semibold text-teal-700">{vessel.gearType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Pelabuhan Pangkalan:</span>
                      <span className="font-semibold text-slate-800">{vessel.homePort}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Kapasitas Maksimal ABK:</span>
                      <span className="font-semibold text-slate-800">{vessel.crewCapacity} Orang</span>
                    </div>
                  </div>
                </div>

                {/* Owner & Legal Agent */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
                    Legalitas Pemilik & Keagenan
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Nama Pemilik:</span>
                      <span className="font-semibold text-slate-800">{vessel.ownerName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Agen Operasional:</span>
                      <span className="font-semibold text-slate-800">{vessel.agentName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">Total Riwayat Inspeksi:</span>
                      <span className="font-semibold text-slate-800">{vessel.totalInspections || vesselInspections.length} Kali</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Tanggal Terdaftar:</span>
                      <span className="font-mono text-slate-700">{vessel.createdAt?.split('T')[0] || '-'}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: Bukti Google Drive */}
          {activeTab === 'evidence' && (
            <VesselEvidenceVault
              vessel={vessel}
              evidences={evidences}
              onEvidenceChange={() => setEvidences(getStoredEvidences())}
              currentUserEmail={currentUserEmail}
            />
          )}

          {/* TAB 2: Riwayat Inspeksi */}
          {activeTab === 'history' && (
            <div className="space-y-3 sm:space-y-4">
              {vesselInspections.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Belum ada catatan inspeksi resmi untuk kapal ini.
                </div>
              ) : (
                vesselInspections.map((insp) => (
                  <div
                    key={insp.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs">{insp.inspectionDate}</span>
                        <span className="text-xs text-slate-500 font-mono">({insp.inspectionPort})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RiskBadge level={insp.riskEvaluation.riskLevel} score={insp.riskEvaluation.score} size="sm" />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          insp.followUpStatus === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {insp.followUpStatus}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div><strong>Tim:</strong> {insp.inspectors}</div>
                      <div><strong>Rekomendasi:</strong> {insp.riskEvaluation.recommendation}</div>
                      {insp.officialNotes && (
                        <div className="text-slate-500 italic bg-slate-50 p-2 rounded-lg mt-1.5 text-[11px]">
                          "{insp.officialNotes}"
                        </div>
                      )}
                      {insp.checklistData && (
                        insp.checklistData.noteIndicator8 ||
                        insp.checklistData.noteIndicator9 ||
                        insp.checklistData.noteIndicator10 ||
                        insp.checklistData.noteIndicator11 ||
                        insp.checklistData.noteIndicator12 ||
                        insp.checklistData.noteIndicator13 ||
                        insp.checklistData.noteIndicator16 ||
                        insp.checklistData.noteIndicator17 ||
                        insp.checklistData.noteIndicator18 ||
                        insp.checklistData.noteIndicator19 ||
                        insp.checklistData.noteIndicator20 ||
                        insp.checklistData.noteIndicator21 ||
                        insp.checklistData.noteIndicator22
                      ) && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 bg-slate-50/70 p-2.5 rounded-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                            Catatan Khusus Lapangan per Indikator:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                            {insp.checklistData.noteIndicator8 && <div><strong>No. 8:</strong> {insp.checklistData.noteIndicator8}</div>}
                            {insp.checklistData.noteIndicator9 && <div><strong>No. 9:</strong> {insp.checklistData.noteIndicator9}</div>}
                            {insp.checklistData.noteIndicator10 && <div><strong>No. 10:</strong> {insp.checklistData.noteIndicator10}</div>}
                            {insp.checklistData.noteIndicator11 && <div><strong>No. 11:</strong> {insp.checklistData.noteIndicator11}</div>}
                            {insp.checklistData.noteIndicator12 && <div><strong>No. 12:</strong> {insp.checklistData.noteIndicator12}</div>}
                            {insp.checklistData.noteIndicator13 && <div><strong>No. 13:</strong> {insp.checklistData.noteIndicator13}</div>}
                            {insp.checklistData.noteIndicator16 && <div><strong>No. 16:</strong> {insp.checklistData.noteIndicator16}</div>}
                            {insp.checklistData.noteIndicator17 && <div><strong>No. 17:</strong> {insp.checklistData.noteIndicator17}</div>}
                            {insp.checklistData.noteIndicator18 && <div><strong>No. 18:</strong> {insp.checklistData.noteIndicator18}</div>}
                            {insp.checklistData.noteIndicator19 && <div><strong>No. 19:</strong> {insp.checklistData.noteIndicator19}</div>}
                            {insp.checklistData.noteIndicator20 && <div><strong>No. 20:</strong> {insp.checklistData.noteIndicator20}</div>}
                            {insp.checklistData.noteIndicator21 && <div><strong>No. 21:</strong> {insp.checklistData.noteIndicator21}</div>}
                            {insp.checklistData.noteIndicator22 && <div><strong>No. 22:</strong> {insp.checklistData.noteIndicator22}</div>}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Follow up status toggle */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Status Tindak Lanjut:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={updatingId === insp.id}
                          onClick={() => handleStatusChange(insp.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold cursor-pointer"
                        >
                          Selesai (Resolved)
                        </button>
                        <button
                          disabled={updatingId === insp.id}
                          onClick={() => handleStatusChange(insp.id, 'IN_PROGRESS')}
                          className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-semibold cursor-pointer"
                        >
                          Dalam Proses
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Temuan Pelanggaran */}
          {activeTab === 'violations' && (
            <div className="space-y-3 sm:space-y-4">
              {vesselInspections.flatMap(i => i.violations).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  Tidak ada rekam jejak pelanggaran ketenagakerjaan aktif pada kapal ini.
                </div>
              ) : (
                vesselInspections.map((insp) => (
                  insp.violations.length > 0 && (
                    <div key={insp.id} className="space-y-2">
                      <div className="text-xs font-bold text-slate-600">
                        Inspeksi Tanggal {insp.inspectionDate} di {insp.inspectionPort}:
                      </div>
                      <div className="space-y-2">
                        {insp.violations.map((v, vIdx) => (
                          <div
                            key={vIdx}
                            className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 flex items-start gap-2.5"
                          >
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5 text-xs">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-rose-900">{v.title}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-800">
                                  {v.severity} (+{v.scoreWeight} Poin)
                                </span>
                              </div>
                              <p className="text-slate-700 text-[11px]">{v.notes}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))
              )}
            </div>
          )}

          {/* TAB 4: Cetak Berita Acara */}
          {activeTab === 'print' && (
            <div className="p-4 sm:p-6 bg-white rounded-xl border border-slate-300 shadow-xs space-y-4 sm:space-y-6 text-slate-900">
              
              <div className="text-center pb-3 border-b-2 border-slate-800 space-y-1">
                <div className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-slate-500">
                  DESTRUCTIVE FISHING WATCH (DFW) INDONESIA & TIM PENGAWASAN
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase">
                  LEMBAR RESUME PENGAWASAN KAPAL PERIKANAN
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="py-1"><span className="text-slate-500">Nama Kapal:</span> <strong>{vessel.name}</strong></div>
                  <div className="py-1"><span className="text-slate-500">No SIPI:</span> <strong>{vessel.registrationNumber}</strong></div>
                  <div className="py-1"><span className="text-slate-500">Ukuran:</span> <strong>{vessel.grossTonnage} GT</strong></div>
                </div>
                <div>
                  <div className="py-1"><span className="text-slate-500">Pemilik:</span> <strong>{vessel.ownerName}</strong></div>
                  <div className="py-1"><span className="text-slate-500">Pangkalan:</span> <strong>{vessel.homePort}</strong></div>
                  <div className="py-1"><span className="text-slate-500">Skor Risiko:</span> <strong>{vessel.riskScore}/100 ({vessel.riskLevel})</strong></div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 text-xs">
                <strong>Rekomendasi Terakhir:</strong> {vessel.lastRecommendation || 'Kapal dalam status kepatuhan standar.'}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handlePrint}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
