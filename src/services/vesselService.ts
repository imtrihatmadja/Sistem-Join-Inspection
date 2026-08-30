import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { InspectionRecord, Vessel, InspectionStats, InspectionDraft, OfficialChecklistForm } from '../types';
import {
  saveSingleVesselToSupabase,
  saveSingleInspectionToSupabase,
  updateInspectionStatusInSupabase,
  deleteVesselFromSupabase,
  deleteInspectionFromSupabase,
  fetchVesselsFromSupabase,
  fetchInspectionsFromSupabase
} from './supabaseService';

const VESSELS_COLLECTION = 'vessels';
const INSPECTIONS_COLLECTION = 'inspections';
const DRAFTS_COLLECTION = 'inspection_drafts';

// Local storage backup key for seamless offline continuity
const LOCAL_VESSELS_KEY = 'dfw_monev_vessels_v1';
const LOCAL_INSPECTIONS_KEY = 'dfw_monev_inspections_v1';
export const DRAFT_KEY_PREFIX = 'sistem_inspeksi_draft_';

// In-memory active subscribers for instant zero-latency UI re-renders
const vesselSubscribers = new Set<(vessels: Vessel[]) => void>();
const inspectionSubscribers = new Set<(inspections: InspectionRecord[]) => void>();

function notifyVesselSubscribers(vessels: Vessel[]) {
  vesselSubscribers.forEach((cb) => {
    try {
      cb(vessels);
    } catch (err) {
      console.warn('Error in vessel subscriber callback:', err);
    }
  });
}

function notifyInspectionSubscribers(inspections: InspectionRecord[]) {
  inspectionSubscribers.forEach((cb) => {
    try {
      cb(inspections);
    } catch (err) {
      console.warn('Error in inspection subscriber callback:', err);
    }
  });
}

/**
 * Helper to recursively sanitize data structures for Firebase Firestore
 * Firestore throws errors if any property in an object is `undefined`.
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}

/**
 * Merge two lists of vessels, keeping the newest / richest record by ID
 */
function mergeVessels(primary: Vessel[], secondary: Vessel[]): Vessel[] {
  const map = new Map<string, Vessel>();
  // First insert secondary
  secondary.forEach(v => {
    if (v && v.id) map.set(v.id, v);
  });
  // Then overwrite with primary, but keep richer checklist if primary lacks it
  primary.forEach(v => {
    if (v && v.id) {
      const existing = map.get(v.id);
      const mergedVessel: Vessel = {
        ...existing,
        ...v,
        latestChecklist: v.latestChecklist || existing?.latestChecklist
      };
      map.set(v.id, mergedVessel);
    }
  });
  const list = Array.from(map.values());
  return list.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
}

/**
 * Merge two lists of inspections, keeping newest record by ID
 */
function mergeInspections(primary: InspectionRecord[], secondary: InspectionRecord[]): InspectionRecord[] {
  const map = new Map<string, InspectionRecord>();
  secondary.forEach(i => {
    if (i && i.id) map.set(i.id, i);
  });
  primary.forEach(i => {
    if (i && i.id) {
      const existing = map.get(i.id);
      const mergedInsp: InspectionRecord = {
        ...existing,
        ...i,
        checklistData: i.checklistData || existing?.checklistData
      };
      map.set(i.id, mergedInsp);
    }
  });
  const list = Array.from(map.values());
  return list.sort((a, b) => new Date(b.inspectionDate || '').getTime() - new Date(a.inspectionDate || '').getTime());
}

function getLocalVessels(): Vessel[] {
  try {
    const raw = localStorage.getItem(LOCAL_VESSELS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local vessels', e);
  }
  return [];
}

function saveLocalVessels(vessels: Vessel[]) {
  try {
    localStorage.setItem(LOCAL_VESSELS_KEY, JSON.stringify(vessels));
  } catch (e) {
    console.error('Error saving local vessels', e);
  }
}

function getLocalInspections(): InspectionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_INSPECTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local inspections', e);
  }
  return [];
}

function saveLocalInspections(inspections: InspectionRecord[]) {
  try {
    localStorage.setItem(LOCAL_INSPECTIONS_KEY, JSON.stringify(inspections));
  } catch (e) {
    console.error('Error saving local inspections', e);
  }
}

