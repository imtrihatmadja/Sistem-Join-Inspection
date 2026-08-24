export interface PortCategory {
  categoryName: string;
  ports: string[];
}

export const PORT_GROUPS: PortCategory[] = [
  {
    categoryName: 'Pelabuhan Perikanan Samudera (PPS)',
    ports: [
      'PPS Nizam Zachman Jakarta',
      'PPS Belawan, Sumatera Utara',
      'PPS Bitung, Sulawesi Utara',
      'PPS Cilacap, Jawa Tengah',
      'PPS Kendari, Sulawesi Tenggara',
      'PPS Lampulo, Aceh',
      'PPS Bungus, Sumatera Barat'
    ]
  },
  {
    categoryName: 'Pelabuhan Perikanan Nusantara (PPN)',
    ports: [
      'PPN Tantui Ambon, Maluku',
      'PPN Tual, Maluku',
      'PPN Brondong, Lamongan',
      'PPN Pekalongan, Jawa Tengah',
      'PPN Kejawanan, Cirebon',
      'PPN Palabuhanratu, Sukabumi',
      'PPN Prigi, Trenggalek',
      'PPN Sungailiat, Bangka',
      'PPN Pemangkat, Kalimantan Barat',
      'PPN Sibolga, Sumatera Utara',
      'PPN Idi, Aceh Timur',
      'PPN Karangantu, Banten',
      'PPN Kwandang, Gorontalo',
      'PPN Pengambengan, Bali',
      'PPN Morotai, Maluku Utara',
      'PPN Ternate, Maluku Utara',
      'PPN Teluk Batang, Kalimantan Barat'
    ]
  },
  {
    categoryName: 'Pelabuhan Strategis & PSMA / PPP Utama',
    ports: [
      'Pelabuhan Benoa, Bali',
      'Pelabuhan Muara Angke, Jakarta',
      'Pelabuhan Dobo, Kepulauan Aru',
      'Pelabuhan Merauke, Papua Selatan',
      'Pelabuhan Sorong, Papua Barat Daya',
      'Pelabuhan Jayapura, Papua',
      'Pelabuhan Timika (Pomako), Papua Tengah',
      'Pelabuhan Probolinggo, Jawa Timur',
      'Pelabuhan Tegalsari (Tegal), Jawa Tengah',
      'Pelabuhan Bajomulyo (Juwana), Jawa Tengah',
      'Pelabuhan Banyuwangi (Muncar), Jawa Timur',
      'Pelabuhan Tanjung Balai Asahan, Sumatera Utara',
      'Pelabuhan Dumai, Riau',
      'Pelabuhan Tenau Kupang, NTT',
      'Pelabuhan Labuan Bajo, NTT',
      'Pelabuhan Labuhan Lombok, NTB',
      'Pelabuhan Teluk Awang, NTB',
      'Pelabuhan Banjarmasin, Kalimantan Selatan',
      'Pelabuhan Tarakan, Kalimantan Utara',
      'Pelabuhan Paotere (Makassar), Sulawesi Selatan',
      'Pelabuhan Untia (Makassar), Sulawesi Selatan',
      'Pelabuhan Saumlaki, Maluku'
    ]
  }
];

// Flat list for select boxes, filter dropdowns & auto-complete
export const INDONESIAN_PORTS: string[] = [
  'Semua Pelabuhan',
  ...PORT_GROUPS.flatMap((g) => g.ports)
];

