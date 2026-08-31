import React, { useState } from 'react';

// ID Google Drive File Resmi dari Tautan Pengguna
export const OFFICIAL_AGENCY_LOGOS = {
  kkp: {
    id: '1pExM-RcrSvZCzZr4Tb1W9vO9tobENUK5',
    title: 'Kementerian Kelautan dan Perikanan (KKP RI)',
    alt: 'Logo KKP',
    driveLink: 'https://drive.google.com/file/d/1pExM-RcrSvZCzZr4Tb1W9vO9tobENUK5/view?usp=drive_link'
  },
  kemnaker: {
    id: '162CIMqaOSBOdbfA7hX4GWwmpaFabA1FU',
    title: 'Kementerian Ketenagakerjaan (Kemnaker RI)',
    alt: 'Logo Kemnaker',
    driveLink: 'https://drive.google.com/file/d/162CIMqaOSBOdbfA7hX4GWwmpaFabA1FU/view?usp=drive_link'
  },
  dfw: {
    id: '1pkI3rAaIsMZt6rRBWopmlTCMTvRfTleP',
    title: 'Destructive Fishing Watch (DFW) Indonesia',
    alt: 'Logo DFW Indonesia',
    driveLink: 'https://drive.google.com/file/d/1pkI3rAaIsMZt6rRBWopmlTCMTvRfTleP/view?usp=drive_link'
  }
};

interface AgencyLogoProps {
  agency: 'kkp' | 'kemnaker' | 'dfw';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
}

export const AgencyLogo: React.FC<AgencyLogoProps> = ({
  agency,
  className = '',
  size = 'md',
  priority = false
}) => {
  const config = OFFICIAL_AGENCY_LOGOS[agency];
  const [urlIndex, setUrlIndex] = useState(0);

  // Ukuran piksel yang disesuaikan secara proporsional agar hemat bandwidth & memori sistem
  const pixelWidth = {
    sm: 180,
    md: 320,
    lg: 480
  }[size];

  // URL dengan parameter thumbnail Google yang telah di-compress dan di-cache secara efisien di edge CDN
  const urlCandidates = [
    `https://lh3.googleusercontent.com/d/${config.id}=w${pixelWidth}`,
    `https://drive.google.com/thumbnail?id=${config.id}&sz=w${pixelWidth}`,
    `https://lh3.googleusercontent.com/d/${config.id}`,
    `https://drive.google.com/uc?export=view&id=${config.id}`
  ];

  const sizeClass = {
    sm: 'h-7 sm:h-8 max-h-8 max-w-[110px]',
    md: 'h-10 sm:h-11 max-h-11 max-w-[130px]',
    lg: 'h-12 sm:h-14 max-h-14 max-w-[160px]'
  }[size];

  const handleImageError = () => {
    if (urlIndex < urlCandidates.length - 1) {
      setUrlIndex(prev => prev + 1);
    }
  };

  return (
    <div className={`flex items-center justify-center shrink-0 ${sizeClass} ${className}`} title={config.title}>
      <img
        src={urlCandidates[urlIndex]}
        alt={config.alt}
        className="h-full w-auto max-h-full max-w-full object-contain drop-shadow-2xs print:drop-shadow-none select-none"
        referrerPolicy="no-referrer"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={handleImageError}
      />
    </div>
  );
};

/**
 * Komponen KOP Logo Resmi Tim Pengawasan Gabungan
 * Menampilkan logo resmi KKP, Kemnaker, dan DFW Indonesia dari Google Drive
 */
export const OfficialLetterheadLogos: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center gap-6 sm:gap-10 pb-3 pt-1 ${className}`}>
      {/* 1. Logo KKP */}
      <div className="flex flex-col items-center">
        <AgencyLogo agency="kkp" size="md" />
        <span className="text-[10px] font-bold text-slate-800 mt-1 uppercase tracking-tight print:text-black">
          KKP RI
        </span>
      </div>

      <div className="h-10 w-px bg-slate-300 print:bg-slate-400 mx-1"></div>

      {/* 2. Logo Kemnaker */}
      <div className="flex flex-col items-center">
        <AgencyLogo agency="kemnaker" size="md" />
        <span className="text-[10px] font-bold text-slate-800 mt-1 uppercase tracking-tight print:text-black">
          Kemnaker RI
        </span>
      </div>

      <div className="h-10 w-px bg-slate-300 print:bg-slate-400 mx-1"></div>

      {/* 3. Logo DFW Indonesia */}
      <div className="flex flex-col items-center">
        <AgencyLogo agency="dfw" size="md" />
        <span className="text-[10px] font-bold text-slate-800 mt-1 uppercase tracking-tight print:text-black">
          DFW Indonesia
        </span>
      </div>
    </div>
  );
};
