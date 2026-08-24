import React, { useState, useEffect, useMemo } from 'react';
import { Vessel, InspectionRecord, InspectionViolation, CrewComplianceData } from '../types';
import { calculateVesselRisk, STANDARD_VIOLATIONS, getRiskColor } from '../services/riskEngine';
import { X, ShieldCheck, ShieldAlert, AlertTriangle, Check, Plus, Trash2, HelpCircle, FileText, Info } from 'lucide-react';
import { INDONESIAN_PORTS } from '../constants/ports';

interface InspectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vessels: Vessel[];
  initialVessel?: Vessel | null;
  onSaveInspection: (inspection: InspectionRecord, vessel?: Vessel) => Promise<void>;
  currentUserEmail?: string | null;
}

export const InspectionFormModal: React.FC<InspectionFormModalProps> = ({
  isOpen,
  onClose,
  vessels,
  initialVessel,
  onSaveInspection,
  currentUserEmail
}) => {
  const [selectedVesselId, setSelectedVesselId] = useState<string>('');
  const [customVesselName, setCustomVesselName] = useState<string>('');
  const [customRegNumber, setCustomRegNumber] = useState<string>('');
  const [inspectionPort, setInspectionPort] = useState<string>(INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
  const [inspectionDate, setInspectionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [leadAgency, setLeadAgency] = useState<string>('Tim Pengawas Gabungan (PSDKP - Disnaker - KSOP)');
  const [inspectors, setInspectors] = useState<string>('Pengawas Pelabuhan & Wasnaker');

  // Crew compliance state
  const [crewData, setCrewData] = useState<CrewComplianceData>({
    totalCrew: 20,
    crewWithPkl: 20,
    crewWithInsurance: 20,
    crewWithSeamanBook: 20,
    crewWithBst: 20,
    hasFairWageAgreement: true,
    hasProperRestHours: true,
    hasAdequateFoodWater: true,
    hasFirstAidKits: true,
    identityHoldFlag: false
  });

  // Violations list
  const [violations, setViolations] = useState<InspectionViolation[]>([]);
  const [selectedStandardViolationId, setSelectedStandardViolationId] = useState<string>('');
  const [violationNotes, setViolationNotes] = useState<string>('');
  const [officialNotes, setOfficialNotes] = useState<string>('');
  const [actionDeadline, setActionDeadline] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync initial vessel when opened
  useEffect(() => {
    if (initialVessel) {
      setSelectedVesselId(initialVessel.id);
      setCustomVesselName(initialVessel.name);
      setCustomRegNumber(initialVessel.registrationNumber);
      if (initialVessel.homePort) setInspectionPort(initialVessel.homePort);
      setCrewData(prev => ({
        ...prev,
        totalCrew: initialVessel.crewCapacity || 20,
        crewWithPkl: initialVessel.crewCapacity || 20,
        crewWithInsurance: initialVessel.crewCapacity || 20,
        crewWithSeamanBook: initialVessel.crewCapacity || 20,
        crewWithBst: initialVessel.crewCapacity || 20
      }));
    } else if (vessels.length > 0) {
      setSelectedVesselId(vessels[0].id);
      setCustomVesselName(vessels[0].name);
      setCustomRegNumber(vessels[0].registrationNumber);
    }
  }, [initialVessel, vessels, isOpen]);

  const activeVessel = useMemo(() => {
    return vessels.find(v => v.id === selectedVesselId);
  }, [vessels, selectedVesselId]);

  // Live Risk Calculation Engine
  const liveRisk = useMemo(() => {
    const priorInspectionsCount = activeVessel?.totalInspections || 0;
    const priorHighRiskHistory = activeVessel?.riskLevel === 'HIGH';
    return calculateVesselRisk(crewData, violations, priorInspectionsCount, priorHighRiskHistory);
  }, [crewData, violations, activeVessel]);

  if (!isOpen) return null;

  const handleAddStandardViolation = () => {
    if (!selectedStandardViolationId) return;
    const standard = STANDARD_VIOLATIONS.find(v => v.id === selectedStandardViolationId);
    if (!standard) return;

    const newViolation: InspectionViolation = {
      categoryId: standard.id,
      categoryName: standard.category,
      title: standard.title,
      severity: standard.severity,
      scoreWeight: standard.scoreWeight,
      notes: violationNotes || standard.description
    };

    setViolations([...violations, newViolation]);
    setSelectedStandardViolationId('');
    setViolationNotes('');
  };

  const handleRemoveViolation = (index: number) => {
    setViolations(violations.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const inspectionId = `INSP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
      
      const newRecord: InspectionRecord = {
        id: inspectionId,
        vesselId: activeVessel ? activeVessel.id : `VESSEL-${Date.now().toString().slice(-4)}`,
        vesselName: activeVessel ? activeVessel.name : customVesselName || 'KM. Perikanan Baru',
        registrationNumber: activeVessel ? activeVessel.registrationNumber : customRegNumber || 'SIPI-REG-UNSPECIFIED',
        homePort: activeVessel ? activeVessel.homePort : inspectionPort,
        inspectionDate,
        inspectionPort,
        leadAgency,
        inspectors,
        crewData,
        violations,
        riskEvaluation: liveRisk,
        followUpStatus: liveRisk.riskLevel === 'HIGH' ? 'PENDING' : (liveRisk.riskLevel === 'LOW' ? 'RESOLVED' : 'IN_PROGRESS'),
        officialNotes: officialNotes || `Hasil inspeksi bersama pengawasan kepatuhan ketenagakerjaan di ${inspectionPort}.`,
        actionDeadline: actionDeadline || undefined,
        createdBy: currentUserEmail || 'pengawas@inspeksikapal.go.id',
        createdAt: new Date().toISOString()
      };

      await onSaveInspection(newRecord, activeVessel);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Failed to submit inspection:', err);
      setIsSubmitting(false);
    }
  };

  const riskVisual = getRiskColor(liveRisk.riskLevel);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Formulir Inspeksi Bersama Ketenagakerjaan</h2>
              <p className="text-xs text-slate-500">
                Pencatatan real-time dokumen awak kapal, kesejahteraan K3, dan penilaian risiko kepatuhan
              </p>
            </div>
          </div>
          <button
            id="btn-close-inspection-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Identitas Kapal & Pengawas */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              1. Identitas Kapal & Pelaksanaan Inspeksi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Kapal Terdaftar:
                </label>
                <select
                  id="select-vessel-input"
                  value={selectedVesselId}
                  onChange={(e) => {
                    setSelectedVesselId(e.target.value);
                    const found = vessels.find(v => v.id === e.target.value);
                    if (found) {
                      setCustomVesselName(found.name);
                      setCustomRegNumber(found.registrationNumber);
                    }
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-teal-500 bg-white text-slate-800"
                >
                  <option value="">-- Input Kapal Baru / Belum Terdata --</option>
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber} - {v.homePort})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedVesselId && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Kapal:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: KM. Bahari Samudera 01"
                      value={customVesselName}
                      onChange={(e) => setCustomVesselName(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      No. SIPI / Tanda Selar:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="SIPI-2025-..."
                      value={customRegNumber}
                      onChange={(e) => setCustomRegNumber(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pelabuhan Lokasi Inspeksi:
                </label>
                <select
                  value={inspectionPort}
                  onChange={(e) => setInspectionPort(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-teal-500 bg-white text-slate-800"
                >
                  {INDONESIAN_PORTS.filter(p => p !== 'Semua Pelabuhan').map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Pemeriksaan:
                </label>
                <input
                  type="date"
                  required
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tim Pengawas Gabungan (Instansi / Nama Personel):
                </label>
                <input
                  type="text"
                  placeholder="PSDKP, Wasnaker Kemnaker/Disnaker, KSOP Syahbandar"
                  value={inspectors}
                  onChange={(e) => setInspectors(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Checklist Kepatuhan Dokumen Awak Kapal */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                2. Verifikasi Dokumen Ketenagakerjaan Awak Kapal (ABK)
              </h3>
              <span className="text-[11px] text-slate-500">Standar Permen KP & ILO C188</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Awak Kapal (ABK):
                </label>
                <input
                  id="input-total-crew"
                  type="number"
                  min="1"
                  max="100"
                  value={crewData.totalCrew}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setCrewData(prev => ({ ...prev, totalCrew: val }));
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ABK Memiliki PKL Sah:
                </label>
                <input
                  id="input-pkl-crew"
                  type="number"
                  min="0"
                  max={crewData.totalCrew}
                  value={crewData.crewWithPkl}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCrewData(prev => ({ ...prev, crewWithPkl: val }));
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                />
                <span className="text-[10px] text-slate-500">
                  {Math.round((crewData.crewWithPkl / (crewData.totalCrew || 1)) * 100)}% Kepatuhan PKL
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ABK Terdaftar BPJS / Asuransi:
                </label>
                <input
                  id="input-insurance-crew"
                  type="number"
                  min="0"
                  max={crewData.totalCrew}
                  value={crewData.crewWithInsurance}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCrewData(prev => ({ ...prev, crewWithInsurance: val }));
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                />
                <span className="text-[10px] text-slate-500">
                  {Math.round((crewData.crewWithInsurance / (crewData.totalCrew || 1)) * 100)}% Terproteksi
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ABK Memiliki Buku Pelaut:
                </label>
                <input
                  type="number"
                  min="0"
                  max={crewData.totalCrew}
                  value={crewData.crewWithSeamanBook}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCrewData(prev => ({ ...prev, crewWithSeamanBook: val }));
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ABK Memiliki Sertifikat BST-F:
                </label>
                <input
                  type="number"
                  min="0"
                  max={crewData.totalCrew}
                  value={crewData.crewWithBst}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setCrewData(prev => ({ ...prev, crewWithBst: val }));
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Indikator Kesejahteraan, K3 & Kerja Paksa (Red Flags) */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              3. Standar Kesejahteraan, K3 & Indikator Kerja Paksa
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                crewData.hasFairWageAgreement ? 'bg-white border-slate-200' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <input
                  type="checkbox"
                  checked={crewData.hasFairWageAgreement}
                  onChange={(e) => setCrewData(prev => ({ ...prev, hasFairWageAgreement: e.target.checked }))}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">Sistem Upah / Bagi Hasil Transparan</div>
                  <div className="text-[11px] text-slate-500">Tidak ada pemotongan liar atau penahanan sisa gaji sepihak</div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                crewData.hasProperRestHours ? 'bg-white border-slate-200' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <input
                  type="checkbox"
                  checked={crewData.hasProperRestHours}
                  onChange={(e) => setCrewData(prev => ({ ...prev, hasProperRestHours: e.target.checked }))}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">Waktu Istirahat Memadai</div>
                  <div className="text-[11px] text-slate-500">Minimal 10 jam istirahat dalam 24 jam / jam kerja tidak ekstrem</div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                crewData.hasAdequateFoodWater ? 'bg-white border-slate-200' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <input
                  type="checkbox"
                  checked={crewData.hasAdequateFoodWater}
                  onChange={(e) => setCrewData(prev => ({ ...prev, hasAdequateFoodWater: e.target.checked }))}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">Akomodasi, Makanan & Air Bersih Layak</div>
                  <div className="text-[11px] text-slate-500">Kamar ABK berventilasi & suplai air minum tawar cukup</div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                crewData.hasFirstAidKits ? 'bg-white border-slate-200' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <input
                  type="checkbox"
                  checked={crewData.hasFirstAidKits}
                  onChange={(e) => setCrewData(prev => ({ ...prev, hasFirstAidKits: e.target.checked }))}
                  className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">Perlengkapan P3K & APD Memadai</div>
                  <div className="text-[11px] text-slate-500">Kotak obat darurat siap pakai & life jacket tersedia</div>
                </div>
              </label>

              {/* CRITICAL RED FLAG */}
              <label className={`sm:col-span-2 flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                crewData.identityHoldFlag ? 'bg-rose-100 border-rose-400' : 'bg-slate-100/70 border-slate-200 hover:bg-slate-100'
              }`}>
                <input
                  type="checkbox"
                  checked={crewData.identityHoldFlag}
                  onChange={(e) => setCrewData(prev => ({ ...prev, identityHoldFlag: e.target.checked }))}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>⚠️ RED FLAG: Terdapat Indikasi Penahanan Dokumen Asli Awak Kapal (KTP / Buku Pelaut / Ijazah)</span>
                  </div>
                  <div className="text-[11px] text-rose-800">
                    Dokumen ditahan oleh pemilik kapal/agen tanpa izin sebagai jaminan ikatan kerja (Pelanggaran Kritis ILO).
                  </div>
                </div>
              </label>

            </div>
          </div>

          {/* Section 4: Temuan Pelanggaran Lapangan */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              4. Pencatatan Temuan Pelanggaran di Lapangan
            </h3>

            {/* Selector to add standard violation */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                id="select-standard-violation"
                value={selectedStandardViolationId}
                onChange={(e) => setSelectedStandardViolationId(e.target.value)}
                className="flex-1 text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800"
              >
                <option value="">-- Pilih Katalog Temuan Standar (Ketenagakerjaan & K3) --</option>
                {STANDARD_VIOLATIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.severity}] {v.title} (+{v.scoreWeight} skor risiko)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddStandardViolation}
                disabled={!selectedStandardViolationId}
                className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-semibold shrink-0 transition-colors"
              >
                + Tambah Temuan
              </button>
            </div>

            {/* List of active violations */}
            {violations.length > 0 ? (
              <div className="space-y-2 pt-2">
                {violations.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : (v.severity === 'MODERATE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800')
                        }`}>
                          {v.severity} (+{v.scoreWeight})
                        </span>
                        <span className="font-semibold text-slate-900 text-xs">{v.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{v.notes}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveViolation(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">
                Tidak ada temuan pelanggaran khusus yang ditambahkan (kapal memenuhi standar dasar).
              </p>
            )}
          </div>

          {/* Section 5: LIVE RISK SCORING & RECOMMENDATION (HIGHLIGHT) */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${riskVisual.border} ${riskVisual.bg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${riskVisual.badgeBg}`}>
                  {liveRisk.riskLevel === 'HIGH' ? <ShieldAlert className="w-5 h-5" /> : (liveRisk.riskLevel === 'MEDIUM' ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />)}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-slate-500">
                    Hasil Scoring Risiko Kepatuhan Otomatis
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Tingkat: {riskVisual.label}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white font-mono text-xs font-bold border border-slate-200">
                      {liveRisk.score} / 100
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[11px] text-slate-500">Rekomendasi Tindakan:</div>
                <div className={`text-xs font-bold ${riskVisual.text}`}>
                  {liveRisk.riskLevel === 'HIGH' ? 'Tunda SPB / Pemanggilan Pemilik' : (liveRisk.riskLevel === 'MEDIUM' ? 'Peringatan 7-14 Hari' : 'Lolos Verifikasi SPB')}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="font-semibold text-slate-800">Faktor Risiko Utama:</div>
              <ul className="list-disc list-inside text-slate-700 space-y-1 text-[11px]">
                {liveRisk.primaryRiskFactors.map((factor, idx) => (
                  <li key={idx} className="leading-relaxed">{factor}</li>
                ))}
              </ul>

              <div className="mt-3 p-2.5 bg-white/90 rounded-lg border border-slate-200 text-slate-800 text-[11px]">
                <strong>Arahan Tindak Lanjut:</strong> {liveRisk.actionRequired}
              </div>
            </div>
          </div>

          {/* Section 6: Catatan Berita Acara & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Berita Acara Pengawas Lapangan:
              </label>
              <textarea
                rows={2}
                placeholder="Catatan tambahan hasil klarifikasi dengan nakhoda / agen kapal..."
                value={officialNotes}
                onChange={(e) => setOfficialNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tenggat Waktu Perbaikan:
              </label>
              <input
                type="date"
                value={actionDeadline}
                onChange={(e) => setActionDeadline(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[10px] text-slate-400">Opsional untuk tindak lanjut</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>

            <button
              id="btn-submit-inspection"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan & Sync...' : 'Simpan & Publikasikan Hasil Inspeksi'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
