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
  // I. DATA UMUM & IDENTITAS KAPAL (Hanya No. 7 WLKP yang dihitung dalam penilaian skor)
  inspectionDate?: string; // Tanggal pengawasan bersama
  inspectionLocation?: string; // Lokasi Pengawasan Bersama (Pelabuhan / WPP)
  vesselName?: string; // 1. Nama Kapal Perikanan
  grossTonnage?: number; // 2. Ukuran Kapal Satuan GT
  callSign?: string; // 3. Tanda Selar / Call Sign
  tandaSelar?: string;
  sipiNumber?: string; // 4. Nomor SIPI / SIUP Kapal
  registrationNumber?: string;
  fisheriesRegisterNumber?: string; // No. Register Kapal Perikanan (Buku Kapal / Register KKP Unik)
  homePort?: string; // 5. Pelabuhan Pangkalan 1 (Utama)
  secondaryHomePort?: string; // Pelabuhan Pangkalan 2 (Tambahan/Sekunder)
  fishingGround?: string; // 6. Daerah Penangkapan Ikan (WPPNRI)
  fishingGearType?: string; // 7. Jenis Alat Tangkap
  gearType?: string;
  ownerName?: string; // 8. Nama Pemilik / Korporasi
  ownerAddress?: string; // 9. Alamat Pemilik
  captainName?: string; // 10. Nama Nahkoda / Tekong (menggantikan Agen Operasional)
  agentName?: string; // Data historis agen jika ada
  
  // Penilaian Kepatuhan Bagian I:
  hasWlkp?: boolean | null; // 7 (Indikator Kepatuhan). Wajib Lapor Ketenagakerjaan (WLKP)
  wlkpStatus?: 'ADA' | 'TIDAK_ADA' | 'PROSES';
  wlkpNumber?: string;

  // Data Awak Kapal
  crewListStatus?: 'LENGKAP' | 'SEBAGIAN' | 'TIDAK_ADA';
  totalCrewCount?: number;
  crewMaleCount?: number;
  crewFemaleCount?: number;
  hasMigrantCrew?: boolean;
  migrantCrewCount?: number;
  hasForeignCrew?: boolean;
  foreignCrewCount?: number;

  // II. PERJANJIAN KERJA LAUT (PKL) & PENGUPAHAN
  hasPklAgreement?: boolean | null; // 8. Kepemilikan Dokumen PKL oleh Awak Kapal
  pklStatus?: 'SEMUA_BER_PKL' | 'SEBAGIAN_BER_PKL' | 'TIDAK_ADA_PKL';
  crewWithPklCount?: number;
  pklDuration?: string; // Jangka Waktu PKL (setelah checklist no 8)
  pklDurationMonths?: string;
  pklHeldByCrew?: boolean | null; // 9. Salinan PKL Dipegang Awak Kapal
  pklStandardFormat?: boolean | null;
  pklWageScheme?: 'BULANAN' | 'BAGI_HASIL' | 'KOMBINASI' | ''; // 10. Sistem Pengupahan Awak Kapal
  wageSystem?: 'BAGI_HASIL' | 'UPAH_BULANAN' | 'KOMBINASI';
  wageAmount?: string; // a. Besaran upah saat gaji pokok bulanan di klik
  monthlyBasicWage?: string;
  allowances?: Array<{ id?: string; name: string; amount: string }>; // b. Tunjangan (jenis tunjangan & nilai tunjangannya)
  profitSharingRatio?: string; // b. Besaran bagi hasil apabila isian bagi hasil murni di isi
  overtimeBonus?: string; // c. Form isian upah lembur / premi / insentif
  overtimeOrBonusPay?: string;
  minimumWageGuaranteed?: boolean | null;
  wageProofType?: 'SLIP_UPAH' | 'PERHITUNGAN_TERTULIS' | 'TIDAK_ADA' | ''; // 11. Bukti Pembayaran Upah (1. Ada bukti Slip Upah, 2. Perhitungan Tertulis, 3. Tidak ada bukti upah)
  hasSalarySlips?: boolean; // 1. Ada bukti Slip Upah
  hasWrittenCalculation?: boolean; // 2. Perhitungan Tertulis
  noWageProof?: boolean; // 3. Tidak ada bukti upah
  wagePaymentMechanism?: 'CASH' | 'TRANSFER' | 'CASH_DAN_TRANSFER' | ''; // Mekanisme Pengupahan (1. Cash, 2. Transfer, 3. Cash dan Transfer)
  hasProductionSharingProof?: boolean;
  hasWageDeductions?: boolean; // Bebas Pemotongan Upah Liar
  wageDeductionNotes?: string;

  // III. JAMINAN SOSIAL KETENAGAKERJAAN & KESEHATAN
  hasBpjsKetenagakerjaan?: boolean | null; // 12. Kepesertaan BPJS Ketenagakerjaan
  bpjsTkProgram?: 'BPU_2_PROGRAM' | 'PU_3_PROGRAM' | 'PU_4_PROGRAM' | 'TIDAK_TERDAFTAR';
  bpjsTkPrograms?: string[]; // JKK, JKM, JHT, JP
  crewWithBpjsTkCount?: number;
  hasBpjsKesehatan?: boolean; // 13. BPJS Kesehatan / Asuransi Tambahan
  bpjsKesStatus?: 'AKTIF_SEMUA' | 'SEBAGIAN' | 'TIDAK_ADA';
  crewWithBpjsKesCount?: number;
  bpjsHealthContributionPaid?: boolean;
  hasPrivateInsurance?: boolean;
  gearDeploymentsPerTrip?: number; // a. Jumlah pengoperasian alat tangkap per trip
  gearOperatingHoursPerDay?: number; // b. Lama pengoperasian alat tangkap perhari (satuan jam)
  fishingOperationsPerTrip?: string | number;
  dailyFishingOperationHours?: string | number;

  // IV. KONDISI OPERASIONAL & KELAYAKAN FASILITAS
  daysAtSeaPerTrip?: number; // Estimasi hari melaut per trip
  plannedSeaDays?: number | string; // 17. Lama rencana operational di laut (satuan hari - informasi)
  apiOperationsPerTrip?: number;
  apiOperatingHoursPerDay?: number;
  dailyRestHoursCompliant?: boolean; // 16. Standar Jam Istirahat (Min. 10 Jam/Hari - ILO C188)
  restHoursPerDay?: number;
  hasCleanWaterAccess?: boolean; // Pasokan Air Bersih & Minum Memadai
  cleanWaterCapacityLiters?: number;
  mineralWaterGallonsCount?: number;
  cleanWaterSourceType?: string;
  hasSufficientFoodSupply?: boolean; // Ketersediaan Bahan Makanan Layak
  foodSupplyDays?: number;
  hasAdequateAccommodation?: boolean; // Kondisi Kamar Tidur / Sanitasi Bersih
  bunkBedCount?: number;
  toiletCount?: number;

  // V. KESELAMATAN & KESEHATAN KERJA (K3) MARITIM
  // 18. Jenis APD yang tersedia (Scored)
  hasPpeAvailable?: boolean;
  hasLifeJacketsAvailable?: boolean;
  lifeJacketCount?: number | string;
  lifebuoyCount?: number | string;
  otherPpeName?: string;
  otherPpeCount?: number | string;
  ppeTypesAvailable?: string[];
  ppeSetCount?: number;
  ppeAdequacy?: 'CUKUP' | 'KURANG' | 'TIDAK_ADA';

  // 19. Alat Pemadam Api Ringan (APAR) (Scored)
  hasFireExtinguisherApar?: boolean;
  aparPowderChecked?: boolean;
  aparPowderCount?: number | string;
  aparPowderExpiry?: string;
  aparPowderCondition?: 'BAIK' | 'KOROSI' | 'BERLUBANG_RUSAK' | 'TEKANAN_TURUN';
  
  aparCo2Checked?: boolean;
  aparCo2Count?: number | string;
  aparCo2Expiry?: string;
  aparCo2Condition?: 'BAIK' | 'KOROSI' | 'BERLUBANG_RUSAK' | 'TEKANAN_TURUN';
  
  aparFoamChecked?: boolean;
  aparFoamCount?: number | string;
  aparFoamExpiry?: string;
  aparFoamCondition?: 'BAIK' | 'KOROSI' | 'BERLUBANG_RUSAK' | 'TEKANAN_TURUN';
  
  aparOtherChecked?: boolean;
  aparOtherName?: string;
  aparOtherCount?: number | string;
  aparOtherExpiry?: string;
  aparOtherCondition?: 'BAIK' | 'KOROSI' | 'BERLUBANG_RUSAK' | 'TEKANAN_TURUN';

  // 20. Kotak Obat P3K Maritim (Scored)
  hasFirstAidBox?: boolean;
  firstAidBoxCondition?: 'BAIK_BERSIH' | 'RUSAK_KOTOR' | 'TIDAK_LAYAK';

  // 21. Obat-Obatan P3K Maritim (Scored)
  hasFirstAidMedicines?: boolean;
  hasFirstAidKit?: boolean; // compatibility fallback
  hasStandardMaritimeMedicineList?: boolean; // 1. List Obat Standar Maritim Tersedia
  hasGenericMedicineList?: boolean; // 2. List Obat Generik
  firstAidAvailable?: 'LENGKAP' | 'KURANG_LENGKAP' | 'TIDAK_ADA';
  firstAidMedicineExpiryStatus?: 'MASIH_BERLAKU' | 'KADALUARSA' | 'SEBAGIAN_KADALUARSA';
  firstAidMedicineItems?: string[];
  firstAidMedicineListText?: string; // Form isian daftar / jenis obat tersedia (format paragraf/multiline)

  // 22. Keluhan Kesehatan ABK (Informasi)
  crewHealthComplaints?: string;
  healthComplaintNotes?: string;

  // 23. Catatan Nahkoda (Pencatatan Kecelakaan Kerja & Insiden) (Scored)
  hasAccidentLog?: boolean;
  hasPersonalProtectiveEquipment?: boolean;
  accidentConditions?: string; // Kondisi potensi bahaya kecelakaan
  accidentHistoryDetails?: string; // Kasus kecelakaan yang pernah terjadi
  nearMissIncidentsPerTrip?: number;
  workAccidentsPerTrip?: number;
  nearMissIncidents?: string;

  // VI. FASILITASI MAGANG & LARANGAN PEKERJA ANAK
  // 24. Fasilitasi Siswa Magang & Bebas Pekerja Anak (Scored)
  hasApprenticeOrStudents?: boolean | null;
  apprenticeCount?: number;
  apprenticeMajor?: string;
  apprenticeSchoolOrigin?: string;
  apprenticeHasContract?: boolean;
  apprenticeUnderAge?: boolean; // Indikasi usia < 18 tahun di pekerjaan berbahaya
  internMajor?: string;
  internSchoolOrigin?: string;
  hasInternship?: boolean;
  internCount?: number;
  internHasPpeAndInsurance?: boolean;

  // VII. BUKTI KOMPETENSI AWAK KAPAL PERIKANAN (AKP)
  // 25. Bukti Sertifikat Kompetensi & Dokumen Pelaut ABK (2 Kolom: Jenis Dokumen & Jumlah ABK)
  competencyCertificates?: Array<{
    id?: string;
    certificateType: string;
    customCertificateName?: string;
    crewCount: number;
  }>;
  // 25. Sertifikat BST-F (Scored)
  crewWithBstCount?: number;
  // 26. Buku Pelaut (Seaman Book) Resmi (Scored)
  crewWithSeamanBookCount?: number;
  // 27. Bukti Sertifikat Keahlian / Kompetensi AKP (Scored)
  competenciesAvailable?: string[];

  // VIII. SISTEM PEREKRUTAN AWAK KAPAL (Informasi - Tidak Masuk Penilaian Skor)
  recruitmentCrews?: Array<{
    id?: string;
    workerName: string; // Nama Pekerja / ABK
    workerPosition: string; // Jabatan / Posisi Pekerja
    customPosition?: string; // Jabatan kustom jika pilih Lainnya
    vacantJobInfo?: string; // 1. Dari mana info lowongan kerja diketahui
    recruiterType?: 'PERUSAHAAN' | 'NAHKODA' | 'PEMILIK_KAPAL' | 'MANDIRI' | 'AGEN' | 'CALO_PERORANGAN' | string; // 2. Direkrut oleh siapa
    agentLicenseStatus?: 'BERIZIN' | 'TIDAK_BERIZIN' | 'TIDAK_TAHU' | ''; // 3. Legalitas izin agen
    recruiterName?: string; // 4a. Nama perekrut / PT Agen
    recruiterPhone?: string; // 4b. No telepon kontak perekrut
    recruiterAddress?: string; // 4c. Alamat kantor agen
    isHoused?: boolean | null; // 5a. Apakah ditampung sebelum berangkat?
    housingLocation?: string; // 5b. Lokasi tempat penampungan
    housingCondition?: 'LAYAK' | 'KURANG_LAYAK' | 'TIDAK_LAYAK' | string; // 5c. Kondisi tempat penampungan
    feeOrDeduction?: string; // 6. Biaya perekrutan / skema potongan uang muka
    notes?: string; // 7. Catatan khusus perekrutan pekerja ini
  }>;
  recruitmentVacantJobInfo?: string; // a. Informasi lowongan kerja (sumber info, perantara, dsb)
  recruitmentRecruiterType?: 'PERUSAHAAN' | 'NAHKODA' | 'PEMILIK_KAPAL' | 'MANDIRI' | 'AGEN' | ''; // b. Pilihan pihak perekrut
  recruitmentAgentLicenseStatus?: 'BERIZIN' | 'TIDAK_BERIZIN' | ''; // Pilihan agen berizin / agen tidak berizin
  recruitmentRecruiterName?: string; // Nama perekrut
  recruitmentRecruiterAddress?: string; // Alamat perekrut
  recruitmentRecruiterPhone?: string; // No telepon / kontak perekrut
  recruitmentIsHoused?: boolean | null; // c. Mekanisme perekrutan: Apakah ditampung sebelum berangkat?
  recruitmentHousingLocation?: string; // Lokasi / alamat penampungan jika ditampung
  recruitmentHousingCondition?: string; // Kondisi tempat penampungan
  recruitmentFeeOrDeduction?: string; // Biaya rekrutmen / pungutan awal jika ada
  recruitmentOtherInfo?: string; // Informasi lainnya seputar mekanisme perekrutan

  // IX. INTEGRITAS & RED FLAGS KERJA PAKSA (Indikator 18 & 19 Khusus)
  identityHoldVerified?: boolean; // Konfirmasi verifikasi pengawas: Bebas Penahanan Dokumen Asli ABK (Indikator 18)
  arbitraryDeductionVerified?: boolean; // Konfirmasi verifikasi pengawas: Bebas Pemotongan Upah Liar / Jeratan Utang (Indikator 19)
  integrityVerified?: boolean; // Konfirmasi umum verifikasi integritas oleh pengawas
  freedomFromForcedLaborConfirmed?: boolean;
  identityHoldFlag?: boolean; // Terindikasi Penahanan Dokumen Asli ABK (Red Flag Kritis)
  arbitraryDeductionFlag?: boolean; // Terindikasi Pemotongan Upah Liar / Jeratan Utang (Red Flag Kritis)
  additionalNotes?: string; // Catatan Tambahan Pengawas
  officialRecommendations?: string; // Rekomendasi Resmi Pengawas

  // Catatan Khusus Pemeriksa per Indikator & Bagian
  noteSection1?: string;
  noteIndicatorWlkp?: string;
  noteIndicator8?: string;
  noteIndicator9?: string;
  noteIndicator10?: string;
  noteIndicator11?: string;
  noteIndicator12?: string;
  noteIndicator13?: string;
  noteIndicator14?: string;
  noteIndicator15?: string;
  noteIndicator16?: string;
  noteIndicator16b?: string;
  noteIndicator16c?: string;
  noteIndicator16d?: string;
  noteIndicator17?: string; // Catatan Lama Rencana Melaut
  noteIndicator18?: string; // Catatan APD
  noteIndicator19?: string; // Catatan APAR
  noteIndicator20?: string; // Catatan Kotak Obat
  noteIndicator21?: string; // Catatan Obat-Obatan
  noteIndicator22?: string; // Catatan Keluhan Kesehatan
  noteIndicator23?: string; // Catatan Indikator 23 (Catatan Nahkoda / Insiden)
  noteIndicator24?: string; // Catatan Pemagangan & Pekerja Anak
  noteIndicator25?: string; // Catatan Sertifikat BST-F & Dokumen Pelaut
  noteIndicatorRecruitment?: string; // Catatan Sistem Perekrutan

  // Tanda Tangan & Pengesahan
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

