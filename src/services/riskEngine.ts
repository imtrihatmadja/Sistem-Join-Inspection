import {
  CrewComplianceData,
  InspectionViolation,
  RiskBreakdown,
  RiskLevel,
  ViolationCategory,
  OfficialChecklistForm
} from '../types';

export const STANDARD_VIOLATIONS: ViolationCategory[] = [
  {
    id: 'VIO-DOC-01',
    category: 'DOCUMENTATION',
    title: 'ABK Tidak Memiliki Perjanjian Kerja Laut (PKL)',
    severity: 'CRITICAL',
    scoreWeight: 25,
    description: 'Sebagian atau seluruh awak kapal bekerja tanpa kontrak kerja tertulis yang disahkan Syahbandar.'
  },
  {
    id: 'VIO-DOC-02',
    category: 'DOCUMENTATION',
    title: 'PKL Tidak Standar / Klausul Tidak Jelas',
    severity: 'MODERATE',
    scoreWeight: 12,
    description: 'PKL ada namun tidak memuat klausul hak upah, asuransi, atau repatriasi sesuai Permen KP & ILO C188.'
  },
  {
    id: 'VIO-DOC-03',
    category: 'DOCUMENTATION',
    title: 'Buku Pelaut / Sertifikat BST Kedaluwarsa',
    severity: 'MINOR',
    scoreWeight: 5,
    description: 'Kelengkapan sertifikat kompetensi atau buku pelaut ABK telah habis masa berlaku atau belum diperbarui.'
  },
  {
    id: 'VIO-WAGE-01',
    category: 'WAGES',
    title: 'Penahanan Upah atau Pemotongan Ilegal',
    severity: 'CRITICAL',
    scoreWeight: 30,
    description: 'Terdapat indikasi penahanan gaji, uang jaminan tidak sah, atau sistem bagi hasil tidak transparan.'
  },
  {
    id: 'VIO-WAGE-02',
    category: 'WAGES',
    title: 'Upah Pokok di Bawah Standar Minimum',
    severity: 'MODERATE',
    scoreWeight: 15,
    description: 'Nominal upah bulanan atau bonus tidak memenuhi kesepakatan upah minimum sektoral kelautan.'
  },
  {
    id: 'VIO-HRS-01',
    category: 'WORKING_HOURS',
    title: 'Jam Kerja Ekstrem / Jam Istirahat Kurang dari 10 Jam',
    severity: 'CRITICAL',
    scoreWeight: 20,
    description: 'ABK dipaksa bekerja terus menerus tanpa waktu istirahat yang memadai (minimal 10 jam dalam periode 24 jam).'
  },
  {
    id: 'VIO-FL-01',
    category: 'FORCED_LABOR_INDICATOR',
    title: 'Penahanan Dokumen Identitas (KTP/Buku Pelaut/Ijazah)',
    severity: 'CRITICAL',
    scoreWeight: 35,
    description: 'Dokumen asli ABK ditahan secara sepihak oleh pemilik kapal/agen tanpa persetujuan untuk membatasi pergerakan.'
  },
  {
    id: 'VIO-K3-01',
    category: 'SAFETY_HEALTH',
    title: 'Ketiadaan Jaminan Sosial / BPJS Ketenagakerjaan',
    severity: 'CRITICAL',
    scoreWeight: 25,
    description: 'Seluruh atau mayoritas ABK tidak diikutsertakan dalam program jaminan kecelakaan kerja & kematian.'
  },
  {
    id: 'VIO-K3-02',
    category: 'SAFETY_HEALTH',
    title: 'Fasilitas Akomodasi, Makanan & Air Bersih Tidak Layak',
    severity: 'MODERATE',
    scoreWeight: 15,
    description: 'Ruang tidur lembap/kotor, stok air tawar bersih tidak mencukupi, atau makanan tidak bergizi selama melaut.'
  },
  {
    id: 'VIO-K3-03',
    category: 'SAFETY_HEALTH',
    title: 'Perlengkapan P3K & Alat Pelindung Diri (APD) Kurang',
    severity: 'MINOR',
    scoreWeight: 6,
    description: 'Kotak P3K kedaluwarsa atau perlengkapan keselamatan kerja (lifejacket, sepatu, sarung tangan) tidak lengkap.'
  }
];

