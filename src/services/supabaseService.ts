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
 * Sync Local Vessels to Supabase Database
 */
export async function syncVesselsToSupabase(vessels: Vessel[]): Promise<{ count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { count: 0, error: 'Supabase client belum aktif' };

  try {
    const records = vessels.map((v) => ({
      id: v.id,
      name: v.name,
      registration_number: v.registrationNumber,
      gross_tonnage: Number(v.grossTonnage) || 0,
      call_sign: v.callSign || null,
      owner_name: v.ownerName,
      agent_name: v.agentName || null,
      home_port: v.homePort,
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
      latest_checklist: v.latestChecklist ? JSON.stringify(v.latestChecklist) : null,
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
      registration_number: v.registrationNumber,
      gross_tonnage: Number(v.grossTonnage) || 0,
      call_sign: v.callSign || null,
      owner_name: v.ownerName,
      agent_name: v.agentName || null,
      home_port: v.homePort,
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
      latest_checklist: v.latestChecklist ? JSON.stringify(v.latestChecklist) : null,
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
    const records = inspections.map((i) => ({
      id: i.id,
      vessel_id: i.vesselId,
      vessel_name: i.vesselName,
      registration_number: i.registrationNumber,
      home_port: i.homePort,
      inspection_date: i.inspectionDate,
      inspection_port: i.inspectionPort,
      lead_agency: i.leadAgency,
      inspectors: i.inspectors,
      crew_data: JSON.stringify(i.crewData),
      checklist_data: i.checklistData ? JSON.stringify(i.checklistData) : null,
      violations: JSON.stringify(i.violations),
      risk_evaluation: JSON.stringify(i.riskEvaluation),
      follow_up_status: i.followUpStatus,
      official_notes: i.officialNotes,
      action_deadline: i.actionDeadline || null,
      created_by: i.createdBy,
      created_at: i.createdAt || new Date().toISOString()
    }));

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
    const record = {
      id: i.id,
      vessel_id: i.vesselId,
      vessel_name: i.vesselName,
      registration_number: i.registrationNumber,
      home_port: i.homePort,
      inspection_date: i.inspectionDate ? i.inspectionDate.split('T')[0] : new Date().toISOString().split('T')[0],
      inspection_port: i.inspectionPort,
      lead_agency: i.leadAgency,
      inspectors: i.inspectors,
      crew_data: JSON.stringify(i.crewData),
      checklist_data: i.checklistData ? JSON.stringify(i.checklistData) : null,
      violations: JSON.stringify(i.violations || []),
      risk_evaluation: JSON.stringify(i.riskEvaluation),
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
      let parsedChecklist = undefined;
      if (row.latest_checklist) {
        try {
          parsedChecklist = typeof row.latest_checklist === 'string' 
            ? JSON.parse(row.latest_checklist) 
            : row.latest_checklist;
        } catch (e) {
          console.warn('Error parsing latest_checklist from Supabase:', e);
        }
      }

      return {
        id: row.id,
        name: row.name || 'Kapal Tanpa Nama',
        registrationNumber: row.registration_number || row.id,
        grossTonnage: Number(row.gross_tonnage) || 0,
        callSign: row.call_sign || '',
        ownerName: row.owner_name || 'Tidak Diketahui',
        agentName: row.agent_name || '',
        homePort: row.home_port || 'Pelabuhan Tidak Diketahui',
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
      let crewData = { totalCrew: 0, maleCount: 0, femaleCount: 0, pklHoldersCount: 0, bpjsTkCount: 0, bpjsHealthCount: 0 };
      let checklistData = undefined;
      let violations = [];
      let riskEvaluation = {
        score: 0,
        complianceRate: 0,
        riskLevel: 'LOW',
        calculatedAt: new Date().toISOString(),
        recommendation: '',
        primaryRiskFactors: []
      };

      try {
        if (row.crew_data) {
          crewData = typeof row.crew_data === 'string' ? JSON.parse(row.crew_data) : row.crew_data;
        }
      } catch (e) {
        console.warn('Error parsing crew_data from Supabase:', e);
      }

      try {
        if (row.checklist_data) {
          checklistData = typeof row.checklist_data === 'string' ? JSON.parse(row.checklist_data) : row.checklist_data;
        }
      } catch (e) {
        console.warn('Error parsing checklist_data from Supabase:', e);
      }

      try {
        if (row.violations) {
          violations = typeof row.violations === 'string' ? JSON.parse(row.violations) : row.violations;
        }
      } catch (e) {
        console.warn('Error parsing violations from Supabase:', e);
      }

      try {
        if (row.risk_evaluation) {
          riskEvaluation = typeof row.risk_evaluation === 'string' ? JSON.parse(row.risk_evaluation) : row.risk_evaluation;
        }
      } catch (e) {
        console.warn('Error parsing risk_evaluation from Supabase:', e);
      }

      return {
        id: row.id,
        vesselId: row.vessel_id,
        vesselName: row.vessel_name || 'Kapal Tanpa Nama',
        registrationNumber: row.registration_number || '',
        homePort: row.home_port || '',
        inspectionDate: row.inspection_date || new Date().toISOString().split('T')[0],
        inspectionPort: row.inspection_port || '',
        leadAgency: row.lead_agency || 'Kemnaker & KKP',
        inspectors: row.inspectors || '',
        crewData: crewData as any,
        checklistData: checklistData as any,
        violations: violations as any,
        riskEvaluation: riskEvaluation as any,
        followUpStatus: row.follow_up_status || 'PENDING',
        officialNotes: row.official_notes || '',
        actionDeadline: row.action_deadline || undefined,
        createdBy: row.created_by || 'Admin DFW',
        createdAt: row.created_at || new Date().toISOString()
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
 * Returns PostgreSQL DDL SQL Schema Script for Supabase
 */
export function getCompleteSqlSchema(): string {
  return `-- =========================================================================
-- BLUEPRINT DATABASE TERPUSAT INSPEKSI BERSAMA KAPAL PERIKANAN (DFW INDONESIA)
-- Database Engine: PostgreSQL (Supabase)
-- Standar: ILO C188 / PSMA / KKP / Kemnaker RI
-- =========================================================================

-- 1. TABEL UTAMA KAPAL (VESSELS)
CREATE TABLE IF NOT EXISTS public.vessels (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    gross_tonnage NUMERIC NOT NULL DEFAULT 0,
    call_sign VARCHAR(50),
    owner_name VARCHAR(255) NOT NULL,
    agent_name VARCHAR(255),
    home_port VARCHAR(255) NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_vessels_reg ON public.vessels (registration_number);
CREATE INDEX IF NOT EXISTS idx_vessels_risk ON public.vessels (risk_level, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_vessels_port ON public.vessels (home_port);

-- 2. TABEL HASIL INSPEKSI BERSAMA (INSPECTIONS)
CREATE TABLE IF NOT EXISTS public.inspections (
    id VARCHAR(64) PRIMARY KEY,
    vessel_id VARCHAR(64) NOT NULL REFERENCES public.vessels(id) ON DELETE CASCADE,
    vessel_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    home_port VARCHAR(255) NOT NULL,
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
