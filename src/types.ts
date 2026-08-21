export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type VesselStatus = 'ACTIVE' | 'FLAGGED' | 'SUSPENDED' | 'CLEARED';
export type ViolationSeverity = 'MINOR' | 'MODERATE' | 'CRITICAL';
export type FollowUpStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'SANCTIONED';

export interface ViolationCategory {
  id: string;
  category: 'DOCUMENTATION' | 'WAGES' | 'WORKING_HOURS' | 'SAFETY_HEALTH' | 'FORCED_LABOR_INDICATOR';
  title: string;
  severity: ViolationSeverity;
  scoreWeight: number; // e.g. 5 for minor, 15 for moderate, 35 for critical
  description: string;
}

export interface InspectionViolation {
  categoryId: string;
  categoryName: string;
  title: string;
  severity: ViolationSeverity;
  scoreWeight: number;
  notes: string;
}

// -------------------------------------------------------------
// TIM PENGAWASAN BERSAMA NORMA KETENAGAKERJAAN DI ATAS KAPAL IKAN
// DAFTAR PERIKSA (CHECKLIST CRITERIA I - VIII)
// -------------------------------------------------------------

export interface OfficialChecklistForm {
  // I. DATA UMUM & IDENTITAS KAPAL
  inspectionDate?: string; // 1. Tanggal pengawasan bersama
  inspectionLocation?: string; // 2. Lokasi Pengawasan Bersama (Pelabuhan / WPP)
  vesselName?: string; // 3. Nama Kapal
  callSign?: string;
  sipiNumber?: string;
  registrationNumber?: string;
  homePort?: string; // 4. Pelabuhan Pangkalan
  tandaSelar?: string; // 5. Tanda Selar
  grossTonnage?: number; // 6. GT Kapal
  ownerName?: string; // 7. Pemilik Kapal
  ownerAddress?: string;
  agentName?: string; // 8. Nama Agen Operasional
  hasWlkp?: boolean | null; // 9. Wajib Lapor Ketenagakerjaan (WLKP)
  wlkpStatus?: 'ADA' | 'TIDAK_ADA' | 'PROSES';
  wlkpNumber?: string;
  captainName?: string; // 10. Nama Nakhoda/Tekong
  crewListStatus?: 'LENGKAP' | 'SEBAGIAN' | 'TIDAK_ADA'; // 11. Daftar AKP
  totalCrewCount?: number; // 12. Jumlah Awak Kapal
  crewMaleCount?: number;
  crewFemaleCount?: number;
  hasMigrantCrew?: boolean;
  migrantCrewCount?: number;
  hasForeignCrew?: boolean;
  foreignCrewCount?: number;
  fishingGearType?: string; // 13. Jenis Alat Tangkap
  gearType?: string;
  fishingGround?: string; // Daerah Penangkapan Ikan (WPP-NRI)

  // II. PKL (PERJANJIAN KERJA LAUT) & PENGUPAHAN
  hasPklAgreement?: boolean | null; // 14. Kepemilikan Dokumen PKL
  pklStatus?: 'SEMUA_BER_PKL' | 'SEBAGIAN_BER_PKL' | 'TIDAK_ADA_PKL';
  crewWithPklCount?: number;
  pklHeldByCrew?: boolean | null; // 15. Salinan PKL dipegang awak kapal
  pklStandardFormat?: boolean | null; // 16. Format & durasi standar PKL
  pklDuration?: string;
  pklWageScheme?: 'BULANAN' | 'BAGI_HASIL' | 'KOMBINASI' | ''; // 17. Sistem pengupahan
  wageSystem?: 'BAGI_HASIL' | 'UPAH_BULANAN' | 'KOMBINASI';
  wageAmount?: string;
  profitSharingRatio?: string;
  overtimeBonus?: string;
  minimumWageGuaranteed?: boolean | null;
  hasSalarySlips?: boolean; // 18. Slip Upah / rincian bagi hasil tertulis
  hasProductionSharingProof?: boolean;
  hasWageDeductions?: boolean; // 19. Bebas potongan liar
  wageDeductionNotes?: string;

  // III. JAMINAN SOSIAL KETENAGAKERJAAN & KESEHATAN
  hasBpjsKetenagakerjaan?: boolean | null; // 20. BPJS Ketenagakerjaan
  bpjsTkProgram?: 'BPU_2_PROGRAM' | 'PU_3_PROGRAM' | 'PU_4_PROGRAM' | 'TIDAK_TERDAFTAR';
  bpjsTkPrograms?: string[]; // 21. Program JKK / JKM / JHT
  crewWithBpjsTkCount?: number;
  hasBpjsKesehatan?: boolean; // 22. BPJS Kesehatan / Asuransi
  bpjsKesStatus?: 'AKTIF_SEMUA' | 'SEBAGIAN' | 'TIDAK_ADA';
  crewWithBpjsKesCount?: number;
  bpjsHealthContributionPaid?: boolean;
  hasPrivateInsurance?: boolean;

