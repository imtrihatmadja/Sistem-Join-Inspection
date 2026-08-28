import React, { useState, useEffect } from 'react';
import { Vessel } from '../types';
import { X, Plus, Ship, Check, RefreshCw, Pencil } from 'lucide-react';
import { INDONESIAN_PORTS, PORT_GROUPS } from '../constants/ports';
import { STANDARD_GEAR_TYPES } from '../constants/gearTypes';

interface AddVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVessel: (vessel: Vessel) => Promise<void>;
  vesselToEdit?: Vessel | null;
}

export const AddVesselModal: React.FC<AddVesselModalProps> = ({
  isOpen,
  onClose,
  onSaveVessel,
  vesselToEdit
}) => {
  const isEditMode = !!vesselToEdit;

  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [grossTonnage, setGrossTonnage] = useState<number>(80);
  const [callSign, setCallSign] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [homePort, setHomePort] = useState(INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
  const [fishingGround, setFishingGround] = useState('WPPNRI 711 / Laut Natuna');
  const [gearType, setGearType] = useState('Purse Seine Pelagis Besar');
  const [crewCapacity, setCrewCapacity] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (vesselToEdit) {
        setName(vesselToEdit.name || '');
        setRegistrationNumber(vesselToEdit.registrationNumber || '');
        setGrossTonnage(vesselToEdit.grossTonnage || 80);
        setCallSign(vesselToEdit.callSign || '');
        setOwnerName(vesselToEdit.ownerName || '');
        setOwnerAddress(vesselToEdit.ownerAddress || '');
        setCaptainName(vesselToEdit.captainName || '');
        setAgentName(vesselToEdit.agentName || '');
        setHomePort(vesselToEdit.homePort || INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
        setFishingGround(vesselToEdit.fishingGround || 'WPPNRI 711 / Laut Natuna');
        setGearType(vesselToEdit.gearType || 'Purse Seine Pelagis Besar');
        setCrewCapacity(vesselToEdit.crewCapacity || 20);
      } else {
        setName('');
        setRegistrationNumber('');
        setGrossTonnage(80);
        setCallSign('');
        setOwnerName('');
        setOwnerAddress('');
        setCaptainName('');
        setAgentName('');
        setHomePort(INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
        setFishingGround('WPPNRI 711 / Laut Natuna');
        setGearType('Purse Seine Pelagis Besar');
        setCrewCapacity(20);
      }
      setSaveError(null);
    }
  }, [vesselToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !registrationNumber.trim() || !ownerName.trim()) {
      setSaveError('Nama kapal, nomor registrasi/SIPI, dan pemilik wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setSaveError(null);

    try {
      const targetVessel: Vessel = isEditMode && vesselToEdit
        ? {
            ...vesselToEdit,
            name: name.trim(),
            registrationNumber: registrationNumber.trim(),
            grossTonnage: Number(grossTonnage) || 50,
            callSign: callSign.trim() || 'YDA-0000',
            ownerName: ownerName.trim() || 'Pemilik Kapal Terdaftar',
            ownerAddress: ownerAddress.trim() || undefined,
            captainName: captainName.trim() || undefined,
            agentName: agentName.trim() || 'Agen Maritim Terdaftar',
            homePort,
            fishingGround: fishingGround.trim() || 'WPPNRI 711 / Laut Natuna',
            gearType,
            crewCapacity: Number(crewCapacity) || 15,
            updatedAt: new Date().toISOString()
          }
        : {
            id: `VESSEL-${Date.now().toString().slice(-6)}`,
            name: name.trim(),
            registrationNumber: registrationNumber.trim(),
            grossTonnage: Number(grossTonnage) || 50,
            callSign: callSign.trim() || 'YDA-0000',
            ownerName: ownerName.trim() || 'Pemilik Kapal Terdaftar',
            ownerAddress: ownerAddress.trim() || undefined,
            captainName: captainName.trim() || undefined,
            agentName: agentName.trim() || 'Agen Maritim Terdaftar',
            homePort,
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
                  ? 'Perbarui identitas, perizinan SIPI, spesifikasi tonase, atau keagenan kapal dalam database'
                  : 'Registrasi identitas kapal ke dalam database monev pelabuhan'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {saveError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{saveError}</span>
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
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-mono text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pelabuhan Pangkalan:
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

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-lg ${
                isEditMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'
              } disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer`}
            >
              {isEditMode ? (
                <>
                  <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{isSubmitting ? 'Memperbarui...' : 'Perbaharui Data Kapal'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Mendaftarkan...' : 'Simpan Data Kapal'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
