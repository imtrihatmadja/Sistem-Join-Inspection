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
  HardDrive,
  Trash2,
  Loader2,
  Building,
  Award,
  HeartPulse,
  GraduationCap,
  Users,
  ShieldCheck,
  Check,
  MapPin,
  Anchor,
  FileCheck
} from 'lucide-react';
import { getRiskColor } from '../services/riskEngine';
import { VesselEvidenceVault } from './VesselEvidenceVault';
import { getStoredEvidences } from '../services/googleDriveService';
import { deleteVessel } from '../services/vesselService';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>('');

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

  // Active inspection for print resume
  const activePrintInspection = vesselInspections.find(i => i.id === selectedInspectionId) || latestInspection;
  const checklist = activePrintInspection?.checklistData || vessel.latestChecklist;
  const activeViolations = activePrintInspection?.violations || vesselInspections.flatMap(i => i.violations) || [];

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
              id="btn-vessel-delete-detail"
              onClick={() => setShowDeleteConfirm(true)}
              title="Hapus Kapal Ini"
              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
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
            <div className="space-y-4 sm:space-y-6">
              
              {/* Control & Switcher Bar (No Print) */}
              <div className="no-print p-3 sm:p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-700">Pilih Rekam Riwayat Inspeksi:</span>
                  <select
                    value={selectedInspectionId || (latestInspection?.id || '')}
                    onChange={(e) => setSelectedInspectionId(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
                  >
                    {vesselInspections.length === 0 ? (
                      <option value="">Inspeksi Terkini (Draft / Data Terdaftar)</option>
                    ) : (
                      vesselInspections.map((insp, idx) => (
                        <option key={insp.id} value={insp.id}>
                          {idx === 0 ? '★ Terbaru: ' : ''}{insp.inspectionDate} - {insp.inspectionPort} ({insp.riskEvaluation.riskLevel} - {insp.riskEvaluation.score} Poin)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Berita Acara (PDF / Print)</span>
                  </button>
                </div>
              </div>

              {/* Printable Document Sheet Container */}
              <div
                id="printable-berita-acara"
                className="p-5 sm:p-8 bg-white rounded-xl border border-slate-300 shadow-sm space-y-6 text-slate-900 print:border-none print:shadow-none print:p-0"
              >
                
                {/* Official Letterhead (KOP Resmi) */}
                <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1.5 print-avoid-break">
                  <div className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-700 uppercase">
                    KEMENTERIAN KELAUTAN DAN PERIKANAN • KEMENTERIAN KETENAGAKERJAAN REPUBLIK INDONESIA
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase">
                    TIM PENGAWASAN BERSAMA NORMA KETENAGAKERJAAN KAPAL PERIKANAN
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-tight">
                    BERITA ACARA & LEMBAR RESUME HASIL PENGAWASAN KAPAL PERIKANAN
                  </h3>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Berdasarkan Standar Konvensi ILO C188, UU No. 45/2009, PP No. 27/2021, dan Peraturan Menteri Terkait
                  </p>
                </div>

                {/* Bagian 1: Data Identitas & Legalitas Kapal */}
                <div className="space-y-2.5 print-avoid-break">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-md">
                    <Ship className="w-3.5 h-3.5 text-slate-700" />
                    <span>I. DATA IDENTITAS & PERIZINAN KAPAL PERIKANAN</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Nama Kapal:</span>
                        <strong className="text-slate-900">{checklist?.vesselName || vessel.name}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Nomor SIPI / SIUP:</span>
                        <strong className="font-mono text-slate-900">{checklist?.sipiNumber || vessel.registrationNumber}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Ukuran Kapal:</span>
                        <strong>{checklist?.grossTonnage || vessel.grossTonnage} GT</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Tanda Selar / Call Sign:</span>
                        <strong className="font-mono">{checklist?.callSign || vessel.callSign || '-'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pelabuhan Pangkalan:</span>
                        <strong>{checklist?.homePort || vessel.homePort}</strong>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Pemilik / Korporasi:</span>
                        <strong>{checklist?.ownerName || vessel.ownerName}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Nahkoda / Tekong:</span>
                        <strong>{checklist?.captainName || vessel.captainName || '-'}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Jenis Alat Tangkap (API):</span>
                        <strong>{checklist?.gearType || checklist?.fishingGearType || vessel.gearType}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500">Daerah Tangkapan (WPP):</span>
                        <strong>{checklist?.fishingGround || vessel.fishingGround || 'WPPNRI'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status WLKP Ketenagakerjaan:</span>
                        <strong className={checklist?.hasWlkp ? 'text-emerald-700' : 'text-amber-700'}>
                          {checklist?.hasWlkp ? 'Ada / Terdaftar' : checklist?.hasWlkp === false ? 'Belum Ada' : 'Dalam Verifikasi'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Hasil Evaluasi Risiko & Rekomendasi Pengawas */}
                <div className="space-y-2.5 print-avoid-break">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                    <span>II. HASIL EVALUASI RISIKO & REKOMENDASI PENGAWAS</span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div>
                        <span className="text-slate-500">Tingkat Risiko Kepatuhan:</span>
                        <span className="ml-2 font-bold px-2.5 py-0.5 rounded text-xs inline-flex items-center gap-1 border border-slate-300">
                          {activePrintInspection?.riskEvaluation.riskLevel || vessel.riskLevel} ({activePrintInspection?.riskEvaluation.score ?? vessel.riskScore}/100)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Tanggal Inspeksi:</span>
                        <strong className="ml-1.5">{activePrintInspection?.inspectionDate || vessel.lastInspectionDate || '-'}</strong> di <strong>{activePrintInspection?.inspectionPort || vessel.lastInspectionPort || vessel.homePort}</strong>
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-0.5">Rekomendasi & Tindakan Pengawas:</span>
                      <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-900 font-medium">
                        {activePrintInspection?.riskEvaluation.recommendation || vessel.lastRecommendation || 'Penerbitan Nota Pemeriksaan Kepatuhan I dengan Tenggat Perbaikan 14 Hari.'}
                      </p>
                    </div>

                    {activePrintInspection?.officialNotes && (
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">Catatan Resmi Petugas:</span>
                        <p className="text-slate-600 italic">{activePrintInspection.officialNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bagian 3: DAFTAR TEMUAN PELANGGARAN LAPANGAN */}
                <div className="space-y-2.5 print-avoid-break">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-md">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>III. DAFTAR TEMUAN PELANGGARAN LAPANGAN</span>
                    </div>
                    <span className="text-[11px] font-mono lowercase tracking-normal">
                      ({activeViolations.length} butir pelanggaran aktif)
                    </span>
                  </div>

                  {activeViolations.length === 0 ? (
                    <div className="p-4 bg-emerald-50/60 rounded-lg border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Nihil Temuan Pelanggaran Lapangan.</strong> Seluruh aspek kepatuhan norma ketenagakerjaan dan K3 berada dalam standar yang dipersyaratkan.</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-200">
                            <th className="py-2 px-2.5 font-bold w-8 text-center">No</th>
                            <th className="py-2 px-2.5 font-bold w-32">Kategori Norma</th>
                            <th className="py-2 px-2.5 font-bold">Uraian Butir Pelanggaran</th>
                            <th className="py-2 px-2.5 font-bold w-24 text-center">Bobot / Sifat</th>
                            <th className="py-2 px-2.5 font-bold">Catatan Temuan & Rekomendasi Korektif</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeViolations.map((v, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-600">{idx + 1}</td>
                              <td className="py-2 px-2.5 font-semibold text-slate-700">{v.categoryName || 'Ketenagakerjaan'}</td>
                              <td className="py-2 px-2.5 font-bold text-rose-950">{v.title}</td>
                              <td className="py-2 px-2.5 text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  v.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                  v.severity === 'MODERATE' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                  'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}>
                                  {v.severity} (+{v.scoreWeight})
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-slate-800 text-[11px] leading-relaxed">
                                {v.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Bagian 4: DAFTAR CATATAN CHECKLIST SESUAI INDIKATOR PENGAWASAN */}
                <div className="space-y-2.5 print-avoid-break">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-md">
                    <div className="flex items-center gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>IV. DAFTAR LENGKAP CATATAN CHECKLIST PER INDIKATOR PENGAWASAN (I - VIII)</span>
                    </div>
                    <span className="text-[11px] font-sans font-normal text-slate-500 normal-case">
                      Rekam Catatan Pemeriksa Lapangan
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-200 text-xs">
                    
                    {/* Indikator 8: PKL */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 8: Kepemilikan Dokumen Perjanjian Kerja Laut (PKL)
                        </span>
                        <span className="font-semibold text-slate-600">
                          Status: {checklist?.hasPklAgreement === true ? '✓ Ada PKL Tertulis Lengkap' : checklist?.hasPklAgreement === false ? '✗ Tidak Ada PKL' : 'Sebagian'}
                          {checklist?.pklDurationMonths ? ` (${checklist.pklDurationMonths})` : ''}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator8 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 9: Salinan PKL */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 9: Salinan Asli PKL Dipegang oleh Awak Kapal
                        </span>
                        <span className="font-semibold text-slate-600">
                          Status: {checklist?.pklHeldByCrew === true ? '✓ Dipegang ABK' : checklist?.pklHeldByCrew === false ? '✗ Salinan Ditahan' : 'Belum Dicek'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator9 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 10: Skema Pengupahan */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 10: Sistem & Struktur Pengupahan Awak Kapal
                        </span>
                        <span className="font-semibold text-slate-600">
                          Skema: {checklist?.pklWageScheme === 'BULANAN' ? 'Gaji Pokok Bulanan' : checklist?.pklWageScheme === 'BAGI_HASIL' ? 'Bagi Hasil Murni' : checklist?.pklWageScheme === 'KOMBINASI' ? 'Kombinasi Gaji & Bagi Hasil' : '-'}
                          {checklist?.monthlyBasicWage ? ` | Upah Pokok: ${checklist.monthlyBasicWage}` : ''}
                          {checklist?.profitSharingRatio ? ` | Rasio Bagi Hasil: ${checklist.profitSharingRatio}` : ''}
                          {checklist?.overtimeOrBonusPay ? ` | Lembur/Premi: ${checklist.overtimeOrBonusPay}` : ''}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator10 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 11: Jaminan Upah Minimum & Slip Gaji */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 11: Slip Gaji Resmi & Bebas Pemotongan Upah Liar
                        </span>
                        <span className="font-semibold text-slate-600">
                          Slip Upah: {checklist?.hasSalarySlips ? '✓ Ada Slip' : '✗ Tidak Ada'} | Potongan Upah: {checklist?.hasWageDeductions ? '✗ Ada Potongan Liar' : '✓ Bebas Potongan'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator11 || checklist?.wageDeductionNotes || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 12: BPJS Ketenagakerjaan */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 12: Kepesertaan BPJS Ketenagakerjaan Awak Kapal
                        </span>
                        <span className="font-semibold text-slate-600">
                          Status: {checklist?.hasBpjsKetenagakerjaan === true ? '✓ Terdaftar Aktif' : checklist?.hasBpjsKetenagakerjaan === false ? '✗ Tidak Terdaftar' : '-'}
                          {checklist?.bpjsTkPrograms && checklist.bpjsTkPrograms.length > 0 ? ` (Program: ${checklist.bpjsTkPrograms.join(', ')})` : ''}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator12 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 13: BPJS Kesehatan & Asuransi Tambahan */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 13: BPJS Kesehatan / Asuransi Tambahan Maritim & Operasional API
                        </span>
                        <span className="font-semibold text-slate-600">
                          BPJS Kes: {checklist?.hasBpjsKesehatan ? '✓ Aktif' : '✗ Belum'} | Asuransi Swasta: {checklist?.hasPrivateInsurance ? '✓ Ada' : '-'}
                          {checklist?.fishingOperationsPerTrip ? ` | Operasi API: ${checklist.fishingOperationsPerTrip}` : ''}
                          {checklist?.dailyFishingOperationHours ? ` | Durasi: ${checklist.dailyFishingOperationHours}` : ''}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator13 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 16: Standar Fasilitas & Jam Istirahat */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 16: Standar Fasilitas Hidup & Jam Istirahat (ILO C188)
                        </span>
                        <span className="font-semibold text-slate-600">
                          Istirahat Min 10 Jam: {checklist?.dailyRestHoursCompliant ? '✓ Terpenuhi' : '✗ Kurang'} | Air Bersih: {checklist?.hasCleanWaterAccess ? '✓' : '✗'} | Makanan: {checklist?.hasSufficientFoodSupply ? '✓' : '✗'} | Kamar Tidur: {checklist?.hasAdequateAccommodation ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator16 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 17: Lifejacket */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 17: Lifejacket / Pelampung Keselamatan Awak Kapal
                        </span>
                        <span className="font-semibold text-slate-600">
                          Status: {checklist?.hasLifeJacketsAvailable ? '✓ Tersedia Rasio 1:1' : '✗ Tidak Mencukupi'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator17 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 18: APAR */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 18: Alat Pemadam Api Ringan (APAR) Siap Pakai
                        </span>
                        <span className="font-semibold text-slate-600">
                          Status: {checklist?.hasFireExtinguisherApar ? '✓ Siap Pakai & Berlaku' : '✗ Kadaluarsa / Tidak Ada'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator18 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 19: Kotak P3K */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 19: Kotak & Obat-obatan P3K Maritim Lengkap
                        </span>
                        <span className="font-semibold text-slate-600">
                          Status: {checklist?.hasFirstAidKit ? '✓ Lengkap' : '✗ Kurang / Kadaluarsa'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator19 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 20: Buku Log Kecelakaan Kerja */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 20: Buku Log Pencatatan Kecelakaan & Rekam Insiden
                        </span>
                        <span className="font-semibold text-slate-600">
                          Buku Log: {checklist?.hasAccidentLog ? '✓ Ada Buku Log' : '✗ Tidak Ada'}
                          {checklist?.accidentConditions ? ` | Kondisi: ${checklist.accidentConditions}` : ''}
                          {checklist?.accidentHistoryDetails ? ` | Kasus: ${checklist.accidentHistoryDetails}` : ''}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator20 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 21: Magang & Pekerja Anak */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 21: Fasilitasi Siswa Magang & Larangan Pekerja Anak
                        </span>
                        <span className="font-semibold text-slate-600">
                          Magang: {checklist?.hasApprenticeOrStudents === true ? `✓ Ada (${checklist?.apprenticeCount || 1} Siswa)` : '✗ Tidak Ada'}
                          {checklist?.apprenticeMajor ? ` | Jurusan: ${checklist.apprenticeMajor}` : ''}
                          {checklist?.apprenticeSchoolOrigin ? ` | Sekolah: ${checklist.apprenticeSchoolOrigin}` : ''}
                          {checklist?.apprenticeUnderAge ? ' | [PERINGATAN USIA ANAK]' : ''}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator21 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 22: Kompetensi AKP */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 22: Bukti Sertifikat Kompetensi BST-F & Buku Pelaut
                        </span>
                        <span className="font-semibold text-slate-600">
                          Sertifikat BST-F: {checklist?.crewWithBstCount ?? '-'} ABK | Buku Pelaut: {checklist?.crewWithSeamanBookCount ?? '-'} ABK
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Pengawas: </span>
                        {checklist?.noteIndicator22 || <span className="text-slate-400 italic">Tidak ada catatan khusus.</span>}
                      </div>
                    </div>

                    {/* Indikator 23: Catatan Khusus & Integritas Norma */}
                    <div className="p-3 bg-white space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-900">
                          Indikator No. 23: Integritas Norma & Bebas Penahanan Dokumen Asli ABK
                        </span>
                        <span className="font-semibold text-slate-600">
                          Status: {checklist?.identityHoldFlag ? '✗ TERINDIKASI PENAHANAN DOKUMEN' : '✓ Bebas Penahanan Dokumen'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200/80 text-slate-800 text-[11px]">
                        <span className="font-semibold text-slate-600">Catatan Tambahan Khusus: </span>
                        {checklist?.additionalNotes || <span className="text-slate-400 italic">Tidak ada catatan tambahan.</span>}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Bagian 5: Lembar Pengesahan & Tanda Tangan Para Pihak */}
                <div className="pt-4 border-t border-slate-300 space-y-4 print-avoid-break text-xs">
                  <div className="text-center text-[11px] text-slate-600 font-sans">
                    Demikian Berita Acara Hasil Pengawasan Bersama ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-center text-xs">
                    {/* Nakhoda */}
                    <div className="p-3 border border-slate-200 rounded-lg flex flex-col justify-between min-h-[140px] bg-slate-50/40">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Pihak Kapal / Pengusaha</div>
                        <div className="font-bold text-slate-900 mt-1">Nahkoda / Tekong Kapal</div>
                      </div>
                      <div className="pt-8">
                        <div className="font-bold text-slate-900 underline">
                          {checklist?.captainName || vessel.captainName || '(.............................................)'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {checklist?.captainNik ? `NIK: ${checklist.captainNik}` : 'Nahkoda / Kuasa Pemilik'}
                        </div>
                      </div>
                    </div>

                    {/* Pengawas Perikanan KKP */}
                    <div className="p-3 border border-slate-200 rounded-lg flex flex-col justify-between min-h-[140px] bg-slate-50/40">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Kementerian Kelautan & Perikanan</div>
                        <div className="font-bold text-slate-900 mt-1">Pengawas Perikanan (KKP)</div>
                      </div>
                      <div className="pt-8">
                        <div className="font-bold text-slate-900 underline">
                          {checklist?.fisheryInspectorName || activePrintInspection?.inspectors || '(.............................................)'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {checklist?.fisheryInspectorNip ? `NIP: ${checklist.fisheryInspectorNip}` : 'Pengawas Perikanan / PSDKP'}
                        </div>
                      </div>
                    </div>

                    {/* Pengawas Ketenagakerjaan Kemnaker */}
                    <div className="p-3 border border-slate-200 rounded-lg flex flex-col justify-between min-h-[140px] bg-slate-50/40">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Kementerian Ketenagakerjaan</div>
                        <div className="font-bold text-slate-900 mt-1">Pengawas Ketenagakerjaan</div>
                      </div>
                      <div className="pt-8">
                        <div className="font-bold text-slate-900 underline">
                          {checklist?.laborInspectorName || (currentUserEmail ? currentUserEmail.split('@')[0] : '(.............................................)')}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {checklist?.laborInspectorNip ? `NIP: ${checklist.laborInspectorNip}` : 'Pengawas Norma Ketenagakerjaan'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Konfirmasi Hapus Kapal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Hapus Data Kapal?</h3>
                    <p className="text-xs text-slate-500 font-mono">{vessel.name} ({vessel.registrationNumber})</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                  Apakah Anda yakin ingin menghapus kapal <strong>{vessel.name}</strong>? Tindakan ini akan menghapus data profil kapal dan semua riwayat inspeksi terkait secara permanen.
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-delete-vessel-modal"
                    disabled={isDeleting}
                    onClick={async () => {
                      try {
                        setIsDeleting(true);
                        await deleteVessel(vessel.id);
                        setShowDeleteConfirm(false);
                        onClose();
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

      </div>
    </div>
  );
};
