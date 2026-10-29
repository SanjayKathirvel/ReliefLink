import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ToastNotificationContainer } from './components/ToastNotification.js';
import { Navbar } from './components/Navbar.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { CitizenDashboard } from './pages/CitizenDashboard.js';
import { VolunteerDashboard } from './pages/VolunteerDashboard.js';
import { GovernmentControlRoom } from './pages/GovernmentControlRoom.js';
import { ResourcesManagement } from './pages/ResourcesManagement.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { LiveMap } from './components/LiveMap.js';
import { apiRequest } from './lib/api.js';
import { DistressRequest, VolunteerItem, ReliefCenter, DisasterZone } from './types/index.js';
import { LifeBuoy, MapPin, RefreshCw, Shield, AlertTriangle } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Full Live Map tab data cache
  const [mapRequests, setMapRequests] = useState<DistressRequest[]>([]);
  const [mapVolunteers, setMapVolunteers] = useState<VolunteerItem[]>([]);
  const [mapShelters, setMapShelters] = useState<ReliefCenter[]>([]);
  const [mapZones, setMapZones] = useState<DisasterZone[]>([]);
  const [mapLoading, setMapLoading] = useState<boolean>(false);

  // Sync tab with user role upon login
  useEffect(() => {
    if (user) {
      if (user.role === 'CITIZEN') setCurrentTab('citizen');
      else if (user.role === 'VOLUNTEER') setCurrentTab('volunteer');
      else if (user.role === 'GOVERNMENT') setCurrentTab('government');
      else if (user.role === 'ADMIN') setCurrentTab('government');
    } else {
      setCurrentTab('login');
    }
  }, [user]);

  // Fetch full map data when map tab is selected
  useEffect(() => {
    if (currentTab === 'live-map') {
      setMapLoading(true);
      Promise.all([
        apiRequest('/api/requests'),
        apiRequest('/api/volunteers'),
        apiRequest('/api/disasters/relief-centers'),
        apiRequest('/api/disasters'),
      ]).then(([reqRes, volRes, centRes, disRes]) => {
        if (reqRes.success && reqRes.data?.requests) setMapRequests(reqRes.data.requests);
        if (volRes.success && volRes.data?.volunteers) setMapVolunteers(volRes.data.volunteers);
        if (centRes.success && centRes.data?.centers) setMapShelters(centRes.data.centers);
        if (disRes.success && disRes.data?.disasters) {
          const z: DisasterZone[] = [];
          disRes.data.disasters.forEach((d: any) => {
            if (d.zones) z.push(...d.zones);
          });
          setMapZones(z);
        }
        setMapLoading(false);
      });
    }
  }, [currentTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-900 space-y-3 font-sans">
        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs animate-pulse">
          RL
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-sm tracking-tight text-slate-900 font-sans">
            Relief<span className="text-indigo-600">Link</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Connecting to disaster ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">
      <Navbar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      <main className="flex-1">
        {!user ? (
          authView === 'login' ? (
            <Login
              onSuccess={() => {}}
              onGoToRegister={() => setAuthView('register')}
            />
          ) : (
            <Register
              onSuccess={() => {}}
              onGoToLogin={() => setAuthView('login')}
            />
          )
        ) : (
          <>
            {currentTab === 'citizen' && <CitizenDashboard />}
            {currentTab === 'volunteer' && <VolunteerDashboard />}
            {currentTab === 'government' && <GovernmentControlRoom />}
            {currentTab === 'resources' && <ResourcesManagement />}
            {currentTab === 'admin' && <AdminDashboard />}

            {/* Standalone Full Tactical Map View */}
            {currentTab === 'live-map' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="bg-white text-slate-900 rounded-xl p-6 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      Spatial Overview
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      Tactical Disaster Map
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                      Live OpenStreetMap visualization of emergency distress signals, volunteer field responders, evacuation centers, and hazard zones.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-600"></span> Emergency</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-600"></span> Field Unit</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-purple-600"></span> Shelter Hub</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400/50 border border-rose-500"></span> Hazard Zone</span>
                  </div>
                </div>

                <LiveMap
                  requests={mapRequests}
                  volunteers={mapVolunteers}
                  reliefCenters={mapShelters}
                  zones={mapZones}
                  heightClass="h-[680px]"
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Real-time Regional Toast Notification System for Citizens & Volunteers */}
      <ToastNotificationContainer onNavigateTab={(tab) => setCurrentTab(tab)} />

      {/* Global Clean Footer */}
      <footer className="h-16 border-t border-slate-100 bg-white text-slate-400 text-xs mt-auto">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-slate-900 font-sans">Relief<span className="text-indigo-600">Link</span></span>
            <span>— Mission Critical Disaster Relief & Resource Coordination</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Postgres DB
            </span>
            <span className="text-indigo-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Socket.IO
            </span>
            <span className="text-slate-400">Node.js Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