export function calculateVesselRisk(
  crewData: CrewComplianceData,
  violations: InspectionViolation[],
  priorInspectionsCount: number = 0,
  priorHighRiskHistory: boolean = false
): RiskBreakdown {
  const primaryRiskFactors: string[] = [];
  let docPenalty = 0;
  let welfarePenalty = 0;
  let violationPenalty = 0;
  let historicalPenalty = 0;

  const totalCrew = Math.max(1, crewData.totalCrew);

  // 1. Hitung penalti kepatuhan dokumen ketenagakerjaan
  const pklRatio = crewData.crewWithPkl / totalCrew;
  if (pklRatio < 0.5) {
    docPenalty += 20;
    primaryRiskFactors.push(`Lebih dari 50% ABK (${totalCrew - crewData.crewWithPkl} orang) belum memiliki PKL sah.`);
  } else if (pklRatio < 1.0) {
    docPenalty += 10;
    primaryRiskFactors.push(`Sebagian ABK (${totalCrew - crewData.crewWithPkl} orang) belum tercatat memiliki PKL.`);
  }

  const insuranceRatio = crewData.crewWithInsurance / totalCrew;
  if (insuranceRatio < 0.5) {
    docPenalty += 15;
    primaryRiskFactors.push(`Kepesertaan BPJS Ketenagakerjaan / Asuransi Awak Kapal sangat rendah (${Math.round(insuranceRatio * 100)}%).`);
  } else if (insuranceRatio < 1.0) {
    docPenalty += 8;
  }

  const bstRatio = crewData.crewWithBst / totalCrew;
  if (bstRatio < 0.8) {
    docPenalty += 8;
    primaryRiskFactors.push('Kepatuhan sertifikasi keselamatan dasar (BST-F) ABK di bawah 80%.');
  }

  // 2. Kesejahteraan, K3 & Indikator Kerja Paksa
  if (crewData.identityHoldFlag) {
    welfarePenalty += 35;
    primaryRiskFactors.push('⚠️ Indikasi Penahanan Dokumen Asli Awak Kapal oleh pihak kapal/agen (Red Flag Ketenagakerjaan).');
  }

  if (!crewData.hasFairWageAgreement) {
    welfarePenalty += 15;
    primaryRiskFactors.push('Sistem pengupahan/bagi hasil tidak transparan atau ada keluhan pemotongan.');
  }

  if (!crewData.hasProperRestHours) {
    welfarePenalty += 12;
    primaryRiskFactors.push('Pengaturan jam kerja tidak memenuhi standar istirahat minimum 10 jam per hari.');
  }

  if (!crewData.hasAdequateFoodWater) {
    welfarePenalty += 10;
    primaryRiskFactors.push('Fasilitas akomodasi, sanitasi, dan ketersediaan air bersih kapal tidak memadai.');
  }

  if (!crewData.hasFirstAidKits) {
    welfarePenalty += 6;
  }

  // 3. Penalti dari daftar temuan pelanggaran spesifik
  violations.forEach((v) => {
    if (v.severity === 'CRITICAL') {
      violationPenalty += (v.scoreWeight || 25);
    } else if (v.severity === 'MODERATE') {
      violationPenalty += (v.scoreWeight || 12);
    } else {
      violationPenalty += (v.scoreWeight || 5);
    }
  });

  // 4. Riwayat historis
  if (priorHighRiskHistory) {
    historicalPenalty += 10;
    primaryRiskFactors.push('Kapal memiliki catatan rekam jejak pelanggaran pada inspeksi sebelumnya.');
  } else if (priorInspectionsCount > 0 && violations.length > 2) {
    historicalPenalty += 5;
  }

  // Total Skor Risiko dihitung (maks 100, min 0)
  const rawScore = docPenalty + welfarePenalty + violationPenalty + historicalPenalty;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Klasifikasi Tingkat Risiko
  let riskLevel: RiskLevel = 'LOW';
  let recommendation = '';
  let actionRequired = '';

  if (finalScore >= 65 || crewData.identityHoldFlag || violations.some(v => v.severity === 'CRITICAL' && v.scoreWeight >= 30)) {
    riskLevel = 'HIGH';
    recommendation = 'Rekomendasi Penundaan Penerbitan SPB (Surat Persetujuan Berlayar) & Pemanggilan Resmi Pemilik/Agen.';
    actionRequired = 'Investigasi mendalam oleh Tim Pengawas Gabungan (PSDKP, Disnaker, KSOP). Wajib menyelesaikan perbaikan hak ABK sebelum keberangkatan.';
  } else if (finalScore >= 30 || violations.length > 0) {
    riskLevel = 'MEDIUM';
    recommendation = 'Penerbitan Surat Peringatan Kepatuhan Ketenagakerjaan & Verifikasi Berkas Bersyarat.';
    actionRequired = 'Pemilik kapal diberikan tenggat waktu 7-14 hari kerja untuk melengkapi dokumen PKL, asuransi, dan pembenahan fasilitas K3.';
  } else {
    riskLevel = 'LOW';
    recommendation = 'Lolos Verifikasi Kepatuhan Ketenagakerjaan Awak Kapal (Rekomendasi Layak Melaut).';
    actionRequired = 'Pencatatan rutin dalam database inspeksi pelabuhan dan monitoring berkala saat sandar berikutnya.';
  }

  if (primaryRiskFactors.length === 0) {
    primaryRiskFactors.push('Seluruh dokumen ketenagakerjaan, PKL, dan standar K3 awak kapal terpantau terpenuhi secara baik.');
  }

  return {
    score: finalScore,
    riskLevel,
    documentScorePenalty: docPenalty,
    welfareScorePenalty: welfarePenalty,
    violationScorePenalty: violationPenalty,
    historicalPenalty,
    primaryRiskFactors,
    recommendation,
    actionRequired
  };
}