  // IV. KONDISI OPERASIONAL & KELAYAKAN FASILITAS
  daysAtSeaPerTrip?: number; // 23. Hari melaut per trip
  apiOperationsPerTrip?: number;
  apiOperatingHoursPerDay?: number;
  dailyRestHoursCompliant?: boolean; // 24. Standar Jam Istirahat (Min. 10 Jam/Hari)
  restHoursPerDay?: number;
  hasCleanWaterAccess?: boolean; // 25. Pasokan Air Bersih & Minum
  hasSufficientFoodSupply?: boolean; // 26. Pasokan Makanan Cukup
  hasAdequateAccommodation?: boolean; // 27. Ruang Tidur & Sanitasi Bersih

  // V. KESELAMATAN & KESEHATAN KERJA (K3)
  hasLifeJacketsAvailable?: boolean; // 28. Lifejacket / Pelampung Sesuai Jumlah ABK
  lifeJacketCount?: number;
  ppeTypesAvailable?: string[];
  ppeSetCount?: number;
  ppeAdequacy?: 'CUKUP' | 'KURANG' | 'TIDAK_ADA';
  hasFireExtinguisherApar?: boolean; // 29. APAR Siap Pakai
  hasFirstAidKit?: boolean; // 30. Kotak & Obat P3K
  firstAidAvailable?: 'LENGKAP' | 'KURANG_LENGKAP' | 'TIDAK_ADA';
  hasAccidentLog?: boolean; // 31. Buku Log Insiden & Kecelakaan
  hasPersonalProtectiveEquipment?: boolean; // 32. APD Kerja (Sepatu, Sarung Tangan, Helm)
  crewHealthComplaints?: string;
  nearMissIncidents?: string;
  workAccidentsPerTrip?: number;

  // VI. FASILITASI MAGANG & PERLINDUNGAN ANAK
  apprenticeUnderAge?: boolean; // 33. Bebas Pekerja Anak (<18 Tahun di Pekerjaan Berbahaya)
  hasApprenticeOrStudents?: boolean | null; // 34. Fasilitasi Magang
  apprenticeCount?: number;
  apprenticeHasContract?: boolean;
  hasInternship?: boolean;
  internCount?: number;
  internMajor?: string;
  internHasPpeAndInsurance?: boolean;
  internSchoolOrigin?: string;

  // VII. BUKTI KOMPETENSI AWAK KAPAL
  crewWithBstCount?: number; // 35. Sertifikat Keselamatan Dasar BST-F
  crewWithSeamanBookCount?: number; // 36. Buku Pelaut (Seaman Book) Resmi
  competenciesAvailable?: string[];

  // VIII. INTEGRITAS & RED FLAGS KERJA PAKSA
  identityHoldFlag?: boolean; // 37. Bebas Penahanan Dokumen Asli ABK
  arbitraryDeductionFlag?: boolean;
  additionalNotes?: string;

  // Catatan Khusus Pemeriksa per Indikator (Field Findings & Observations)
  noteIndicator8?: string; // Catatan No. 8 (Kepemilikan PKL)
  noteIndicator9?: string; // Catatan No. 9 (Salinan PKL)
  noteIndicator10?: string; // Catatan No. 10 (Sistem Pengupahan)
  noteIndicator11?: string; // Catatan No. 11 (Slip Upah & Potongan)
  noteIndicator12?: string; // Catatan No. 12 (BPJS Ketenagakerjaan)
  noteIndicator13?: string; // Catatan No. 13 (BPJS Kesehatan / Asuransi)
  noteIndicator16?: string; // Catatan No. 16 (Fasilitas & Jam Istirahat)
  noteIndicator17?: string; // Catatan No. 17 (Lifejacket / Pelampung)
  noteIndicator18?: string; // Catatan No. 18 (APAR)
  noteIndicator19?: string; // Catatan No. 19 (Kotak & Obat P3K)
  noteIndicator20?: string; // Catatan No. 20 (Buku Log Kecelakaan Kerja)
  noteIndicator21?: string; // Catatan No. 21 (Fasilitasi Magang & Anak)
  noteIndicator22?: string; // Catatan No. 22 (Bukti Kompetensi AKP)

  // Tanda Tangan / Verifikasi
  captainNik?: string;
  captainPhone?: string;
  fisheryInspectorName?: string;
  fisheryInspectorNip?: string;
  laborInspectorName?: string;
  laborInspectorNip?: string;
}

