import React, { useState, useEffect, useMemo } from 'react';
import { Vessel } from '../types';
import { X, Plus, Ship, Check, RefreshCw, Pencil, ShieldAlert, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';
import { INDONESIAN_PORTS, PORT_GROUPS } from '../constants/ports';
import { STANDARD_GEAR_TYPES } from '../constants/gearTypes';

interface AddVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVessel: (vessel: Vessel) => Promise<void>;
  vesselToEdit?: Vessel | null;
  existingVessels?: Vessel[];
}

export const AddVesselModal: React.FC<AddVesselModalProps> = ({
  isOpen,
  onClose,
  onSaveVessel,
  vesselToEdit,
  existingVessels = []
}) => {
  const isEditMode = !!vesselToEdit;

  const [name, setName] = useState('');
  const [fisheriesRegisterNumber, setFisheriesRegisterNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [grossTonnage, setGrossTonnage] = useState<number>(80);
  const [callSign, setCallSign] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [homePort, setHomePort] = useState(INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
  const [secondaryHomePort, setSecondaryHomePort] = useState('');
  const [fishingGround, setFishingGround] = useState('WPPNRI 711 / Laut Natuna');
  const [gearType, setGearType] = useState('Purse Seine Pelagis Besar');
  const [crewCapacity, setCrewCapacity] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (vesselToEdit) {
        setName(vesselToEdit.name || '');
        setFisheriesRegisterNumber(vesselToEdit.fisheriesRegisterNumber || '');
        setRegistrationNumber(vesselToEdit.registrationNumber || '');
        setGrossTonnage(vesselToEdit.grossTonnage || 80);
        setCallSign(vesselToEdit.callSign || '');
        setOwnerName(vesselToEdit.ownerName || '');
        setOwnerAddress(vesselToEdit.ownerAddress || '');
        setCaptainName(vesselToEdit.captainName || '');
        setAgentName(vesselToEdit.agentName || '');
        setHomePort(vesselToEdit.homePort || INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
        setSecondaryHomePort(vesselToEdit.secondaryHomePort || '');
        setFishingGround(vesselToEdit.fishingGround || 'WPPNRI 711 / Laut Natuna');
        setGearType(vesselToEdit.gearType || 'Purse Seine Pelagis Besar');
        setCrewCapacity(vesselToEdit.crewCapacity || 20);
      } else {
        setName('');
        setFisheriesRegisterNumber('');
        setRegistrationNumber('');
        setGrossTonnage(80);
        setCallSign('');
        setOwnerName('');
        setOwnerAddress('');
        setCaptainName('');
        setAgentName('');
        setHomePort(INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
        setSecondaryHomePort('');
        setFishingGround('WPPNRI 711 / Laut Natuna');
        setGearType('Purse Seine Pelagis Besar');
        setCrewCapacity(20);
      }
      setSaveError(null);
    }
  }, [vesselToEdit, isOpen]);

  // Validasi Unik Real-time untuk No. Register Kapal Perikanan
  const duplicateRegisterVessel = useMemo(() => {
    const trimmed = fisheriesRegisterNumber.trim().toLowerCase();
    if (!trimmed) return null;
    
    // Check against existingVessels list
    return existingVessels.find((v) => {
      if (v.id === vesselToEdit?.id) return false;
      const vReg = v.fisheriesRegisterNumber?.trim().toLowerCase();
      return vReg === trimmed;
    }) || null;
  }, [fisheriesRegisterNumber, existingVessels, vesselToEdit]);

  // Validasi Unik untuk Nomor SIPI / SIUP (pembantu keamanan data)
  const duplicateSipiVessel = useMemo(() => {
    const trimmed = registrationNumber.trim().toLowerCase();
    if (!trimmed) return null;

    return existingVessels.find((v) => {
      if (v.id === vesselToEdit?.id) return false;
      const vSipi = v.registrationNumber?.trim().toLowerCase();
      return vSipi === trimmed;
    }) || null;
  }, [registrationNumber, existingVessels, vesselToEdit]);

  const hasDuplicateError = !!duplicateRegisterVessel || !!duplicateSipiVessel;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fisheriesRegisterNumber.trim() || !registrationNumber.trim() || !ownerName.trim()) {
      setSaveError('Nama kapal, No. Register Kapal Perikanan, nomor izin SIPI, dan pemilik wajib diisi.');
      return;
    }

    // Strict validation lock
    if (duplicateRegisterVessel) {
      setSaveError(
        `Kapal telah terdaftar! No. Register Kapal Perikanan "${fisheriesRegisterNumber}" sudah digunakan oleh kapal "${duplicateRegisterVessel.name}". Duplikasi tidak diizinkan.`
      );
      return;
    }

    if (duplicateSipiVessel) {
      setSaveError(
        `Kapal telah terdaftar! No. SIPI/Registrasi "${registrationNumber}" sudah digunakan oleh kapal "${duplicateSipiVessel.name}".`
      );
      return;
    }

    setIsSubmitting(true);
    setSaveError(null);

    try {
      const targetVessel: Vessel = isEditMode && vesselToEdit
        ? {
            ...vesselToEdit,
            name: name.trim(),
            fisheriesRegisterNumber: fisheriesRegisterNumber.trim(),
            registrationNumber: registrationNumber.trim(),
            grossTonnage: Number(grossTonnage) || 50,
            callSign: callSign.trim() || 'YDA-0000',
            ownerName: ownerName.trim() || 'Pemilik Kapal Terdaftar',
            ownerAddress: ownerAddress.trim() || undefined,
            captainName: captainName.trim() || undefined,
            agentName: agentName.trim() || 'Agen Maritim Terdaftar',
            homePort,
            secondaryHomePort: secondaryHomePort.trim() || undefined,
            fishingGround: fishingGround.trim() || 'WPPNRI 711 / Laut Natuna',
            gearType,
            crewCapacity: Number(crewCapacity) || 15,
            updatedAt: new Date().toISOString()
          }
        : {
            id: `VESSEL-${Date.now().toString().slice(-6)}`,
            name: name.trim(),
            fisheriesRegisterNumber: fisheriesRegisterNumber.trim(),
            registrationNumber: registrationNumber.trim(),
            grossTonnage: Number(grossTonnage) || 50,
            callSign: callSign.trim() || 'YDA-0000',
            ownerName: ownerName.trim() || 'Pemilik Kapal Terdaftar',
            ownerAddress: ownerAddress.trim() || undefined,
            captainName: captainName.trim() || undefined,
            agentName: agentName.trim() || 'Agen Maritim Terdaftar',
            homePort,
            secondaryHomePort: secondaryHomePort.trim() || undefined,
            fishingGround: fishingGround.trim() || 'WPPNRI 711 / Laut Natuna',
            gearType,
            crewCapacity: Number(crewCapacity) || 15,
            riskScore: 100,
            riskLevel: 'HIGH',
            totalInspections: 0,
            status: 'ACTIVE',
            activeViolationsCount: 0,
            criticalViolationsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

      await onSaveVessel(targetVessel);
      
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to save vessel:', err);
      setSaveError(err?.message || 'Gagal memperbarui data kapal. Silakan coba kembali.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isEditMode ? 'bg-blue-600' : 'bg-teal-600'} text-white flex items-center justify-center shadow-xs`}>
              {isEditMode ? <Pencil className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditMode ? 'Edit / Perbarui Data Kapal Perikanan' : 'Daftarkan Kapal Perikanan Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? 'Perbarui identitas, nomor register kapal, perizinan SIPI, atau spesifikasi dalam database'
                  : 'Registrasi data identitas dan No. Register Kapal Perikanan ke dalam database monev terpusat'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Duplicate Warning Banner */}
        {hasDuplicateError && (
          <div className="bg-rose-600 text-white px-6 py-3 flex items-start gap-3 text-xs shadow-inner animate-in fade-in">
            <ShieldAlert className="w-5 h-5 shrink-0 text-white mt-0.5" />
            <div>
              <p className="font-bold text-sm">Kapal Telah Terdaftar (Data Terkunci)</p>
              <p className="text-rose-100 mt-0.5 leading-relaxed">
                {duplicateRegisterVessel
                  ? `No. Register Kapal Perikanan "${fisheriesRegisterNumber}" sudah digunakan oleh kapal "${duplicateRegisterVessel.name}" (Pelabuhan: ${duplicateRegisterVessel.homePort}). Duplikasi pendaftaran kapal dilarang.`
                  : `No. Registrasi / SIPI "${registrationNumber}" sudah terdaftar atas nama kapal "${duplicateSipiVessel?.name}".`}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {saveError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="text-rose-500 hover:text-rose-800 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nama Kapal */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kapal Perikanan: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: KM. Bahari Makmur 09"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Kolom No. Register Kapal Perikanan (Unik & Terkunci) */}
            <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-600" />
                  <span>No. Register Kapal Perikanan:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800 tracking-wider">
                  Kunci Unik (Anti-Duplikasi)
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Contoh: REG-ID-3324-00918 / No. Buku Kapal KKP"
                  value={fisheriesRegisterNumber}
                  onChange={(e) => setFisheriesRegisterNumber(e.target.value)}
                  className={`w-full text-xs rounded-lg border p-2.5 font-mono transition-colors ${
                    duplicateRegisterVessel
                      ? 'border-rose-500 bg-rose-50/60 text-rose-900 pr-10 focus:ring-2 focus:ring-rose-500'
                      : fisheriesRegisterNumber.trim()
                      ? 'border-emerald-500 bg-emerald-50/30 text-slate-900 pr-10 focus:ring-2 focus:ring-emerald-500'
                      : 'border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {duplicateRegisterVessel ? (
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                  ) : fisheriesRegisterNumber.trim() ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Status Validasi Real-Time */}
              {duplicateRegisterVessel ? (
                <div className="p-2.5 rounded-lg bg-rose-100/80 border border-rose-300 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Kapal Telah Terdaftar!</span>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      No. Register ini sudah dipakai oleh kapal: <strong>{duplicateRegisterVessel.name}</strong> ({duplicateRegisterVessel.homePort}, SIPI: {duplicateRegisterVessel.registrationNumber}). Form dikunci agar tidak ada duplikasi data kapal.
                    </p>
                  </div>
                </div>
              ) : fisheriesRegisterNumber.trim() ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>No. Register unik & belum pernah didaftarkan. Valid untuk disimpan.</span>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Nomor register unik nasional (Buku Kapal / NIKP). Data dikunci untuk mencegah entri kapal ganda.
                </p>
              )}
            </div>

            {/* No. Registrasi / SIPI */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Registrasi / SIPI: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="SIPI-2025-..."
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className={`w-full text-xs rounded-lg border p-2.5 font-mono text-slate-900 ${
                  duplicateSipiVessel
                    ? 'border-rose-500 bg-rose-50/60 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-300 bg-white focus:ring-2 focus:ring-teal-500'
                }`}
              />
              {duplicateSipiVessel && (
                <p className="text-[10px] text-rose-600 mt-1 font-semibold">
                  ⚠️ SIPI sudah digunakan oleh kapal {duplicateSipiVessel.name}
                </p>
              )}
            </div>

            {/* Gross Tonnage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gross Tonnage (GT): <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="5"
                max="2000"
                value={grossTonnage}
                onChange={(e) => setGrossTonnage(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Tanda Selar / Call Sign */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanda Selar / Call Sign:
              </label>
              <input
                type="text"
                placeholder="Contoh: YDA-8821 / BELAWAN/GT.108"
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-mono text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Kapasitas ABK */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kapasitas Maksimal ABK:
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={crewCapacity}
                onChange={(e) => setCrewCapacity(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Pemilik */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pemilik / Korporasi: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PT. Samudera Raya / Andrew"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Agen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agen Maritim / Pengurus:
              </label>
              <input
                type="text"
                placeholder="Contoh: Samudera Mandiri Agen"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Nahkoda */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Nahkoda / Tekong:
              </label>
              <input
                type="text"
                placeholder="Contoh: Capt. Herman"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* WPP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wilayah Tangkapan (WPPNRI):
              </label>
              <input
                type="text"
                placeholder="Contoh: WPPNRI 711 / Laut Natuna"
                value={fishingGround}
                onChange={(e) => setFishingGround(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Pelabuhan Pangkalan 1 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pelabuhan Pangkalan 1 (Utama): <span className="text-rose-500">*</span>
              </label>
              <select
                value={homePort}
                onChange={(e) => setHomePort(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
              >
                {PORT_GROUPS.map((group) => (
                  <optgroup key={group.categoryName} label={`📍 ${group.categoryName}`}>
                    {group.ports.map((port) => (
                      <option key={port} value={port}>
                        {port}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Pelabuhan Pangkalan 2 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Pelabuhan Pangkalan 2 (Tambahan):
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Opsional</span>
              </div>
              <select
                value={secondaryHomePort || ''}
                onChange={(e) => setSecondaryHomePort(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Tidak Ada (Hanya 1 Pelabuhan) --</option>
                {PORT_GROUPS.map((group) => (
                  <optgroup key={`sec-${group.categoryName}`} label={`📍 ${group.categoryName}`}>
                    {group.ports.map((port) => (
                      <option key={`sec-${port}`} value={port}>
                        {port}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Jenis Alat Tangkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Alat Tangkap:
              </label>
              <select
                value={gearType}
                onChange={(e) => setGearType(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              >
                {STANDARD_GEAR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Alamat Domisili */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Domisili Pemilik (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Jl. Pelabuhan Ratu No. 12, Jakarta Utara"
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-500">
              {hasDuplicateError ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Tombol dikunci karena ada duplikasi data
                </span>
              ) : (
                <span>* Kolom wajib diisi</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || hasDuplicateError}
                title={hasDuplicateError ? 'Kapal telah terdaftar! Silakan gunakan nomor register yang berbeda.' : undefined}
                className={`px-5 py-2 rounded-lg ${
                  hasDuplicateError
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : isEditMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                } disabled:opacity-50 text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isEditMode ? 'Memperbarui...' : 'Mendaftarkan...'}</span>
                  </>
                ) : isEditMode ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Perbaharui Data Kapal</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Data Kapal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