/**
 * Helper to prevent async network promises from hanging indefinitely
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
}

export function subscribeToVessels(
  onUpdate: (vessels: Vessel[]) => void,
  onError?: (err: Error) => void
) {
  // Register subscriber
  vesselSubscribers.add(onUpdate);

  // Set initial local state immediately from localStorage for zero-latency UI
  const currentList = getLocalVessels();
  onUpdate(currentList);

  // 1. Fetch authoritative data from Supabase (PostgreSQL)
  fetchVesselsFromSupabase().then(({ data: supaVessels, error }) => {
    if (!error && supaVessels) {
      if (supaVessels.length > 0) {
        // Authoritative update directly from Supabase
        saveLocalVessels(supaVessels);
        onUpdate(supaVessels);
        notifyVesselSubscribers(supaVessels);
      } else {
        // If Supabase table is empty but user already created local vessels, sync them to Supabase
        const localList = getLocalVessels();
        if (localList.length > 0) {
          localList.forEach(v => {
            saveSingleVesselToSupabase(v).catch(() => {});
          });
        }
      }
    }
  }).catch((err) => {
    console.warn('Initial Supabase vessels fetch notice:', err);
  });

  // 2. Real-time Firestore listener with automatic backup
  let unsubFirestore = () => {};
  try {
    const collectionRef = collection(db, VESSELS_COLLECTION);
    unsubFirestore = onSnapshot(
      collectionRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreList: Vessel[] = [];
          snapshot.forEach((docSnap) => {
            firestoreList.push({ ...docSnap.data(), id: docSnap.id } as Vessel);
          });
          
          // Merge without resurrecting deleted vessels
          const currentLocal = getLocalVessels();
          const merged = currentLocal.length > 0 ? mergeVessels(firestoreList, currentLocal) : firestoreList;
          saveLocalVessels(merged);
          notifyVesselSubscribers(merged);
        }
      },
      (error) => {
        console.warn('Firestore subscription notice:', error);
        if (onError) {
          try {
            handleFirestoreError(error, OperationType.GET, VESSELS_COLLECTION);
          } catch (e) {
            onError(e as Error);
          }
        }
      }
    );
  } catch (err) {
    console.warn('Could not initialize Firestore vessels listener:', err);
  }

  return () => {
    vesselSubscribers.delete(onUpdate);
    unsubFirestore();
  };
}

export function subscribeToInspections(
  onUpdate: (inspections: InspectionRecord[]) => void,
  onError?: (err: Error) => void
) {
  // Register subscriber
  inspectionSubscribers.add(onUpdate);

  // Immediate local cache dispatch
  const initial = getLocalInspections();
  onUpdate(initial);

  // 1. Fetch authoritative data from Supabase (PostgreSQL)
  fetchInspectionsFromSupabase().then(({ data: supaInspections, error }) => {
    if (!error && supaInspections) {
      if (supaInspections.length > 0) {
        saveLocalInspections(supaInspections);
        onUpdate(supaInspections);
        notifyInspectionSubscribers(supaInspections);
      } else {
        const localInspections = getLocalInspections();
        if (localInspections.length > 0) {
          localInspections.forEach(i => {
            saveSingleInspectionToSupabase(i).catch(() => {});
          });
        }
      }
    }
  }).catch((err) => {
    console.warn('Initial Supabase inspections fetch notice:', err);
  });

  // 2. Real-time Firestore listener with automatic backup
  let unsubFirestore = () => {};
  try {
    const collectionRef = collection(db, INSPECTIONS_COLLECTION);
    const q = query(collectionRef, orderBy('inspectionDate', 'desc'));

    unsubFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreList: InspectionRecord[] = [];
          snapshot.forEach((docSnap) => {
            firestoreList.push({ ...docSnap.data(), id: docSnap.id } as InspectionRecord);
          });

          const currentLocal = getLocalInspections();
          const merged = currentLocal.length > 0 ? mergeInspections(firestoreList, currentLocal) : firestoreList;
          saveLocalInspections(merged);
          notifyInspectionSubscribers(merged);
        }
      },
      (error) => {
        console.warn('Firestore inspections subscription notice:', error);
        if (onError) {
          try {
            handleFirestoreError(error, OperationType.GET, INSPECTIONS_COLLECTION);
          } catch (e) {
            onError(e as Error);
          }
        }
      }
    );
  } catch (err) {
    console.warn('Could not initialize Firestore inspections listener:', err);
  }

  return () => {
    inspectionSubscribers.delete(onUpdate);
    unsubFirestore();
  };
}

/**
 * Force reload all data directly from Supabase into local cache & UI
 */
