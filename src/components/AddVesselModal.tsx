import React, { useState } from 'react';
import { Vessel } from '../types';
import { X, Plus, Ship, Check } from 'lucide-react';
import { INDONESIAN_PORTS } from '../constants/ports';

interface AddVesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVessel: (vessel: Vessel) => Promise<void>;
}

export const AddVesselModal: React.FC<AddVesselModalProps> = ({
  isOpen,
  onClose,
  onSaveVessel
}) => {
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [grossTonnage, setGrossTonnage] = useState<number>(80);
  const [callSign, setCallSign] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [homePort, setHomePort] = useState(INDONESIAN_PORTS[1] || 'PPS Nizam Zachman Jakarta');
  const [gearType, setGearType] = useState('Purse Seine Pelagis Besar');
  const [crewCapacity, setCrewCapacity] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      const vesselId = `VESSEL-${Date.now().toString().slice(-6)}`;
      const newVessel: Vessel = {
        id: vesselId,
        name: name.trim(),
        registrationNumber: registrationNumber.trim(),
        grossTonnage: Number(grossTonnage) || 50,
        callSign: callSign.trim() || 'YDA-0000',
        ownerName: ownerName.trim() || 'Pemilik Kapal Terdaftar',
        agentName: agentName.trim() || 'Agen Maritim Terdaftar',
        homePort,
        gearType,
        crewCapacity: Number(crewCapacity) || 15,
        riskScore: 20,
        riskLevel: 'LOW',
        totalInspections: 0,
        status: 'ACTIVE',
        activeViolationsCount: 0,
        criticalViolationsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSaveVessel(newVessel);
      
      // Reset form and close
      setName('');
      setRegistrationNumber('');
      setCallSign('');
      setOwnerName('');
      setAgentName('');
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to add vessel:', err);
      setSaveError(err?.message || 'Gagal menyimpan kapal. Silakan coba kembali.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Daftarkan Kapal Perikanan Baru</h2>
              <p className="text-xs text-slate-500">
                Registrasi identitas kapal ke dalam database monev pelabuhan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {saveError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{saveError}</span>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="text-rose-500 hover:text-rose-800 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kapal Perikanan:
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
                No. Registrasi / SIPI:
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
                Gross Tonnage (GT):
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
                placeholder="Contoh: YDA-8821"
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
                Nama Pemilik / Perusahaan:
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PT. Samudera Raya"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agen Pengurus:
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
                Pelabuhan Pangkalan:
              </label>
              <select
                value={homePort}
                onChange={(e) => setHomePort(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500"
              >
                {INDONESIAN_PORTS.filter(p => p !== 'Semua Pelabuhan').map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
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
                <option value="Purse Seine Pelagis Besar">Purse Seine Pelagis Besar</option>
                <option value="Tuna Longline">Tuna Longline</option>
                <option value="Pole and Line (Huhate)">Pole and Line (Huhate)</option>
                <option value="Jaring Insang Hanyut (Drift Gillnet)">Jaring Insang Hanyut (Drift Gillnet)</option>
                <option value="Handline Tuna Organik">Handline Tuna Organik</option>
                <option value="Bouke Ami (Cumi)">Bouke Ami (Cumi)</option>
                <option value="Rawai Dasar (Bottom Longline)">Rawai Dasar (Bottom Longline)</option>
              </select>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Mendaftarkan...' : 'Simpan Data Kapal'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
