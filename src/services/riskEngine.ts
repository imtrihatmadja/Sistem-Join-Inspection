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
 * Calculates compliance and risk score directly from the 22 items of the Official Joint Labor Inspection Checklist
 * (TIM PENGAWASAN BERSAMA NORMA KETENAGAKERJAAN DI ATAS KAPAL IKAN - 22 INDIKATOR DAFTAR PERIKSA)
 * 
 * Rumus:
 * - Total Item Checklist = 22 Indikator
 * - Setiap indikator yang terisi & patuh bernilai 1 poin (100% / 22 ≈ 4.545% per item).
 * - Skor Kepatuhan (%) = (Jumlah Item Patuh / 22) * 100%
 * - Skor Risiko = 100 - Skor Kepatuhan (atau penyesuaian Red Flags)
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
  const totalItemsCount = 22;
  let completedItemsCount = 0;

  const totalCrew = Math.max(0, form.totalCrewCount || (form.crewMaleCount || 0) + (form.crewFemaleCount || 0) || 0);

  // -------------------------------------------------------------
  // BAGIAN I. DATA UMUM & IDENTITAS KAPAL (Indikator 1 - 7)
  // -------------------------------------------------------------

  // 1. Nama Kapal Perikanan
  if (form.vesselName && form.vesselName.trim() !== '') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 1: Nama kapal perikanan belum diisi.');
  }

  // 2. Tanda Selar / Call Sign
  if ((form.callSign || form.tandaSelar) && (form.callSign || form.tandaSelar).trim() !== '') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 2: Tanda selar / Call Sign kapal belum terisi.');
  }

  // 3. Nomor SIPI / SIUP Kapal
  if ((form.sipiNumber && form.sipiNumber.trim() !== '') || (form.registrationNumber && form.registrationNumber.trim() !== '')) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 3: Dokumen izin penangkapan (SIPI/SIUP) belum terisi.');
  }

  // 4. Pelabuhan Pangkalan
  if (form.homePort && form.homePort.trim() !== '') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 4: Pelabuhan pangkalan kapal belum terisi.');
  }

  // 5. Nama Pemilik / Korporasi
  if (form.ownerName && form.ownerName.trim() !== '') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 5: Nama pemilik kapal / korporasi belum diisi.');
  }

  // 6. Nama Agen Operasional
  if (form.agentName && form.agentName.trim() !== '') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 6: Nama agen operasional perkapalan belum diisi.');
  }

  // 7. Wajib Lapor Ketenagakerjaan Perusahaan (WLKP)
  if (form.hasWlkp === true || form.wlkpStatus === 'ADA') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 7: Perusahaan belum memiliki bukti Lapor WLKP aktif.');
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
  // BAGIAN II. PERJANJIAN KERJA LAUT (PKL) & PENGUPAHAN (Indikator 8 - 11)
  // -------------------------------------------------------------

  // 8. Kepemilikan Dokumen PKL oleh Awak Kapal
  if (form.hasPklAgreement === true || form.pklStatus === 'SEMUA_BER_PKL') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 8: Awak kapal belum memiliki Perjanjian Kerja Laut (PKL) resmi.');
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

  // 9. Salinan PKL Dipegang oleh Awak Kapal
  if (form.pklHeldByCrew === true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 9: Salinan asli PKL tidak dipegang langsung oleh awak kapal.');
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

  // 10. Sistem Pengupahan Awak Kapal (Bulanan / Bagi Hasil / Kombinasi)
  if (form.pklWageScheme && form.pklWageScheme.trim() !== '') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 10: Sistem pengupahan (gaji pokok/bagi hasil) belum ditentukan.');
  }

  // 11. Jaminan Upah Minimum & Bukti Slip Gaji / Bebas Potongan Liar
  if ((form.hasSalarySlips === true || form.hasProductionSharingProof === true) && form.hasWageDeductions !== true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 11: Belum ada slip upah tertulis atau terindikasi potongan tidak wajar.');
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
  // BAGIAN III. JAMINAN SOSIAL KETENAGAKERJAAN & KESEHATAN (Indikator 12 - 13)
  // -------------------------------------------------------------

  // 12. Kepesertaan BPJS Ketenagakerjaan Awak Kapal
  if (form.hasBpjsKetenagakerjaan === true || form.bpjsTkProgram === 'PU_4_PROGRAM' || form.bpjsTkProgram === 'PU_3_PROGRAM' || form.bpjsTkProgram === 'BPU_2_PROGRAM') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 12: Awak kapal belum terdaftar aktif dalam BPJS Ketenagakerjaan.');
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

  // 13. Kepesertaan BPJS Kesehatan / Asuransi Tambahan
  if (form.hasBpjsKesehatan === true || form.hasPrivateInsurance === true || form.bpjsKesStatus === 'AKTIF_SEMUA') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 13: Belum terdaftar dalam BPJS Kesehatan atau asuransi maritim aktif.');
  }

  // -------------------------------------------------------------
  // BAGIAN IV. KONDISI OPERASIONAL & KELAYAKAN FASILITAS (Indikator 14 - 16)
  // -------------------------------------------------------------

  // 14. Jenis Alat Penangkapan Ikan (API) Teridentifikasi
  if ((form.fishingGearType || form.gearType) && (form.fishingGearType || form.gearType).trim() !== '') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 14: Jenis alat penangkapan ikan (API) belum diisi.');
  }

  // 15. Estimasi Hari Melaut per Trip
  if (form.daysAtSeaPerTrip && form.daysAtSeaPerTrip > 0) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 15: Estimasi hari melaut per trip belum ditentukan.');
  }

  // 16. Jam Istirahat Harian Sesuai Standar (Min 10 Jam/Hari - ILO C188) & Fasilitas Layak
  if (form.dailyRestHoursCompliant === true || (form.hasCleanWaterAccess === true && form.hasSufficientFoodSupply === true)) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 16: Jam istirahat atau pasokan fasilitas kapal belum memenuhi standar ILO C188.');
  }

  // -------------------------------------------------------------
  // BAGIAN V. KESELAMATAN & KESEHATAN KERJA (K3) MARITIM (Indikator 17 - 20)
  // -------------------------------------------------------------

  // 17. Ketersediaan Lifejacket / Pelampung Sesuai Jumlah ABK (1:1)
  if (form.hasLifeJacketsAvailable === true || form.ppeAdequacy === 'CUKUP') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 17: Lifejacket/pelampung keselamatan belum mencukupi untuk seluruh ABK.');
  }

  // 18. Alat Pemadam Api Ringan (APAR) Siap Pakai
  if (form.hasFireExtinguisherApar === true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 18: Alat Pemadam Api Ringan (APAR) tidak tersedia / kadaluarsa.');
  }

  // 19. Kotak & Obat-obatan P3K Maritim Lengkap
  if (form.hasFirstAidKit === true || form.firstAidAvailable === 'LENGKAP') {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 19: Kotak P3K atau obat darurat pelayaran belum tersedia lengkap.');
  }

  // 20. Buku Log Pencatatan Insiden & Kecelakaan Kerja
  if (form.hasAccidentLog === true) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 20: Buku log kecelakaan kerja belum disediakan di kapal.');
  }

  // -------------------------------------------------------------
  // BAGIAN VI. FASILITASI MAGANG & LARANGAN PEKERJA ANAK (Indikator 21)
  // -------------------------------------------------------------

  // 21. Fasilitasi Siswa Magang Resmi & Bebas Pekerja Anak (<18 Tahun)
  if (form.hasApprenticeOrStudents === false || (form.hasApprenticeOrStudents === true && form.apprenticeHasContract === true && form.apprenticeUnderAge === false)) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 21: Status pemagangan atau perlindungan pekerja anak belum terverifikasi.');
    if (form.apprenticeUnderAge === true) {
      violations.push({
        categoryId: 'VIO-CHILD-01',
        categoryName: 'FORCED_LABOR_INDICATOR',
        title: 'Indikasi Pekerja Anak di Bawah Umur',
        severity: 'CRITICAL',
        scoreWeight: 30,
        notes: 'Terdapat awak kapal di bawah usia 18 tahun tanpa perlindungan khusus.'
      });
    }
  }

  // -------------------------------------------------------------
  // BAGIAN VII. BUKTI KOMPETENSI AWAK KAPAL (Indikator 22)
  // -------------------------------------------------------------

  // 22. Kepemilikan Sertifikat BST-F / Buku Pelaut / Sertifikasi Kompetensi
  const hasCompetency = (form.competenciesAvailable && form.competenciesAvailable.length > 0 && form.competenciesAvailable.some((c: string) => c.trim() !== '')) ||
    (form.crewWithBstCount && form.crewWithBstCount > 0) ||
    (form.crewWithSeamanBookCount && form.crewWithSeamanBookCount > 0);

  if (hasCompetency) {
    completedItemsCount++;
  } else {
    primaryRiskFactors.push('Indikator 22: Bukti sertifikat kompetensi BST-F atau Buku Pelaut belum terdata.');
  }

  // -------------------------------------------------------------
  // PERHITUNGAN SKOR KEPATUHAN & SKOR RISIKO PROPORSIONAL (22 ITEM)
  // -------------------------------------------------------------
  
  // Nilai Kepatuhan (%) = (completedItemsCount / 22) * 100
  const complianceRatio = Math.max(0, Math.min(1, completedItemsCount / totalItemsCount));
  const complianceRate = Math.round(complianceRatio * 100);

  // Skor Risiko (0 - 100): Jika Kepatuhan 100%, Skor Risiko = 0.
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
    actionRequired = `Tingkat kepatuhan ${complianceRate}% (${completedItemsCount}/${totalItemsCount} indikator terpenuhi). Tim Pengawas Gabungan merekomendasikan penundaan SPB hingga PKL, jaminan sosial, dan K3 dipenuhi.`;
  } else if (complianceRate < 80 || riskScore >= 25 || violations.length > 0) {
    riskLevel = 'MEDIUM';
    recommendation = 'Penerbitan Nota Pemeriksaan Kepatuhan I dengan Tenggat Perbaikan 14 Hari.';
    actionRequired = `Tingkat kepatuhan ${complianceRate}% (${completedItemsCount}/${totalItemsCount} indikator terpenuhi). Pemilik kapal diberikan waktu 14 hari kerja untuk melengkapi indikator yang belum terpenuhi.`;
  } else {
    riskLevel = 'LOW';
    recommendation = 'Kapal Memenuhi Standar Norma Ketenagakerjaan & K3 (Rekomendasi Terbit SPB).';
    actionRequired = `Tingkat kepatuhan ${complianceRate}% (${completedItemsCount}/${totalItemsCount} indikator terpenuhi). Tidak ada pelanggaran kritis yang menghambat operasional pelayaran.`;
  }

  if (primaryRiskFactors.length === 0) {
    primaryRiskFactors.push('Seluruh 22 indikator daftar periksa pengawasan norma ketenagakerjaan telah terpenuhi dengan baik (100% Kepatuhan).');
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
    hasFirstAidKits: form.hasFirstAidKit === true && form.hasLifeJacketsAvailable === true,
    identityHoldFlag: !!form.identityHoldFlag
  };

  const riskEvaluation: RiskBreakdown = {
    score: riskScore, // 0 - 100
    riskLevel,
    documentScorePenalty: Math.round((1 - (completedItemsCount / totalItemsCount)) * 50),
    welfareScorePenalty: Math.round((1 - (completedItemsCount / totalItemsCount)) * 50),
    violationScorePenalty: violations.length * 5,
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