export async function reloadAllDataFromSupabase(): Promise<{
  vesselsCount: number;
  inspectionsCount: number;
  error?: string;
}> {
  try {
    const [vRes, iRes] = await Promise.all([
      fetchVesselsFromSupabase(),
      fetchInspectionsFromSupabase()
    ]);

    if (vRes.error && iRes.error) {
      return { vesselsCount: 0, inspectionsCount: 0, error: vRes.error || iRes.error };
    }

    const supaVessels = vRes.data || [];
    const supaInspections = iRes.data || [];

    // Overwrite local cache with authoritative Supabase records
    saveLocalVessels(supaVessels);
    notifyVesselSubscribers(supaVessels);

    saveLocalInspections(supaInspections);
    notifyInspectionSubscribers(supaInspections);

    return {
      vesselsCount: supaVessels.length,
      inspectionsCount: supaInspections.length
    };
  } catch (err: any) {
    console.error('Error reloading data from Supabase:', err);
    return {
      vesselsCount: 0,
      inspectionsCount: 0,
      error: err?.message || 'Gagal memuat ulang data dari Supabase'
    };
  }
}

/**
 * Save New Inspection: Updates Local Cache, dispatches to React state,
 * and background synchronizes to Supabase and Firestore.
 */
export async function saveNewInspection(
  inspection: InspectionRecord,
  currentVessel?: Vessel
): Promise<void> {
  // 1. Update local inspections
  const currentInspections = getLocalInspections();
  const updatedInspections = [inspection, ...currentInspections.filter(i => i.id !== inspection.id)];
  saveLocalInspections(updatedInspections);
  notifyInspectionSubscribers(updatedInspections);

  // 2. Update vessel risk metrics
  const currentVessels = getLocalVessels();
  const existingVessel = currentVessel || currentVessels.find(v => v.id === inspection.vesselId);

  const updatedVessel: Vessel = existingVessel ? {
    ...existingVessel,
    riskScore: inspection.riskEvaluation.score,
    riskLevel: inspection.riskEvaluation.riskLevel,
    totalInspections: (existingVessel.totalInspections || 0) + 1,
    lastInspectionDate: inspection.inspectionDate,
    lastInspectionPort: inspection.inspectionPort,
    status: inspection.riskEvaluation.riskLevel === 'HIGH' ? 'FLAGGED' : (inspection.riskEvaluation.riskLevel === 'LOW' ? 'CLEARED' : 'ACTIVE'),
    activeViolationsCount: inspection.violations.length,
    criticalViolationsCount: inspection.violations.filter(v => v.severity === 'CRITICAL').length,
    lastRecommendation: inspection.riskEvaluation.recommendation,
    latestChecklist: inspection.checklistData || existingVessel.latestChecklist,
    updatedAt: new Date().toISOString()
  } : {
    id: inspection.vesselId,
    name: inspection.vesselName,
    registrationNumber: inspection.registrationNumber || 'SIPI-REG-NEW',
    grossTonnage: 90,
    callSign: 'YDX-0000',
    ownerName: 'Pemilik Kapal Terdata',
    agentName: 'Agen Maritim Terdata',
    homePort: inspection.homePort || inspection.inspectionPort,
    gearType: 'Purse Seine / Longline',
    crewCapacity: inspection.crewData?.totalCrew || 20,
    riskScore: inspection.riskEvaluation.score,
    riskLevel: inspection.riskEvaluation.riskLevel,
    totalInspections: 1,
    lastInspectionDate: inspection.inspectionDate,
    lastInspectionPort: inspection.inspectionPort,
    status: inspection.riskEvaluation.riskLevel === 'HIGH' ? 'FLAGGED' : 'ACTIVE',
    activeViolationsCount: inspection.violations.length,
    criticalViolationsCount: inspection.violations.filter(v => v.severity === 'CRITICAL').length,
    lastRecommendation: inspection.riskEvaluation.recommendation,
    latestChecklist: inspection.checklistData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedVessels = [
    updatedVessel,
    ...currentVessels.filter(v => v.id !== updatedVessel.id)
  ];
  saveLocalVessels(updatedVessels);
  notifyVesselSubscribers(updatedVessels);

  // 3. Sequentially sync to Supabase (Vessel first, then Inspection to avoid Foreign Key errors)
  try {
    const vRes = await saveSingleVesselToSupabase(updatedVessel);
    if (!vRes.success && vRes.error) {
      console.warn('Supabase vessel update note:', vRes.error);
    }
    const iRes = await saveSingleInspectionToSupabase(inspection);
    if (!iRes.success && iRes.error) {
      console.warn('Supabase inspection save note:', iRes.error);
    }
  } catch (err) {
    console.warn('Auto-sync to Supabase catch:', err);
  }

  // 4. Background sync to Firestore with strict sanitization (prevents undefined field rejection)
  try {
    const sanitizedInspection = sanitizeForFirestore(inspection);
    const sanitizedVessel = sanitizeForFirestore(updatedVessel);

    withTimeout(setDoc(doc(db, INSPECTIONS_COLLECTION, inspection.id), sanitizedInspection), 3000).catch((e) =>
      console.warn('Firestore inspection background save note:', e)
    );
    withTimeout(setDoc(doc(db, VESSELS_COLLECTION, updatedVessel.id), sanitizedVessel), 3000).catch((e) =>
      console.warn('Firestore vessel background save note:', e)
    );
  } catch (err) {
    console.warn('Firestore sync skipped:', err);
  }

  // 5. Clean up any saved draft for this vessel across local storage and cloud database
  try {
    await deleteInspectionDraft(inspection.vesselId);
  } catch (err) {
    console.warn('Draft cleanup notice:', err);
  }
}

/**
 * Save New Vessel: Saves immediately to Local Cache and React state,
 * and syncs directly to Supabase and Firestore.
 */
export async function saveNewVessel(vessel: Vessel): Promise<void> {
  // 1. Update local storage & notify all subscribers immediately (0ms latency)
  const currentVessels = getLocalVessels();
  const updatedVessels = [vessel, ...currentVessels.filter(v => v.id !== vessel.id)];
  saveLocalVessels(updatedVessels);
  notifyVesselSubscribers(updatedVessels);

  // 2. Direct Sync to Supabase (PostgreSQL)
  try {
    const supaRes = await saveSingleVesselToSupabase(vessel);
    if (!supaRes.success && supaRes.error) {
      console.warn('Supabase vessel save notice:', supaRes.error);
    }
  } catch (supaErr) {
    console.warn('Supabase save single vessel catch:', supaErr);
  }

  // 3. Background Sync to Firestore with sanitization & timeout
  try {
    const sanitizedVessel = sanitizeForFirestore(vessel);
    withTimeout(setDoc(doc(db, VESSELS_COLLECTION, vessel.id), sanitizedVessel), 3000).catch((err) => {
      console.warn('Firestore background vessel save notice:', err);
    });
  } catch (error) {
    console.warn('Firestore save vessel skipped:', error);
  }
}

/**
 * Update Follow-up Status: Updates local, Supabase, and Firestore seamlessly.
 */
export async function updateFollowUp(
  inspectionId: string,
  newStatus: InspectionRecord['followUpStatus'],
  notes?: string
): Promise<void> {
  const currentInspections = getLocalInspections();
  const updatedInspections = currentInspections.map(i => {
    if (i.id === inspectionId) {
      return {
        ...i,
        followUpStatus: newStatus,
        officialNotes: notes ? `${i.officialNotes}\n[${new Date().toISOString().split('T')[0]}]: ${notes}` : i.officialNotes
      };
    }
    return i;
  });
  saveLocalInspections(updatedInspections);
  notifyInspectionSubscribers(updatedInspections);

  // Sync to Supabase
  updateInspectionStatusInSupabase(inspectionId, newStatus, notes).catch((err) =>
    console.warn('Supabase follow-up sync notice:', err)
  );

  // Sync to Firestore
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, inspectionId);
    withTimeout(
      updateDoc(docRef, {
        followUpStatus: newStatus,
        ...(notes ? { officialNotes: notes } : {})
      }),
      2000
    ).catch((err) => console.warn('Firestore update follow-up notice:', err));
  } catch (error) {
    console.warn('Firestore update follow-up skipped:', error);
  }
}