// Alias keyword dictionary mapping variations to canonical dropdown port names
const PORT_KEYWORD_MAP: Array<{ keywords: string[]; standardName: string }> = [
  {
    keywords: ['benoa', 'bali', 'denpasar'],
    standardName: 'Pelabuhan Benoa, Bali'
  },
  {
    keywords: ['nizam', 'zachman', 'muara baru', 'pps jakarta', 'nizam zachman'],
    standardName: 'PPS Nizam Zachman Jakarta'
  },
  {
    keywords: ['bitung', 'sulawesi utara', 'sulut'],
    standardName: 'PPS Bitung, Sulawesi Utara'
  },
  {
    keywords: ['belawan', 'medan', 'sumatera utara'],
    standardName: 'PPS Belawan, Sumatera Utara'
  },
  {
    keywords: ['cilacap', 'jawa tengah'],
    standardName: 'PPS Cilacap, Jawa Tengah'
  },
  {
    keywords: ['kendari', 'sulawesi tenggara', 'sultra'],
    standardName: 'PPS Kendari, Sulawesi Tenggara'
  },
  {
    keywords: ['lampulo', 'banda aceh', 'aceh'],
    standardName: 'PPS Lampulo, Aceh'
  },
  {
    keywords: ['bungus', 'padang', 'sumatera barat', 'sumbar'],
    standardName: 'PPS Bungus, Sumatera Barat'
  },
  {
    keywords: ['muara angke', 'angke', 'pluit'],
    standardName: 'Pelabuhan Muara Angke, Jakarta'
  },
  {
    keywords: ['ambon', 'tantui', 'maluku'],
    standardName: 'PPN Tantui Ambon, Maluku'
  },
  {
    keywords: ['tual', 'kei'],
    standardName: 'PPN Tual, Maluku'
  },
  {
    keywords: ['dobo', 'kepulauan aru', 'aru'],
    standardName: 'Pelabuhan Dobo, Kepulauan Aru'
  },
  {
    keywords: ['merauke', 'papua selatan'],
    standardName: 'Pelabuhan Merauke, Papua Selatan'
  },
  {
    keywords: ['sorong', 'papua barat'],
    standardName: 'Pelabuhan Sorong, Papua Barat Daya'
  },
  {
    keywords: ['jayapura'],
    standardName: 'Pelabuhan Jayapura, Papua'
  },
  {
    keywords: ['timika', 'pomako', 'papua tengah'],
    standardName: 'Pelabuhan Timika (Pomako), Papua Tengah'
  },
  {
    keywords: ['brondong', 'lamongan'],
    standardName: 'PPN Brondong, Lamongan'
  },
  {
    keywords: ['pekalongan'],
    standardName: 'PPN Pekalongan, Jawa Tengah'
  },
  {
    keywords: ['kejawanan', 'cirebon'],
    standardName: 'PPN Kejawanan, Cirebon'
  },
  {
    keywords: ['palabuhanratu', 'pelabuhan ratu', 'sukabumi'],
    standardName: 'PPN Palabuhanratu, Sukabumi'
  },
  {
    keywords: ['prigi', 'trenggalek'],
    standardName: 'PPN Prigi, Trenggalek'
  },
  {
    keywords: ['probolinggo', 'mayangan'],
    standardName: 'Pelabuhan Probolinggo, Jawa Timur'
  },
  {
    keywords: ['tegalsari', 'tegal'],
    standardName: 'Pelabuhan Tegalsari (Tegal), Jawa Tengah'
  },
  {
    keywords: ['bajomulyo', 'juwana', 'pati'],
    standardName: 'Pelabuhan Bajomulyo (Juwana), Jawa Tengah'
  },
  {
    keywords: ['muncar', 'banyuwangi'],
    standardName: 'Pelabuhan Banyuwangi (Muncar), Jawa Timur'
  },
  {
    keywords: ['sungailiat', 'bangka'],
    standardName: 'PPN Sungailiat, Bangka'
  },
  {
    keywords: ['pemangkat', 'sambas'],
    standardName: 'PPN Pemangkat, Kalimantan Barat'
  },
  {
    keywords: ['sibolga'],
    standardName: 'PPN Sibolga, Sumatera Utara'
  },
  {
    keywords: ['idi', 'aceh timur'],
    standardName: 'PPN Idi, Aceh Timur'
  },
  {
    keywords: ['karangantu', 'banten', 'serang'],
    standardName: 'PPN Karangantu, Banten'
  },
  {
    keywords: ['kwandang', 'gorontalo'],
    standardName: 'PPN Kwandang, Gorontalo'
  },
  {
    keywords: ['pengambengan', 'jembrana'],
    standardName: 'PPN Pengambengan, Bali'
  },
  {
    keywords: ['morotai'],
    standardName: 'PPN Morotai, Maluku Utara'
  },
  {
    keywords: ['ternate'],
    standardName: 'PPN Ternate, Maluku Utara'
  },
  {
    keywords: ['teluk batang', 'kayong utara'],
    standardName: 'PPN Teluk Batang, Kalimantan Barat'
  },
  {
    keywords: ['tanjung balai asahan', 'asahan'],
    standardName: 'Pelabuhan Tanjung Balai Asahan, Sumatera Utara'
  },
  {
    keywords: ['dumai'],
    standardName: 'Pelabuhan Dumai, Riau'
  },
  {
    keywords: ['tenau', 'kupang'],
    standardName: 'Pelabuhan Tenau Kupang, NTT'
  },
  {
    keywords: ['labuan bajo', 'manggarai barat'],
    standardName: 'Pelabuhan Labuan Bajo, NTT'
  },
  {
    keywords: ['labuhan lombok', 'lombok timur'],
    standardName: 'Pelabuhan Labuhan Lombok, NTB'
  },
  {
    keywords: ['teluk awang', 'lombok tengah'],
    standardName: 'Pelabuhan Teluk Awang, NTB'
  },
  {
    keywords: ['banjarmasin'],
    standardName: 'Pelabuhan Banjarmasin, Kalimantan Selatan'
  },
  {
    keywords: ['tarakan'],
    standardName: 'Pelabuhan Tarakan, Kalimantan Utara'
  },
  {
    keywords: ['paotere', 'makassar'],
    standardName: 'Pelabuhan Paotere (Makassar), Sulawesi Selatan'
  },
  {
    keywords: ['untia'],
    standardName: 'Pelabuhan Untia (Makassar), Sulawesi Selatan'
  },
  {
    keywords: ['saumlaki', 'tanimbar'],
    standardName: 'Pelabuhan Saumlaki, Maluku'
  }
];

// Standard helper to normalize port names strictly to dropdown choices
export function normalizePortName(rawPort: string | undefined | null): string {
  if (!rawPort || rawPort.trim() === '' || rawPort === '-' || rawPort.toLowerCase() === 'semua pelabuhan') {
    return 'Pelabuhan Pangkalan Lainnya';
  }

  const clean = rawPort.trim();
  const lowerClean = clean.toLowerCase();

  // 1. Direct exact match (case-insensitive)
  const exact = INDONESIAN_PORTS.find(
    (p) => p !== 'Semua Pelabuhan' && p.toLowerCase() === lowerClean
  );
  if (exact) return exact;

  // 2. Keyword dictionary match (handles "Pelabuhan Benoa", "Benoa", "PPS Jakarta", "Nizam Zachman", dll)
  for (const entry of PORT_KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (lowerClean.includes(kw) || kw.includes(lowerClean)) {
        return entry.standardName;
      }
    }
  }

  // 3. Substring match across official ports list
  const substringMatch = INDONESIAN_PORTS.find((p) => {
    if (p === 'Semua Pelabuhan') return false;
    const lowerP = p.toLowerCase();
    return lowerP.includes(lowerClean) || lowerClean.includes(lowerP);
  });
  if (substringMatch) return substringMatch;

  // Fallback to cleaned title case
  return clean;
}

