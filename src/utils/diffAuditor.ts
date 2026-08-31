import { OfficialChecklistForm, FieldChange, AuditLogEntry, InspectionRecord, Vessel } from '../types';

/**
 * Format string display untuk berbagai tipe data
 */
function formatDisplayValue(val: any): string {
  if (val === null || val === undefined || val === '') return '(Kosong / Belum Diisi)';
  if (typeof val === 'boolean') return val ? 'Ya / Terpenuhi' : 'Tidak / Belum Terpenuhi';
  if (Array.isArray(val)) return val.length === 0 ? '(Tidak Ada)' : val.join(', ');
  if (typeof val === 'number') return val.toLocaleString('id-ID');
  return String(val);
}

/**
 * Membandingkan formulir lama dan baru untuk mendeteksi bagian-bagian mana saja yang berubah
 */
export function generateChecklistDiff(
  oldForm: OfficialChecklistForm | undefined,
  newForm: OfficialChecklistForm,
  userEmail: string = 'Pengawas Ketenagakerjaan'
): AuditLogEntry | null {
  if (!oldForm) {
    // Entri awal (Pembuatan Baru)
    return {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      updatedBy: userEmail,
      actionType: 'CREATE_INSPECTION',
      title: 'Pencatatan Inspeksi Baru',
      summary: 'Data formulir checklist awal berhasil disimpan ke database.',
      changes: []
    };
  }

  const changes: FieldChange[] = [];

  // Mapping field dan label komparasi yang komprehensif
  const fieldDefinitions: Array<{
    key: keyof OfficialChecklistForm;
    label: string;
    category: FieldChange['category'];
  }> = [
    // Profil Kapal & Legalitas
    { key: 'vesselName', label: 'Nama Kapal', category: 'Profil Kapal' },
    { key: 'sipiNumber', label: 'No. SIPI / Perizinan', category: 'Profil Kapal' },
    { key: 'grossTonnage', label: 'Gross Tonnage (GT)', category: 'Profil Kapal' },
    { key: 'gearType', label: 'Alat Tangkap', category: 'Profil Kapal' },
    { key: 'homePort', label: 'Pelabuhan Pangkalan 1 (Utama)', category: 'Profil Kapal' },
    { key: 'secondaryHomePort', label: 'Pelabuhan Pangkalan 2 (Tambahan)', category: 'Profil Kapal' },
    { key: 'inspectionLocation', label: 'Lokasi Pelabuhan Inspeksi', category: 'Profil Kapal' },
    { key: 'inspectionDate', label: 'Tanggal Pelaksanaan Inspeksi', category: 'Profil Kapal' },
    { key: 'ownerName', label: 'Nama Pemilik Kapal', category: 'Profil Kapal' },
    { key: 'captainName', label: 'Nama Nahkoda', category: 'Profil Kapal' },
    { key: 'agentName', label: 'Agen Perusahaan', category: 'Profil Kapal' },

    // WLKP
    { key: 'hasWlkp', label: 'Kepemilikan Dokumen WLKP (No. 6)', category: 'Dokumen & Legalitas' },
    { key: 'wlkpNumber', label: 'Nomor WLKP', category: 'Dokumen & Legalitas' },
    { key: 'noteIndicatorWlkp', label: 'Catatan Indikator WLKP', category: 'Dokumen & Legalitas' },

    // Jumlah Awak Kapal
    { key: 'totalCrewCount', label: 'Jumlah Total ABK (No. 7)', category: 'PKL & Upah' },
    { key: 'hasMigrantCrew', label: 'Keberadaan ABK Migran Domestik', category: 'PKL & Upah' },
    { key: 'migrantCrewCount', label: 'Jumlah ABK Migran Domestik', category: 'PKL & Upah' },
    { key: 'hasForeignCrew', label: 'Keberadaan ABK WNA Asing', category: 'PKL & Upah' },
    { key: 'foreignCrewCount', label: 'Jumlah ABK WNA Asing', category: 'PKL & Upah' },

    // PKL & Upah
    { key: 'hasPklAgreement', label: 'Keberadaan Perjanjian Kerja Laut (No. 8)', category: 'PKL & Upah' },
    { key: 'pklStandardFormat', label: 'Format Baku PKL Sesuai Regulasi', category: 'PKL & Upah' },
    { key: 'pklHeldByCrew', label: 'Salinan PKL Dipegang ABK', category: 'PKL & Upah' },
    { key: 'pklWageScheme', label: 'Skema Pengupahan ABK (No. 9)', category: 'PKL & Upah' },
    { key: 'monthlyBasicWage', label: 'Nominal Upah Pokok Bulanan (Rp)', category: 'PKL & Upah' },
    { key: 'profitSharingRatio', label: 'Sistem / Rasio Bagi Hasil', category: 'PKL & Upah' },
    { key: 'hasWageDeductions', label: 'Potongan Upah Liar / Jeratan Hutang (No. 19)', category: 'PKL & Upah' },
    { key: 'minimumWageGuaranteed', label: 'Jaminan Upah Minimum Terpenuhi', category: 'PKL & Upah' },

    // Jaminan Sosial
    { key: 'hasBpjsKetenagakerjaan', label: 'Kepesertaan BPJS Ketenagakerjaan (No. 10)', category: 'Asuransi & Jaminan Sosial' },
    { key: 'bpjsTkProgram', label: 'Program BPJS Ketenagakerjaan', category: 'Asuransi & Jaminan Sosial' },
    { key: 'crewWithBpjsTkCount', label: 'Jumlah ABK Terdaftar BPJS Ketenagakerjaan', category: 'Asuransi & Jaminan Sosial' },
    { key: 'hasBpjsKesehatan', label: 'Kepesertaan BPJS Kesehatan (No. 11)', category: 'Asuransi & Jaminan Sosial' },
    { key: 'bpjsKesStatus', label: 'Status Keaktifan BPJS Kesehatan', category: 'Asuransi & Jaminan Sosial' },
    { key: 'crewWithBpjsKesCount', label: 'Jumlah ABK Terdaftar BPJS Kesehatan', category: 'Asuransi & Jaminan Sosial' },

    // Jam Kerja & Akomodasi
    { key: 'dailyRestHoursCompliant', label: 'Jam Istirahat Min. 10 Jam/Hari (No. 12)', category: 'K3 & Keselamatan' },
    { key: 'restHoursPerDay', label: 'Jumlah Jam Istirahat Harian', category: 'K3 & Keselamatan' },
    { key: 'hasAdequateAccommodation', label: 'Kelayakan Ruang Tidur & Akomodasi (No. 13)', category: 'Akomodasi & Pangan' },
    { key: 'hasCleanWaterAccess', label: 'Akses Air Bersih & Minum Layak (No. 14)', category: 'Akomodasi & Pangan' },
    { key: 'cleanWaterCapacityLiters', label: 'Kapasitas Pasokan Air Bersih (Liter)', category: 'Akomodasi & Pangan' },
    { key: 'hasSufficientFoodSupply', label: 'Kecukupan Logistik Makanan Sehat (No. 15)', category: 'Akomodasi & Pangan' },
    { key: 'foodSupplyDays', label: 'Estimasi Kecukupan Makanan (Hari)', category: 'Akomodasi & Pangan' },

    // K3 & Keselamatan
    { key: 'hasPpeAvailable', label: 'Ketersediaan APD Lengkap (No. 16)', category: 'K3 & Keselamatan' },
    { key: 'hasFireExtinguisherApar', label: 'APAR Siap Pakai & Tidak Kadaluarsa (No. 17)', category: 'K3 & Keselamatan' },
    { key: 'hasLifeJacketsAvailable', label: 'Ketersediaan Life Jacket Sesuai ABK', category: 'K3 & Keselamatan' },
    { key: 'lifeJacketCount', label: 'Jumlah Life Jacket Tersedia', category: 'K3 & Keselamatan' },

    // Kesehatan & P3K
    { key: 'hasFirstAidBox', label: 'Kotak Obat P3K Maritim (No. 18)', category: 'Kesehatan & P3K' },
    { key: 'hasFirstAidMedicines', label: 'Ketersediaan Obat-Obatan Standar Maritim', category: 'Kesehatan & P3K' },
    { key: 'hasAccidentLog', label: 'Pencatatan Insiden & Kecelakaan Kerja', category: 'Kesehatan & P3K' },

    // Sertifikasi & Integritas
    { key: 'crewWithSeamanBookCount', label: 'Jumlah ABK Berbuku Pelaut (No. 20)', category: 'Dokumen & Legalitas' },
    { key: 'crewWithBstCount', label: 'Jumlah ABK Bersertifikat BST-F (No. 21)', category: 'K3 & Keselamatan' },
    { key: 'identityHoldFlag', label: 'Indikasi Penahanan Dokumen Asli ABK (No. 22)', category: 'Dokumen & Legalitas' },
    { key: 'apprenticeUnderAge', label: 'Temuan Pekerja/Magang di Bawah Umur (< 18 Thn)', category: 'Dokumen & Legalitas' },

    // Catatan Khusus Per Indikator
    { key: 'noteIndicator8', label: 'Catatan Lapangan Indikator 8 (PKL)', category: 'PKL & Upah' },
    { key: 'noteIndicator9', label: 'Catatan Lapangan Indikator 9 (Upah)', category: 'PKL & Upah' },
    { key: 'noteIndicator10', label: 'Catatan Lapangan Indikator 10 (BPJS TK)', category: 'Asuransi & Jaminan Sosial' },
    { key: 'noteIndicator11', label: 'Catatan Lapangan Indikator 11 (BPJS Kes)', category: 'Asuransi & Jaminan Sosial' },
    { key: 'noteIndicator12', label: 'Catatan Lapangan Indikator 12 (Jam Istirahat)', category: 'K3 & Keselamatan' },
    { key: 'noteIndicator13', label: 'Catatan Lapangan Indikator 13 (Akomodasi)', category: 'Akomodasi & Pangan' },
    { key: 'noteIndicator14', label: 'Catatan Lapangan Indikator 14 (Air Bersih)', category: 'Akomodasi & Pangan' },
    { key: 'noteIndicator15', label: 'Catatan Lapangan Indikator 15 (Pangan)', category: 'Akomodasi & Pangan' },
    { key: 'noteIndicator16', label: 'Catatan Lapangan Indikator 16 (APD)', category: 'K3 & Keselamatan' },
    { key: 'noteIndicator17', label: 'Catatan Lapangan Indikator 17 (APAR)', category: 'K3 & Keselamatan' },
    { key: 'noteIndicator18', label: 'Catatan Lapangan Indikator 18 (P3K)', category: 'Kesehatan & P3K' },
    { key: 'noteIndicator19', label: 'Catatan Lapangan Indikator 19 (Potongan Liar)', category: 'PKL & Upah' },
    { key: 'noteIndicator20', label: 'Catatan Lapangan Indikator 20 (Buku Pelaut)', category: 'Dokumen & Legalitas' },
    { key: 'noteIndicator21', label: 'Catatan Lapangan Indikator 21 (BST-F)', category: 'K3 & Keselamatan' },
    { key: 'noteIndicator22', label: 'Catatan Lapangan Indikator 22 (Tahan Dokumen)', category: 'Dokumen & Legalitas' },

    // Catatan Keseluruhan & Rekomendasi
    { key: 'additionalNotes', label: 'Catatan Tambahan Pengawas', category: 'Status & Rekomendasi' },
    { key: 'officialRecommendations', label: 'Rekomendasi Resmi Pengawas', category: 'Status & Rekomendasi' },

    // Tim Pengawas
    { key: 'fisheryInspectorName', label: 'Nama Pengawas Perikanan', category: 'Tim Pengawas' },
    { key: 'fisheryInspectorNip', label: 'NIP Pengawas Perikanan', category: 'Tim Pengawas' },
    { key: 'laborInspectorName', label: 'Nama Pengawas Ketenagakerjaan', category: 'Tim Pengawas' },
    { key: 'laborInspectorNip', label: 'NIP Pengawas Ketenagakerjaan', category: 'Tim Pengawas' }
  ];

  for (const def of fieldDefinitions) {
    const oldVal = (oldForm as any)[def.key];
    const newVal = (newForm as any)[def.key];

    // Cek jika berbeda
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: String(def.key),
        label: def.label,
        category: def.category,
        oldValue: oldVal,
        newValue: newVal,
        oldDisplay: formatDisplayValue(oldVal),
        newDisplay: formatDisplayValue(newVal)
      });
    }
  }

  if (changes.length === 0) {
    return null;
  }

  return {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    updatedBy: userEmail,
    actionType: 'UPDATE_INSPECTION',
    title: `Pembaruan Isian Formulir (${changes.length} Bagian Diubah)`,
    summary: `Terdapat perubahan pada ${changes.length} isian indikator/catatan kepatuhan kapal.`,
    changes
  };
}

/**
 * Format timestamp ISO ke format WIB yang ramah pengguna
 * Contoh: "31 Agustus 2026, 16:30 WIB"
 */
export function formatFullDateTimeWIB(isoDateStr?: string): string {
  if (!isoDateStr) return '-';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;

    // Formatting Indonesia
    const dateFormatted = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${dateFormatted} • ${hours}:${minutes} WIB`;
  } catch {
    return isoDateStr;
  }
}