/**
 * Delete a Vessel: Immediately removes from local cache, dispatches to state,
 * and deletes from Supabase and Firestore.
 */
export async function deleteVessel(vesselId: string): Promise<void> {
  // 1. Immediately update local state
  const currentVessels = getLocalVessels();
  const updatedVessels = currentVessels.filter(v => v.id !== vesselId);
  saveLocalVessels(updatedVessels);
  notifyVesselSubscribers(updatedVessels);

  // Also remove inspections for this vessel locally
  const currentInspections = getLocalInspections();
  const updatedInspections = currentInspections.filter(i => i.vesselId !== vesselId);
  saveLocalInspections(updatedInspections);
  notifyInspectionSubscribers(updatedInspections);

  // 2. Delete from Supabase
  try {
    await deleteVesselFromSupabase(vesselId);
  } catch (err) {
    console.warn('Supabase vessel deletion catch:', err);
  }

  // 3. Delete from Firestore
  try {
    const vesselRef = doc(db, VESSELS_COLLECTION, vesselId);
    withTimeout(deleteDoc(vesselRef), 3000).catch((e) => console.warn('Firestore vessel delete note:', e));
  } catch (err) {
    console.warn('Firestore vessel delete skipped:', err);
  }
}

/**
 * Delete an Inspection record
 */