/**
 * Calculates compliance and risk score directly from the Official Joint Labor Inspection Checklist
 * (TIM PENGAWASAN BERSAMA NORMA KETENAGAKERJAAN DI ATAS KAPAL IKAN)
 * 
 * 19 Indikator Kepatuhan Resmi:
 * 1. 11. Wajib Lapor Ketenagakerjaan Perusahaan (WLKP)
 * 2. 8. Kepemilikan Dokumen PKL oleh Awak Kapal
 * 3. 9. Salinan PKL Dipegang oleh Awak Kapal
 * 4. 10. Sistem Pengupahan Awak Kapal
 * 5. 11. Jaminan Upah Minimum & Slip Upah Resmi
 * 6. 12. Kepesertaan BPJS Ketenagakerjaan Awak Kapal
 * 7. 13. Kepesertaan BPJS Kesehatan / Asuransi Tambahan
 * 8. 16.a Jam Istirahat Terpenuhi (Min. 10 Jam/Hari)
 * 9. 16.b Pasokan Air Bersih & Minum Memadai
 * 10. 16.c Ketersediaan Bahan Makanan Layak
 * 11. 16.d Kondisi Kamar Tidur / Sanitasi Bersih
 * 12. 18. Jenis Alat Pelindung Diri (APD) yang Tersedia
 * 13. 19. Alat Pemadam Api Ringan (APAR)
 * 14. 20. Kotak Obat (P3K Fisik)
 * 15. 21. Obat-Obatan P3K Maritim
 * 16. 23. Catatan Nahkoda (Pencatatan Kecelakaan Kerja & Insiden)
 * 17. 24. Fasilitasi Siswa Magang & Bebas Pekerja Anak
 * 18. Indikator Khusus: Terindikasi Penahanan Dokumen Asli Awak Kapal (Bebas & Terverifikasi)
 * 19. Indikator Khusus: Terindikasi Pemotongan Upah Liar / Jeratan Utang (Bebas & Terverifikasi)
 */