export interface CrewComplianceData {
  totalCrew: number; // Total ABK di atas kapal
  crewWithPkl: number; // Jumlah ABK dengan PKL sah & terdaftar
  crewWithInsurance: number; // Jumlah ABK terdaftar BPJS Ketenagakerjaan / Asuransi
  crewWithSeamanBook: number; // Jumlah ABK dengan Buku Pelaut
  crewWithBst: number; // Jumlah ABK dengan Sertifikat BST-F (Keselamatan)
  hasFairWageAgreement: boolean; // Kesepakatan upah transparan / tanpa potongan liar
  hasProperRestHours: boolean; // Jam kerja wajar (istirahat min 10 jam/hari)
  hasAdequateFoodWater: boolean; // Makanan & air bersih layak
  hasFirstAidKits: boolean; // Fasilitas P3K & APD memadai
  identityHoldFlag: boolean; // Indikasi penahanan dokumen identitas ABK oleh agen/nakhoda
}

export interface RiskBreakdown {
  score: number; // 0 - 100
  riskLevel: RiskLevel;
  documentScorePenalty: number; // Penalti ketidaklengkapan dokumen
  welfareScorePenalty: number; // Penalti upah & K3
  violationScorePenalty: number; // Penalti temuan pelanggaran
  historicalPenalty: number; // Penalti rekam jejak inspeksi sebelumnya
  primaryRiskFactors: string[];
  recommendation: string;
  actionRequired: string;
}

export interface InspectionRecord {
  id: string;
  vesselId: string;
  vesselName: string;
  registrationNumber: string;
  homePort: string;
  inspectionDate: string;
  inspectionPort: string;
  leadAgency: string; // e.g. 'PSDKP - KKP', 'Pengawas Ketenagakerjaan Kemnaker', 'Syahbandar KSOP', 'Tim Pengawas Gabungan'
  inspectors: string; // Nama pengawas gabungan
  crewData: CrewComplianceData;
  checklistData?: OfficialChecklistForm; // Formulir Daftar Periksa Lengkap
  violations: InspectionViolation[];
  riskEvaluation: RiskBreakdown;
  followUpStatus: FollowUpStatus;
  officialNotes: string;
  actionDeadline?: string;
  createdBy: string;
  createdAt: string;
}

export interface Vessel {
  id: string;
  name: string;
  registrationNumber: string; // No. SIPI / SIUP / Tanda Selar
  grossTonnage: number; // GT
  callSign: string;
  ownerName: string;
  agentName: string;
  homePort: string;
  gearType: string; // Alat tangkap: Purse Seine, Longline, Gillnet, Bouke Ami, dll.
  crewCapacity: number;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  totalInspections: number;
  lastInspectionDate?: string;
  lastInspectionPort?: string;
  status: VesselStatus;
  activeViolationsCount: number;
  criticalViolationsCount: number;
  lastRecommendation?: string;
  latestChecklist?: OfficialChecklistForm;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionStats {
  totalVessels: number;
  totalInspections: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageComplianceRate: number; // Percentage
  pendingFollowUps: number;
  activePortsCount: number;
}

// -------------------------------------------------------------
// BUKTI FOTO & DOKUMEN GOOGLE DRIVE (PER KAPAL & PER INSPEKSI)
// -------------------------------------------------------------

export type EvidenceCategory =
  | 'FOTO_KAPAL_FISIK'
  | 'FOTO_AKOMODASI_ABK'
  | 'DOKUMEN_PKL'
  | 'FOTO_K3_APD'
  | 'DOKUMEN_BUKU_PELAUT'
  | 'FOTO_TEMUAN_PELANGGARAN'
  | 'DOKUMEN_WLKP_SIPI'
  | 'FASILITAS_DAPUR_AIR'
  | 'BERITA_ACARA_PEMERIKSAAN'
  | 'LAINNYA';

export interface VesselEvidence {
  id: string;
  vesselId: string;
  vesselName: string;
  vesselRegistration: string;
  inspectionId?: string;
  fileName: string;
  fileSize: number;
  fileSizeBytesFormatted: string;
  mimeType: string;
  category: EvidenceCategory;
  categoryLabel: string;
  description: string;
  driveFileId: string;
  driveFolderId?: string;
  driveFolderName?: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  uploadedBy: string;
  uploadedAt: string;
  storageProvider: 'GOOGLE_DRIVE' | 'LOCAL_CACHE';
  syncStatus: 'SYNCED' | 'LOCAL_CACHED' | 'FAILED';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSync?: string;
  syncError?: string;
  tableCounts?: {
    vessels: number;
    inspections: number;
    evidences: number;
  };
}