export async function deleteInspection(inspectionId: string): Promise<void> {
  const currentInspections = getLocalInspections();
  const updatedInspections = currentInspections.filter(i => i.id !== inspectionId);
  saveLocalInspections(updatedInspections);
  notifyInspectionSubscribers(updatedInspections);

  // Supabase delete
  try {
    await deleteInspectionFromSupabase(inspectionId);
  } catch (err) {
    console.warn('Supabase inspection deletion catch:', err);
  }

  // Firestore delete
  try {
    const inspRef = doc(db, INSPECTIONS_COLLECTION, inspectionId);
    withTimeout(deleteDoc(inspRef), 3000).catch((e) => console.warn('Firestore inspection delete note:', e));
  } catch (err) {
    console.warn('Firestore inspection delete skipped:', err);
  }
}

export function computeInspectionStats(vessels: Vessel[], inspections: InspectionRecord[]): InspectionStats {
  const totalVessels = vessels.length;
  const totalInspections = inspections.length;
  const highRiskCount = vessels.filter(v => v.riskLevel === 'HIGH').length;
  const mediumRiskCount = vessels.filter(v => v.riskLevel === 'MEDIUM').length;
  const lowRiskCount = vessels.filter(v => v.riskLevel === 'LOW').length;

  let totalCrew = 0;
  let totalWithPkl = 0;
  inspections.forEach(i => {
    totalCrew += i.crewData?.totalCrew || 0;
    totalWithPkl += i.crewData?.crewWithPkl || 0;
  });

  const averageComplianceRate = totalCrew > 0 ? Math.round((totalWithPkl / totalCrew) * 100) : (inspections.length > 0 ? 0 : 0);
  const pendingFollowUps = inspections.filter(i => i.followUpStatus === 'PENDING' || i.followUpStatus === 'IN_PROGRESS').length;
  
  const portsSet = new Set<string>();
  vessels.forEach(v => { if (v.homePort) portsSet.add(v.homePort); });
  inspections.forEach(i => { if (i.inspectionPort) portsSet.add(i.inspectionPort); });

  return {
    totalVessels,
    totalInspections,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    averageComplianceRate,
    pendingFollowUps,
    activePortsCount: Math.max(portsSet.size, 0)
  };
}

/**
 * Save Inspection Draft:
 * Saves immediately to local storage and syncs to Cloud Firestore so that
 * any user/device accessing the vessel checklist will see the exact same draft.
 */
