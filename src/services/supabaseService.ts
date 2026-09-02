import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Vessel, InspectionRecord, VesselEvidence, SupabaseConfig } from '../types';

const SUPABASE_STORAGE_URL_KEY = 'dfw_supabase_url_cfg';
const SUPABASE_STORAGE_KEY_KEY = 'dfw_supabase_anon_key_cfg';

// Built-in system fallback defaults if environment variable or localStorage is not set
export const DEFAULT_SUPABASE_CONFIG = {
  url: '',
  anonKey: ''
};

export function getSupabaseCredentials(): { url: string; anonKey: string; isLockedGlobal: boolean } {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(SUPABASE_STORAGE_URL_KEY);
  const storedKey = localStorage.getItem(SUPABASE_STORAGE_KEY_KEY);

  const effectiveUrl = (storedUrl || envUrl || DEFAULT_SUPABASE_CONFIG.url || '').trim();
  const effectiveKey = (storedKey || envKey || DEFAULT_SUPABASE_CONFIG.anonKey || '').trim();

  // If provided via VITE_ build variable or DEFAULT_SUPABASE_CONFIG without custom local overrides
  const isLockedGlobal = Boolean((envUrl || DEFAULT_SUPABASE_CONFIG.url) && !storedUrl);

  return {
    url: effectiveUrl,
    anonKey: effectiveKey,
    isLockedGlobal
  };
}

export function resetToGlobalSupabaseCredentials() {
  localStorage.removeItem(SUPABASE_STORAGE_URL_KEY);
  localStorage.removeItem(SUPABASE_STORAGE_KEY_KEY);
  cachedClient = null;
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  localStorage.setItem(SUPABASE_STORAGE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_STORAGE_KEY_KEY, anonKey.trim());
  cachedClient = null; // reset client
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase Client:', err);
    return null;
  }
}

/**
 * Test connectivity with Supabase project
 */
