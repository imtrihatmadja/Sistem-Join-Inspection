import React, { useState, useEffect } from 'react';
import { Vessel, InspectionRecord, VesselEvidence, EvidenceCategory } from '../types';
import {
  getStoredEvidences,
  EVIDENCE_CATEGORIES,
  formatBytes,
  getDriveAccessToken,
  setDriveAccessToken
} from '../services/googleDriveService';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  syncVesselsToSupabase,
  syncInspectionsToSupabase,
  syncEvidencesToSupabase,
  fetchVesselsFromSupabase,
  fetchInspectionsFromSupabase,
  fetchEvidencesFromSupabase,
  getCompleteSqlSchema
} from '../services/supabaseService';
import { reloadAllDataFromSupabase } from '../services/vesselService';
import {
  Database,
  HardDrive,
  Folder,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Search,
  Filter,
  FileText,
  Ship,
  Eye,
  Trash2,
  Sparkles,
  ShieldCheck,
  Code
} from 'lucide-react';
import { VesselEvidenceVault } from './VesselEvidenceVault';

interface CloudDatabaseViewProps {
  vessels: Vessel[];
  inspections: InspectionRecord[];
  onSelectVessel: (vessel: Vessel) => void;
}

export const CloudDatabaseView: React.FC<CloudDatabaseViewProps> = ({
  vessels,
  inspections,
  onSelectVessel
}) => {
  const [subTab, setSubTab] = useState<'DRIVE' | 'SUPABASE'>('DRIVE');
  const [evidences, setEvidences] = useState<VesselEvidence[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVesselId, setSelectedVesselId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    tableCounts?: { vessels: number; inspections: number; evidences: number };
  }>({
    tested: false,
    success: false,
    message: ''
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Active target vessel for modal upload
  const [targetVesselForUpload, setTargetVesselForUpload] = useState<Vessel | null>(null);

  useEffect(() => {
    loadEvidences();
    const creds = getSupabaseCredentials();
    setSupabaseUrl(creds.url);
    setSupabaseKey(creds.anonKey);

    // Initial silent connection check if url exists
    if (creds.url && creds.anonKey) {
      testSupabaseConnection(creds.url, creds.anonKey).then((res) => {
        setSupabaseStatus({
          tested: true,
          success: res.success,
          message: res.message,
          tableCounts: res.tableCounts
        });
      });
    }
  }, []);

  const loadEvidences = () => {
    setEvidences(getStoredEvidences());
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSyncResult(null);
    saveSupabaseCredentials(supabaseUrl, supabaseKey);

    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setSupabaseStatus({
      tested: true,
      success: res.success,
      message: res.message,
      tableCounts: res.tableCounts
    });
    setIsTestingSupabase(false);
  };

  const handlePullFromSupabase = async () => {
    setIsPulling(true);
    setSyncResult(null);
    try {
      saveSupabaseCredentials(supabaseUrl, supabaseKey);
      const res = await reloadAllDataFromSupabase();
      
      // Also pull evidences
      const eRes = await fetchEvidencesFromSupabase();
      if (eRes.data && eRes.data.length > 0) {
        localStorage.setItem('dfw_google_drive_evidences_v1', JSON.stringify(eRes.data));
        loadEvidences();
      }

      if (res.error) {
        setSyncResult(`Peringatan penarikan data: ${res.error}`);
      } else {
        setSyncResult(
          `Berhasil menarik dan menyinkronkan data dari Supabase! (${res.vesselsCount} Kapal, ${res.inspectionsCount} Inspeksi, ${eRes.data?.length || 0} Berkas Bukti) telah dimuat ke dalam daftar data aplikasi.`
        );
      }

      // Refresh table counts
      const testRes = await testSupabaseConnection(supabaseUrl, supabaseKey);
      if (testRes.tableCounts) {
        setSupabaseStatus((prev) => ({
          ...prev,
          tableCounts: testRes.tableCounts
        }));
      }
    } catch (err: any) {
      setSyncResult(`Gagal memuat data dari Supabase: ${err?.message || err}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handleSyncAllToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      saveSupabaseCredentials(supabaseUrl, supabaseKey);
      const vRes = await syncVesselsToSupabase(vessels);
      const iRes = await syncInspectionsToSupabase(inspections);
      const eRes = await syncEvidencesToSupabase(evidences);

      if (vRes.error || iRes.error || eRes.error) {
        setSyncResult(
          `Peringatan saat sinkronisasi: ${vRes.error || iRes.error || eRes.error}. Pastikan tabel SQL sudah dibuat di Supabase.`
        );
      } else {
        setSyncResult(
          `Berhasil sinkronisasi terpusat! (${vRes.count} Kapal, ${iRes.count} Inspeksi, ${eRes.count} Berkas Bukti) telah terunggah ke Supabase.`
        );
      }

      // Refresh table counts
      const testRes = await testSupabaseConnection(supabaseUrl, supabaseKey);
      if (testRes.tableCounts) {
        setSupabaseStatus((prev) => ({
          ...prev,
          tableCounts: testRes.tableCounts
        }));
      }
    } catch (err: any) {
      setSyncResult(`Gagal sinkronisasi: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getCompleteSqlSchema());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filtered evidences
  const filteredEvidences = evidences.filter((e) => {
    const matchSearch =
      e.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.vesselName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchVessel = selectedVesselId === 'ALL' || e.vesselId === selectedVesselId;
    const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;

    return matchSearch && matchVessel && matchCat;
  });

  const totalBytes = evidences.reduce((acc, e) => acc + (e.fileSize || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Banner & Sub-Tabs */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Pusat Penyimpanan Database & Cloud Storage
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Arsitektur Terpadu: <strong>Supabase</strong> untuk data relasional inspeksi & <strong>Google Drive</strong> untuk berkas bukti foto/dokumen besar per nama kapal.
          </p>
        </div>

        {/* Navigation Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setSubTab('DRIVE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'DRIVE'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive Bukti ({evidences.length})</span>
          </button>
          <button
            onClick={() => setSubTab('SUPABASE')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'SUPABASE'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Supabase</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: GOOGLE DRIVE STORAGE */}
      {subTab === 'DRIVE' && (
        <div className="space-y-4">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold">Total Berkas Terunggah</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                <span>{evidences.length}</span>
                <span className="text-xs font-normal text-slate-400">File</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold">Ukuran Data Google Drive</div>
              <div className="text-lg sm:text-xl font-bold text-blue-600 mt-1">
                {formatBytes(totalBytes)}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold">Kapal dengan Bukti</div>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 mt-1">
                {new Set(evidences.map((e) => e.vesselId)).size} / {vessels.length}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-semibold">Struktur Folder Drive</div>
              <div className="text-xs font-bold text-slate-700 mt-1 truncate">
                /DFW-Monev/[KAPAL]
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama file, kapal, atau catatan temuan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Filter Kapal */}
              <div>
                <select
                  value={selectedVesselId}
                  onChange={(e) => setSelectedVesselId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="ALL">Semua Kapal ({vessels.length} Kapal Terdaftar)</option>
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Kategori */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="ALL">Semua Kategori Berkas</option>
                  {EVIDENCE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grouped Folders by Vessel */}
          <div className="space-y-4">
            {vessels.map((vessel) => {
              const vEvidences = filteredEvidences.filter((e) => e.vesselId === vessel.id);
              if (selectedVesselId !== 'ALL' && selectedVesselId !== vessel.id) return null;
              if (searchTerm && vEvidences.length === 0) return null;

              const vTotalSize = vEvidences.reduce((acc, e) => acc + (e.fileSize || 0), 0);

              return (
                <div
                  key={vessel.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  {/* Folder Header */}
                  <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {vessel.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                            {vessel.registrationNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{vessel.homePort}</span>
                          <span>•</span>
                          <span>{vEvidences.length} Berkas Google Drive</span>
                          <span>•</span>
                          <span>{formatBytes(vTotalSize)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => onSelectVessel(vessel)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Ship className="w-3.5 h-3.5 text-blue-600" />
                        <span>Detail Profil</span>
                      </button>
                      <button
                        onClick={() => setTargetVesselForUpload(vessel)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>+ Unggah ke Kapal Ini</span>
                      </button>
                    </div>
                  </div>

                  {/* Evidence Items for this Vessel */}
                  <div className="p-3.5 sm:p-4">
                    {vEvidences.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                        Belum ada berkas terunggah untuk kapal ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {vEvidences.map((item) => {
                          const isImage = item.mimeType.startsWith('image/');
                          const catInfo = EVIDENCE_CATEGORIES.find((c) => c.value === item.category);

                          return (
                            <div
                              key={item.id}
                              className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2 transition-colors"
                            >
                              <div className="flex items-start gap-2.5">
                                {isImage && item.thumbnailLink ? (
                                  <img
                                    src={item.thumbnailLink}
                                    alt={item.fileName}
                                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <FileText className="w-6 h-6" />
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-800 truncate" title={item.fileName}>
                                    {item.fileName}
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-semibold mt-0.5">
                                    <span>{catInfo?.icon}</span>
                                    <span className="truncate">{item.categoryLabel}</span>
                                  </span>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {item.fileSizeBytesFormatted} • {new Date(item.uploadedAt).toLocaleDateString('id-ID')}
                                  </div>
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                                {item.description || 'Tidak ada catatan tambahan.'}
                              </p>

                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                <a
                                  href={item.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                                >
                                  <span>Buka di Google Drive</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SUPABASE DATABASE SYNC */}
      {subTab === 'SUPABASE' && (
        <div className="space-y-4">
          
          {/* Connection Status & Config Box */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <span>Konfigurasi Supabase PostgreSQL</span>
                    {supabaseStatus.success ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                        ● Terhubung
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
                        Standby / Lokal
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Menyimpan skema relasional tabel: <code>vessels</code>, <code>inspections</code>, dan <code>vessel_evidences</code>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTestSupabase}
                  disabled={isTestingSupabase}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[38px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  <span>Uji Koneksi</span>
                </button>
                <button
                  onClick={handlePullFromSupabase}
                  disabled={isPulling}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 min-h-[38px]"
                  title="Tarik seluruh data kapal dan inspeksi yang ada di Supabase ke dalam list tabel aplikasi"
                >
                  <DownloadCloud className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                  <span>{isPulling ? 'Menarik Data...' : 'Tarik & Tampilkan Data Supabase'}</span>
                </button>
                <button
                  onClick={handleSyncAllToSupabase}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 min-h-[38px]"
                >
                  <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Semua Data'}</span>
                </button>
              </div>
            </div>

            {/* Status Alert Banner */}
            {supabaseStatus.tested && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  supabaseStatus.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {supabaseStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold">{supabaseStatus.message}</div>
                  {supabaseStatus.tableCounts && (
                    <div className="mt-1 text-[11px] text-emerald-700 flex items-center gap-3">
                      <span>Baris Kapal di Supabase: <strong>{supabaseStatus.tableCounts.vessels}</strong></span>
                      <span>•</span>
                      <span>Baris Inspeksi: <strong>{supabaseStatus.tableCounts.inspections}</strong></span>
                      <span>•</span>
                      <span>Baris Bukti: <strong>{supabaseStatus.tableCounts.evidences}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {syncResult && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{syncResult}</span>
              </div>
            )}

            {/* Supabase URL & Anon Key Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Project URL:
                </label>
                <input
                  type="text"
                  placeholder="https://xyzproject.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  onBlur={() => {
                    if (supabaseUrl && supabaseKey) {
                      saveSupabaseCredentials(supabaseUrl, supabaseKey);
                      handleTestSupabase();
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Dapat diperoleh di dashboard Supabase: Project Settings → API → Project URL
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Anon (Public) Key:
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  onBlur={() => {
                    if (supabaseUrl && supabaseKey) {
                      saveSupabaseCredentials(supabaseUrl, supabaseKey);
                      handleTestSupabase();
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Dapat diperoleh di dashboard Supabase: Project Settings → API → anon public API Key
                </span>
              </div>
            </div>
          </div>

          {/* DDL SQL Schema Generator & Copy Box */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  <span>Script Skema DDL Database Supabase (PostgreSQL)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Jalankan skrip ini sekali di menu <strong>SQL Editor</strong> pada dashboard Supabase Anda.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                {copiedSql ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Seluruh SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
              <code>{getCompleteSqlSchema()}</code>
            </pre>
          </div>

        </div>
      )}

      {/* Upload Modal for specific target vessel */}
      {targetVesselForUpload && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  Unggah Bukti Google Drive: {targetVesselForUpload.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {targetVesselForUpload.registrationNumber} • {targetVesselForUpload.homePort}
                </p>
              </div>
              <button
                onClick={() => setTargetVesselForUpload(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Tutup [X]
              </button>
            </div>

            <VesselEvidenceVault
              vessel={targetVesselForUpload}
              evidences={evidences}
              onEvidenceChange={() => {
                loadEvidences();
                setTargetVesselForUpload(null);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