export function calculateRiskFromOfficialChecklist(form: any): {
  riskEvaluation: RiskBreakdown;
  violations: InspectionViolation[];
  crewData: CrewComplianceData;
  complianceRate: number;
  completedItemsCount: number;
  totalItemsCount: number;
} {
  const violations: InspectionViolation[] = [];
  const primaryRiskFactors: string[] = [];
  const totalItemsCount = 19; // Tepat 19 Indikator kepatuhan resmi
  let completedItemsCount = 0;

  const totalCrew = Math.max(0, form.totalCrewCount || (form.crewMaleCount || 0) + (form.crewFemaleCount || 0) || 0);

  // -------------------------------------------------------------
  // 1. Wajib Lapor Ketenagakerjaan Perusahaan (WLKP) (Indikator 1)
  // -------------------------------------------------------------
  if (form.hasWlkp === true || form.wlkpStatus === 'ADA') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 1 (WLKP): Perusahaan pemilik belum memiliki bukti Lapor WLKP aktif.');
    if (form.hasWlkp === false) {
      violations.push({
        categoryId: 'VIO-DOC-WLKP',
        categoryName: 'DOCUMENTATION',
        title: 'Ketiadaan Wajib Lapor Ketenagakerjaan (WLKP)',
        severity: 'MODERATE',
        scoreWeight: 10,
        notes: 'Perusahaan pemilik kapal belum memiliki bukti pendaftaran WLKP online aktif.'
      });
    }
  }

  // -------------------------------------------------------------
  // 2. Kepemilikan Dokumen PKL oleh Awak Kapal (Indikator 8)
  // -------------------------------------------------------------
  if (form.hasPklAgreement === true || form.pklStatus === 'SEMUA_BER_PKL') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 2 (PKL): Awak kapal belum memiliki Perjanjian Kerja Laut (PKL) resmi.');
    if (form.hasPklAgreement === false || form.pklStatus === 'TIDAK_ADA_PKL') {
      violations.push({
        categoryId: 'VIO-DOC-01',
        categoryName: 'DOCUMENTATION',
        title: 'ABK Tidak Memiliki Perjanjian Kerja Laut (PKL)',
        severity: 'CRITICAL',
        scoreWeight: 25,
        notes: 'Awak kapal bekerja tanpa kontrak PKL tertulis yang disahkan Syahbandar.'
      });
    }
  }

  // -------------------------------------------------------------
  // 3. Salinan PKL Dipegang oleh Awak Kapal (Indikator 9)
  // -------------------------------------------------------------
  if (form.pklHeldByCrew === true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 3: Salinan asli PKL tidak dipegang langsung oleh awak kapal.');
    if (form.pklHeldByCrew === false) {
      violations.push({
        categoryId: 'VIO-DOC-PKLHELD',
        categoryName: 'DOCUMENTATION',
        title: 'Salinan PKL Tidak Dipegang oleh Awak Kapal',
        severity: 'MODERATE',
        scoreWeight: 10,
        notes: 'Salinan PKL ditahan oleh pengurus/agen perkapalan.'
      });
    }
  }

  // -------------------------------------------------------------
  // 4. Sistem Pengupahan Awak Kapal (Indikator 10)
  // -------------------------------------------------------------
  if (form.pklWageScheme && form.pklWageScheme.trim() !== '') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 4: Sistem pengupahan (gaji pokok/bagi hasil) belum disepakati.');
  }

  // -------------------------------------------------------------
  // 5. Jaminan Upah Minimum & Slip Upah Resmi (Indikator 11)
  // -------------------------------------------------------------
  const hasValidWageProof = (
    form.wageProofType === 'SLIP_UPAH' ||
    form.wageProofType === 'PERHITUNGAN_TERTULIS' ||
    form.hasSalarySlips === true ||
    form.hasWrittenCalculation === true ||
    form.hasProductionSharingProof === true
  ) && form.wageProofType !== 'TIDAK_ADA' && form.noWageProof !== true;

  if (hasValidWageProof && form.hasWageDeductions !== true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 5: Belum ada bukti slip upah resmi/perhitungan tertulis.');
    if (form.hasWageDeductions === true) {
      violations.push({
        categoryId: 'VIO-WAGE-01',
        categoryName: 'WAGES',
        title: 'Pemotongan Upah Sepihak / Tidak Wajar',
        severity: 'CRITICAL',
        scoreWeight: 20,
        notes: 'Terdapat potongan liar di luar kesepakatan tertulis.'
      });
    }
  }

  // -------------------------------------------------------------
  // 6. Kepesertaan BPJS Ketenagakerjaan Awak Kapal (Indikator 12)
  // -------------------------------------------------------------
  if (form.hasBpjsKetenagakerjaan === true || form.bpjsTkProgram === 'PU_4_PROGRAM' || form.bpjsTkProgram === 'PU_3_PROGRAM' || form.bpjsTkProgram === 'BPU_2_PROGRAM') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 6 (BPJS TK): Awak kapal belum terdaftar aktif dalam BPJS Ketenagakerjaan.');
    if (form.hasBpjsKetenagakerjaan === false) {
      violations.push({
        categoryId: 'VIO-K3-01',
        categoryName: 'SAFETY_HEALTH',
        title: 'Ketiadaan BPJS Ketenagakerjaan ABK',
        severity: 'CRITICAL',
        scoreWeight: 25,
        notes: 'ABK tidak memiliki perlindungan Jaminan Kecelakaan Kerja (JKK) dan Jaminan Kematian (JKM).'
      });
    }
  }

  // -------------------------------------------------------------
  // 7. Kepesertaan BPJS Kesehatan / Asuransi Tambahan (Indikator 13)
  // -------------------------------------------------------------
  if (form.hasBpjsKesehatan === true || form.hasPrivateInsurance === true || form.bpjsKesStatus === 'AKTIF_SEMUA') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 7: Belum terdaftar dalam BPJS Kesehatan atau asuransi maritim aktif.');
  }

  // -------------------------------------------------------------
  // 8. 16.a Jam Istirahat Terpenuhi (Min. 10 Jam/Hari)
  // -------------------------------------------------------------
  if (form.dailyRestHoursCompliant === true || (Number(form.restHoursPerDay) >= 10 && form.dailyRestHoursCompliant !== false)) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 8 (16.a): Jam istirahat harian belum memenuhi standar minimum 10 jam/hari.');
  }

  // -------------------------------------------------------------
  // 9. 16.b Pasokan Air Bersih & Minum Memadai
  // -------------------------------------------------------------
  if (form.hasCleanWaterAccess === true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 9 (16.b): Pasokan air bersih dan air minum di atas kapal belum memadai.');
  }

  // -------------------------------------------------------------
  // 10. 16.c Ketersediaan Bahan Makanan Layak
  // -------------------------------------------------------------
  if (form.hasSufficientFoodSupply === true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 10 (16.c): Ketersediaan pasokan bahan makanan layak laut belum mencukupi.');
  }

  // -------------------------------------------------------------
  // 11. 16.d Kondisi Kamar Tidur / Sanitasi Bersih
  // -------------------------------------------------------------
  if (form.hasAdequateAccommodation === true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 11 (16.d): Kondisi akomodasi kamar tidur / sanitasi kapal belum bersih dan layak.');
  }

  // -------------------------------------------------------------
  // 12. 18. Jenis Alat Pelindung Diri (APD) yang Tersedia
  // -------------------------------------------------------------
  const hasValidPpe = form.hasPpeAvailable === true || form.hasLifeJacketsAvailable === true || (Number(form.lifeJacketCount) > 0 && form.hasLifeJacketsAvailable !== false);
  if (hasValidPpe) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 12 (18. APD): Perlengkapan APD / Pelampung keselamatan belum mencukupi.');
  }

  // -------------------------------------------------------------
  // 13. 19. Alat Pemadam Api Ringan (APAR)
  // -------------------------------------------------------------
  if (form.hasFireExtinguisherApar === true || form.aparPowderChecked === true || form.aparCo2Checked === true || form.aparFoamChecked === true || form.aparOtherChecked === true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 13 (19. APAR): Alat Pemadam Api Ringan tidak tersedia atau kondisi kadaluarsa/rusak.');
  }

  // -------------------------------------------------------------
  // 14. 20. Kotak Obat (P3K Fisik)
  // -------------------------------------------------------------
  if (form.hasFirstAidBox === true || (form.hasFirstAidKit === true && form.firstAidBoxCondition !== 'TIDAK_LAYAK')) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 14 (20. Kotak P3K): Kotak obat fisik tidak tersedia atau rusak/tidak layak.');
  }

  // -------------------------------------------------------------
  // 15. 21. Obat-Obatan P3K Maritim
  // -------------------------------------------------------------
  if (form.hasFirstAidMedicines === true || form.firstAidAvailable === 'LENGKAP') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 15 (21. Obat P3K): Stok obat-obatan P3K maritim tidak lengkap / kadaluarsa.');
  }

  // -------------------------------------------------------------
  // 16. 23. Catatan Nahkoda (Pencatatan Kecelakaan Kerja & Insiden)
  // -------------------------------------------------------------
  if (form.hasAccidentLog === true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 16 (23. Catatan Nahkoda): Catatan nahkoda terkait pencatatan kecelakaan kerja & insiden belum disediakan.');
  }

  // -------------------------------------------------------------
  // 17. 24. Fasilitasi Siswa Magang & Bebas Pekerja Anak
  // -------------------------------------------------------------
  const isMagangVerified = (form.hasApprenticeOrStudents === false) || 
    (form.hasApprenticeOrStudents === true && form.apprenticeHasContract === true && form.apprenticeUnderAge !== true);

  if (isMagangVerified) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 17 (24. Magang/Anak): Status pemagangan atau perlindungan pekerja anak belum diverifikasi.');
    if (form.apprenticeUnderAge === true) {
      violations.push({
        categoryId: 'VIO-CHILD-01',
        categoryName: 'FORCED_LABOR_INDICATOR',
        title: 'Indikasi Pekerja Anak di Bawah Umur',
        severity: 'CRITICAL',
        scoreWeight: 30,
        notes: 'Terdapat awak kapal di bawah usia 18 tahun di pekerjaan berbahaya.'
      });
    }
  }

  // -------------------------------------------------------------
  // 18. Indikator Khusus: Terindikasi Penahanan Dokumen Asli Awak Kapal
  // Wajib diverifikasi pengawas dan bebas dari pelanggaran penahanan dokumen
  // -------------------------------------------------------------
  const isIdentityHoldVerified = (form.identityHoldVerified === true || form.integrityVerified === true || form.freedomFromForcedLaborConfirmed === true) && 
    form.identityHoldFlag !== true;

  if (isIdentityHoldVerified) {
    completedItemsCount++;
  } else {
    if (form.identityHoldFlag === true) {
      primaryRiskFactors.push('Indikator 18 (Khusus): Terindikasi penahanan dokumen identitas/ijazah asli awak kapal.');
    } else {
      primaryRiskFactors.push('Indikator 18 (Khusus): Verifikasi kebebasan penahanan dokumen asli belum dikonfirmasi pengawas.');
    }
  }

  // -------------------------------------------------------------
  // 19. Indikator Khusus: Terindikasi Pemotongan Upah Liar / Jeratan Utang
  // Wajib diverifikasi pengawas dan bebas dari pemotongan sepihak / jeratan utang
  // -------------------------------------------------------------
  const isWageDeductionVerified = (form.arbitraryDeductionVerified === true || form.integrityVerified === true || form.freedomFromForcedLaborConfirmed === true) && 
    form.arbitraryDeductionFlag !== true;

  if (isWageDeductionVerified) {
    completedItemsCount++;
  } else {
    if (form.arbitraryDeductionFlag === true) {
      primaryRiskFactors.push('Indikator 19 (Khusus): Terindikasi pemotongan upah sepihak / jeratan utang.');
    } else {
      primaryRiskFactors.push('Indikator 19 (Khusus): Verifikasi kebebasan potongan upah liar/jeratan utang belum dikonfirmasi pengawas.');
    }
  }

  // -------------------------------------------------------------
  // PERHITUNGAN SKOR KEPATUHAN & SKOR RISIKO PROPORSIONAL (19 INDIKATOR)
  // -------------------------------------------------------------
  
  // Nilai Kepatuhan (%) = (completedItemsCount / 19) * 100
  const complianceRatio = Math.max(0, Math.min(1, completedItemsCount / totalItemsCount));
  const complianceRate = Math.round(complianceRatio * 100);

  // Skor Risiko (0 - 100): Jika Kepatuhan 0/19 (0%), Skor Risiko = 100 (HIGH). Jika Kepatuhan 19/19 (100%), Skor Risiko = 0 (LOW).
  let riskScore = 100 - complianceRate;

  // Jika ada Red Flag Kritis (Penahanan Dokumen Asli atau Pekerja Anak)
  const hasFatalRedFlag = form.identityHoldFlag === true || form.apprenticeUnderAge === true;
  if (hasFatalRedFlag) {
    riskScore = Math.max(riskScore, 75);
    if (form.identityHoldFlag === true) {
      violations.push({
        categoryId: 'VIO-FL-01',
        categoryName: 'FORCED_LABOR_INDICATOR',
        title: 'Penahanan Dokumen Identitas Awak Kapal',
        severity: 'CRITICAL',
        scoreWeight: 35,
        notes: 'Dokumen asli ABK ditahan secara sepihak untuk membatasi kebebasan bergerak.'
      });
    }
  }

  let riskLevel: RiskLevel = 'LOW';
  let recommendation = '';
  let actionRequired = '';

  if (complianceRate < 50 || riskScore >= 55 || hasFatalRedFlag) {
    riskLevel = 'HIGH';
    recommendation = 'Rekomendasi Penundaan SPB (Surat Persetujuan Berlayar) & Pemanggilan Resmi Pemilik Kapal.';
    actionRequired = `Tingkat kepatuhan ${complianceRate}% (${completedItemsCount}/${totalItemsCount} indikator kepatuhan terpenuhi). Tim Pengawas Gabungan merekomendasikan penundaan SPB hingga PKL, jaminan sosial, dan K3 dipenuhi.`;
  } else if (complianceRate < 80 || riskScore >= 25 || violations.length > 0) {
    riskLevel = 'MEDIUM';
    recommendation = 'Penerbitan Nota Pemeriksaan Kepatuhan I dengan Tenggat Perbaikan 14 Hari.';
    actionRequired = `Tingkat kepatuhan ${complianceRate}% (${completedItemsCount}/${totalItemsCount} indikator kepatuhan terpenuhi). Pemilik kapal diberikan waktu 14 hari kerja untuk melengkapi indikator yang belum terpenuhi.`;
  } else {
    riskLevel = 'LOW';
    recommendation = 'Kapal Memenuhi Standar Norma Ketenagakerjaan & K3 (Rekomendasi Terbit SPB).';
    actionRequired = `Tingkat kepatuhan ${complianceRate}% (${completedItemsCount}/${totalItemsCount} indikator kepatuhan terpenuhi). Tidak ada pelanggaran kritis yang menghambat operasional pelayaran.`;
  }

  if (primaryRiskFactors.length === 0) {
    primaryRiskFactors.push('Seluruh 19 indikator kepatuhan norma ketenagakerjaan dan K3 telah terpenuhi dengan baik (100% Kepatuhan).');
  }

  const bstCount = form.crewWithBstCount ?? 0;
  const seamanCount = form.crewWithSeamanBookCount ?? 0;
  const isPklFullyCompliant = form.hasPklAgreement === true || form.pklStatus === 'SEMUA_BER_PKL';

  const crewData: CrewComplianceData = {
    totalCrew,
    crewWithPkl: isPklFullyCompliant ? totalCrew : 0,
    crewWithInsurance: form.hasBpjsKetenagakerjaan ? totalCrew : 0,
    crewWithSeamanBook: seamanCount,
    crewWithBst: bstCount,
    hasFairWageAgreement: form.hasWageDeductions !== true && form.arbitraryDeductionFlag !== true,
    hasProperRestHours: form.dailyRestHoursCompliant === true || Number(form.restHoursPerDay) >= 10,
    hasAdequateFoodWater: form.hasCleanWaterAccess === true && form.hasSufficientFoodSupply === true,
    hasFirstAidKits: (form.hasFirstAidBox === true || form.hasFirstAidMedicines === true || form.hasFirstAidKit === true) && (form.hasLifeJacketsAvailable === true || form.hasPpeAvailable === true),
    identityHoldFlag: !!form.identityHoldFlag
  };

  const riskEvaluation: RiskBreakdown = {
    score: riskScore, // 0 - 100
    riskLevel,
    documentScorePenalty: Math.round((1 - (completedItemsCount / totalItemsCount)) * 50),
    welfareScorePenalty: Math.round((1 - (completedItemsCount / totalItemsCount)) * 30),
    violationScorePenalty: Math.round((1 - (completedItemsCount / totalItemsCount)) * 20),
    historicalPenalty: 0,
    primaryRiskFactors,
    recommendation,
    actionRequired
  };

  return {
    riskEvaluation,
    violations,
    crewData,
    complianceRate,
    completedItemsCount,
    totalItemsCount
  };
}

export function getRiskColor(level: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  label: string;
} {
  switch (level) {
    case 'HIGH':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badgeBg: 'bg-red-100 text-red-700 border-red-200',
        label: 'Risiko Tinggi'
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badgeBg: 'bg-orange-100 text-orange-700 border-orange-200',
        label: 'Risiko Sedang'
      };
    case 'LOW':
    default:
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badgeBg: 'bg-green-100 text-green-700 border-green-200',
        label: 'Risiko Rendah (Patuh)'
      };
  }
}
