import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, logoutUser, testConnection } from './firebase/config';
import {
  subscribeToVessels,
  subscribeToInspections,
  saveNewInspection,
  saveNewVessel,
  updateFollowUp,
  computeInspectionStats
} from './services/vesselService';
import { Vessel, InspectionRecord, InspectionStats } from './types';
import { INDONESIAN_PORTS } from './constants/ports';

import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardStats } from './components/DashboardStats';
import { VesselTable } from './components/VesselTable';
import { RiskMatrixView } from './components/RiskMatrixView';
import { InspectionHistoryView } from './components/InspectionHistoryView';
import { OfficialChecklistModal } from './components/OfficialChecklistModal';
import { InspectionFormModal } from './components/InspectionFormModal';
import { VesselDetailModal } from './components/VesselDetailModal';
import { AddVesselModal } from './components/AddVesselModal';
import { AuthModal } from './components/AuthModal';
import { CloudDatabaseView } from './components/CloudDatabaseView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vessels' | 'matrix' | 'history' | 'storage'>('dashboard');
  const [selectedPort, setSelectedPort] = useState<string>('Semua Pelabuhan');

  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Data states
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [isOfficialChecklistOpen, setIsOfficialChecklistOpen] = useState<boolean>(false);
  const [isQuickInspectionModalOpen, setIsQuickInspectionModalOpen] = useState<boolean>(false);
  const [isAddVesselModalOpen, setIsAddVesselModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [selectedVesselForDetail, setSelectedVesselForDetail] = useState<Vessel | null>(null);
  const [preselectedVesselForInspect, setPreselectedVesselForInspect] = useState<Vessel | null>(null);
  const [vesselToEdit, setVesselToEdit] = useState<Vessel | null>(null);

  // Initial Auth & Firestore Subscriptions
  useEffect(() => {
    testConnection();

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    const unsubVessels = subscribeToVessels((updatedVessels) => {
      setVessels(updatedVessels);
      setLoading(false);
    });

    const unsubInspections = subscribeToInspections((updatedInspections) => {
      setInspections(updatedInspections);
    });

    return () => {
      unsubAuth();
      unsubVessels();
      unsubInspections();
    };
  }, []);

  const stats: InspectionStats = computeInspectionStats(vessels, inspections);

  const handleOpenNewVessel = () => {
    setVesselToEdit(null);
    setIsAddVesselModalOpen(true);
  };

  const handleOpenEditVessel = (vessel: Vessel) => {
    setVesselToEdit(vessel);
    setIsAddVesselModalOpen(true);
  };

  const handleOpenOfficialChecklist = (targetVessel?: Vessel) => {
    setPreselectedVesselForInspect(targetVessel || null);
    setIsOfficialChecklistOpen(true);
  };

  const handleOpenQuickInspection = (targetVessel?: Vessel) => {
    setPreselectedVesselForInspect(targetVessel || null);
    setIsQuickInspectionModalOpen(true);
  };

  const handleSelectVesselForDetail = (vessel: Vessel) => {
    setSelectedVesselForDetail(vessel);
  };

  const currentDetailVessel = selectedVesselForDetail
    ? (vessels.find(v => v.id === selectedVesselForDetail.id) || selectedVesselForDetail)
    : null;

  const handleFilterPortFromMatrix = (port: string) => {
    setSelectedPort(port);
    setActiveTab('vessels');
  };

  const handleFilterRiskFromStats = (riskLevel: string) => {
    setActiveTab('vessels');
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans overflow-hidden text-slate-900">
      
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogin={() => setIsAuthModalOpen(true)}
        onLogout={logoutUser}
        selectedPort={selectedPort}
        setSelectedPort={setSelectedPort}
        ports={INDONESIAN_PORTS}
        onOpenNewInspection={() => handleOpenOfficialChecklist()}
        onOpenChecklist={() => handleOpenOfficialChecklist()}
        onOpenNewVessel={handleOpenNewVessel}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <TopNavbar
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenNewInspection={() => handleOpenOfficialChecklist()}
          onOpenChecklist={() => handleOpenOfficialChecklist()}
          onOpenNewVessel={handleOpenNewVessel}
        />

        {/* Scrollable Viewport with safe mobile bottom padding */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 pb-24 lg:pb-6">
          
          {/* Tab 1: Dashboard Utama */}
          {activeTab === 'dashboard' && (
            <DashboardStats
              stats={stats}
              vessels={vessels}
              onSelectVessel={handleSelectVesselForDetail}
              onFilterRisk={handleFilterRiskFromStats}
              onOpenChecklist={() => handleOpenOfficialChecklist()}
            />
          )}

          {/* Tab 2: Database Kapal */}
          {activeTab === 'vessels' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Database Kapal Perikanan & Kepatuhan Awak Kapal
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Pencarian dan pemantauan legalitas dokumen, rekam temuan, dan skor risiko kapal
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenNewVessel}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer min-h-[40px] text-center"
                  >
                    + Kapal Baru
                  </button>
                  <button
                    onClick={() => handleOpenOfficialChecklist()}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px]"
                  >
                    <span>📋 Isi Checklist</span>
                  </button>
                </div>
              </div>

              <VesselTable
                vessels={vessels}
                onSelectVessel={handleSelectVesselForDetail}
                onInspectVessel={handleOpenOfficialChecklist}
                onOpenChecklist={handleOpenOfficialChecklist}
                onEditVessel={handleOpenEditVessel}
                selectedPort={selectedPort}
              />
            </div>
          )}

          {/* Tab 3: Matriks Risiko */}
          {activeTab === 'matrix' && (
            <RiskMatrixView
              vessels={vessels}
              onSelectVessel={handleSelectVesselForDetail}
              onFilterPort={handleFilterPortFromMatrix}
            />
          )}

          {/* Tab 4: Log Inspeksi */}
          {activeTab === 'history' && (
            <InspectionHistoryView
              inspections={inspections}
              vessels={vessels}
              onSelectVessel={handleSelectVesselForDetail}
              selectedPort={selectedPort}
            />
          )}

          {/* Tab 5: Pusat Cloud & Database (Supabase + Google Drive) */}
          {activeTab === 'storage' && (
            <CloudDatabaseView
              vessels={vessels}
              inspections={inspections}
              onSelectVessel={handleSelectVesselForDetail}
              currentUserEmail={currentUser?.email}
            />
          )}

          {/* Subdued Footer Note */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 pb-6">
            <span>Sistem Inpeksi Bersama Ketenagakerjaan di Kapal Perikanan</span>
          </div>

        </main>

        {/* Mobile Bottom Navigation Bar (visible on < 1024px) */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenChecklist={() => handleOpenOfficialChecklist()}
        />

      </div>

      {/* MODALS */}
      {/* 1. Modal Formulir Daftar Periksa Resmi (ILO C188 / KKP / Kemnaker) - 8 Bagian */}
      <OfficialChecklistModal
        isOpen={isOfficialChecklistOpen}
        onClose={() => {
          setIsOfficialChecklistOpen(false);
          setPreselectedVesselForInspect(null);
        }}
        vessels={vessels}
        initialVessel={preselectedVesselForInspect}
        onSaveInspection={saveNewInspection}
        onAddNewVessel={saveNewVessel}
        currentUserEmail={currentUser?.email}
      />

      {/* 2. Modal Pencatatan Cepat Ringkas */}
      <InspectionFormModal
        isOpen={isQuickInspectionModalOpen}
        onClose={() => {
          setIsQuickInspectionModalOpen(false);
          setPreselectedVesselForInspect(null);
        }}
        vessels={vessels}
        initialVessel={preselectedVesselForInspect}
        onSaveInspection={saveNewInspection}
        currentUserEmail={currentUser?.email}
      />

      {/* 3. Modal Detail Profil & Resume Berita Acara Kapal */}
      <VesselDetailModal
        isOpen={!!selectedVesselForDetail}
        onClose={() => setSelectedVesselForDetail(null)}
        vessel={currentDetailVessel}
        inspections={inspections}
        onOpenNewInspection={handleOpenOfficialChecklist}
        onUpdateFollowUp={updateFollowUp}
        onEditVessel={handleOpenEditVessel}
        currentUserEmail={currentUser?.email}
      />

      {/* 4. Modal Daftarkan Kapal Baru & Edit Kapal */}
      <AddVesselModal
        isOpen={isAddVesselModalOpen}
        onClose={() => {
          setIsAddVesselModalOpen(false);
          setVesselToEdit(null);
        }}
        onSaveVessel={async (vessel) => {
          await saveNewVessel(vessel);
          if (selectedVesselForDetail?.id === vessel.id) {
            setSelectedVesselForDetail(vessel);
          }
        }}
        vesselToEdit={vesselToEdit}
      />

      {/* 5. Modal Autentikasi Pengawas */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
