import React, { useState, useEffect } from 'react';
import {
  OfficialChecklistForm,
  InspectionRecord,
  Vessel,
  CrewComplianceData,
  InspectionViolation
} from '../types';
import { calculateRiskFromOfficialChecklist } from '../services/riskEngine';
import { INDONESIAN_PORTS } from '../services/mockData';
import { RiskBadge } from './RiskBadge';
import {
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Ship,
  Users,
  ShieldCheck,
  HeartPulse,
  Award,
  GraduationCap,
  Clock,
  ShieldAlert,
  ClipboardCheck,
  MapPin,
  Calendar,
  Building,
  Check,
  ChevronRight,
  ChevronLeft,
  Plus,
  Anchor
} from 'lucide-react';

interface OfficialChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  vessels: Vessel[];
  initialVessel?: Vessel | null;
  onSaveInspection: (inspection: InspectionRecord, currentVessel?: Vessel) => Promise<void>;
  onAddNewVessel?: (vessel: Vessel) => Promise<void>;
  currentUserEmail?: string | null;
}

export const OfficialChecklistModal: React.FC<OfficialChecklistModalProps> = ({
  isOpen,
  onClose,
  vessels,
  initialVessel,
  onSaveInspection,
  onAddNewVessel,
  currentUserEmail
}) => {
  const [selectedVesselId, setSelectedVesselId] = useState<string>('');
  const [activeSection, setActiveSection] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State for integrated Quick Add Vessel
  const [isQuickAddVesselOpen, setIsQuickAddVesselOpen] = useState<boolean>(false);
  const [newVesselName, setNewVesselName] = useState<string>('');
  const [newRegistrationNumber, setNewRegistrationNumber] = useState<string>('');
  const [newGrossTonnage, setNewGrossTonnage] = useState<number>(80);
  const [newCallSign, setNewCallSign] = useState<string>('');
  const [newOwnerName, setNewOwnerName] = useState<string>('');
  const [newAgentName, setNewAgentName] = useState<string>('');
  const [newHomePort, setNewHomePort] = useState<string>(INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
  const [newGearType, setNewGearType] = useState<string>('Purse Seine Pelagis Besar');
  const [newCrewCapacity, setNewCrewCapacity] = useState<number>(20);
  const [isCreatingVessel, setIsCreatingVessel] = useState<boolean>(false);
  const [quickVesselError, setQuickVesselError] = useState<string | null>(null);

  // Form State initialized with standard blank checklist defaults
  const [form, setForm] = useState<OfficialChecklistForm>({
    vesselName: '',
    callSign: '',
    sipiNumber: '',
    grossTonnage: 0,
    homePort: '',
    fishingGround: '',
    gearType: '',
    ownerName: '',
    ownerAddress: '',
    captainName: '',
    agentName: '',
    hasWlkp: null,
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionLocation: '',
    totalCrewCount: 0,
    hasMigrantCrew: false,
    migrantCrewCount: 0,
    hasForeignCrew: false,
    foreignCrewCount: 0,
    captainNik: '',
    captainPhone: '',
    fisheryInspectorName: '',
    laborInspectorName: '',

    // Section 2: PKL & Pengupahan
    hasPklAgreement: null,
    pklStandardFormat: null,
    pklHeldByCrew: null,
    pklDurationMonths: '',
    pklWageScheme: '',
    monthlyBasicWage: '',
    profitSharingRatio: '',
    overtimeOrBonusPay: '',
    minimumWageGuaranteed: null,
    hasSalarySlips: false,
    hasProductionSharingProof: false,
    hasWageDeductions: false,
    wageDeductionNotes: '',

    // Section 3: Jaminan Sosial & Operasional Trip
    hasBpjsKetenagakerjaan: null,
    bpjsTkPrograms: [],
    hasBpjsKesehatan: false,
    bpjsHealthContributionPaid: false,
    hasPrivateInsurance: false,
    fishingOperationsPerTrip: '',
    dailyFishingOperationHours: '',

    // Section 4: Operasional & Jam Kerja
    fishingGearType: '',
    daysAtSeaPerTrip: 0,
    dailyRestHoursCompliant: false,
    hasCleanWaterAccess: false,
    hasSufficientFoodSupply: false,
    hasAdequateAccommodation: false,

    // Section 5: K3 & Keselamatan Kerja
    hasPersonalProtectiveEquipment: false,
    hasLifeJacketsAvailable: false,
    lifeJacketCount: 0,
    hasFireExtinguisherApar: false,
    hasFirstAidKit: false,
    hasAccidentLog: false,
    accidentConditions: '',
    accidentHistoryDetails: '',

    // Section 6: Magang
    hasApprenticeOrStudents: null,
    apprenticeCount: 0,
    apprenticeMajor: '',
    apprenticeSchoolOrigin: '',
    apprenticeHasContract: false,
    apprenticeUnderAge: false,

    // Section 7: Kompetensi
    competenciesAvailable: [],
    crewWithBstCount: 0,
    crewWithSeamanBookCount: 0,

    // Section 8: Indikator & Pengesahan
    identityHoldFlag: false,
    arbitraryDeductionFlag: false,
    additionalNotes: '',

    // Catatan Khusus Pemeriksa per Indikator
    noteIndicator8: '',
    noteIndicator9: '',
    noteIndicator10: '',
    noteIndicator11: '',
    noteIndicator12: '',
    noteIndicator13: '',
    noteIndicator16: '',
    noteIndicator17: '',
    noteIndicator18: '',
    noteIndicator19: '',
    noteIndicator20: '',
    noteIndicator21: '',
    noteIndicator22: ''
  });

  // Prepopulate vessel data when initialVessel changes or modal opens
  useEffect(() => {
    if (initialVessel) {
      setSelectedVesselId(initialVessel.id);
      setForm((prev) => ({
        ...prev,
        vesselName: initialVessel.name,
        grossTonnage: initialVessel.grossTonnage || 0,
        callSign: initialVessel.callSign || '',
        sipiNumber: initialVessel.registrationNumber,
        homePort: initialVessel.homePort,
        fishingGround: initialVessel.fishingGround || prev.fishingGround || 'WPPNRI 711 / Laut Natuna',
        gearType: initialVessel.gearType || prev.gearType,
        fishingGearType: initialVessel.gearType || prev.fishingGearType,
        ownerName: initialVessel.ownerName,
        ownerAddress: initialVessel.ownerAddress || prev.ownerAddress || '',
        captainName: initialVessel.captainName || prev.captainName || '',
        agentName: initialVessel.agentName,
        inspectionLocation: initialVessel.homePort,
        totalCrewCount: initialVessel.crewCapacity || 24
      }));
    } else if (vessels.length > 0 && !selectedVesselId) {
      const first = vessels[0];
      setSelectedVesselId(first.id);
      setForm((prev) => ({
        ...prev,
        vesselName: first.name,
        grossTonnage: first.grossTonnage || 0,
        callSign: first.callSign || '',
        sipiNumber: first.registrationNumber,
        homePort: first.homePort,
        fishingGround: first.fishingGround || prev.fishingGround || 'WPPNRI 711 / Laut Natuna',
        gearType: first.gearType || prev.gearType,
        fishingGearType: first.gearType || prev.fishingGearType,
        ownerName: first.ownerName,
        ownerAddress: first.ownerAddress || prev.ownerAddress || '',
        captainName: first.captainName || prev.captainName || '',
        agentName: first.agentName,
        inspectionLocation: first.homePort,
        totalCrewCount: first.crewCapacity || 24
      }));
    }
  }, [initialVessel, vessels, isOpen]);

  if (!isOpen) return null;

  const handleVesselChange = (vesselId: string) => {
    setSelectedVesselId(vesselId);
    const v = vessels.find((item) => item.id === vesselId);
    if (v) {
      setForm((prev) => ({
        ...prev,
        vesselName: v.name,
        grossTonnage: v.grossTonnage || 0,
        callSign: v.callSign || '',
        sipiNumber: v.registrationNumber,
        homePort: v.homePort,
        fishingGround: v.fishingGround || prev.fishingGround || 'WPPNRI 711 / Laut Natuna',
        gearType: v.gearType || prev.gearType,
        fishingGearType: v.gearType || prev.fishingGearType,
        ownerName: v.ownerName,
        ownerAddress: v.ownerAddress || prev.ownerAddress || '',
        captainName: v.captainName || prev.captainName || '',
        agentName: v.agentName,
        inspectionLocation: v.homePort,
        totalCrewCount: v.crewCapacity || prev.totalCrewCount
      }));
    }
  };

  // Live Risk Calculation derived from current checklist state (14 indicators scored)
  const { violations, riskEvaluation, complianceRate, completedItemsCount, totalItemsCount } = calculateRiskFromOfficialChecklist(form);

  const handleQuickCreateVessel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVesselName.trim() || !newRegistrationNumber.trim() || !newOwnerName.trim()) {
      setQuickVesselError('Nama kapal, nomor registrasi/SIPI, dan pemilik wajib diisi.');
      return;
    }

    setIsCreatingVessel(true);
    setQuickVesselError(null);

    try {
      const vesselId = `VESSEL-${Date.now().toString().slice(-6)}`;
      const createdVessel: Vessel = {
        id: vesselId,
        name: newVesselName.trim(),
        registrationNumber: newRegistrationNumber.trim(),
        grossTonnage: Number(newGrossTonnage) || 50,
        callSign: newCallSign.trim() || 'YDA-0000',
        ownerName: newOwnerName.trim() || 'Pemilik Kapal Terdaftar',
        ownerAddress: form.ownerAddress || 'Pelabuhan Perikanan',
        captainName: form.captainName || 'Nahkoda Terdaftar',
        agentName: newAgentName.trim() || 'Agen Maritim Terdaftar',
        homePort: newHomePort,
        fishingGround: 'WPPNRI 711 / Laut Natuna',
        gearType: newGearType,
        crewCapacity: Number(newCrewCapacity) || 15,
        riskScore: 20,
        riskLevel: 'LOW',
        totalInspections: 0,
        status: 'ACTIVE',
        activeViolationsCount: 0,
        criticalViolationsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (onAddNewVessel) {
        await onAddNewVessel(createdVessel);
      }

      // Automatically select the newly created vessel
      setSelectedVesselId(createdVessel.id);

      // Prepopulate Section 1 and related checklist fields with the new vessel's info
      setForm((prev) => ({
        ...prev,
        vesselName: createdVessel.name,
        grossTonnage: createdVessel.grossTonnage,
        callSign: createdVessel.callSign || '',
        sipiNumber: createdVessel.registrationNumber,
        homePort: createdVessel.homePort,
        fishingGround: createdVessel.fishingGround || 'WPPNRI 711 / Laut Natuna',
        gearType: createdVessel.gearType,
        fishingGearType: createdVessel.gearType || prev.fishingGearType,
        ownerName: createdVessel.ownerName,
        ownerAddress: createdVessel.ownerAddress || prev.ownerAddress || '',
        captainName: createdVessel.captainName || prev.captainName || '',
        agentName: createdVessel.agentName,
        inspectionLocation: createdVessel.homePort,
        totalCrewCount: createdVessel.crewCapacity || 20
      }));

      setIsQuickAddVesselOpen(false);
      setActiveSection(1);
    } catch (err: any) {
      setQuickVesselError(err?.message || 'Gagal mendaftarkan kapal baru.');
    } finally {
      setIsCreatingVessel(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedVessel = vessels.find((v) => v.id === selectedVesselId);
      const inspectionId = `INSP-OFFICIAL-${Date.now()}`;

      const crewData: CrewComplianceData = {
        totalCrew: form.totalCrewCount,
        crewWithPkl: form.hasPklAgreement ? form.totalCrewCount : 0,
        crewWithInsurance: form.hasBpjsKetenagakerjaan ? form.totalCrewCount : 0,
        crewWithSeamanBook: form.crewWithSeamanBookCount || 0,
        crewWithBst: form.crewWithBstCount || 0,
        hasFairWageAgreement: !form.hasWageDeductions,
        hasProperRestHours: form.dailyRestHoursCompliant,
        hasAdequateFoodWater: form.hasCleanWaterAccess && form.hasSufficientFoodSupply,
        hasFirstAidKits: form.hasFirstAidKit && form.hasLifeJacketsAvailable,
        identityHoldFlag: form.identityHoldFlag
      };

      const record: InspectionRecord = {
        id: inspectionId,
        vesselId: selectedVesselId || `VESSEL-NEW-${Date.now()}`,
        vesselName: form.vesselName,
        registrationNumber: form.sipiNumber,
        homePort: form.homePort,
        inspectionDate: form.inspectionDate,
        inspectionPort: form.inspectionLocation,
        leadAgency: 'Tim Pengawasan Bersama (Kemnaker, KKP/PSDKP & KSOP)',
        inspectors: `${form.fisheryInspectorName || 'Pengawas Perikanan'} & ${form.laborInspectorName || 'Pengawas Ketenagakerjaan'}`,
        crewData,
        checklistData: form,
        violations,
        riskEvaluation,
        followUpStatus: riskEvaluation.riskLevel === 'HIGH' ? 'PENDING' : 'RESOLVED',
        officialNotes: form.additionalNotes || riskEvaluation.recommendation,
        createdBy: currentUserEmail || 'pengawas@inspeksikapal.go.id',
        createdAt: new Date().toISOString()
      };

      await onSaveInspection(record, selectedVessel);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error submitting checklist:', err);
      setIsSubmitting(false);
    }
  };

  const sections = [
    { id: 1, title: 'I. Data Umum', icon: Ship, shortTitle: 'Umum' },
    { id: 2, title: 'II. PKL & Upah', icon: FileText, shortTitle: 'PKL/Upah' },
    { id: 3, title: 'III. Jaminan Sosial', icon: ShieldCheck, shortTitle: 'Jamsos' },
    { id: 4, title: 'IV. Operasional & Istirahat', icon: Clock, shortTitle: 'Operasional' },
    { id: 5, title: 'V. K3 & Keselamatan', icon: HeartPulse, shortTitle: 'K3' },
    { id: 6, title: 'VI. Fasilitasi Magang', icon: GraduationCap, shortTitle: 'Magang' },
    { id: 7, title: 'VII. Kompetensi AKP', icon: Award, shortTitle: 'Kompetensi' },
    { id: 8, title: 'VIII. Red Flags & Tanda Tangan', icon: ShieldAlert, shortTitle: 'Pengesahan' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[94vh] max-w-5xl bg-white rounded-none sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <ClipboardCheck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs sm:text-base font-bold tracking-tight truncate">
                  DAFTAR PERIKSA PENGAWASAN
                </h2>
                <span className="hidden md:inline-block px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-400/30 shrink-0">
                  ILO C188 / KKP / Kemnaker
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                Formulir Verifikasi Kepatuhan & Penilaian Risiko Awak Kapal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <RiskBadge level={riskEvaluation.riskLevel} score={riskEvaluation.score} size="sm" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Score & Fast Vessel Switcher Strip */}
        <div className="px-3 sm:px-6 py-2 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap min-w-0">
            <span className="font-semibold text-slate-700 shrink-0 text-[11px] sm:text-xs">Kapal:</span>
            <select
              value={selectedVesselId}
              onChange={(e) => handleVesselChange(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 max-w-[140px] xs:max-w-[180px] sm:max-w-[220px] truncate"
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.grossTonnage} GT)
                </option>
              ))}
            </select>

            {/* Tombol Tambah / Daftarkan Kapal Baru */}
            <button
              type="button"
              onClick={() => {
                setNewVesselName('');
                setNewRegistrationNumber('');
                setNewGrossTonnage(80);
                setNewCallSign('');
                setNewOwnerName('');
                setNewAgentName('');
                setNewHomePort(form.homePort || INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
                setNewGearType('Purse Seine Pelagis Besar');
                setNewCrewCapacity(20);
                setQuickVesselError(null);
                setIsQuickAddVesselOpen(true);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md font-semibold text-[11px] sm:text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs border border-slate-700 cursor-pointer"
              title="Daftarkan Kapal Baru dan Langsung Isi Checklist"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>+ Daftarkan Kapal</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 font-mono text-[10px] sm:text-xs shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
            <div className="flex items-center gap-1">
              <span className="text-slate-600 font-sans font-semibold">Checklist:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-bold">
                {completedItemsCount}/{totalItemsCount} ({complianceRate}%)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Skor:</span>
              <strong className={`px-1.5 py-0.5 rounded border ${riskEvaluation.riskLevel === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : riskEvaluation.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {riskEvaluation.score}/100
              </strong>
            </div>
          </div>
        </div>

        {/* Swipeable Horizontal Stepper for Mobile / Vertical for Desktop */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Section Navigation Tabs */}
          <div className="w-full md:w-60 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-2 md:p-3 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col gap-1 scrollbar-none">
            <div className="hidden md:block px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Bagian Formulir:
            </div>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`shrink-0 md:shrink md:w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer min-h-[38px] ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white md:bg-transparent border md:border-transparent border-slate-200 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="hidden md:inline truncate">{sec.title}</span>
                  <span className="md:hidden truncate">{sec.shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col justify-between">
            
            {/* SECTION 1: DATA UMUM */}
            {activeSection === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">I. DATA UMUM & IDENTITAS KAPAL</h3>
                  <p className="text-xs text-slate-500">Data Identitas, Perizinan, Kepemilikan & WLKP (Indikator 1 - 7)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">1. Nama Kapal Perikanan</label>
                    <input
                      type="text"
                      required
                      value={form.vesselName}
                      onChange={(e) => setForm({ ...form, vesselName: e.target.value })}
                      placeholder="Masukkan nama kapal"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">2. Ukuran Kapal (Satuan Gross Tonnage / GT)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.grossTonnage || ''}
                      onChange={(e) => setForm({ ...form, grossTonnage: Number(e.target.value) })}
                      placeholder="Contoh: 120"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm font-mono bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">3. Tanda Selar / Call Sign</label>
                    <input
                      type="text"
                      value={form.callSign}
                      onChange={(e) => setForm({ ...form, callSign: e.target.value })}
                      placeholder="Contoh: YB-9201 / 2341/Bc"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm font-mono bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">4. Nomor SIPI / SIUP Kapal</label>
                    <input
                      type="text"
                      value={form.sipiNumber}
                      onChange={(e) => setForm({ ...form, sipiNumber: e.target.value })}
                      placeholder="Nomor izin penangkapan"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm font-mono bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">5. Pelabuhan Pangkalan</label>
                    <input
                      type="text"
                      value={form.homePort}
                      onChange={(e) => setForm({ ...form, homePort: e.target.value })}
                      placeholder="Contoh: PPS Nizam Zachman Jakarta"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">6. Daerah Penangkapan Ikan (WPPNRI / Wilayah)</label>
                    <input
                      type="text"
                      value={form.fishingGround || ''}
                      onChange={(e) => setForm({ ...form, fishingGround: e.target.value })}
                      placeholder="Contoh: WPPNRI 711 / Laut Natuna"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">7. Jenis Alat Tangkap (API)</label>
                    <input
                      type="text"
                      value={form.gearType || form.fishingGearType || ''}
                      onChange={(e) => setForm({ ...form, gearType: e.target.value, fishingGearType: e.target.value })}
                      placeholder="Contoh: Purse Seine, Longline Tuna, Bouke Ami"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">8. Nama Pemilik / Korporasi</label>
                    <input
                      type="text"
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                      placeholder="Nama pemilik / PT perikanan"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">9. Alamat Pemilik / Kantor Perusahaan</label>
                    <input
                      type="text"
                      value={form.ownerAddress || ''}
                      onChange={(e) => setForm({ ...form, ownerAddress: e.target.value })}
                      placeholder="Alamat lengkap pemilik atau domisili kantor PT"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">10. Nama Nahkoda / Tekong</label>
                    <input
                      type="text"
                      value={form.captainName || ''}
                      onChange={(e) => setForm({ ...form, captainName: e.target.value })}
                      placeholder="Nama nahkoda / tekong kapal"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="block font-semibold text-slate-800">11. Wajib Lapor Ketenagakerjaan Perusahaan (WLKP)</label>
                    <p className="text-[11px] text-slate-500">Kewajiban pelaporan ketenagakerjaan secara daring / resmi ke Kemnaker</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasWlkp === true ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <input
                          type="radio"
                          name="hasWlkp"
                          checked={form.hasWlkp === true}
                          onChange={() => setForm({ ...form, hasWlkp: true })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-xs font-medium">Sudah Lapor WLKP</span>
                      </label>
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasWlkp === false ? 'bg-red-50 border-red-400 font-bold text-red-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <input
                          type="radio"
                          name="hasWlkp"
                          checked={form.hasWlkp === false}
                          onChange={() => setForm({ ...form, hasWlkp: false })}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-xs font-medium">Belum Lapor WLKP</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: PKL & UPAH */}
            {activeSection === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">II. PERJANJIAN KERJA LAUT (PKL) & PENGUPAHAN</h3>
                  <p className="text-xs text-slate-500">Indikator Kepatuhan No. 8 - 11</p>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Indikator 8 */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="font-semibold text-slate-800">8. Kepemilikan Dokumen PKL oleh Awak Kapal</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasPklAgreement === true ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="radio"
                          name="hasPkl"
                          checked={form.hasPklAgreement === true}
                          onChange={() => setForm({ ...form, hasPklAgreement: true })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Ada PKL Tertulis Lengkap</span>
                      </label>
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasPklAgreement === false ? 'bg-red-50 border-red-400 font-bold text-red-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="radio"
                          name="hasPkl"
                          checked={form.hasPklAgreement === false}
                          onChange={() => setForm({ ...form, hasPklAgreement: false })}
                          className="w-4 h-4 text-red-600"
                        />
                        <span>Tidak Ada PKL (Lisan / Ilegal)</span>
                      </label>
                    </div>

                    {/* Jangka Waktu PKL */}
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Jangka Waktu PKL (Masa Berlaku Perjanjian):
                      </label>
                      <input
                        type="text"
                        value={form.pklDurationMonths || ''}
                        onChange={(e) => setForm({ ...form, pklDurationMonths: e.target.value })}
                        placeholder="Contoh: 12 Bulan / 1 Tahun / 1 Trip Melaut"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 8 - Kepemilikan PKL):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator8 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator8: e.target.value })}
                        placeholder="Tuliskan catatan lapangan / temuan kepemilikan PKL..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 9 */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="font-semibold text-slate-800">9. Salinan PKL Dipegang oleh Awak Kapal</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.pklHeldByCrew === true ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="radio"
                          name="pklHeld"
                          checked={form.pklHeldByCrew === true}
                          onChange={() => setForm({ ...form, pklHeldByCrew: true })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>ABK Memegang Salinan Asli</span>
                      </label>
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.pklHeldByCrew === false ? 'bg-red-50 border-red-400 font-bold text-red-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="radio"
                          name="pklHeld"
                          checked={form.pklHeldByCrew === false}
                          onChange={() => setForm({ ...form, pklHeldByCrew: false })}
                          className="w-4 h-4 text-red-600"
                        />
                        <span>Salinan Ditahan Pemilik / Agen</span>
                      </label>
                    </div>
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 9 - Salinan PKL Awak Kapal):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator9 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator9: e.target.value })}
                        placeholder="Tuliskan catatan penyerahan atau penahanan salinan PKL..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 10 */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="font-semibold text-slate-800">10. Sistem Pengupahan Awak Kapal</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(['BULANAN', 'BAGI_HASIL', 'KOMBINASI'] as const).map((scheme) => (
                        <label
                          key={scheme}
                          className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                            form.pklWageScheme === scheme ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="wageScheme"
                            checked={form.pklWageScheme === scheme}
                            onChange={() => setForm({ ...form, pklWageScheme: scheme })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>{scheme === 'BULANAN' ? 'Gaji Pokok Bulanan' : scheme === 'BAGI_HASIL' ? 'Bagi Hasil Murni' : 'Kombinasi Gaji & Bagi Hasil'}</span>
                        </label>
                      ))}
                    </div>

                    {/* Conditional Input: Besaran Upah Bulanan */}
                    {(form.pklWageScheme === 'BULANAN' || form.pklWageScheme === 'KOMBINASI') && (
                      <div className="p-2.5 bg-blue-50/50 border border-blue-200 rounded-lg">
                        <label className="block text-[11px] font-semibold text-blue-900 mb-1">
                          a. Besaran Gaji Pokok Bulanan:
                        </label>
                        <input
                          type="text"
                          value={form.monthlyBasicWage || ''}
                          onChange={(e) => setForm({ ...form, monthlyBasicWage: e.target.value })}
                          placeholder="Contoh: Rp 3.500.000 / bulan"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Conditional Input: Besaran Bagi Hasil */}
                    {(form.pklWageScheme === 'BAGI_HASIL' || form.pklWageScheme === 'KOMBINASI') && (
                      <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg">
                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                          b. Besaran / Rasio Bagi Hasil:
                        </label>
                        <input
                          type="text"
                          value={form.profitSharingRatio || ''}
                          onChange={(e) => setForm({ ...form, profitSharingRatio: e.target.value })}
                          placeholder="Contoh: 50% Pemilik : 50% ABK / 1 bagian ABK per trip"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Form isian Upah Lembur / Premi */}
                    <div className="p-2.5 bg-slate-100/70 border border-slate-200 rounded-lg">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        c. Upah Lembur / Premi Penangkapan:
                      </label>
                      <input
                        type="text"
                        value={form.overtimeOrBonusPay || ''}
                        onChange={(e) => setForm({ ...form, overtimeOrBonusPay: e.target.value })}
                        placeholder="Contoh: Bonus target Rp 500/kg atau lembur Rp 25.000/jam"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 10 - Skema Pengupahan):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator10 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator10: e.target.value })}
                        placeholder="Tuliskan catatan skema upah, rasio bagi hasil, atau tunjangan melaut..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 11 */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="font-semibold text-slate-800">11. Jaminan Upah Minimum & Slip Upah Resmi</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasSalarySlips ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasSalarySlips}
                          onChange={(e) => setForm({ ...form, hasSalarySlips: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>Ada Bukti Slip Upah / Perhitungan Tertulis</span>
                      </label>
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasWageDeductions ? 'bg-red-50 border-red-400 font-bold text-red-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasWageDeductions}
                          onChange={(e) => setForm({ ...form, hasWageDeductions: e.target.checked })}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <span>Ada Pemotongan Upah Tidak Jelas</span>
                      </label>
                    </div>
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 11 - Slip Gaji & Potongan):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator11 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator11: e.target.value })}
                        placeholder="Tuliskan catatan bukti slip upah, rincian potongan, atau transparansi pembagian hasil..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: JAMINAN SOSIAL */}
            {activeSection === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">III. JAMINAN SOSIAL KETENAGAKERJAAN & KESEHATAN</h3>
                  <p className="text-xs text-slate-500">Indikator Kepatuhan No. 12 - 13 & Parameter Operasional</p>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Indikator 12: BPJS TK */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="font-semibold text-slate-800">12. Kepesertaan BPJS Ketenagakerjaan Awak Kapal</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasBpjsKetenagakerjaan === true ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="radio"
                          name="bpjsTk"
                          checked={form.hasBpjsKetenagakerjaan === true}
                          onChange={() => setForm({ ...form, hasBpjsKetenagakerjaan: true })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Terdaftar Aktif BPJS Ketenagakerjaan</span>
                      </label>
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasBpjsKetenagakerjaan === false ? 'bg-red-50 border-red-400 font-bold text-red-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="radio"
                          name="bpjsTk"
                          checked={form.hasBpjsKetenagakerjaan === false}
                          onChange={() => setForm({ ...form, hasBpjsKetenagakerjaan: false })}
                          className="w-4 h-4 text-red-600"
                        />
                        <span>Belum / Tidak Terdaftar</span>
                      </label>
                    </div>

                    {form.hasBpjsKetenagakerjaan && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="font-medium text-slate-600 block mb-1">Program BPJS TK yang Diikuti:</span>
                        <div className="flex flex-wrap gap-2">
                          {['JKK', 'JKM', 'JHT', 'JP'].map((prog) => {
                            const isChecked = form.bpjsTkPrograms.includes(prog);
                            return (
                              <label key={prog} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-md cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setForm({ ...form, bpjsTkPrograms: [...form.bpjsTkPrograms, prog] });
                                    } else {
                                      setForm({ ...form, bpjsTkPrograms: form.bpjsTkPrograms.filter(p => p !== prog) });
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="font-semibold text-slate-700">{prog}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 12 - BPJS Ketenagakerjaan):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator12 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator12: e.target.value })}
                        placeholder="Tuliskan catatan nomor kepesertaan BPJS TK, bukti pembayaran iuran, atau kepesertaan ABK..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 13: BPJS Kesehatan */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="font-semibold text-slate-800">13. Kepesertaan BPJS Kesehatan / Asuransi Tambahan</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasBpjsKesehatan ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasBpjsKesehatan}
                          onChange={(e) => setForm({ ...form, hasBpjsKesehatan: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>BPJS Kesehatan Terdaftar Aktif</span>
                      </label>
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasPrivateInsurance ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasPrivateInsurance}
                          onChange={(e) => setForm({ ...form, hasPrivateInsurance: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>Asuransi Swasta / Tambahan Maritim</span>
                      </label>
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 13 - BPJS Kesehatan & Asuransi):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator13 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator13: e.target.value })}
                        placeholder="Tuliskan catatan kartu BPJS Kesehatan, kepesertaan aktif, atau polis asuransi tambahan..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Tambahan Data Operasional Alat Tangkap */}
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                    <div className="font-semibold text-blue-900">Operasional Penggunaan Alat Penangkapan Ikan (API)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          a. Jumlah Pengoperasian Alat Tangkap per Trip
                        </label>
                        <input
                          type="text"
                          value={form.fishingOperationsPerTrip || ''}
                          onChange={(e) => setForm({ ...form, fishingOperationsPerTrip: e.target.value })}
                          placeholder="Contoh: 15 - 20 kali setting / hauling"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          b. Lama Pengoperasian Alat Tangkap per Hari (Jam)
                        </label>
                        <input
                          type="text"
                          value={form.dailyFishingOperationHours || ''}
                          onChange={(e) => setForm({ ...form, dailyFishingOperationHours: e.target.value })}
                          placeholder="Contoh: 8 - 12 jam / hari"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: OPERASIONAL & JAM KERJA */}
            {activeSection === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">IV. KONDISI OPERASIONAL & KELAYAKAN FASILITAS</h3>
                  <p className="text-xs text-slate-500">Indikator Kepatuhan No. 14 - 16</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">14. Jenis Alat Penangkapan Ikan (API)</label>
                    <input
                      type="text"
                      value={form.fishingGearType}
                      onChange={(e) => setForm({ ...form, fishingGearType: e.target.value, gearType: e.target.value })}
                      placeholder="Contoh: Pursein, Rawai Tuna, Jaring Insang"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">15. Estimasi Hari Melaut per Trip</label>
                    <input
                      type="number"
                      min="1"
                      value={form.daysAtSeaPerTrip}
                      onChange={(e) => setForm({ ...form, daysAtSeaPerTrip: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2.5 pt-2">
                    <label className="block font-semibold text-slate-800">16. Standar Fasilitas & Jam Istirahat (ILO C188):</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.dailyRestHoursCompliant ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.dailyRestHoursCompliant}
                          onChange={(e) => setForm({ ...form, dailyRestHoursCompliant: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>Jam Istirahat Terpenuhi (Min. 10 Jam/Hari)</span>
                      </label>

                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasCleanWaterAccess ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasCleanWaterAccess}
                          onChange={(e) => setForm({ ...form, hasCleanWaterAccess: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>Pasokan Air Bersih & Minum Memadai</span>
                      </label>

                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasSufficientFoodSupply ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasSufficientFoodSupply}
                          onChange={(e) => setForm({ ...form, hasSufficientFoodSupply: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>Ketersediaan Bahan Makanan Layak</span>
                      </label>

                      <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasAdequateAccommodation ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasAdequateAccommodation}
                          onChange={(e) => setForm({ ...form, hasAdequateAccommodation: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>Kondisi Kamar Tidur / Sanitasi Bersih</span>
                      </label>
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 16 - Fasilitas & Jam Istirahat):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator16 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator16: e.target.value })}
                        placeholder="Tuliskan catatan kelayakan kamar tidur, sanitasi, pasokan air, makanan, atau shift jam kerja..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: K3 & KESELAMATAN */}
            {activeSection === 5 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">V. KESELAMATAN & KESEHATAN KERJA (K3) MARITIM</h3>
                  <p className="text-xs text-slate-500">Indikator Kepatuhan No. 17 - 20</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Indikator 17 */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${form.hasLifeJacketsAvailable ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={form.hasLifeJacketsAvailable}
                        onChange={(e) => setForm({ ...form, hasLifeJacketsAvailable: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <span>17. Lifejacket / Pelampung Sesuai Jumlah ABK</span>
                        <p className="text-[11px] font-normal text-slate-500">Min. 1 pelampung per orang di atas kapal</p>
                      </div>
                    </label>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 17 - Lifejacket):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator17 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator17: e.target.value })}
                        placeholder="Catatan jumlah, kelayakan, atau penempatan lifejacket..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 18 */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${form.hasFireExtinguisherApar ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={form.hasFireExtinguisherApar}
                        onChange={(e) => setForm({ ...form, hasFireExtinguisherApar: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <span>18. Alat Pemadam Api Ringan (APAR)</span>
                        <p className="text-[11px] font-normal text-slate-500">Kondisi siap pakai dan belum kadaluarsa</p>
                      </div>
                    </label>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 18 - APAR):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator18 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator18: e.target.value })}
                        placeholder="Catatan jumlah tabung, tekanan, masa berlaku APAR..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 19 */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${form.hasFirstAidKit ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={form.hasFirstAidKit}
                        onChange={(e) => setForm({ ...form, hasFirstAidKit: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <span>19. Kotak & Obat-obatan P3K Maritim</span>
                        <p className="text-[11px] font-normal text-slate-500">Dilengkapi obat darurat pelayaran</p>
                      </div>
                    </label>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 19 - Obat & Kotak P3K):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator19 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator19: e.target.value })}
                        placeholder="Catatan kelengkapan obat luka, obat darurat, atau masa berlaku..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 20 */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${form.hasAccidentLog ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                      <input
                        type="checkbox"
                        checked={form.hasAccidentLog}
                        onChange={(e) => setForm({ ...form, hasAccidentLog: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <span>20. Buku Log Pencatatan Kecelakaan Kerja</span>
                        <p className="text-[11px] font-normal text-slate-500">Mencatat insiden medis / kecelakaan di laut</p>
                      </div>
                    </label>

                    {/* Kondisi Kecelakaan & Kasus Kecelakaan Form Fields */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Kondisi Kecelakaan Kerja / Potensi Bahaya:
                        </label>
                        <input
                          type="text"
                          value={form.accidentConditions || ''}
                          onChange={(e) => setForm({ ...form, accidentConditions: e.target.value })}
                          placeholder="Contoh: Terpeleset di geladak basah, tertimpa jaring, kabel putus"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Kasus Kecelakaan yang Pernah Terjadi:
                        </label>
                        <input
                          type="text"
                          value={form.accidentHistoryDetails || ''}
                          onChange={(e) => setForm({ ...form, accidentHistoryDetails: e.target.value })}
                          placeholder="Contoh: 1 kasus luka ringan di trip sebelumnya, nihil kasus fatal"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 20 - Logbook Kecelakaan):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator20 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator20: e.target.value })}
                        placeholder="Catatan keterisian buku log kecelakaan atau rekam jejak insiden..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6: MAGANG */}
            {activeSection === 6 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">VI. FASILITASI MAGANG & LARANGAN PEKERJA ANAK</h3>
                  <p className="text-xs text-slate-500">Indikator Kepatuhan No. 21</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="font-semibold text-slate-800">21. Fasilitasi Siswa Magang & Bebas Pekerja Anak</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasApprenticeOrStudents === false ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                      <input
                        type="radio"
                        name="hasMagang"
                        checked={form.hasApprenticeOrStudents === false}
                        onChange={() => setForm({ ...form, hasApprenticeOrStudents: false, apprenticeCount: 0, apprenticeMajor: '', apprenticeSchoolOrigin: '' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Tidak Ada Siswa Magang</span>
                    </label>

                    <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${form.hasApprenticeOrStudents === true ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                      <input
                        type="radio"
                        name="hasMagang"
                        checked={form.hasApprenticeOrStudents === true}
                        onChange={() => setForm({ ...form, hasApprenticeOrStudents: true })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Ada Siswa / Peserta Magang</span>
                    </label>
                  </div>

                  {form.hasApprenticeOrStudents && (
                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Jumlah Peserta Magang</label>
                        <input
                          type="number"
                          min="1"
                          value={form.apprenticeCount || 1}
                          onChange={(e) => setForm({ ...form, apprenticeCount: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Jurusan Siswa Magang</label>
                        <input
                          type="text"
                          value={form.apprenticeMajor || ''}
                          onChange={(e) => setForm({ ...form, apprenticeMajor: e.target.value })}
                          placeholder="Contoh: NKPI (Nautika) / TKPI (Teknika)"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Asal Sekolah / Kampus Magang</label>
                        <input
                          type="text"
                          value={form.apprenticeSchoolOrigin || ''}
                          onChange={(e) => setForm({ ...form, apprenticeSchoolOrigin: e.target.value })}
                          placeholder="Contoh: SUPM Tegal / SMK Perikanan Negeri / Politeknik AUP"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-2 pt-1">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={form.apprenticeHasContract}
                            onChange={(e) => setForm({ ...form, apprenticeHasContract: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span>Ada Kontrak & Asuransi Magang Resmi</span>
                        </label>
                        <label className="flex items-center gap-2 text-red-600 font-bold">
                          <input
                            type="checkbox"
                            checked={form.apprenticeUnderAge}
                            onChange={(e) => setForm({ ...form, apprenticeUnderAge: e.target.checked })}
                            className="w-4 h-4 text-red-600 rounded"
                          />
                          <span>Terindikasi Usia &lt; 18 Tahun di Posisi Berbahaya</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Catatan Pemeriksa (Indikator No. 21 - Pemagangan & Perlindungan Anak):
                    </label>
                    <input
                      type="text"
                      value={form.noteIndicator21 || ''}
                      onChange={(e) => setForm({ ...form, noteIndicator21: e.target.value })}
                      placeholder="Tuliskan catatan asal sekolah magang, kondisi kerja siswa, atau verifikasi usia anak..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 7: KOMPETENSI AKP */}
            {activeSection === 7 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">VII. BUKTI KOMPETENSI AWAK KAPAL PERIKANAN (AKP)</h3>
                  <p className="text-xs text-slate-500">Indikator No. 22</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">22. Bukti Sertifikat Kompetensi & Dokumen Pelaut ABK</label>
                    <input
                      type="text"
                      value={form.competenciesAvailable.join(', ')}
                      onChange={(e) => setForm({ ...form, competenciesAvailable: e.target.value.split(',').map(s => s.trim()) })}
                      placeholder="BST-F, Buku Pelaut / Seaman Book, ANKPIN, ATKPIN, SKK 60 Mil"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jumlah ABK Memiliki Sertifikat BST-F</label>
                    <input
                      type="number"
                      min="0"
                      value={form.crewWithBstCount}
                      onChange={(e) => setForm({ ...form, crewWithBstCount: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jumlah ABK Memiliki Buku Pelaut</label>
                    <input
                      type="number"
                      min="0"
                      value={form.crewWithSeamanBookCount}
                      onChange={(e) => setForm({ ...form, crewWithSeamanBookCount: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Catatan Pemeriksa (Indikator No. 22 - Kompetensi & Sertifikat ABK):
                    </label>
                    <input
                      type="text"
                      value={form.noteIndicator22 || ''}
                      onChange={(e) => setForm({ ...form, noteIndicator22: e.target.value })}
                      placeholder="Tuliskan catatan masa berlaku BST-F, buku pelaut, atau catatan kompetensi keahlian ABK..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 8: RED FLAGS & PENGESAHAN */}
            {activeSection === 8 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">VIII. INDIKATOR PELANGGARAN KHUSUS & PENGESAHAN</h3>
                  <p className="text-xs text-slate-500">Tanda Tangan & Berita Acara Lapangan</p>
                </div>

                {/* Red Flags Checkboxes */}
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-rose-900 uppercase">
                    Indikator Khusus / Red Flag Kerja Paksa:
                  </h4>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.identityHoldFlag}
                      onChange={(e) => setForm({ ...form, identityHoldFlag: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 mt-0.5"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-rose-900">Terindikasi Penahanan Dokumen Asli Awak Kapal</span>
                      <p className="text-[11px] text-rose-700">
                        KTP, Buku Pelaut, atau Ijazah asli ditahan oleh pemilik/nakhoda tanpa hak. (Otomatis Risiko Tinggi)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.arbitraryDeductionFlag}
                      onChange={(e) => setForm({ ...form, arbitraryDeductionFlag: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 mt-0.5"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-rose-900">Terindikasi Pemotongan Upah Liar / Jeratan Utang</span>
                      <p className="text-[11px] text-rose-700">
                        Sistem bagi hasil tidak transparan atau ada pemotongan sepihak di luar kesepakatan.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Signature and Officers info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800">1. Perwakilan Nakhoda / ABK</h5>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Nama Nakhoda / ABK:</label>
                      <input
                        type="text"
                        value={form.captainName}
                        onChange={(e) => setForm({ ...form, captainName: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">NIK Nakhoda:</label>
                      <input
                        type="text"
                        value={form.captainNik || ''}
                        onChange={(e) => setForm({ ...form, captainNik: e.target.value })}
                        placeholder="NIK KTP 16 digit"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-800">2. Tim Pengawas Gabungan</h5>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Pengawas Perikanan (KKP/PSDKP):</label>
                      <input
                        type="text"
                        value={form.fisheryInspectorName || ''}
                        onChange={(e) => setForm({ ...form, fisheryInspectorName: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Pengawas Ketenagakerjaan (Kemnaker):</label>
                      <input
                        type="text"
                        value={form.laborInspectorName || ''}
                        onChange={(e) => setForm({ ...form, laborInspectorName: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan & Rekomendasi Resmi Pengawas:</label>
                    <textarea
                      rows={2}
                      value={form.additionalNotes || ''}
                      onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                      placeholder="Masukkan catatan khusus tindak lanjut di pelabuhan..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Bar with Thumb-Friendly Controls */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2 mt-auto">
              <div className="flex items-center gap-1.5">
                {activeSection > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection - 1)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer min-h-[40px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>
                )}
                {activeSection < 8 && (
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection + 1)}
                    className="px-3.5 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer min-h-[40px]"
                  >
                    <span>Lanjut</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 sm:px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Skor'}</span>
                </button>
              </div>
            </div>

          </form>

        </div>

      </div>

      {/* SUB-MODAL: REGISTRASI KAPAL BARU CEPAT (LANGSUNG TERPILIH DI CHECKLIST) */}
      {isQuickAddVesselOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                  <Ship className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Daftarkan Kapal Perikanan Baru</h3>
                  <p className="text-[10px] text-slate-400">Registrasi kapal langsung terhubung ke formulir checklist</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddVesselOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleQuickCreateVessel} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
              {quickVesselError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{quickVesselError}</span>
                </div>
              )}

              <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                Kapal yang baru didaftarkan akan otomatis dipilih dan data identitas kapal langsung diisikan ke Formulir Checklist (Bagian I).
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Kapal Perikanan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KM. Bahari Makmur 01"
                    value={newVesselName}
                    onChange={(e) => setNewVesselName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nomor Registrasi / SIPI <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="SIPI-2025-JKT-001"
                      value={newRegistrationNumber}
                      onChange={(e) => setNewRegistrationNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanda Selar / Call Sign
                    </label>
                    <input
                      type="text"
                      placeholder="YDB-1234 / 2341/Bc"
                      value={newCallSign}
                      onChange={(e) => setNewCallSign(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ukuran Gross Tonnage (GT)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="5000"
                      value={newGrossTonnage}
                      onChange={(e) => setNewGrossTonnage(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Estimasi Jumlah Awak Kapal (ABK)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newCrewCapacity}
                      onChange={(e) => setNewCrewCapacity(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pelabuhan Pangkalan
                  </label>
                  <select
                    value={newHomePort}
                    onChange={(e) => setNewHomePort(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-900"
                  >
                    {INDONESIAN_PORTS.filter(p => p !== 'Semua Pelabuhan').map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Pemilik / Korporasi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="PT / CV / Perorangan"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Agen Maritim / Pengelola
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Agen Operasional"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Alat Penangkapan Ikan (API)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Purse Seine, Tuna Longline, Bouke Ami"
                    value={newGearType}
                    onChange={(e) => setNewGearType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddVesselOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer min-h-[38px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingVessel}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <Check className="w-4 h-4" />
                  <span>{isCreatingVessel ? 'Menyimpan...' : 'Simpan & Lanjut Checklist'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};