export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; tableCounts?: { vessels: number; inspections: number; evidences: number } }> {
  const { url, anonKey } = customUrl && customKey
    ? { url: customUrl, anonKey: customKey }
    : getSupabaseCredentials();

  if (!url || !anonKey) {
    return {
      success: false,
      message: 'URL Project dan Anon Public Key Supabase belum dikonfigurasi.'
    };
  }

  try {
    const client = createClient(url, anonKey);
    
    // Check vessels table
    const { count: vCount, error: vErr } = await client
      .from('vessels')
      .select('*', { count: 'exact', head: true });

    if (vErr) {
      if (vErr.code === '42P01') {
        return {
          success: true,
          message: 'Terkoneksi ke Supabase! Tabel "vessels" belum dibuat. Silakan jalankan script SQL Schema di Supabase SQL Editor.',
          tableCounts: { vessels: 0, inspections: 0, evidences: 0 }
        };
      }
      return {
        success: false,
        message: `Koneksi gagal: ${vErr.message} (Code: ${vErr.code})`
      };
    }

    const { count: iCount } = await client
      .from('inspections')
      .select('*', { count: 'exact', head: true });

    const { count: eCount } = await client
      .from('vessel_evidences')
      .select('*', { count: 'exact', head: true });

    return {
      success: true,
      message: 'Koneksi Supabase aktif & terverifikasi!',
      tableCounts: {
        vessels: vCount || 0,
        inspections: iCount || 0,
        evidences: eCount || 0
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi server Supabase: ${err?.message || err}`
    };
  }
}

/**
 * Helper to sanitize JavaScript objects for PostgreSQL JSONB columns
 */
function sanitizeForJsonb(obj: any): any {
  if (obj === undefined || obj === null) return null;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.warn('Error sanitizing for JSONB:', e);
    return null;
  }
}

/**
 * Helper to safely parse JSONB / JSON string values
 */
function safeParseJsonb(val: any): any {
  if (!val) return undefined;
  let current = val;
  while (typeof current === 'string') {
    try {
      current = JSON.parse(current);
    } catch {
      break;
    }
  }
  return current;
}

/**
 * Sync Local Vessels to Supabase Database
 */
export async function syncVesselsToSupabase(vessels: Vessel[]): Promise<{ count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { count: 0, error: 'Supabase client belum aktif' };

  try {
    const records = vessels.map((v) => ({
      id: v.id,
      name: v.name,
      fisheries_register_number: v.fisheriesRegisterNumber || null,
      registration_number: v.registrationNumber,
      gross_tonnage: Number(v.grossTonnage) || 0,
      call_sign: v.callSign || null,
      owner_name: v.ownerName,
      agent_name: v.agentName || null,
      home_port: v.homePort,
      secondary_home_port: v.secondaryHomePort || null,
      gear_type: v.gearType,
      crew_capacity: Number(v.crewCapacity) || 0,
      risk_score: Number(v.riskScore) || 0,
      risk_level: v.riskLevel,
      total_inspections: Number(v.totalInspections) || 0,
      last_inspection_date: v.lastInspectionDate ? v.lastInspectionDate.split('T')[0] : null,
      last_inspection_port: v.lastInspectionPort || null,
      status: v.status || 'ACTIVE',
      active_violations_count: Number(v.activeViolationsCount) || 0,
      critical_violations_count: Number(v.criticalViolationsCount) || 0,
      last_recommendation: v.lastRecommendation || null,
      latest_checklist: sanitizeForJsonb(v.latestChecklist),
      updated_at: new Date().toISOString()
    }));

    const { error } = await client
      .from('vessels')
      .upsert(records, { onConflict: 'id' });

    if (error) throw error;
    return { count: records.length };
  } catch (err: any) {
    console.error('Supabase vessels sync error:', err);
    return { count: 0, error: err?.message || 'Gagal sinkronisasi data kapal ke Supabase' };
  }
}

/**
 * Save / Upsert Single Vessel to Supabase
 */
export async function saveSingleVesselToSupabase(v: Vessel): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client belum dikonfigurasi' };

  try {
    const record = {
      id: v.id,
      name: v.name,
      fisheries_register_number: v.fisheriesRegisterNumber || null,
      registration_number: v.registrationNumber,
      gross_tonnage: Number(v.grossTonnage) || 0,
      call_sign: v.callSign || null,
      owner_name: v.ownerName,
      agent_name: v.agentName || null,
      home_port: v.homePort,
      secondary_home_port: v.secondaryHomePort || null,
      gear_type: v.gearType,
      crew_capacity: Number(v.crewCapacity) || 0,
      risk_score: Number(v.riskScore) || 0,
      risk_level: v.riskLevel || 'LOW',
      total_inspections: Number(v.totalInspections) || 0,
      last_inspection_date: v.lastInspectionDate ? v.lastInspectionDate.split('T')[0] : null,
      last_inspection_port: v.lastInspectionPort || null,
      status: v.status || 'ACTIVE',
      active_violations_count: Number(v.activeViolationsCount) || 0,
      critical_violations_count: Number(v.criticalViolationsCount) || 0,
      last_recommendation: v.lastRecommendation || null,
      latest_checklist: sanitizeForJsonb(v.latestChecklist),
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from('vessels')
      .upsert([record], { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Supabase save single vessel error:', err);
    return { success: false, error: err?.message || 'Gagal menyimpan kapal ke Supabase' };
  }
}

/**
 * Sync Local Inspections to Supabase Database
 */
export async function syncInspectionsToSupabase(inspections: InspectionRecord[]): Promise<{ count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { count: 0, error: 'Supabase client belum aktif' };

  try {
    const records = inspections.map((i) => {
      // Enrich checklistData with audit metadata to ensure PostgreSQL JSONB stores full history
      const enrichedChecklist = i.checklistData ? {
        ...i.checklistData,
        _auditLogs: i.changeLogs || [],
        _previousForm: i.previousChecklistData || null,
        _updatedAt: i.updatedAt || new Date().toISOString(),
        _updatedBy: i.updatedBy || i.createdBy || 'Pengawas'
      } : null;

      return {
        id: i.id,
        vessel_id: i.vesselId,
        vessel_name: i.vesselName,
        registration_number: i.registrationNumber,
        home_port: i.homePort,
        secondary_home_port: i.secondaryHomePort || null,
        inspection_date: i.inspectionDate ? i.inspectionDate.split('T')[0] : new Date().toISOString().split('T')[0],
        inspection_port: i.inspectionPort,
        lead_agency: i.leadAgency,
        inspectors: i.inspectors,
        crew_data: sanitizeForJsonb(i.crewData),
        checklist_data: sanitizeForJsonb(enrichedChecklist),
        violations: sanitizeForJsonb(i.violations || []),
        risk_evaluation: sanitizeForJsonb(i.riskEvaluation),
        follow_up_status: i.followUpStatus,
        official_notes: i.officialNotes,
        action_deadline: i.actionDeadline ? i.actionDeadline.split('T')[0] : null,
        created_by: i.createdBy,
        created_at: i.createdAt || new Date().toISOString()
      };
    });

    const { error } = await client
      .from('inspections')
      .upsert(records, { onConflict: 'id' });

    if (error) throw error;
    return { count: records.length };
  } catch (err: any) {
    console.error('Supabase inspections sync error:', err);
    return { count: 0, error: err?.message || 'Gagal sinkronisasi data inspeksi ke Supabase' };
  }
}

/**
 * Save / Upsert Single Inspection to Supabase
 */
export async function saveSingleInspectionToSupabase(i: InspectionRecord): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client belum aktif' };

  try {
    const enrichedChecklist = i.checklistData ? {
      ...i.checklistData,
      _auditLogs: i.changeLogs || [],
      _previousForm: i.previousChecklistData || null,
      _updatedAt: i.updatedAt || new Date().toISOString(),
      _updatedBy: i.updatedBy || i.createdBy || 'Pengawas'
    } : null;

    const record = {
      id: i.id,
      vessel_id: i.vesselId,
      vessel_name: i.vesselName,
      registration_number: i.registrationNumber,
      home_port: i.homePort,
      secondary_home_port: i.secondaryHomePort || null,
      inspection_date: i.inspectionDate ? i.inspectionDate.split('T')[0] : new Date().toISOString().split('T')[0],
      inspection_port: i.inspectionPort,
      lead_agency: i.leadAgency,
      inspectors: i.inspectors,
      crew_data: sanitizeForJsonb(i.crewData),
      checklist_data: sanitizeForJsonb(enrichedChecklist),
      violations: sanitizeForJsonb(i.violations || []),
      risk_evaluation: sanitizeForJsonb(i.riskEvaluation),
      follow_up_status: i.followUpStatus,
      official_notes: i.officialNotes,
      action_deadline: i.actionDeadline ? i.actionDeadline.split('T')[0] : null,
      created_by: i.createdBy,
      created_at: i.createdAt || new Date().toISOString()
    };

    const { error } = await client
      .from('inspections')
      .upsert([record], { onConflict: 'id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Supabase single inspection save error:', err);
    return { success: false, error: err?.message || 'Gagal menyimpan inspeksi ke Supabase' };
  }
}

/**
 * Update follow up status in Supabase
 */
export async function updateInspectionStatusInSupabase(
  inspectionId: string,
  newStatus: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client belum aktif' };

  try {
    const payload: Record<string, any> = { follow_up_status: newStatus };
    if (notes) payload.official_notes = notes;

    const { error } = await client
      .from('inspections')
      .update(payload)
      .eq('id', inspectionId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Supabase follow-up update error:', err);
    return { success: false, error: err?.message || 'Gagal update status di Supabase' };
  }
}

/**
 * Sync Evidences / Google Drive Metadata to Supabase
 */
export async function syncEvidencesToSupabase(evidences: VesselEvidence[]): Promise<{ count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { count: 0, error: 'Supabase client belum aktif' };

  try {
    const records = evidences.map((e) => ({
      id: e.id,
      vessel_id: e.vesselId,
      vessel_name: e.vesselName,
      vessel_registration: e.vesselRegistration,
      inspection_id: e.inspectionId || null,
      file_name: e.fileName,
      file_size: e.fileSize,
      file_size_formatted: e.fileSizeBytesFormatted,
      mime_type: e.mimeType,
      category: e.category,
      category_label: e.categoryLabel,
      description: e.description,
      drive_file_id: e.driveFileId,
      drive_folder_id: e.driveFolderId || null,
      drive_folder_name: e.driveFolderName || null,
      web_view_link: e.webViewLink,
      web_content_link: e.webContentLink || null,
      thumbnail_link: e.thumbnailLink || null,
      uploaded_by: e.uploadedBy,
      uploaded_at: e.uploadedAt,
      storage_provider: e.storageProvider,
      sync_status: e.syncStatus
    }));

    const { error } = await client
      .from('vessel_evidences')
      .upsert(records, { onConflict: 'id' });

    if (error) throw error;
    return { count: records.length };
  } catch (err: any) {
    console.error('Supabase evidences sync error:', err);
    return { count: 0, error: err?.message || 'Gagal sinkronisasi data bukti ke Supabase' };
  }
}

/**
 * Fetch all Vessels from Supabase (PostgreSQL)
 */
export async function fetchVesselsFromSupabase(): Promise<{ data: Vessel[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: 'Supabase client belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('vessels')
      .select('*')
      .order('risk_score', { ascending: false });

    if (error) throw error;
    if (!data) return { data: [] };

    const vessels: Vessel[] = data.map((row: any) => {
      const parsedChecklist = safeParseJsonb(row.latest_checklist);

      return {
        id: row.id,
        name: row.name || 'Kapal Tanpa Nama',
        fisheriesRegisterNumber: row.fisheries_register_number || row.fisheries_reg_number || undefined,
        registrationNumber: row.registration_number || row.id,
        grossTonnage: Number(row.gross_tonnage) || 0,
        callSign: row.call_sign || '',
        ownerName: row.owner_name || 'Tidak Diketahui',
        agentName: row.agent_name || '',
        homePort: row.home_port || 'Pelabuhan Tidak Diketahui',
        secondaryHomePort: row.secondary_home_port || undefined,
        gearType: row.gear_type || 'Alat Tangkap',
        crewCapacity: Number(row.crew_capacity) || 0,
        riskScore: Number(row.risk_score) || 0,
        riskLevel: row.risk_level || 'LOW',
        totalInspections: Number(row.total_inspections) || 0,
        lastInspectionDate: row.last_inspection_date || undefined,
        lastInspectionPort: row.last_inspection_port || undefined,
        status: row.status || 'ACTIVE',
        activeViolationsCount: Number(row.active_violations_count) || 0,
        criticalViolationsCount: Number(row.critical_violations_count) || 0,
        lastRecommendation: row.last_recommendation || '',
        latestChecklist: parsedChecklist,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString()
      };
    });

    return { data: vessels };
  } catch (err: any) {
    console.error('Fetch vessels from Supabase error:', err);
    return { data: [], error: err?.message || 'Gagal mengambil data kapal dari Supabase' };
  }
}

/**
 * Fetch all Inspections from Supabase (PostgreSQL)
 */
export async function fetchInspectionsFromSupabase(): Promise<{ data: InspectionRecord[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: 'Supabase client belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('inspections')
      .select('*')
      .order('inspection_date', { ascending: false });

    if (error) throw error;
    if (!data) return { data: [] };

    const inspections: InspectionRecord[] = data.map((row: any) => {
      const crewData = safeParseJsonb(row.crew_data) || { totalCrew: 0, maleCount: 0, femaleCount: 0, pklHoldersCount: 0, bpjsTkCount: 0, bpjsHealthCount: 0 };
      const checklistData = safeParseJsonb(row.checklist_data);
      const violations = safeParseJsonb(row.violations) || [];
      const riskEvaluation = safeParseJsonb(row.risk_evaluation) || {
        score: 0,
        complianceRate: 0,
        riskLevel: 'LOW',
        calculatedAt: new Date().toISOString(),
        recommendation: '',
        primaryRiskFactors: []
      };

      // Restore changeLogs and previousChecklistData if embedded or in row
      const changeLogs = row.change_logs ? safeParseJsonb(row.change_logs) : (checklistData?._auditLogs || []);
      const previousChecklistData = row.previous_checklist_data ? safeParseJsonb(row.previous_checklist_data) : (checklistData?._previousForm || undefined);
      const updatedAt = row.updated_at || checklistData?._updatedAt || row.created_at || new Date().toISOString();
      const updatedBy = row.updated_by || checklistData?._updatedBy || row.created_by || 'Pengawas Lapangan';

      return {
        id: row.id,
        vesselId: row.vessel_id,
        vesselName: row.vessel_name || 'Kapal Tanpa Nama',
        registrationNumber: row.registration_number || '',
        homePort: row.home_port || '',
        secondaryHomePort: row.secondary_home_port || undefined,
        inspectionDate: row.inspection_date || new Date().toISOString().split('T')[0],
        inspectionPort: row.inspection_port || '',
        leadAgency: row.lead_agency || 'Kemnaker & KKP',
        inspectors: row.inspectors || '',
        crewData: crewData as any,
        checklistData: checklistData as any,
        previousChecklistData: previousChecklistData as any,
        violations: violations as any,
        riskEvaluation: riskEvaluation as any,
        followUpStatus: row.follow_up_status || 'PENDING',
        officialNotes: row.official_notes || '',
        actionDeadline: row.action_deadline || undefined,
        createdBy: row.created_by || 'Admin Pengawas',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: updatedAt,
        updatedBy: updatedBy,
        changeLogs: Array.isArray(changeLogs) ? changeLogs : []
      };
    });

    return { data: inspections };
  } catch (err: any) {
    console.error('Fetch inspections from Supabase error:', err);
    return { data: [], error: err?.message || 'Gagal mengambil data inspeksi dari Supabase' };
  }
}

/**
 * Fetch all Evidences from Supabase (PostgreSQL)
 */
export async function fetchEvidencesFromSupabase(): Promise<{ data: VesselEvidence[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { data: [], error: 'Supabase client belum dikonfigurasi' };

  try {
    const { data, error } = await client
      .from('vessel_evidences')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    if (!data) return { data: [] };

    const evidences: VesselEvidence[] = data.map((row: any) => ({
      id: row.id,
      vesselId: row.vessel_id,
      vesselName: row.vessel_name,
      vesselRegistration: row.vessel_registration || '',
      inspectionId: row.inspection_id || undefined,
      fileName: row.file_name,
      fileSize: Number(row.file_size) || 0,
      fileSizeBytesFormatted: row.file_size_formatted || '0 B',
      mimeType: row.mime_type || 'application/octet-stream',
      category: row.category,
      categoryLabel: row.category_label || row.category,
      description: row.description || '',
      driveFileId: row.drive_file_id,
      driveFolderId: row.drive_folder_id || undefined,
      driveFolderName: row.drive_folder_name || undefined,
      webViewLink: row.web_view_link,
      webContentLink: row.web_content_link || undefined,
      thumbnailLink: row.thumbnail_link || undefined,
      uploadedBy: row.uploaded_by || 'Inspector',
      uploadedAt: row.uploaded_at || new Date().toISOString(),
      storageProvider: row.storage_provider || 'GOOGLE_DRIVE',
      syncStatus: row.sync_status || 'SYNCED'
    }));

    return { data: evidences };
  } catch (err: any) {
    console.error('Fetch evidences from Supabase error:', err);
    return { data: [], error: err?.message || 'Gagal mengambil data bukti dari Supabase' };
  }
}

/**
 * Delete a Vessel and its cascade relations from Supabase
 */
export async function deleteVesselFromSupabase(vesselId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client belum dikonfigurasi' };

  try {
    // Delete inspections first (if cascade is not enabled or for safe redundancy)
    await client.from('inspections').delete().eq('vessel_id', vesselId);
    await client.from('vessel_evidences').delete().eq('vessel_id', vesselId);

    // Delete vessel
    const { error } = await client.from('vessels').delete().eq('id', vesselId);
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error('Delete vessel from Supabase error:', err);
    return { success: false, error: err?.message || 'Gagal menghapus kapal dari Supabase' };
  }
}

/**
 * Delete an Inspection from Supabase
 */
export async function deleteInspectionFromSupabase(inspectionId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase client belum dikonfigurasi' };

  try {
    const { error } = await client.from('inspections').delete().eq('id', inspectionId);
    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error('Delete inspection from Supabase error:', err);
    return { success: false, error: err?.message || 'Gagal menghapus inspeksi dari Supabase' };
  }
}

/**
 * Returns concise SQL migration script to update existing database tables in Supabase
 */
export function getMigrationSqlScript(): string {
  return `-- =========================================================================
-- SKRIP UPDATE / MIGRASI DATABASE SUPABASE (JALANKAN DI SQL EDITOR)
-- 1. Menambahkan kolom fisheries_register_number (No. Register Kapal Perikanan)
-- 2. Menambahkan indeks unik anti-duplikasi kapal
-- 3. Menambahkan dukungan Pelabuhan Pangkalan ke-2 (Secondary Home Port)
-- =========================================================================

-- 1. Tambah kolom fisheries_register_number (No. Register Kapal Perikanan) di tabel vessels
ALTER TABLE IF EXISTS public.vessels 
ADD COLUMN IF NOT EXISTS fisheries_register_number VARCHAR(100);

-- 2. Tambah kolom fisheries_register_number di tabel inspections
ALTER TABLE IF EXISTS public.inspections 
ADD COLUMN IF NOT EXISTS fisheries_register_number VARCHAR(100);

-- 3. Tambah indeks unik anti-duplikasi kapal (No. Register Kapal Perikanan tidak boleh sama)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vessels_fisheries_reg_unique 
ON public.vessels (fisheries_register_number) 
WHERE fisheries_register_number IS NOT NULL AND fisheries_register_number <> '';

-- 4. Tambah kolom secondary_home_port di tabel vessels & inspections
ALTER TABLE IF EXISTS public.vessels 
ADD COLUMN IF NOT EXISTS secondary_home_port VARCHAR(255);

ALTER TABLE IF EXISTS public.inspections 
ADD COLUMN IF NOT EXISTS secondary_home_port VARCHAR(255);

-- 5. Tambah indeks pencarian cepat
CREATE INDEX IF NOT EXISTS idx_vessels_fisheries_reg ON public.vessels (fisheries_register_number);
CREATE INDEX IF NOT EXISTS idx_vessels_secondary_port ON public.vessels (secondary_home_port);
CREATE INDEX IF NOT EXISTS idx_inspections_secondary_port ON public.inspections (secondary_home_port);
`;
}

/**
 * Returns PostgreSQL DDL SQL Schema Script for Supabase (Full Database Creation)
 */
export function getCompleteSqlSchema(): string {
  return `-- =========================================================================
-- BLUEPRINT DATABASE TERPUSAT INSPEKSI BERSAMA KAPAL PERIKANAN
-- Database Engine: PostgreSQL (Supabase)
-- Standar: ILO C188 / PSMA / KKP / Kemnaker RI
-- =========================================================================

-- 1. TABEL UTAMA KAPAL (VESSELS)
CREATE TABLE IF NOT EXISTS public.vessels (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    fisheries_register_number VARCHAR(100) UNIQUE, -- No. Register Kapal Perikanan (Unik / Anti-Duplikasi)
    registration_number VARCHAR(100) NOT NULL,     -- Nomor SIPI / SIUP / Perizinan Berusaha
    gross_tonnage NUMERIC NOT NULL DEFAULT 0,
    call_sign VARCHAR(50),
    owner_name VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255),
    home_port VARCHAR(255) NOT NULL, -- Pelabuhan Pangkalan 1 (Utama)
    secondary_home_port VARCHAR(255), -- Pelabuhan Pangkalan 2 (Tambahan / Sekunder)
    gear_type VARCHAR(150) NOT NULL,
    crew_capacity INT NOT NULL DEFAULT 0,
    risk_score INT NOT NULL DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH'
    total_inspections INT NOT NULL DEFAULT 0,
    last_inspection_date DATE,
    last_inspection_port VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'FLAGGED', 'SUSPENDED', 'CLEARED'
    active_violations_count INT NOT NULL DEFAULT 0,
    critical_violations_count INT NOT NULL DEFAULT 0,
    last_recommendation TEXT,
    latest_checklist JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indeks Pencarian Kapal
CREATE INDEX IF NOT EXISTS idx_vessels_name ON public.vessels (name);
CREATE INDEX IF NOT EXISTS idx_vessels_fisheries_reg ON public.vessels (fisheries_register_number);
CREATE INDEX IF NOT EXISTS idx_vessels_reg ON public.vessels (registration_number);
CREATE INDEX IF NOT EXISTS idx_vessels_risk ON public.vessels (risk_level, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_vessels_port ON public.vessels (home_port);
CREATE INDEX IF NOT EXISTS idx_vessels_sec_port ON public.vessels (secondary_home_port);

-- 2. TABEL HASIL INSPEKSI BERSAMA (INSPECTIONS)
CREATE TABLE IF NOT EXISTS public.inspections (
    id VARCHAR(64) PRIMARY KEY,
    vessel_id VARCHAR(64) NOT NULL REFERENCES public.vessels(id) ON DELETE CASCADE,
    vessel_name VARCHAR(255) NOT NULL,
    fisheries_register_number VARCHAR(100),
    registration_number VARCHAR(100) NOT NULL,
    home_port VARCHAR(255) NOT NULL,
    secondary_home_port VARCHAR(255),
    inspection_date DATE NOT NULL,
    inspection_port VARCHAR(255) NOT NULL,
    lead_agency VARCHAR(255) NOT NULL,
    inspectors TEXT NOT NULL,
    crew_data JSONB NOT NULL,
    checklist_data JSONB,
    violations JSONB NOT NULL DEFAULT '[]'::jsonb,
    risk_evaluation JSONB NOT NULL,
    follow_up_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    official_notes TEXT,
    action_deadline DATE,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inspections_vessel ON public.inspections (vessel_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON public.inspections (inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_port ON public.inspections (inspection_port);
CREATE INDEX IF NOT EXISTS idx_inspections_sec_port ON public.inspections (secondary_home_port);

-- 3. TABEL BUKTI FOTO & DOKUMEN GOOGLE DRIVE (VESSEL_EVIDENCES)
-- Mengikat setiap file foto dan dokumen berukuran besar langsung pada nama kapal
CREATE TABLE IF NOT EXISTS public.vessel_evidences (
    id VARCHAR(64) PRIMARY KEY,
    vessel_id VARCHAR(64) NOT NULL REFERENCES public.vessels(id) ON DELETE CASCADE,
    vessel_name VARCHAR(255) NOT NULL,
    vessel_registration VARCHAR(100),
    inspection_id VARCHAR(64) REFERENCES public.inspections(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_size_formatted VARCHAR(50),
    mime_type VARCHAR(100) NOT NULL,
    category VARCHAR(80) NOT NULL,
    category_label VARCHAR(150) NOT NULL,
    description TEXT,
    drive_file_id VARCHAR(255) NOT NULL,
    drive_folder_id VARCHAR(255),
    drive_folder_name VARCHAR(255),
    web_view_link TEXT NOT NULL,
    web_content_link TEXT,
    thumbnail_link TEXT,
    uploaded_by VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'GOOGLE_DRIVE',
    sync_status VARCHAR(50) DEFAULT 'SYNCED'
);

CREATE INDEX IF NOT EXISTS idx_evidences_vessel ON public.vessel_evidences (vessel_id);
CREATE INDEX IF NOT EXISTS idx_evidences_category ON public.vessel_evidences (category);
CREATE INDEX IF NOT EXISTS idx_evidences_drive_id ON public.vessel_evidences (drive_file_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessel_evidences ENABLE ROW LEVEL SECURITY;

-- Allow Read & Write for Authenticated / Anon Service Role
CREATE POLICY "Public Read Vessels" ON public.vessels FOR SELECT USING (true);
CREATE POLICY "Public Upsert Vessels" ON public.vessels FOR ALL USING (true);

CREATE POLICY "Public Read Inspections" ON public.inspections FOR SELECT USING (true);
CREATE POLICY "Public Upsert Inspections" ON public.inspections FOR ALL USING (true);

CREATE POLICY "Public Read Evidences" ON public.vessel_evidences FOR SELECT USING (true);
CREATE POLICY "Public Upsert Evidences" ON public.vessel_evidences FOR ALL USING (true);
`;
}