export interface FieldChange {
  field: string;
  label: string;
  category?: 'Profil Kapal' | 'Dokumen & Legalitas' | 'PKL & Upah' | 'K3 & Keselamatan' | 'Akomodasi & Pangan' | 'Asuransi & Jaminan Sosial' | 'Kesehatan & P3K' | 'Status & Rekomendasi' | 'Tim Pengawas' | 'Lainnya';
  oldValue: any;
  newValue: any;
  oldDisplay: string;
  newDisplay: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string with complete date and time
  updatedBy: string; // user email / inspector
  actionType: 'CREATE_INSPECTION' | 'UPDATE_INSPECTION' | 'STATUS_CHANGE' | 'EDIT_VESSEL';
  title: string;
  summary?: string;
  changes: FieldChange[];
  previousSnapshot?: {
    riskScore?: number;
    riskLevel?: RiskLevel;
    followUpStatus?: FollowUpStatus;
    totalCrew?: number;
    inspectionDate?: string;
    inspectionPort?: string;
  };
}

export interface InspectionRecord {
  id: string;
  vesselId: string;
  vesselName: string;
  registrationNumber: string;
  fisheriesRegisterNumber?: string; // No. Register Kapal Perikanan
  homePort: string;
  secondaryHomePort?: string;
  inspectionDate: string;
  inspectionPort: string;
  leadAgency: string; // e.g. 'PSDKP - KKP', 'Pengawas Ketenagakerjaan Kemnaker', 'Syahbandar KSOP', 'Tim Pengawas Gabungan'
  inspectors: string; // Nama pengawas gabungan
  crewData: CrewComplianceData;
  checklistData?: OfficialChecklistForm; // Formulir Daftar Periksa Lengkap
  previousChecklistData?: OfficialChecklistForm; // Isian formulir sebelum update terakhir
  violations: InspectionViolation[];
  riskEvaluation: RiskBreakdown;
  followUpStatus: FollowUpStatus;
  officialNotes: string;
  actionDeadline?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string; // Tanggal & Waktu update terakhir
  changeLogs?: AuditLogEntry[]; // Riwayat log perubahan per isian
}

export interface InspectionDraft {
  vesselId: string;
  vesselName: string;
  form: OfficialChecklistForm;
  savedAt: string;
  updatedBy?: string;
}

export interface Vessel {
  id: string;
  name: string;
  registrationNumber: string; // No. SIPI / SIUP / Tanda Selar
  fisheriesRegisterNumber?: string; // No. Register Kapal Perikanan (Unik / Anti-Duplikasi Buku Kapal Nasional)
  grossTonnage: number; // GT
  callSign: string;
  ownerName: string;
  ownerAddress?: string; // Alamat Pemilik
  captainName?: string; // Nama Nahkoda / Tekong
  agentName?: string;
  homePort: string;
  secondaryHomePort?: string; // Pelabuhan Pangkalan 2 (Kedua / Sekunder)
  fishingGround?: string; // Daerah Penangkapan Ikan (WPPNRI)
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

