import React, { useState, useRef } from 'react';
import { Vessel, VesselEvidence, EvidenceCategory } from '../types';
import {
  EVIDENCE_CATEGORIES,
  uploadEvidenceToGoogleDrive,
  deleteEvidenceRecord,
  formatBytes,
  getDriveAccessToken
} from '../services/googleDriveService';
import {
  Folder,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Eye,
  X,
  Plus,
  Lock
} from 'lucide-react';

interface VesselEvidenceVaultProps {
  vessel: Vessel;
  evidences: VesselEvidence[];
  onEvidenceChange?: () => void;
  currentUserEmail?: string;
  inspectionId?: string;
}

export const VesselEvidenceVault: React.FC<VesselEvidenceVaultProps> = ({
  vessel,
  evidences,
  onEvidenceChange,
  currentUserEmail,
  inspectionId
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [previewModalFile, setPreviewModalFile] = useState<VesselEvidence | null>(null);

  // Form states for uploading
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [formCategory, setFormCategory] = useState<EvidenceCategory>('FOTO_AKOMODASI_ABK');
  const [formDescription, setFormDescription] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vesselEvidences = evidences.filter((e) => e.vesselId === vessel.id);

  const filteredEvidences = selectedCategory === 'ALL'
    ? vesselEvidences
    : vesselEvidences.filter((e) => e.category === selectedCategory);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTargetFile(file);
      setUploadError(null);
      if (!formDescription) {
        setFormDescription(`Bukti ${file.name} untuk Kapal ${vessel.name}`);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setTargetFile(file);
      setUploadError(null);
      if (!formDescription) {
        setFormDescription(`Bukti ${file.name} untuk Kapal ${vessel.name}`);
      }
    }
  };

  const handleExecuteUpload = async () => {
    if (!targetFile) {
      setUploadError('Pilih file foto atau dokumen terlebih dahulu.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);
      setUploadError(null);

      const token = getDriveAccessToken() || undefined;

      await uploadEvidenceToGoogleDrive({
        file: targetFile,
        vessel,
        category: formCategory,
        description: formDescription.trim() || `Bukti ${targetFile.name} untuk ${vessel.name}`,
        inspectionId,
        uploadedBy: currentUserEmail || 'pengawas@inspeksikapal.go.id',
        accessToken: token,
        onProgress: (p) => setUploadProgress(p)
      });

      setIsUploading(false);
      setUploadModalOpen(false);
      setTargetFile(null);
      setFormDescription('');
      if (onEvidenceChange) onEvidenceChange();
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err?.message || 'Gagal mengunggah file ke Google Drive');
    }
  };

  const handleDelete = (evidenceId: string) => {
    if (window.confirm('Hapus tautan bukti ini dari kapal?')) {
      deleteEvidenceRecord(evidenceId);
      if (onEvidenceChange) onEvidenceChange();
    }
  };

  const totalSize = vesselEvidences.reduce((acc, e) => acc + (e.fileSize || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header & Google Drive Folder Badge */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs border border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm sm:text-base text-white">
                Penyimpanan Bukti Google Drive
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Terkoneksi Kapal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 truncate max-w-[280px] sm:max-w-md">
              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                [KAPAL] {vessel.name} ({vessel.registrationNumber || vessel.id})
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Total Berkas
            </div>
            <div className="text-xs font-bold text-slate-200">
              {vesselEvidences.length} File • {formatBytes(totalSize)}
            </div>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer min-h-[38px]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>+ Unggah Bukti</span>
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer text-xs ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua ({vesselEvidences.length})
        </button>

        {EVIDENCE_CATEGORIES.map((cat) => {
          const count = vesselEvidences.filter((e) => e.category === cat.value).length;
          if (count === 0 && selectedCategory !== cat.value) return null;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="opacity-70 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Evidences List / Grid */}
      {filteredEvidences.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-sm font-bold text-slate-800">
              Belum Ada Bukti atau Dokumen Terunggah
            </h5>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Setiap foto kamar ABK, draft PKL, sertifikat keselamatan, atau bukti temuan K3 akan tersimpan aman di Google Drive terikat nama kapal ini.
            </p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Unggah Bukti Lapangan Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEvidences.map((evidence) => {
            const isImage = evidence.mimeType.startsWith('image/');
            const catInfo = EVIDENCE_CATEGORIES.find((c) => c.value === evidence.category);

            return (
              <div
                key={evidence.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col overflow-hidden group"
              >
                {/* Thumbnail / File Header */}
                <div className="h-32 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {isImage && evidence.thumbnailLink ? (
                    <img
                      src={evidence.thumbnailLink}
                      alt={evidence.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <FileText className="w-10 h-10 text-blue-500" />
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {evidence.mimeType.split('/')[1] || 'PDF'}
                      </span>
                    </div>
                  )}

                  {/* Category Pill on top of Thumbnail */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                    <span>{catInfo?.icon || '📁'}</span>
                    <span className="truncate max-w-[120px]">{evidence.categoryLabel}</span>
                  </span>

                  {/* Google Drive Verified Badge */}
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-extrabold flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Drive</span>
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 line-clamp-1" title={evidence.fileName}>
                      {evidence.fileName}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {evidence.description || 'Tidak ada catatan tambahan.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{evidence.fileSizeBytesFormatted}</span>
                    <span>{new Date(evidence.uploadedAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewModalFile(evidence)}
                    className="flex-1 py-1.5 px-2 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lihat</span>
                  </button>

                  <a
                    href={evidence.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors"
                    title="Buka Langsung di Google Drive"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDelete(evidence.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 text-xs cursor-pointer transition-colors"
                    title="Hapus Bukti"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base">
                    Unggah Bukti ke Google Drive
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-xs">
                    Target Kapal: <strong>{vessel.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-4 sm:p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Drag & Drop File Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                  targetFile
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />

                {targetFile ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <div className="text-xs font-bold text-slate-800 truncate max-w-xs mx-auto">
                      {targetFile.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {formatBytes(targetFile.size)} • {targetFile.type || 'Berkas'}
                    </div>
                    <span className="text-[10px] text-blue-600 font-semibold underline mt-1 inline-block">
                      Ganti berkas lain
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-8 h-8 text-blue-500 mx-auto" />
                    <div className="text-xs font-bold text-slate-700">
                      Tarik file bukti ke sini, atau klik untuk memilih
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Mendukung Foto Kamera, Dokumen PDF, Gambar Beresolusi Tinggi (hingga 100MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Kategori Bukti */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Bukti Inspeksi:
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as EvidenceCategory)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {EVIDENCE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deskripsi & Temuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan Temuan Lapangan:
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Contoh: Foto kondisi tempat tidur ABK bagian buritan, ventilasi kurang memadai..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4 text-blue-600 animate-bounce" />
                      <span>Mengunggah ke Google Drive...</span>
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteUpload}
                disabled={isUploading || !targetFile}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isUploading ? (
                  <span>Mengunggah...</span>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Simpan ke Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewModalFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm truncate max-w-sm">
                  {previewModalFile.fileName}
                </h4>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>{previewModalFile.categoryLabel}</span>
                  <span>•</span>
                  <span>{previewModalFile.fileSizeBytesFormatted}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalFile(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-50 flex flex-col items-center justify-center">
              {previewModalFile.mimeType.startsWith('image/') && previewModalFile.thumbnailLink ? (
                <img
                  src={previewModalFile.thumbnailLink}
                  alt={previewModalFile.fileName}
                  className="max-h-[50vh] rounded-lg shadow-xs object-contain"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">
                    Dokumen Berkas Resmi
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs">
                    File ini tersimpan dalam format asli berukuran penuh di Google Drive.
                  </p>
                </div>
              )}

              <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl w-full text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900">Keterangan Bukti:</div>
                <p className="text-slate-600 leading-relaxed">
                  {previewModalFile.description || 'Tidak ada catatan tambahan.'}
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Diunggah oleh: {previewModalFile.uploadedBy} pada{' '}
                  {new Date(previewModalFile.uploadedAt).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setPreviewModalFile(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>

              <a
                href={previewModalFile.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka di Google Drive Asli</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