export async function saveInspectionDraft(
  vesselId: string,
  form: OfficialChecklistForm,
  userEmail?: string
): Promise<InspectionDraft> {
  const now = new Date().toISOString();
  const draftData: InspectionDraft = {
    vesselId,
    vesselName: form.vesselName || '',
    form,
    savedAt: now,
    updatedBy: userEmail || 'Pengawas Lapangan'
  };

  // 1. Simpan ke Local Storage untuk akses cepat dan offline fallback
  try {
    localStorage.setItem(`${DRAFT_KEY_PREFIX}${vesselId}`, JSON.stringify(draftData));
  } catch (err) {
    console.warn('LocalStorage save draft note:', err);
  }

  // 2. Sinkronisasi ke Cloud Firestore agar dapat dimunculkan kembali di gawai/device manapun
  try {
    const sanitizedDraft = sanitizeForFirestore(draftData);
    const draftDocRef = doc(db, DRAFTS_COLLECTION, vesselId);
    await withTimeout(setDoc(draftDocRef, sanitizedDraft), 5000);
  } catch (err) {
    console.warn('Cloud Firestore save draft note:', err);
  }

  return draftData;
}

/**
 * Get Inspection Draft:
 * Membaca draft tersimpan dari LocalStorage dan Cloud Firestore secara otomatis,
 * memilih data yang paling mutakhir (terbaru) untuk sinkronisasi lintas perangkat.
 */
export async function getInspectionDraft(vesselId: string): Promise<InspectionDraft | null> {
  if (!vesselId) return null;

  let localDraft: InspectionDraft | null = null;
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${vesselId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.form) {
        localDraft = parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading local draft:', err);
  }

  // Ambil data draft dari Cloud Firestore
  try {
    const draftDocRef = doc(db, DRAFTS_COLLECTION, vesselId);
    const snap = await withTimeout(getDoc(draftDocRef), 3500);
    if (snap.exists()) {
      const cloudDraft = snap.data() as InspectionDraft;
      if (cloudDraft && cloudDraft.form) {
        // Jika ada di cloud, perbarui local storage agar selaras
        try {
          localStorage.setItem(`${DRAFT_KEY_PREFIX}${vesselId}`, JSON.stringify(cloudDraft));
        } catch {
          // ignore local quota
        }
        return cloudDraft;
      }
    }
  } catch (err) {
    console.warn('Cloud draft fetch notice:', err);
  }

  return localDraft;
}

/**
 * Delete Inspection Draft:
 * Menghapus draft dari LocalStorage dan Cloud Firestore secara menyeluruh
 * saat user menekan 'Hapus Draft / Reset' atau setelah berhasil submit resmi.
 */
export async function deleteInspectionDraft(vesselId: string): Promise<void> {
  if (!vesselId) return;

  // 1. Hapus dari Local Storage
  try {
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${vesselId}`);
  } catch (err) {
    console.warn('LocalStorage delete draft note:', err);
  }

  // 2. Hapus dari Cloud Firestore
  try {
    const draftDocRef = doc(db, DRAFTS_COLLECTION, vesselId);
    await withTimeout(deleteDoc(draftDocRef), 3500);
  } catch (err) {
    console.warn('Cloud draft deletion notice:', err);
  }
}

/**
 * Real-time Listener untuk Seluruh Draft Aktif:
 * Memastikan sinkronisasi real-time antar tab dan multi-device.
 */
export function subscribeToInspectionDrafts(
  onUpdate: (drafts: Record<string, InspectionDraft>) => void
) {
  try {
    const draftsCol = collection(db, DRAFTS_COLLECTION);
    return onSnapshot(
      draftsCol,
      (snapshot) => {
        const draftsMap: Record<string, InspectionDraft> = {};
        snapshot.forEach((dSnap) => {
          const data = dSnap.data() as InspectionDraft;
          if (data && data.form) {
            draftsMap[dSnap.id] = data;
          }
        });
        onUpdate(draftsMap);
      },
      (error) => {
        console.warn('Firestore drafts listener notice:', error);
      }
    );
  } catch (err) {
    console.warn('Could not initialize drafts listener:', err);
    return () => {};
  }
}
