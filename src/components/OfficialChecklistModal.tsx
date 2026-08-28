import React, { useState, useEffect, useRef } from 'react';
import {
  OfficialChecklistForm,
  InspectionRecord,
  Vessel,
  CrewComplianceData,
  InspectionViolation
} from '../types';
import { calculateRiskFromOfficialChecklist } from '../services/riskEngine';
import { INDONESIAN_PORTS, PORT_GROUPS, normalizePortName } from '../constants/ports';
import { STANDARD_GEAR_TYPES } from '../constants/gearTypes';
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
  ChevronDown,
  ChevronUp,
  User,
  UserCheck,
  UserPlus,
  Plus,
  Anchor,
  Bookmark,
  Trash2,
  Lock,
  RotateCcw
} from 'lucide-react';

const DRAFT_KEY_PREFIX = 'sistem_inspeksi_draft_';

export const getInitialBlankForm = (v?: Vessel | null): OfficialChecklistForm => ({
  vesselName: v?.name || '',
  callSign: v?.callSign || '',
  sipiNumber: v?.registrationNumber || '',
  grossTonnage: v?.grossTonnage || 0,
  homePort: v?.homePort || '',
  fishingGround: v?.fishingGround || 'WPPNRI 711 / Laut Natuna',
  gearType: v?.gearType || '',
  fishingGearType: v?.gearType || '',
  ownerName: v?.ownerName || '',
  ownerAddress: v?.ownerAddress || '',
  captainName: v?.captainName || '',
  agentName: v?.agentName || '',
  hasWlkp: null,
  wlkpStatus: undefined,
  wlkpNumber: '',
  noteIndicatorWlkp: '',
  inspectionDate: new Date().toISOString().split('T')[0],
  inspectionLocation: v?.homePort || '',
  totalCrewCount: v?.crewCapacity || 0,
  hasMigrantCrew: false,
  migrantCrewCount: 0,
  hasForeignCrew: false,
  foreignCrewCount: 0,
  captainNik: '',
  captainPhone: '',
  fisheryInspectorName: '',
  laborInspectorName: '',
  noteSection1: '',

  // Section 2: PKL & Pengupahan
  hasPklAgreement: null,
  pklStatus: undefined,
  pklStandardFormat: null,
  pklHeldByCrew: null,
  pklDurationMonths: '',
  pklWageScheme: '',
  monthlyBasicWage: '',
  allowances: [],
  profitSharingRatio: '',
  overtimeOrBonusPay: '',
  minimumWageGuaranteed: null,
  wageProofType: '',
  hasSalarySlips: false,
  hasWrittenCalculation: false,
  noWageProof: false,
  wagePaymentMechanism: '',
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

  // Section 4: Operasional & Fasilitas
  daysAtSeaPerTrip: 0,
  dailyRestHoursCompliant: false,
  restHoursPerDay: undefined,
  hasCleanWaterAccess: false,
  cleanWaterCapacityLiters: undefined,
  mineralWaterGallonsCount: undefined,
  cleanWaterSourceType: '',
  hasSufficientFoodSupply: false,
  foodSupplyDays: undefined,
  hasAdequateAccommodation: false,
  bunkBedCount: undefined,
  toiletCount: undefined,
  plannedSeaDays: 0,

  // Section 5: K3 & Keselamatan Kerja
  hasPpeAvailable: false,
  hasPersonalProtectiveEquipment: false,
  hasLifeJacketsAvailable: false,
  lifeJacketCount: 0,
  lifebuoyCount: 0,
  otherPpeName: '',
  otherPpeCount: 0,
  ppeAdequacy: undefined,

  hasFireExtinguisherApar: false,
  aparPowderChecked: false,
  aparPowderCount: 0,
  aparPowderExpiry: '',
  aparPowderCondition: 'BAIK',
  aparCo2Checked: false,
  aparCo2Count: 0,
  aparCo2Expiry: '',
  aparCo2Condition: 'BAIK',
  aparFoamChecked: false,
  aparFoamCount: 0,
  aparFoamExpiry: '',
  aparFoamCondition: 'BAIK',
  aparOtherChecked: false,
  aparOtherName: '',
  aparOtherCount: 0,
  aparOtherExpiry: '',
  aparOtherCondition: 'BAIK',

  hasFirstAidBox: false,
  firstAidBoxCondition: 'BAIK_BERSIH',
  hasFirstAidMedicines: false,
  hasFirstAidKit: false,
  firstAidMedicineExpiryStatus: 'MASIH_BERLAKU',
  firstAidMedicineItems: [],

  crewHealthComplaints: '',
  healthComplaintNotes: '',

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
  competencyCertificates: [
    { certificateType: 'BST-F (Basic Safety Training Fisheries)', crewCount: 0 },
    { certificateType: 'Buku Pelaut (Seaman Book)', crewCount: 0 }
  ],
  competenciesAvailable: ['BST-F (Basic Safety Training Fisheries)', 'Buku Pelaut (Seaman Book)'],
  crewWithBstCount: 0,
  crewWithSeamanBookCount: 0,

  // Section 8: Sistem Perekrutan (Multi-Pekerja)
  recruitmentCrews: [
    {
      id: 'crew-1',
      workerName: '',
      workerPosition: 'Kelasi / ABK Deck',
      customPosition: '',
      vacantJobInfo: '',
      recruiterType: '',
      agentLicenseStatus: '',
      recruiterName: '',
      recruiterPhone: '',
      recruiterAddress: '',
      isHoused: null,
      housingLocation: '',
      housingCondition: 'LAYAK',
      feeOrDeduction: '',
      notes: ''
    }
  ],
  recruitmentVacantJobInfo: '',
  recruitmentRecruiterType: '',
  recruitmentAgentLicenseStatus: '',
  recruitmentRecruiterName: '',
  recruitmentRecruiterAddress: '',
  recruitmentRecruiterPhone: '',
  recruitmentIsHoused: null,
  recruitmentHousingLocation: '',
  recruitmentHousingCondition: '',
  recruitmentFeeOrDeduction: '',
  recruitmentOtherInfo: '',

  // Section 9: Indikator & Pengesahan
  identityHoldVerified: false,
  arbitraryDeductionVerified: false,
  integrityVerified: false,
  freedomFromForcedLaborConfirmed: false,
  identityHoldFlag: false,
  arbitraryDeductionFlag: false,
  additionalNotes: '',
  officialRecommendations: '',

  // Catatan Khusus Pemeriksa per Indikator
  noteIndicator8: '',
  noteIndicator9: '',
  noteIndicator10: '',
  noteIndicator11: '',
  noteIndicator12: '',
  noteIndicator13: '',
  noteIndicator14: '',
  noteIndicator15: '',
  noteIndicator16: '',
  noteIndicator16b: '',
  noteIndicator16c: '',
  noteIndicator16d: '',
  noteIndicator17: '',
  noteIndicator18: '',
  noteIndicator19: '',
  noteIndicator20: '',
  noteIndicator21: '',
  noteIndicator22: '',
  noteIndicator23: '',
  noteIndicator24: '',
  noteIndicator25: '',
  noteIndicatorRecruitment: ''
});

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
  const [draftStatus, setDraftStatus] = useState<{ hasDraft: boolean; savedAt: string | null }>({
    hasDraft: false,
    savedAt: null
  });
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

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
  const [form, setForm] = useState<OfficialChecklistForm>(() => getInitialBlankForm(null));
  const [expandedRecruitmentIndices, setExpandedRecruitmentIndices] = useState<number[]>([0]);

  const toggleRecruitmentTab = (index: number) => {
    setExpandedRecruitmentIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleAddRecruitmentCrew = () => {
    const current = form.recruitmentCrews && form.recruitmentCrews.length > 0 ? form.recruitmentCrews : [];
    const newIndex = current.length;
    const newCrew = {
      id: `crew-${Date.now()}-${newIndex + 1}`,
      workerName: '',
      workerPosition: 'Kelasi / ABK Deck (Deckhand)',
      customPosition: '',
      vacantJobInfo: '',
      recruiterType: '',
      agentLicenseStatus: '' as const,
      recruiterName: '',
      recruiterPhone: '',
      recruiterAddress: '',
      isHoused: null,
      housingLocation: '',
      housingCondition: 'LAYAK' as const,
      feeOrDeduction: '',
      notes: ''
    };
    const updated = [...current, newCrew];
    setForm({ ...form, recruitmentCrews: updated });
    setExpandedRecruitmentIndices(prev => [...prev, newIndex]);
  };

  const handleRemoveRecruitmentCrew = (index: number) => {
    const current = form.recruitmentCrews && form.recruitmentCrews.length > 0 ? form.recruitmentCrews : [];
    if (current.length <= 1) {
      // If only 1 crew member, reset fields
      const resetCrew = [{
        id: `crew-${Date.now()}-1`,
        workerName: '',
        workerPosition: 'Kelasi / ABK Deck (Deckhand)',
        customPosition: '',
        vacantJobInfo: '',
        recruiterType: '',
        agentLicenseStatus: '' as const,
        recruiterName: '',
        recruiterPhone: '',
        recruiterAddress: '',
        isHoused: null,
        housingLocation: '',
        housingCondition: 'LAYAK' as const,
        feeOrDeduction: '',
        notes: ''
      }];
      setForm({ ...form, recruitmentCrews: resetCrew });
      setExpandedRecruitmentIndices([0]);
      return;
    }
    const updated = current.filter((_, i) => i !== index);
    setForm({ ...form, recruitmentCrews: updated });
    setExpandedRecruitmentIndices(prev =>
      prev.filter(i => i !== index).map(i => (i > index ? i - 1 : i))
    );
  };

  const handleUpdateRecruitmentCrew = (index: number, patch: Partial<NonNullable<OfficialChecklistForm['recruitmentCrews']>[number]>) => {
    const current = form.recruitmentCrews && form.recruitmentCrews.length > 0 ? [...form.recruitmentCrews] : [{
      id: `crew-${Date.now()}-1`,
      workerName: '',
      workerPosition: 'Kelasi / ABK Deck (Deckhand)',
      customPosition: '',
      vacantJobInfo: '',
      recruiterType: '',
      agentLicenseStatus: '' as const,
      recruiterName: '',
      recruiterPhone: '',
      recruiterAddress: '',
      isHoused: null,
      housingLocation: '',
      housingCondition: 'LAYAK' as const,
      feeOrDeduction: '',
      notes: ''
    }];
    if (!current[index]) return;
    current[index] = { ...current[index], ...patch };
    
    // Sync first crew with legacy top-level fields for backwards compatibility
    const syncTopLevel = index === 0 ? {
      recruitmentVacantJobInfo: patch.vacantJobInfo !== undefined ? patch.vacantJobInfo : form.recruitmentVacantJobInfo,
      recruitmentRecruiterType: patch.recruiterType !== undefined ? (patch.recruiterType as any) : form.recruitmentRecruiterType,
      recruitmentAgentLicenseStatus: patch.agentLicenseStatus !== undefined ? (patch.agentLicenseStatus as any) : form.recruitmentAgentLicenseStatus,
      recruitmentRecruiterName: patch.recruiterName !== undefined ? patch.recruiterName : form.recruitmentRecruiterName,
      recruitmentRecruiterPhone: patch.recruiterPhone !== undefined ? patch.recruiterPhone : form.recruitmentRecruiterPhone,
      recruitmentRecruiterAddress: patch.recruiterAddress !== undefined ? patch.recruiterAddress : form.recruitmentRecruiterAddress,
      recruitmentIsHoused: patch.isHoused !== undefined ? patch.isHoused : form.recruitmentIsHoused,
      recruitmentHousingLocation: patch.housingLocation !== undefined ? patch.housingLocation : form.recruitmentHousingLocation,
      recruitmentHousingCondition: patch.housingCondition !== undefined ? patch.housingCondition : form.recruitmentHousingCondition,
      recruitmentFeeOrDeduction: patch.feeOrDeduction !== undefined ? patch.feeOrDeduction : form.recruitmentFeeOrDeduction,
    } : {};

    setForm({
      ...form,
      recruitmentCrews: current,
      ...syncTopLevel
    });
  };

  const hasInitializedRef = useRef<string | null>(null);

  const loadDraftForVessel = (vesselId: string): { form: OfficialChecklistForm; savedAt: string } | null => {
    if (!vesselId) return null;
    try {
      const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${vesselId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.form) {
        return { form: parsed.form, savedAt: parsed.savedAt || new Date().toISOString() };
      }
    } catch (err) {
      console.error('Error reading draft from localStorage:', err);
    }
    return null;
  };

  // Prepopulate vessel data when initialVessel changes or modal opens
  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = null;
      return;
    }

    const currentTargetId = initialVessel ? initialVessel.id : (selectedVesselId || vessels[0]?.id || '');

    if (hasInitializedRef.current !== currentTargetId && currentTargetId) {
      hasInitializedRef.current = currentTargetId;
      setSelectedVesselId(currentTargetId);

      const vesselObj = vessels.find((v) => v.id === currentTargetId) || initialVessel;
      const draft = loadDraftForVessel(currentTargetId);

      if (draft) {
        setForm(draft.form);
        setDraftStatus({ hasDraft: true, savedAt: draft.savedAt });
      } else {
        setForm(getInitialBlankForm(vesselObj));
        setDraftStatus({ hasDraft: false, savedAt: null });
      }
    }
  }, [initialVessel, vessels, isOpen, selectedVesselId]);

  if (!isOpen) return null;

  const handleVesselChange = (vesselId: string) => {
    setSelectedVesselId(vesselId);
    hasInitializedRef.current = vesselId;
    const v = vessels.find((item) => item.id === vesselId);
    const draft = loadDraftForVessel(vesselId);
    if (draft) {
      setForm(draft.form);
      setDraftStatus({ hasDraft: true, savedAt: draft.savedAt });
    } else {
      setForm(getInitialBlankForm(v));
      setDraftStatus({ hasDraft: false, savedAt: null });
    }
  };

  // Live Risk Calculation derived from current checklist state (14 indicators scored)
  const { violations, riskEvaluation, complianceRate, completedItemsCount, totalItemsCount } = calculateRiskFromOfficialChecklist(form);

  const handleSaveDraft = () => {
    if (!selectedVesselId) {
      alert('Pilih atau daftarkan kapal terlebih dahulu untuk menyimpan draft.');
      return;
    }
    const now = new Date().toISOString();
    const draftData = {
      form,
      savedAt: now,
      vesselId: selectedVesselId,
      vesselName: form.vesselName
    };
    try {
      localStorage.setItem(`${DRAFT_KEY_PREFIX}${selectedVesselId}`, JSON.stringify(draftData));
      setDraftStatus({ hasDraft: true, savedAt: now });
      setNotificationMessage('Draft isian berhasil disimpan! Saat formulir ini ditutup dan dibuka kembali, seluruh data draft akan otomatis dimunculkan ulang.');
      setTimeout(() => setNotificationMessage(null), 5000);
    } catch (err) {
      console.error('Gagal menyimpan draft:', err);
    }
  };

  const handleDiscardDraft = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus draft tersimpan untuk kapal ini dan mengosongkan formulir?')) {
      if (selectedVesselId) {
        localStorage.removeItem(`${DRAFT_KEY_PREFIX}${selectedVesselId}`);
      }
      const currentV = vessels.find((v) => v.id === selectedVesselId);
      setForm(getInitialBlankForm(currentV));
      setDraftStatus({ hasDraft: false, savedAt: null });
      setNotificationMessage('Draft telah dihapus. Formulir dikosongkan ke status awal.');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

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
        riskScore: 100,
        riskLevel: 'HIGH',
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

      // Automatically select the newly created vessel and set blank initial form
      setSelectedVesselId(createdVessel.id);
      hasInitializedRef.current = createdVessel.id;
      setForm(getInitialBlankForm(createdVessel));
      setDraftStatus({ hasDraft: false, savedAt: null });

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
        hasFirstAidKits: (form.hasFirstAidBox || form.hasFirstAidKit) && (form.hasPpeAvailable || form.hasLifeJacketsAvailable),
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
        officialNotes: form.officialRecommendations 
          ? (form.additionalNotes ? `${form.additionalNotes}\n[Rekomendasi]: ${form.officialRecommendations}` : form.officialRecommendations) 
          : (form.additionalNotes || riskEvaluation.recommendation),
        createdBy: currentUserEmail || 'pengawas@inspeksikapal.go.id',
        createdAt: new Date().toISOString()
      };

      // Kunci data inspeksi resmi ke database Supabase & state
      await onSaveInspection(record, selectedVessel);

      // KUNCI & HAPUS DRAFT: saat disubmit dan disetujui, draft kapal ini langsung dihapus
      if (selectedVesselId) {
        localStorage.removeItem(`${DRAFT_KEY_PREFIX}${selectedVesselId}`);
      }

      // KOSONGKAN FORM: Saat form dibuka kembali nanti, form akan bersih/kosong
      const defaultBlank = getInitialBlankForm(null);
      setForm(defaultBlank);
      setDraftStatus({ hasDraft: false, savedAt: null });
      hasInitializedRef.current = null;

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
    { id: 4, title: 'IV. Operasional & Fasilitas', icon: Clock, shortTitle: 'Operasional' },
    { id: 5, title: 'V. K3 & Keselamatan', icon: HeartPulse, shortTitle: 'K3' },
    { id: 6, title: 'VI. Fasilitasi Magang', icon: GraduationCap, shortTitle: 'Magang' },
    { id: 7, title: 'VII. Kompetensi AKP', icon: Award, shortTitle: 'Kompetensi' },
    { id: 8, title: 'VIII. Sistem Perekrutan', icon: Users, shortTitle: 'Perekrutan' },
    { id: 9, title: 'IX. Red Flags & Pengesahan', icon: ShieldAlert, shortTitle: 'Pengesahan' }
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
              {vessels.length === 0 ? (
                <option value="">-- Belum ada kapal terdaftar --</option>
              ) : (
                vessels.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.grossTonnage} GT)
                  </option>
                ))
              )}
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

        {/* Indikator Banner Draft Aktif */}
        {draftStatus.hasDraft && (
          <div className="bg-amber-50/90 border-b border-amber-200 px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-950 animate-in fade-in duration-150 shrink-0">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-900">Memuat Draft Isian Tersimpan:</span>{' '}
                <span className="text-amber-800 text-[11px]">
                  Terakhir disimpan pada {draftStatus.savedAt ? new Date(draftStatus.savedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sesi Sebelumnya'}. Progres pengisian otomatis dipulihkan.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-100/70 border border-rose-300 rounded-md transition-colors flex items-center gap-1 cursor-pointer shrink-0 self-end sm:self-auto"
              title="Hapus draft tersimpan dan kosongkan formulir"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Draft / Reset</span>
            </button>
          </div>
        )}

        {/* Notifikasi Toast Sukses Simpan Draft / Aksi */}
        {notificationMessage && (
          <div className="bg-emerald-50 border-b border-emerald-300 px-3 sm:px-6 py-2 flex items-center justify-between text-xs text-emerald-950 animate-in fade-in duration-150 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">{notificationMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotificationMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 text-xs sm:text-sm">
                        5. Pelabuhan Pangkalan
                      </label>
                      <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                        Standar Pelabuhan RI
                      </span>
                    </div>
                    <select
                      value={
                        PORT_GROUPS.some(g => g.ports.includes(form.homePort))
                          ? form.homePort
                          : (form.homePort ? 'CUSTOM' : (PORT_GROUPS[0]?.ports[0] || 'PPS Nizam Zachman Jakarta'))
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          // Keep existing custom or initialize empty for manual entry
                          if (PORT_GROUPS.some(g => g.ports.includes(form.homePort))) {
                            setForm({ ...form, homePort: '' });
                          }
                        } else {
                          setForm({ ...form, homePort: val, inspectionLocation: val });
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>-- Pilih Pelabuhan Pangkalan Resmi --</option>
                      {PORT_GROUPS.map((group) => (
                        <optgroup key={group.categoryName} label={`📍 ${group.categoryName}`}>
                          {group.ports.map((port) => (
                            <option key={port} value={port}>
                              {port}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <optgroup label="⚙️ Opsi Lain">
                        <option value="CUSTOM">-- Pelabuhan Lainnya (Tulis Manual) --</option>
                      </optgroup>
                    </select>

                    {/* Manual input if port is custom */}
                    {(!PORT_GROUPS.some(g => g.ports.includes(form.homePort)) || form.homePort === 'CUSTOM') && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={form.homePort === 'CUSTOM' ? '' : form.homePort}
                          onChange={(e) => setForm({ ...form, homePort: e.target.value, inspectionLocation: e.target.value })}
                          placeholder="Ketik nama pelabuhan perikanan lainnya..."
                          className="w-full rounded-lg border border-blue-300 p-2 text-xs bg-blue-50/40 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Nama pelabuhan akan distandarisasi untuk pengelompokan Matriks Risiko.
                        </p>
                      </div>
                    )}
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
                    <select
                      value={
                        STANDARD_GEAR_TYPES.includes(form.gearType || form.fishingGearType || '')
                          ? (form.gearType || form.fishingGearType)
                          : (form.gearType ? 'CUSTOM' : STANDARD_GEAR_TYPES[0])
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          if (STANDARD_GEAR_TYPES.includes(form.gearType || '')) {
                            setForm({ ...form, gearType: '', fishingGearType: '' });
                          }
                        } else {
                          setForm({ ...form, gearType: val, fishingGearType: val });
                        }
                      }}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      {STANDARD_GEAR_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                      <option value="CUSTOM">-- Lainnya / Ketik Manual --</option>
                    </select>
                    {(!STANDARD_GEAR_TYPES.includes(form.gearType || '') || form.gearType === 'CUSTOM') && (
                      <input
                        type="text"
                        value={form.gearType === 'CUSTOM' ? '' : (form.gearType || '')}
                        onChange={(e) => setForm({ ...form, gearType: e.target.value, fishingGearType: e.target.value })}
                        placeholder="Ketik jenis alat tangkap lainnya..."
                        className="mt-2 w-full rounded-lg border border-blue-300 p-2 text-xs bg-blue-50/40 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    )}
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

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">11. Agen Pengelola / Manning Agency</label>
                    <input
                      type="text"
                      value={form.agentName || ''}
                      onChange={(e) => setForm({ ...form, agentName: e.target.value })}
                      placeholder="Nama PT agen / pengelola jika ada"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">12. Tanggal Pelaksanaan Inspeksi</label>
                    <input
                      type="date"
                      value={form.inspectionDate || ''}
                      onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">13. Lokasi / Dermaga Pelaksanaan Inspeksi</label>
                    <input
                      type="text"
                      value={form.inspectionLocation || ''}
                      onChange={(e) => setForm({ ...form, inspectionLocation: e.target.value })}
                      placeholder="Contoh: Dermaga Barat PPS Nizam Zachman"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">14. Total Jumlah Awak Kapal (ABK)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.totalCrewCount || ''}
                      onChange={(e) => setForm({ ...form, totalCrewCount: Number(e.target.value) || 0 })}
                      placeholder="Jumlah total ABK di kapal"
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs sm:text-sm font-mono bg-white text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="block font-semibold text-slate-800">15. Wajib Lapor Ketenagakerjaan Perusahaan (WLKP)</label>
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

                    {/* Conditional Input: Gaji Pokok Bulanan -> a. Besaran Gaji Pokok & b. Tunjangan (Listing) */}
                    {(form.pklWageScheme === 'BULANAN' || form.pklWageScheme === 'KOMBINASI') && (
                      <div className="space-y-3">
                        {/* a. Besaran Gaji Pokok */}
                        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                          <label className="block text-xs font-semibold text-blue-900">
                            a. Besaran Gaji Pokok:
                          </label>
                          <input
                            type="text"
                            value={form.monthlyBasicWage || ''}
                            onChange={(e) => setForm({ ...form, monthlyBasicWage: e.target.value })}
                            placeholder="Contoh: Rp 3.500.000 / bulan"
                            className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 font-mono"
                          />
                        </div>

                        {/* b. Tunjangan (Listing Jenis & Nilai Tunjangan + Icon +) */}
                        <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-xs font-semibold text-blue-900">
                                b. Tunjangan Awak Kapal:
                              </label>
                              <p className="text-[11px] text-slate-500">
                                Isian jenis tunjangan dan nilai tunjangan yang diberikan
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const currentAllowances = form.allowances || [];
                                setForm({
                                  ...form,
                                  allowances: [...currentAllowances, { name: '', amount: '' }]
                                });
                              }}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                              title="Tambah Listing Tunjangan Baru (+)"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Tambah Tunjangan</span>
                            </button>
                          </div>

                          {/* List Tunjangan */}
                          {(!form.allowances || form.allowances.length === 0) ? (
                            <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center bg-white/80">
                              <p className="text-xs text-slate-500 mb-2">Belum ada listing tunjangan.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    allowances: [{ name: '', amount: '' }]
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Tambah Listing Tunjangan</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {form.allowances.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs"
                                >
                                  <div className="flex-1">
                                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                      Jenis Tunjangan #{idx + 1}:
                                    </label>
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) => {
                                        const updated = [...(form.allowances || [])];
                                        updated[idx] = { ...updated[idx], name: e.target.value };
                                        setForm({ ...form, allowances: updated });
                                      }}
                                      placeholder="Contoh: Tunjangan Makan / Kehadiran / Melaut"
                                      className="w-full rounded-md border border-slate-300 p-1.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                      Nilai Tunjangan #{idx + 1}:
                                    </label>
                                    <input
                                      type="text"
                                      value={item.amount}
                                      onChange={(e) => {
                                        const updated = [...(form.allowances || [])];
                                        updated[idx] = { ...updated[idx], amount: e.target.value };
                                        setForm({ ...form, allowances: updated });
                                      }}
                                      placeholder="Contoh: Rp 500.000 / bulan atau Rp 50.000 / hari"
                                      className="w-full rounded-md border border-slate-300 p-1.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                  </div>
                                  <div className="sm:self-end pb-0.5 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = (form.allowances || []).filter((_, i) => i !== idx);
                                        setForm({ ...form, allowances: updated });
                                      }}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                                      title="Hapus baris tunjangan ini"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Conditional Input: Besaran Bagi Hasil */}
                    {(form.pklWageScheme === 'BAGI_HASIL' || form.pklWageScheme === 'KOMBINASI') && (
                      <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg">
                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                          Besaran / Rasio Bagi Hasil:
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
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div>
                      <div className="font-semibold text-slate-800">11. Bukti Pembayaran Upah & Mekanisme Pengupahan</div>
                      <p className="text-[11px] text-slate-500">Verifikasi bukti fisik slip/perhitungan upah dan metode penyaluran gaji/bagi hasil ke awak kapal</p>
                    </div>

                    {/* a. Checklist Bukti Upah */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        a. Bukti Upah Awak Kapal:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.wageProofType === 'SLIP_UPAH' || (form.hasSalarySlips && !form.hasWrittenCalculation && !form.noWageProof)
                            ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="wageProofType"
                            checked={form.wageProofType === 'SLIP_UPAH' || (form.hasSalarySlips === true && !form.hasWrittenCalculation && !form.noWageProof)}
                            onChange={() => setForm({
                              ...form,
                              wageProofType: 'SLIP_UPAH',
                              hasSalarySlips: true,
                              hasWrittenCalculation: false,
                              noWageProof: false
                            })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-xs">1. Ada bukti Slip Upah</span>
                        </label>

                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.wageProofType === 'PERHITUNGAN_TERTULIS' || (form.hasWrittenCalculation && !form.noWageProof)
                            ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="wageProofType"
                            checked={form.wageProofType === 'PERHITUNGAN_TERTULIS' || form.hasWrittenCalculation === true}
                            onChange={() => setForm({
                              ...form,
                              wageProofType: 'PERHITUNGAN_TERTULIS',
                              hasSalarySlips: false,
                              hasWrittenCalculation: true,
                              noWageProof: false
                            })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-xs">2. Perhitungan Tertulis</span>
                        </label>

                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.wageProofType === 'TIDAK_ADA' || form.noWageProof
                            ? 'bg-red-50 border-red-400 font-bold text-red-900 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="wageProofType"
                            checked={form.wageProofType === 'TIDAK_ADA' || form.noWageProof === true}
                            onChange={() => setForm({
                              ...form,
                              wageProofType: 'TIDAK_ADA',
                              hasSalarySlips: false,
                              hasWrittenCalculation: false,
                              noWageProof: true
                            })}
                            className="w-4 h-4 text-red-600"
                          />
                          <span className="text-xs">3. Tidak ada bukti upah</span>
                        </label>
                      </div>
                    </div>

                    {/* b. Checklist Informasi Mekanisme Pengupahan */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        b. Mekanisme Pengupahan:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.wagePaymentMechanism === 'CASH'
                            ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="wagePaymentMechanism"
                            checked={form.wagePaymentMechanism === 'CASH'}
                            onChange={() => setForm({ ...form, wagePaymentMechanism: 'CASH' })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-xs">1. Cash</span>
                        </label>

                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.wagePaymentMechanism === 'TRANSFER'
                            ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="wagePaymentMechanism"
                            checked={form.wagePaymentMechanism === 'TRANSFER'}
                            onChange={() => setForm({ ...form, wagePaymentMechanism: 'TRANSFER' })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-xs">2. Transfer</span>
                        </label>

                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.wagePaymentMechanism === 'CASH_DAN_TRANSFER'
                            ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}>
                          <input
                            type="radio"
                            name="wagePaymentMechanism"
                            checked={form.wagePaymentMechanism === 'CASH_DAN_TRANSFER'}
                            onChange={() => setForm({ ...form, wagePaymentMechanism: 'CASH_DAN_TRANSFER' })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-xs">3. Cash dan Transfer</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 11 - Slip Gaji & Mekanisme Pengupahan):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator11 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator11: e.target.value })}
                        placeholder="Tuliskan catatan bukti slip upah, mekanisme transfer/cash, rincian potongan, atau transparansi pembagian hasil..."
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

            {/* SECTION 4: OPERASIONAL & KELAYAKAN FASILITAS */}
            {activeSection === 4 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">IV. KONDISI OPERASIONAL & KELAYAKAN FASILITAS</h3>
                  <p className="text-xs text-slate-500">Indikator Kepatuhan No. 14 - 17</p>
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

                  <div className="sm:col-span-2 space-y-3 pt-1">
                    <div>
                      <label className="block font-semibold text-slate-800 text-xs">
                        16. Standar Fasilitas & Jam Istirahat (ILO C188):
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Verifikasi pemenuhan standar fasilitas hidup dan jam istirahat awak kapal beserta catatan khusus tiap poin
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Item a: Jam Istirahat */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.dailyRestHoursCompliant ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={form.dailyRestHoursCompliant}
                            onChange={(e) => setForm({ ...form, dailyRestHoursCompliant: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-xs">a. Jam Istirahat Terpenuhi (Min. 10 Jam/Hari)</span>
                        </label>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Catatan Pemeriksa (Jam Istirahat):
                          </label>
                          <input
                            type="text"
                            value={form.noteIndicator16 || ''}
                            onChange={(e) => setForm({ ...form, noteIndicator16: e.target.value })}
                            placeholder="Catatan shift jam kerja, waktu istirahat..."
                            className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Item b: Pasokan Air Bersih */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.hasCleanWaterAccess ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={form.hasCleanWaterAccess}
                            onChange={(e) => setForm({ ...form, hasCleanWaterAccess: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-xs">b. Pasokan Air Bersih & Minum Memadai</span>
                        </label>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Catatan Pemeriksa (Air Bersih & Minum):
                          </label>
                          <input
                            type="text"
                            value={form.noteIndicator16b || ''}
                            onChange={(e) => setForm({ ...form, noteIndicator16b: e.target.value })}
                            placeholder="Catatan tangki air bersih, galon minum, desalinasi..."
                            className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Item c: Bahan Makanan */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.hasSufficientFoodSupply ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={form.hasSufficientFoodSupply}
                            onChange={(e) => setForm({ ...form, hasSufficientFoodSupply: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-xs">c. Ketersediaan Bahan Makanan Layak</span>
                        </label>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Catatan Pemeriksa (Bahan Makanan):
                          </label>
                          <input
                            type="text"
                            value={form.noteIndicator16c || ''}
                            onChange={(e) => setForm({ ...form, noteIndicator16c: e.target.value })}
                            placeholder="Catatan freezer, kecukupan lauk pauk, beras..."
                            className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Item d: Kamar Tidur / Sanitasi */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                          form.hasAdequateAccommodation ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 shadow-2xs' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={form.hasAdequateAccommodation}
                            onChange={(e) => setForm({ ...form, hasAdequateAccommodation: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-xs">d. Kondisi Kamar Tidur / Sanitasi Bersih</span>
                        </label>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Catatan Pemeriksa (Kamar & Sanitasi):
                          </label>
                          <input
                            type="text"
                            value={form.noteIndicator16d || ''}
                            onChange={(e) => setForm({ ...form, noteIndicator16d: e.target.value })}
                            placeholder="Catatan tempat tidur, ventilasi, kebersihan toilet/kamar mandi..."
                            className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checklist No. 17: Lama rencana operasional di laut */}
                  <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div>
                      <label className="block font-bold text-slate-800 text-xs">
                        17. Lama Rencana Operasional di Laut
                      </label>
                      <p className="text-[11px] font-normal text-slate-500">
                        Durasi rencana operasional penangkapan ikan di laut untuk trip yang akan berjalan
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-xs">
                        <input
                          type="number"
                          min="0"
                          value={form.plannedSeaDays ?? form.daysAtSeaPerTrip ?? 0}
                          onChange={(e) => setForm({ ...form, plannedSeaDays: Number(e.target.value) })}
                          placeholder="Jumlah hari rencana melaut"
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 pr-12"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-slate-500 pointer-events-none">
                          Hari
                        </span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <input
                        type="text"
                        value={form.noteIndicator17 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator17: e.target.value })}
                        placeholder="Catatan tambahan rencana operasional berlayar..."
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
                  <p className="text-xs text-slate-500">Indikator Kepatuhan No. 18 - 23</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* Indikator 18: Jenis APD yang Tersedia */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all flex-1 ${form.hasPpeAvailable || form.hasLifeJacketsAvailable ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasPpeAvailable || form.hasLifeJacketsAvailable}
                          onChange={(e) => setForm({
                            ...form,
                            hasPpeAvailable: e.target.checked,
                            hasLifeJacketsAvailable: e.target.checked,
                            hasPersonalProtectiveEquipment: e.target.checked
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <span>18. Jenis Alat Pelindung Diri (APD) yang Tersedia</span>
                          <p className="text-[11px] font-normal text-slate-500">Ketersediaan dan kelayakan perlengkapan keselamatan ABK di atas kapal</p>
                        </div>
                      </label>
                    </div>

                    {(form.hasPpeAvailable || form.hasLifeJacketsAvailable) && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-3">
                        <div className="text-xs font-bold text-blue-950">Rincian Ketersediaan & Jumlah APD:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* 1. Lifejacket */}
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">1. Life Jacket / Pelampung</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-slate-500 whitespace-nowrap">Jumlah:</label>
                              <input
                                type="number"
                                min="0"
                                value={form.lifeJacketCount || 0}
                                onChange={(e) => setForm({ ...form, lifeJacketCount: Number(e.target.value) })}
                                className="w-full rounded-md border border-slate-300 p-1.5 text-xs bg-white font-semibold text-slate-900"
                                placeholder="Pcs"
                              />
                            </div>
                            <p className="text-[10px] text-slate-500">Rasio min. 1:1 sesuai jumlah total ABK ({form.totalCrewCount} orang)</p>
                          </div>

                          {/* 2. Lifebuoy */}
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">2. Lifebuoy / Ban Penyelamat</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-slate-500 whitespace-nowrap">Jumlah:</label>
                              <input
                                type="number"
                                min="0"
                                value={form.lifebuoyCount || 0}
                                onChange={(e) => setForm({ ...form, lifebuoyCount: Number(e.target.value) })}
                                className="w-full rounded-md border border-slate-300 p-1.5 text-xs bg-white font-semibold text-slate-900"
                                placeholder="Pcs"
                              />
                            </div>
                            <p className="text-[10px] text-slate-500">Pelampung lempar siap pakai di lambung/geladak</p>
                          </div>

                          {/* 3. Lainnya */}
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">3. APD Lainnya</span>
                            </div>
                            <input
                              type="text"
                              value={form.otherPpeName || ''}
                              onChange={(e) => setForm({ ...form, otherPpeName: e.target.value })}
                              placeholder="Nama APD (cth: Helm, Sarung Tangan, Sepatu Boot)"
                              className="w-full rounded-md border border-slate-300 p-1 text-xs bg-white text-slate-900 placeholder:text-slate-400"
                            />
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] text-slate-500 whitespace-nowrap">Jumlah:</label>
                              <input
                                type="number"
                                min="0"
                                value={form.otherPpeCount || 0}
                                onChange={(e) => setForm({ ...form, otherPpeCount: Number(e.target.value) })}
                                className="w-full rounded-md border border-slate-300 p-1.5 text-xs bg-white font-semibold text-slate-900"
                                placeholder="Pcs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 18 - APD & Pelampung):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator18 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator18: e.target.value })}
                        placeholder="Catatan jumlah, kelayakan kondisi fisik, atau penempatan APD..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 19: Alat Pemadam Api Ringan (APAR) */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all flex-1 ${form.hasFireExtinguisherApar ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasFireExtinguisherApar}
                          onChange={(e) => setForm({ ...form, hasFireExtinguisherApar: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <span>19. Alat Pemadam Api Ringan (APAR)</span>
                          <p className="text-[11px] font-normal text-slate-500">Ketersediaan jenis APAR berdasarkan media pemadam, masa kadaluarsa, dan kondisi fisik</p>
                        </div>
                      </label>
                    </div>

                    {form.hasFireExtinguisherApar && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-3">
                        <div className="text-xs font-bold text-blue-950">Pilih Jenis APAR Berdasarkan Media Pemadam:</div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* 1. Media Dry Powder */}
                          <div className={`p-2.5 rounded-lg border space-y-2 ${form.aparPowderChecked ? 'bg-blue-50/50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                              <input
                                type="checkbox"
                                checked={form.aparPowderChecked}
                                onChange={(e) => setForm({ ...form, aparPowderChecked: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span>1. Media Serbuk Kering (Dry Powder)</span>
                            </label>
                            {form.aparPowderChecked && (
                              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                                <div>
                                  <label className="block text-slate-500 mb-0.5">Jumlah:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={form.aparPowderCount || 1}
                                    onChange={(e) => setForm({ ...form, aparPowderCount: Number(e.target.value) })}
                                    className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-500 mb-0.5">Kadaluarsa:</label>
                                  <input
                                    type="text"
                                    value={form.aparPowderExpiry || ''}
                                    onChange={(e) => setForm({ ...form, aparPowderExpiry: e.target.value })}
                                    placeholder="Bln/Thn"
                                    className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-500 mb-0.5">Kondisi Fisik:</label>
                                  <select
                                    value={form.aparPowderCondition || 'BAIK'}
                                    onChange={(e) => setForm({ ...form, aparPowderCondition: e.target.value })}
                                    className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                  >
                                    <option value="BAIK">Baik / Mulus</option>
                                    <option value="KOROSI">Korosi / Berkarat</option>
                                    <option value="BERLUBANG">Berlubang / Rusak</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. Media CO2 */}
                          <div className={`p-2.5 rounded-lg border space-y-2 ${form.aparCo2Checked ? 'bg-blue-50/50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                              <input
                                type="checkbox"
                                checked={form.aparCo2Checked}
                                onChange={(e) => setForm({ ...form, aparCo2Checked: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span>2. Media Karbon Dioksida (CO2)</span>
                            </label>
                            {form.aparCo2Checked && (
                              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                                <div>
                                  <label className="block text-slate-500 mb-0.5">Jumlah:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={form.aparCo2Count || 1}
                                    onChange={(e) => setForm({ ...form, aparCo2Count: Number(e.target.value) })}
                                    className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-500 mb-0.5">Kadaluarsa:</label>
                                  <input
                                    type="text"
                                    value={form.aparCo2Expiry || ''}
                                    onChange={(e) => setForm({ ...form, aparCo2Expiry: e.target.value })}
                                    placeholder="Bln/Thn"
                                    className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-500 mb-0.5">Kondisi Fisik:</label>
                                  <select
                                    value={form.aparCo2Condition || 'BAIK'}
                                    onChange={(e) => setForm({ ...form, aparCo2Condition: e.target.value })}
                                    className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                  >
                                    <option value="BAIK">Baik / Mulus</option>
                                    <option value="KOROSI">Korosi / Berkarat</option>
                                    <option value="BERLUBANG">Berlubang / Rusak</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Media Foam (Busa) */}
                          <div className={`p-2.5 rounded-lg border space-y-2 ${form.aparFoamChecked ? 'bg-blue-50/50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                              <input
                                type="checkbox"
                                checked={form.aparFoamChecked}
                                onChange={(e) => setForm({ ...form, aparFoamChecked: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span>3. Media Busa / Cairan Kimia (Foam)</span>
                            </label>
                            {form.aparFoamChecked && (
                              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                                <div>
                                  <label className="block text-slate-500 mb-0.5">Jumlah:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={form.aparFoamCount || 1}
                                    onChange={(e) => setForm({ ...form, aparFoamCount: Number(e.target.value) })}
                                    className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-500 mb-0.5">Kadaluarsa:</label>
                                  <input
                                    type="text"
                                    value={form.aparFoamExpiry || ''}
                                    onChange={(e) => setForm({ ...form, aparFoamExpiry: e.target.value })}
                                    placeholder="Bln/Thn"
                                    className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-slate-500 mb-0.5">Kondisi Fisik:</label>
                                  <select
                                    value={form.aparFoamCondition || 'BAIK'}
                                    onChange={(e) => setForm({ ...form, aparFoamCondition: e.target.value })}
                                    className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                  >
                                    <option value="BAIK">Baik / Mulus</option>
                                    <option value="KOROSI">Korosi / Berkarat</option>
                                    <option value="BERLUBANG">Berlubang / Rusak</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 4. Media Lainnya */}
                          <div className={`p-2.5 rounded-lg border space-y-2 ${form.aparOtherChecked ? 'bg-blue-50/50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                              <input
                                type="checkbox"
                                checked={form.aparOtherChecked}
                                onChange={(e) => setForm({ ...form, aparOtherChecked: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span>4. Jenis Media Pemadam Lainnya</span>
                            </label>
                            {form.aparOtherChecked && (
                              <div className="space-y-1.5 pt-1 text-[11px]">
                                <input
                                  type="text"
                                  value={form.aparOtherName || ''}
                                  onChange={(e) => setForm({ ...form, aparOtherName: e.target.value })}
                                  placeholder="Nama jenis media (cth: Gas Bersih / Halon / Water Mist)"
                                  className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-slate-500 mb-0.5">Jumlah:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={form.aparOtherCount || 1}
                                      onChange={(e) => setForm({ ...form, aparOtherCount: Number(e.target.value) })}
                                      className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-slate-500 mb-0.5">Kadaluarsa:</label>
                                    <input
                                      type="text"
                                      value={form.aparOtherExpiry || ''}
                                      onChange={(e) => setForm({ ...form, aparOtherExpiry: e.target.value })}
                                      placeholder="Bln/Thn"
                                      className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-slate-500 mb-0.5">Kondisi Fisik:</label>
                                    <select
                                      value={form.aparOtherCondition || 'BAIK'}
                                      onChange={(e) => setForm({ ...form, aparOtherCondition: e.target.value })}
                                      className="w-full rounded border border-slate-300 p-1 text-xs bg-white"
                                    >
                                      <option value="BAIK">Baik / Mulus</option>
                                      <option value="KOROSI">Korosi / Berkarat</option>
                                      <option value="BERLUBANG">Berlubang / Rusak</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 19 - APAR):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator19 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator19: e.target.value })}
                        placeholder="Catatan jumlah tabung, tekanan, masa berlaku, atau kondisi fisik APAR..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 20: Kotak Obat */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all flex-1 ${form.hasFirstAidBox ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasFirstAidBox}
                          onChange={(e) => setForm({ ...form, hasFirstAidBox: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <span>20. Kotak Obat (P3K Fisik)</span>
                          <p className="text-[11px] font-normal text-slate-500">Ketersediaan kotak/lemari penyimpanan obat di kapal</p>
                        </div>
                      </label>
                    </div>

                    {form.hasFirstAidBox && (
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 text-xs">
                        <label className="block font-semibold text-slate-700">Kondisi Fisik Kotak Obat:</label>
                        <select
                          value={form.firstAidBoxCondition || 'BAIK_BERSIH'}
                          onChange={(e) => setForm({ ...form, firstAidBoxCondition: e.target.value })}
                          className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-900"
                        >
                          <option value="BAIK_BERSIH">Baik, Kering & Bersih</option>
                          <option value="KOTOR_LEMBAP">Kotor / Lembap / Berdebu</option>
                          <option value="RUSAK">Rusak / Tidak Layak Pakai</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 20 - Kotak Obat):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator20 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator20: e.target.value })}
                        placeholder="Catatan kebersihan kotak, lokasi penempatan, atau aksesibilitas..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Indikator 21: Obat-obatan */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all flex-1 ${form.hasFirstAidMedicines || form.hasFirstAidKit ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasFirstAidMedicines || form.hasFirstAidKit}
                          onChange={(e) => setForm({
                            ...form,
                            hasFirstAidMedicines: e.target.checked,
                            hasFirstAidKit: e.target.checked
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <span>21. Obat-Obatan P3K Maritim</span>
                          <p className="text-[11px] font-normal text-slate-500">Kelengkapan obat standar darurat pelayaran & masa berlaku</p>
                        </div>
                      </label>
                    </div>

                    {(form.hasFirstAidMedicines || form.hasFirstAidKit) && (
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Status Masa Kadaluarsa Obat:</label>
                          <div className="grid grid-cols-2 gap-2">
                            <label className={`p-1.5 rounded border flex items-center gap-1.5 cursor-pointer text-[11px] ${form.firstAidMedicineExpiryStatus !== 'KADALUARSA' ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' : 'bg-slate-50'}`}>
                              <input
                                type="radio"
                                name="firstAidExpiry"
                                checked={form.firstAidMedicineExpiryStatus !== 'KADALUARSA'}
                                onChange={() => setForm({ ...form, firstAidMedicineExpiryStatus: 'MASIH_BERLAKU' })}
                                className="w-3.5 h-3.5 text-emerald-600"
                              />
                              <span>Masih Berlaku (Aman)</span>
                            </label>
                            <label className={`p-1.5 rounded border flex items-center gap-1.5 cursor-pointer text-[11px] ${form.firstAidMedicineExpiryStatus === 'KADALUARSA' ? 'bg-rose-50 border-rose-400 font-bold text-rose-900' : 'bg-slate-50'}`}>
                              <input
                                type="radio"
                                name="firstAidExpiry"
                                checked={form.firstAidMedicineExpiryStatus === 'KADALUARSA'}
                                onChange={() => setForm({ ...form, firstAidMedicineExpiryStatus: 'KADALUARSA' })}
                                className="w-3.5 h-3.5 text-rose-600"
                              />
                              <span>Ada Obat Kadaluarsa</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Daftar / Jenis Obat Tersedia:</label>
                          <input
                            type="text"
                            value={form.firstAidMedicineItems?.join(', ') || ''}
                            onChange={(e) => setForm({ ...form, firstAidMedicineItems: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            placeholder="Contoh: Paracetamol, Betadine/Povidone, Kasa Perban, Obat Diare, Antihistamin, Plester"
                            className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 21 - Obat-obatan P3K):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator21 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator21: e.target.value })}
                        placeholder="Catatan stok obat, tanggal kedaluwarsa, atau kekurangan obat..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Checklist No. 22: Keluhan kesehatan ABK */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 sm:col-span-2">
                    <div>
                      <label className="block font-bold text-slate-800 text-xs">
                        22. Keluhan Kesehatan Awak Kapal (ABK)
                      </label>
                      <p className="text-[11px] font-normal text-slate-500">
                        Pencatatan riwayat keluhan atau gejala sakit yang dialami ABK selama operasional
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Riwayat Keluhan / Gejala Sakit yang Dialami ABK:
                        </label>
                        <input
                          type="text"
                          value={form.crewHealthComplaints || ''}
                          onChange={(e) => setForm({ ...form, crewHealthComplaints: e.target.value })}
                          placeholder="Contoh: Demam berulang, sesak nafas, nyeri lambung, gatal-gatal di laut, nihil keluhan"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Catatan / Tindakan Medis Rujukan:
                        </label>
                        <input
                          type="text"
                          value={form.healthComplaintNotes || ''}
                          onChange={(e) => setForm({ ...form, healthComplaintNotes: e.target.value })}
                          placeholder="Contoh: Diberi obat jalan, disarankan berobat ke KKP Pelabuhan"
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Indikator 23: Catatan Nahkoda (Pencatatan Kecelakaan Kerja & Insiden) */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all flex-1 ${form.hasAccidentLog ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          checked={form.hasAccidentLog}
                          onChange={(e) => setForm({ ...form, hasAccidentLog: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <span>23. Catatan Nahkoda (Pencatatan Kecelakaan Kerja & Insiden)</span>
                          <p className="text-[11px] font-normal text-slate-500">Mencatat insiden medis, kecelakaan di laut, dan tindakan pertolongan</p>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Catatan Pemeriksa (Indikator No. 23 - Catatan Nahkoda / Insiden):
                      </label>
                      <input
                        type="text"
                        value={form.noteIndicator23 || ''}
                        onChange={(e) => setForm({ ...form, noteIndicator23: e.target.value })}
                        placeholder="Catatan keterisian catatan nahkoda atau rekam jejak insiden kecelakaan..."
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
                  <p className="text-xs text-slate-500">Indikator Kepatuhan No. 24</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="font-semibold text-slate-800">24. Fasilitasi Siswa Magang & Bebas Pekerja Anak</div>
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
                      Catatan Pemeriksa (Indikator No. 24 - Pemagangan & Perlindungan Anak):
                    </label>
                    <input
                      type="text"
                      value={form.noteIndicator24 || ''}
                      onChange={(e) => setForm({ ...form, noteIndicator24: e.target.value })}
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
                <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">VII. BUKTI KOMPETENSI AWAK KAPAL PERIKANAN (AKP)</h3>
                    <p className="text-xs text-slate-500">Indikator Kepatuhan No. 25</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const current = form.competencyCertificates || [];
                      const updated = [
                        ...current,
                        { certificateType: 'ANKPIN III (Ahli Nautika Kapal Penangkap Ikan Tingkat III)', crewCount: 0 }
                      ];
                      
                      // Sync helper values
                      const bstItem = updated.find(c => c.certificateType.includes('BST-F'));
                      const seamanItem = updated.find(c => c.certificateType.toLowerCase().includes('buku pelaut') || c.certificateType.toLowerCase().includes('seaman'));
                      const compNames = updated.map(c => c.certificateType === 'Lainnya (Tulis Manual)' ? (c.customCertificateName || 'Dokumen Lainnya') : c.certificateType).filter(Boolean);

                      setForm({
                        ...form,
                        competencyCertificates: updated,
                        crewWithBstCount: bstItem ? bstItem.crewCount : form.crewWithBstCount,
                        crewWithSeamanBookCount: seamanItem ? seamanItem.crewCount : form.crewWithSeamanBookCount,
                        competenciesAvailable: compNames
                      });
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="Tambah Sertifikat Kompetensi Lainnya (+)"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Sertifikat</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Container 2 Kolom Form */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <label className="block font-bold text-slate-800 text-xs">
                          25. Bukti Sertifikat Kompetensi & Dokumen Pelaut ABK:
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Pilih drop bukti sertifikat pada kolom kiri dan isikan jumlah ABK yang memiliki dokumen pada kolom kanan
                        </p>
                      </div>
                    </div>

                    {/* Listing 2 Kolom */}
                    {(!form.competencyCertificates || form.competencyCertificates.length === 0) ? (
                      <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center bg-white">
                        <p className="text-xs text-slate-500 mb-2">Belum ada bukti sertifikat kompetensi yang terdaftar.</p>
                        <button
                          type="button"
                          onClick={() => {
                            const defaultItems = [
                              { certificateType: 'BST-F (Basic Safety Training Fisheries)', crewCount: form.crewWithBstCount || 0 },
                              { certificateType: 'Buku Pelaut (Seaman Book)', crewCount: form.crewWithSeamanBookCount || 0 }
                            ];
                            setForm({
                              ...form,
                              competencyCertificates: defaultItems,
                              competenciesAvailable: ['BST-F', 'Buku Pelaut']
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Muat Format Sertifikat Standar</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Table Header */}
                        <div className="hidden sm:grid grid-cols-12 gap-2.5 px-3 py-1.5 bg-slate-200/70 rounded-lg font-bold text-slate-700 text-[11px]">
                          <div className="col-span-7">Bukti Sertifikat / Dokumen Kompetensi (Drop Pilihan)</div>
                          <div className="col-span-4 text-center">Jumlah ABK / Pekerja Pemilik Dokumen</div>
                          <div className="col-span-1 text-right">Aksi</div>
                        </div>

                        {/* Table Rows */}
                        {form.competencyCertificates.map((item, idx) => {
                          const isCustom = item.certificateType === 'Lainnya (Tulis Manual)' || 
                            (![
                              'BST-F (Basic Safety Training Fisheries)',
                              'Buku Pelaut (Seaman Book)',
                              'ANKPIN I (Ahli Nautika Kapal Penangkap Ikan Tingkat I)',
                              'ANKPIN II (Ahli Nautika Kapal Penangkap Ikan Tingkat II)',
                              'ANKPIN III (Ahli Nautika Kapal Penangkap Ikan Tingkat III)',
                              'ATKPIN I (Ahli Teknika Kapal Penangkap Ikan Tingkat I)',
                              'ATKPIN II (Ahli Teknika Kapal Penangkap Ikan Tingkat II)',
                              'ATKPIN III (Ahli Teknika Kapal Penangkap Ikan Tingkat III)',
                              'SKK 60 Mil (Surat Keterangan Kecakapan 60 Mil)',
                              'SKK 30 Mil (Surat Keterangan Kecakapan 30 Mil)',
                              'Sertifikat K3 / Keselamatan Kerja Perikanan',
                              'Sertifikat Medis / Pertolongan Pertama (First Aid)',
                              'Sertifikat Operator Radio Komunikasi (GOC-GMDSS / SKOR)',
                              'Sertifikat Penanganan Mutu Hasil Tangkapan (HACCP / CPIB)'
                            ].includes(item.certificateType));

                          return (
                            <div
                              key={idx}
                              className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                                {/* Kolom Kiri: Drop Bukti Sertifikat */}
                                <div className="sm:col-span-7 space-y-1">
                                  <label className="block sm:hidden text-[10px] font-semibold text-slate-600">
                                    Bukti Sertifikat / Dokumen:
                                  </label>
                                  <select
                                    value={isCustom ? 'Lainnya (Tulis Manual)' : item.certificateType}
                                    onChange={(e) => {
                                      const updated = [...(form.competencyCertificates || [])];
                                      const selectedType = e.target.value;
                                      updated[idx] = {
                                        ...updated[idx],
                                        certificateType: selectedType,
                                        customCertificateName: selectedType === 'Lainnya (Tulis Manual)' ? (updated[idx].customCertificateName || '') : undefined
                                      };
                                      
                                      const bstItem = updated.find(c => c.certificateType.includes('BST-F'));
                                      const seamanItem = updated.find(c => c.certificateType.toLowerCase().includes('buku pelaut') || c.certificateType.toLowerCase().includes('seaman'));
                                      const compNames = updated.map(c => c.certificateType === 'Lainnya (Tulis Manual)' ? (c.customCertificateName || 'Dokumen Lainnya') : c.certificateType).filter(Boolean);

                                      setForm({
                                        ...form,
                                        competencyCertificates: updated,
                                        crewWithBstCount: bstItem ? bstItem.crewCount : form.crewWithBstCount,
                                        crewWithSeamanBookCount: seamanItem ? seamanItem.crewCount : form.crewWithSeamanBookCount,
                                        competenciesAvailable: compNames
                                      });
                                    }}
                                    className="w-full rounded-md border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                                  >
                                    <optgroup label="Sertifikat Dasar & Identitas Pelaut">
                                      <option value="BST-F (Basic Safety Training Fisheries)">BST-F (Basic Safety Training Fisheries)</option>
                                      <option value="Buku Pelaut (Seaman Book)">Buku Pelaut (Seaman Book)</option>
                                    </optgroup>
                                    <optgroup label="Sertifikat Keahlian Nautika (Deck)">
                                      <option value="ANKPIN I (Ahli Nautika Kapal Penangkap Ikan Tingkat I)">ANKPIN I (Ahli Nautika Kapal Penangkap Ikan Tingkat I)</option>
                                      <option value="ANKPIN II (Ahli Nautika Kapal Penangkap Ikan Tingkat II)">ANKPIN II (Ahli Nautika Kapal Penangkap Ikan Tingkat II)</option>
                                      <option value="ANKPIN III (Ahli Nautika Kapal Penangkap Ikan Tingkat III)">ANKPIN III (Ahli Nautika Kapal Penangkap Ikan Tingkat III)</option>
                                      <option value="SKK 60 Mil (Surat Keterangan Kecakapan 60 Mil)">SKK 60 Mil (Surat Keterangan Kecakapan 60 Mil)</option>
                                      <option value="SKK 30 Mil (Surat Keterangan Kecakapan 30 Mil)">SKK 30 Mil (Surat Keterangan Kecakapan 30 Mil)</option>
                                    </optgroup>
                                    <optgroup label="Sertifikat Keahlian Teknika (Mesin)">
                                      <option value="ATKPIN I (Ahli Teknika Kapal Penangkap Ikan Tingkat I)">ATKPIN I (Ahli Teknika Kapal Penangkap Ikan Tingkat I)</option>
                                      <option value="ATKPIN II (Ahli Teknika Kapal Penangkap Ikan Tingkat II)">ATKPIN II (Ahli Teknika Kapal Penangkap Ikan Tingkat II)</option>
                                      <option value="ATKPIN III (Ahli Teknika Kapal Penangkap Ikan Tingkat III)">ATKPIN III (Ahli Teknika Kapal Penangkap Ikan Tingkat III)</option>
                                    </optgroup>
                                    <optgroup label="Sertifikat Keahlian Khusus & K3">
                                      <option value="Sertifikat K3 / Keselamatan Kerja Perikanan">Sertifikat K3 / Keselamatan Kerja Perikanan</option>
                                      <option value="Sertifikat Medis / Pertolongan Pertama (First Aid)">Sertifikat Medis / Pertolongan Pertama (First Aid)</option>
                                      <option value="Sertifikat Operator Radio Komunikasi (GOC-GMDSS / SKOR)">Sertifikat Operator Radio Komunikasi (GOC-GMDSS / SKOR)</option>
                                      <option value="Sertifikat Penanganan Mutu Hasil Tangkapan (HACCP / CPIB)">Sertifikat Penanganan Mutu Hasil Tangkapan (HACCP / CPIB)</option>
                                    </optgroup>
                                    <optgroup label="Lainnya">
                                      <option value="Lainnya (Tulis Manual)">+ Dokumen / Sertifikat Lainnya (Tulis Manual)</option>
                                    </optgroup>
                                  </select>

                                  {/* Input nama sertifikat kustom jika memilih Lainnya */}
                                  {(item.certificateType === 'Lainnya (Tulis Manual)' || isCustom) && (
                                    <input
                                      type="text"
                                      value={item.customCertificateName || (isCustom && item.certificateType !== 'Lainnya (Tulis Manual)' ? item.certificateType : '')}
                                      onChange={(e) => {
                                        const updated = [...(form.competencyCertificates || [])];
                                        updated[idx] = {
                                          ...updated[idx],
                                          certificateType: 'Lainnya (Tulis Manual)',
                                          customCertificateName: e.target.value
                                        };
                                        const compNames = updated.map(c => c.certificateType === 'Lainnya (Tulis Manual)' ? (c.customCertificateName || 'Dokumen Lainnya') : c.certificateType).filter(Boolean);
                                        setForm({
                                          ...form,
                                          competencyCertificates: updated,
                                          competenciesAvailable: compNames
                                        });
                                      }}
                                      placeholder="Ketikkan nama sertifikat kompetensi lainnya..."
                                      className="w-full rounded-md border border-amber-300 bg-amber-50/50 p-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                                    />
                                  )}
                                </div>

                                {/* Kolom Kanan: Jumlah ABK yang memiliki dokumen */}
                                <div className="sm:col-span-4 space-y-1">
                                  <label className="block sm:hidden text-[10px] font-semibold text-slate-600">
                                    Jumlah ABK Pemilik Dokumen:
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.crewCount === 0 ? '0' : (item.crewCount || '')}
                                      onChange={(e) => {
                                        const count = Number(e.target.value) || 0;
                                        const updated = [...(form.competencyCertificates || [])];
                                        updated[idx] = { ...updated[idx], crewCount: count };

                                        const bstItem = updated.find(c => c.certificateType.includes('BST-F'));
                                        const seamanItem = updated.find(c => c.certificateType.toLowerCase().includes('buku pelaut') || c.certificateType.toLowerCase().includes('seaman'));

                                        setForm({
                                          ...form,
                                          competencyCertificates: updated,
                                          crewWithBstCount: bstItem ? bstItem.crewCount : form.crewWithBstCount,
                                          crewWithSeamanBookCount: seamanItem ? seamanItem.crewCount : form.crewWithSeamanBookCount
                                        });
                                      }}
                                      placeholder="0"
                                      className="w-full rounded-md border border-slate-300 p-2 pr-12 text-xs sm:text-sm bg-white text-slate-900 font-mono text-center focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 pointer-events-none">
                                      Orang
                                    </span>
                                  </div>
                                </div>

                                {/* Kolom Aksi Hapus */}
                                <div className="sm:col-span-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (form.competencyCertificates || []).filter((_, i) => i !== idx);
                                      const bstItem = updated.find(c => c.certificateType.includes('BST-F'));
                                      const seamanItem = updated.find(c => c.certificateType.toLowerCase().includes('buku pelaut') || c.certificateType.toLowerCase().includes('seaman'));
                                      const compNames = updated.map(c => c.certificateType === 'Lainnya (Tulis Manual)' ? (c.customCertificateName || 'Dokumen Lainnya') : c.certificateType).filter(Boolean);

                                      setForm({
                                        ...form,
                                        competencyCertificates: updated,
                                        crewWithBstCount: bstItem ? bstItem.crewCount : 0,
                                        crewWithSeamanBookCount: seamanItem ? seamanItem.crewCount : 0,
                                        competenciesAvailable: compNames
                                      });
                                    }}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                                    title="Hapus baris dokumen ini"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Catatan Pemeriksa Indikator 25 */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Catatan Pemeriksa (Indikator No. 25 - Kompetensi & Sertifikat ABK):
                    </label>
                    <input
                      type="text"
                      value={form.noteIndicator25 || ''}
                      onChange={(e) => setForm({ ...form, noteIndicator25: e.target.value })}
                      placeholder="Tuliskan catatan masa berlaku BST-F, buku pelaut, atau catatan kompetensi keahlian ABK..."
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 8: SISTEM PEREKRUTAN AWAK KAPAL */}
            {activeSection === 8 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200 gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">VIII. SISTEM PEREKRUTAN AWAK KAPAL PERIKANAN</h3>
                    <p className="text-xs text-slate-500">Mekanisme Rekrutmen, Agen/Penyalur, dan Penampungan per Pekerja / ABK</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRecruitmentCrew}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan Pekerja</span>
                  </button>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">Formulir Rekrutmen Berbasis Pekerja:</span>
                    <span className="ml-1 text-blue-800">
                      Setiap pekerja memiliki tab dropdown tersendiri yang memuat data nama, jabatan, serta alur perekrutan spesifik masing-masing. Klik tab nama pekerja untuk membuka/menutup isian data.
                    </span>
                  </div>
                </div>

                {/* List of Recruitment Crew Accordion Cards */}
                <div className="space-y-3">
                  {(form.recruitmentCrews && form.recruitmentCrews.length > 0 ? form.recruitmentCrews : [
                    {
                      id: 'crew-default',
                      workerName: '',
                      workerPosition: 'Kelasi / ABK Deck (Deckhand)',
                      customPosition: '',
                      vacantJobInfo: '',
                      recruiterType: '',
                      agentLicenseStatus: '' as const,
                      recruiterName: '',
                      recruiterPhone: '',
                      recruiterAddress: '',
                      isHoused: null,
                      housingLocation: '',
                      housingCondition: 'LAYAK' as const,
                      feeOrDeduction: '',
                      notes: ''
                    }
                  ]).map((crew, idx) => {
                    const isExpanded = expandedRecruitmentIndices.includes(idx);
                    const displayName = crew.workerName?.trim() ? crew.workerName : `Pekerja #${idx + 1}`;
                    const displayRole = crew.workerPosition === 'LAINNYA' && crew.customPosition?.trim() 
                      ? crew.customPosition 
                      : (crew.workerPosition || 'Kelasi / ABK Deck');

                    return (
                      <div
                        key={crew.id || `crew-item-${idx}`}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                          isExpanded ? 'border-blue-300 bg-white shadow-sm ring-1 ring-blue-100' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                        }`}
                      >
                        {/* Dropdown Tab Header */}
                        <div
                          onClick={() => toggleRecruitmentTab(idx)}
                          className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {displayName}
                                </h4>
                                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold text-[11px]">
                                  {displayRole}
                                </span>
                                {crew.recruiterType && (
                                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-medium">
                                    {crew.recruiterType === 'PEMILIK_LANGSUNG' ? 'Pemilik/Nahkoda' : 
                                     crew.recruiterType === 'AGEN_MANNING' ? 'Agen Manning' : 
                                     crew.recruiterType === 'CALO_PERORANGAN' ? 'Calo' : 'Mandiri'}
                                  </span>
                                )}
                                {crew.agentLicenseStatus === 'BERIZIN' && (
                                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    Izin Resmi
                                  </span>
                                )}
                                {crew.agentLicenseStatus === 'TIDAK_BERIZIN' && (
                                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                                    Tidak Berizin
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {isExpanded ? 'Klik untuk menciutkan formulir isian' : 'Klik dropdown untuk membuka & mengisi formulir perekrutan'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleRemoveRecruitmentCrew(idx)}
                              title="Hapus pekerja ini"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleRecruitmentTab(idx)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg"
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Dropdown Tab Content / Form Body */}
                        {isExpanded && (
                          <div className="p-3 sm:p-4 border-t border-blue-100 bg-white space-y-3.5">
                            {/* KOLOM NAMA & JABATAN PEKERJA (SEBELUM ISIAN 1) */}
                            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70 space-y-2.5">
                              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                                <User className="w-4 h-4 text-blue-600" />
                                <span>Identitas & Posisi Pekerja di Kapal:</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Nama Lengkap Pekerja / ABK <span className="text-rose-500">*</span>:
                                  </label>
                                  <input
                                    type="text"
                                    value={crew.workerName || ''}
                                    onChange={(e) => handleUpdateRecruitmentCrew(idx, { workerName: e.target.value })}
                                    placeholder="Contoh: Budi Santoso / Sutrisno"
                                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Jabatan / Posisi di Kapal <span className="text-rose-500">*</span>:
                                  </label>
                                  <select
                                    value={crew.workerPosition || 'Kelasi / ABK Deck (Deckhand)'}
                                    onChange={(e) => handleUpdateRecruitmentCrew(idx, { workerPosition: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                                  >
                                    <option value="Kelasi / ABK Deck (Deckhand)">Kelasi / ABK Deck (Deckhand)</option>
                                    <option value="Nakhoda / Kapten">Nakhoda / Kapten (Skipper)</option>
                                    <option value="Mualim I (Chief Mate)">Mualim I (Chief Mate)</option>
                                    <option value="Mualim II (Second Mate)">Mualim II (Second Mate)</option>
                                    <option value="KKM (Kepala Kamar Mesin)">KKM (Kepala Kamar Mesin)</option>
                                    <option value="Masinis I (First Engineer)">Masinis I (First Engineer)</option>
                                    <option value="Masinis II (Second Engineer)">Masinis II (Second Engineer)</option>
                                    <option value="Juru Mudi (Quartermaster / Helmsman)">Juru Mudi (Quartermaster / Helmsman)</option>
                                    <option value="Juru Masak / Koki (Cook)">Juru Masak / Koki (Cook)</option>
                                    <option value="Bosun / Mandor Dek">Bosun / Mandor Dek</option>
                                    <option value="Oiler / Teknisi Mesin">Oiler / Teknisi Mesin</option>
                                    <option value="ABK Magang / Taruna Perikanan">ABK Magang / Taruna Perikanan</option>
                                    <option value="LAINNYA">Lainnya (Tulis Manual...)</option>
                                  </select>
                                </div>

                                {crew.workerPosition === 'LAINNYA' && (
                                  <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                      Tuliskan Nama Jabatan Khusus:
                                    </label>
                                    <input
                                      type="text"
                                      value={crew.customPosition || ''}
                                      onChange={(e) => handleUpdateRecruitmentCrew(idx, { customPosition: e.target.value })}
                                      placeholder="Tuliskan nama posisi/tugas spesifik..."
                                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ISIAN 1 - 7 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {/* 1. Dari mana info lowongan kerja di ketahui */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                                <label className="block font-bold text-slate-800">
                                  1. Dari Mana Info Lowongan Kerja Diketahui?
                                </label>
                                <select
                                  value={crew.vacantJobInfo || ''}
                                  onChange={(e) => handleUpdateRecruitmentCrew(idx, { vacantJobInfo: e.target.value })}
                                  className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Pilih Sumber Informasi Lowongan...</option>
                                  <option value="KELUARGA_KERABAT">Kerabat / Rekan Sekampung / Keluarga</option>
                                  <option value="MEDIA_SOSIAL">Media Sosial (Facebook, WA Group, TikTok, YouTube)</option>
                                  <option value="AGEN_CALO">Agen / Calo / Broker Pelabuhan</option>
                                  <option value="PAMFLET_BROSUR">Pamflet / Brosur / Iklan Resmi Perusahaan</option>
                                  <option value="BKK_SEKOLAH">Bursa Kerja Khusus (BKK) / Sekolah Perikanan</option>
                                  <option value="LANGSUNG_DERMAGA">Datang Langsung ke Dermaga / Pelabuhan</option>
                                  <option value="LAINNYA">Sumber Lainnya</option>
                                </select>
                              </div>

                              {/* 2. Direkrut oleh siapa */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                                <label className="block font-bold text-slate-800">
                                  2. Direkrut Oleh Siapa?
                                </label>
                                <select
                                  value={crew.recruiterType || ''}
                                  onChange={(e) => handleUpdateRecruitmentCrew(idx, { recruiterType: e.target.value })}
                                  className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Pilih Pihak Perekrut...</option>
                                  <option value="PEMILIK_LANGSUNG">Pemilik Kapal Langsung / Nahkoda</option>
                                  <option value="AGEN_MANNING">Agen Penyalur / Manning Agency</option>
                                  <option value="CALO_PERORANGAN">Calo / Perantara Perorangan</option>
                                  <option value="MANDIRI_LANGSUNG">Mandiri Datang ke Dermaga</option>
                                  <option value="PERUSAHAAN_DARAT">Perusahaan Pemilik Kapal (Manajemen Darat)</option>
                                  <option value="LAINNYA">Perekrut Lainnya</option>
                                </select>
                              </div>

                              {/* 3. Apakah agen memiliki perizinan */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 sm:col-span-2">
                                <label className="block font-bold text-slate-800">
                                  3. Apakah Agen / Perekrut Memiliki Legalitas Perizinan (SIUPPAK / SIUP)?
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${crew.agentLicenseStatus === 'BERIZIN' ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                      type="radio"
                                      name={`agentLicense_${crew.id || idx}`}
                                      checked={crew.agentLicenseStatus === 'BERIZIN'}
                                      onChange={() => handleUpdateRecruitmentCrew(idx, { agentLicenseStatus: 'BERIZIN' })}
                                      className="w-4 h-4 text-emerald-600"
                                    />
                                    <span>Memiliki Izin Resmi (SIUPPAK/SIUP)</span>
                                  </label>
                                  <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${crew.agentLicenseStatus === 'TIDAK_BERIZIN' ? 'bg-rose-50 border-rose-400 font-bold text-rose-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                      type="radio"
                                      name={`agentLicense_${crew.id || idx}`}
                                      checked={crew.agentLicenseStatus === 'TIDAK_BERIZIN'}
                                      onChange={() => handleUpdateRecruitmentCrew(idx, { agentLicenseStatus: 'TIDAK_BERIZIN' })}
                                      className="w-4 h-4 text-rose-600"
                                    />
                                    <span>Tidak Memiliki Izin Resmi (Ilegal)</span>
                                  </label>
                                  <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${crew.agentLicenseStatus === 'TIDAK_TAHU' ? 'bg-slate-100 border-slate-300 font-bold text-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                      type="radio"
                                      name={`agentLicense_${crew.id || idx}`}
                                      checked={crew.agentLicenseStatus === 'TIDAK_TAHU'}
                                      onChange={() => handleUpdateRecruitmentCrew(idx, { agentLicenseStatus: 'TIDAK_TAHU' })}
                                      className="w-4 h-4 text-slate-600"
                                    />
                                    <span>ABK Tidak Tahu / Tidak Jelas</span>
                                  </label>
                                </div>
                              </div>

                              {/* 4. Identitas & Kontak Agen / Perekrut */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 sm:col-span-2">
                                <label className="block font-bold text-slate-800">
                                  4. Identitas & Kontak Agen / Pihak Perekrut Pekerja Ini:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div>
                                    <label className="block text-[11px] text-slate-600 mb-0.5">Nama Perekrut / PT Agen:</label>
                                    <input
                                      type="text"
                                      value={crew.recruiterName || ''}
                                      onChange={(e) => handleUpdateRecruitmentCrew(idx, { recruiterName: e.target.value })}
                                      placeholder="Nama perorangan / PT Agen"
                                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-600 mb-0.5">Nomor HP / Kontak:</label>
                                    <input
                                      type="text"
                                      value={crew.recruiterPhone || ''}
                                      onChange={(e) => handleUpdateRecruitmentCrew(idx, { recruiterPhone: e.target.value })}
                                      placeholder="No. Telepon / WA Perekrut"
                                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-600 mb-0.5">Alamat / Kota Kantor Agen:</label>
                                    <input
                                      type="text"
                                      value={crew.recruiterAddress || ''}
                                      onChange={(e) => handleUpdateRecruitmentCrew(idx, { recruiterAddress: e.target.value })}
                                      placeholder="Kota / Alamat kantor atau mes"
                                      className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* 5. Apakah ditampung sebelum berangkat melaut */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 sm:col-span-2">
                                <label className="block font-bold text-slate-800">
                                  5. Apakah ABK Ditampung Terlebih Dahulu Sebelum Berangkat Melaut?
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${crew.isHoused === false ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                      type="radio"
                                      name={`isHoused_${crew.id || idx}`}
                                      checked={crew.isHoused === false}
                                      onChange={() => handleUpdateRecruitmentCrew(idx, { isHoused: false, housingLocation: '', housingCondition: 'LAYAK' })}
                                      className="w-4 h-4 text-blue-600"
                                    />
                                    <span>Tidak Ditampung (Langsung ke Kapal / Berangkat)</span>
                                  </label>
                                  <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${crew.isHoused === true ? 'bg-blue-50 border-blue-400 font-bold text-blue-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                      type="radio"
                                      name={`isHoused_${crew.id || idx}`}
                                      checked={crew.isHoused === true}
                                      onChange={() => handleUpdateRecruitmentCrew(idx, { isHoused: true })}
                                      className="w-4 h-4 text-blue-600"
                                    />
                                    <span>Ya, Ditampung di Mes / Mess / Rumah Agen</span>
                                  </label>
                                </div>

                                {crew.isHoused && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Lokasi Tempat Penampungan:
                                      </label>
                                      <input
                                        type="text"
                                        value={crew.housingLocation || ''}
                                        onChange={(e) => handleUpdateRecruitmentCrew(idx, { housingLocation: e.target.value })}
                                        placeholder="Contoh: Mess Penampungan di Pelabuhan Nizam Zachman"
                                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Kondisi Kelayakan Tempat Penampungan:
                                      </label>
                                      <select
                                        value={crew.housingCondition || 'LAYAK'}
                                        onChange={(e) => handleUpdateRecruitmentCrew(idx, { housingCondition: e.target.value as any })}
                                        className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                      >
                                        <option value="LAYAK">Layak (Air, Kasur, Ventilasi Cukup)</option>
                                        <option value="KURANG_LAYAK">Kurang Layak (Berdesakan / Sanitasi Minim)</option>
                                        <option value="TIDAK_LAYAK">Tidak Layak (Terkunci / Dilarang Keluar)</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* 6. Biaya Rekrutmen / Potongan Biaya Awal */}
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 sm:col-span-2">
                                <label className="block font-bold text-slate-800">
                                  6. Biaya Perekrutan / Skema Uang Muka / Potongan Biaya Awal:
                                </label>
                                <input
                                  type="text"
                                  value={crew.feeOrDeduction || ''}
                                  onChange={(e) => handleUpdateRecruitmentCrew(idx, { feeOrDeduction: e.target.value })}
                                  placeholder="Contoh: Gratis tanpa biaya / Ada potongan uang saku Rp 2.000.000 dari gaji bagi hasil"
                                  className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* 7. Catatan Khusus Pekerja Ini */}
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  7. Catatan Khusus Perekrutan untuk Pekerja ({displayName}):
                                </label>
                                <input
                                  type="text"
                                  value={crew.notes || ''}
                                  onChange={(e) => handleUpdateRecruitmentCrew(idx, { notes: e.target.value })}
                                  placeholder="Tuliskan temuan atau catatan khusus terkait rekrutmen pekerja ini..."
                                  className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tombol Tambahkan Pekerja di Bawah List */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddRecruitmentCrew}
                    className="w-full py-2.5 px-4 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Tambahkan Data Pekerja Lainnya (+ Pekerja Baru)</span>
                  </button>
                </div>

                {/* Catatan Keseluruhan Pengawas untuk Sistem Perekrutan */}
                <div className="pt-3 border-t border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Catatan Umum / Rekomendasi Pengawas untuk Sistem Perekrutan Awak Kapal:
                  </label>
                  <input
                    type="text"
                    value={form.noteIndicatorRecruitment || form.recruitmentOtherInfo || ''}
                    onChange={(e) => setForm({ ...form, noteIndicatorRecruitment: e.target.value, recruitmentOtherInfo: e.target.value })}
                    placeholder="Tuliskan kesimpulan umum tim pemeriksa terkait kepatuhan alur perekrutan kapal..."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* SECTION 9: RED FLAGS & PENGESAHAN */}
            {activeSection === 9 && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">IX. INDIKATOR PELANGGARAN KHUSUS & PENGESAHAN</h3>
                  <p className="text-xs text-slate-500">Tanda Tangan & Berita Acara Lapangan</p>
                </div>

                {/* Verifikasi Kepatuhan Integritas & Bebas Kerja Paksa (Indikator Khusus 18 & 19) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase">
                      Verifikasi Integritas & Bebas Kerja Paksa (Indikator Khusus 18 & 19):
                    </h4>
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                      Wajib Diverifikasi Pengawas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Indikator 18 */}
                    <label className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      (form.identityHoldVerified || form.integrityVerified) && !form.identityHoldFlag
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={(form.identityHoldVerified || form.integrityVerified) && !form.identityHoldFlag}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm({
                            ...form,
                            identityHoldVerified: checked,
                            identityHoldFlag: false,
                            integrityVerified: checked && (form.arbitraryDeductionVerified || form.integrityVerified)
                          });
                        }}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900">18. Bebas Penahanan Dokumen Asli Awak Kapal</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Telah diverifikasi langsung bahwa KTP, Buku Pelaut, atau Ijazah asli dipegang oleh ABK dan tidak ditahan majikan/agen.
                        </p>
                      </div>
                    </label>

                    {/* Indikator 19 */}
                    <label className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      (form.arbitraryDeductionVerified || form.integrityVerified) && !form.arbitraryDeductionFlag
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={(form.arbitraryDeductionVerified || form.integrityVerified) && !form.arbitraryDeductionFlag}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm({
                            ...form,
                            arbitraryDeductionVerified: checked,
                            arbitraryDeductionFlag: false,
                            integrityVerified: checked && (form.identityHoldVerified || form.integrityVerified)
                          });
                        }}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900">19. Bebas Potongan Upah Liar / Jeratan Utang</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Telah diverifikasi langsung bahwa tidak ada potongan upah di luar kesepakatan tertulis dan bebas jeratan utang rekrutmen.
                        </p>
                      </div>
                    </label>
                  </div>
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

                  {/* Form 1: Catatan Tambahan Pengawas */}
                  <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-800 text-xs">
                        Catatan Tambahan Pengawas:
                      </label>
                      <span className="text-[11px] text-slate-500">Temuan umum, kondisi khusus di kapal, atau keterangan saksi</span>
                    </div>
                    <textarea
                      rows={2}
                      value={form.additionalNotes || ''}
                      onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                      placeholder="Masukkan catatan tambahan tim pemeriksa terkait temuan di lapangan..."
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Form 2: Rekomendasi Resmi Pengawas */}
                  <div className="sm:col-span-2 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-blue-900 text-xs">
                        Rekomendasi Resmi Pengawas:
                      </label>
                      <span className="text-[11px] text-blue-700 font-medium">Tindakan perbaikan, batas waktu pemenuhan kewajiban, & tindak lanjut</span>
                    </div>
                    <textarea
                      rows={2}
                      value={form.officialRecommendations || ''}
                      onChange={(e) => setForm({ ...form, officialRecommendations: e.target.value })}
                      placeholder="Tuliskan rekomendasi resmi perbaikan (misal: Kewajiban melengkapi PKL & BPJS sebelum SPB diterbitkan)..."
                      className="w-full rounded-lg border border-blue-300 p-2.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
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
                {activeSection < 9 && (
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

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-3.5 sm:px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px] shadow-2xs"
                  title="Simpan sementara progres checklist sebagai draft agar data tidak hilang"
                >
                  <Bookmark className="w-4 h-4 text-amber-700" />
                  <span>Simpan Draft</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 sm:px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                  title="Kunci hasil pengawasan resmi ke database, perbarui skor risiko kapal, dan bersihkan draft"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-100" />
                  <span>{isSubmitting ? 'Memproses...' : 'Submit & Skor (Approve)'}</span>
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
                  <select
                    value={newGearType}
                    onChange={(e) => setNewGearType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white text-slate-900 font-medium"
                  >
                    {STANDARD_GEAR_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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
