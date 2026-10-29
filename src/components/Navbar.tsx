import React, { useState, useEffect } from 'react';
import { Shield, Radio, LogOut, User as UserIcon, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { NotificationBell } from './NotificationBell.js';
import { apiRequest } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { EmergencyBroadcast } from '../types/index.js';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { user, logout, switchRole } = useAuth();
  const [broadcasts, setBroadcasts] = useState<EmergencyBroadcast[]>([]);

  useEffect(() => {
    apiRequest('/api/broadcasts').then((res) => {
      if (res.success && res.data?.broadcasts) {
        setBroadcasts(res.data.broadcasts);
      }
    });

    const socket = getSocket();
    const handleBroadcast = (b: EmergencyBroadcast) => {
      setBroadcasts(prev => [b, ...prev]);
    };
    socket.on('broadcast:emergency', handleBroadcast);

    return () => {
      socket.off('broadcast:emergency', handleBroadcast);
    };
  }, []);

  const activeBroadcast = broadcasts[0];

  const handleTabClick = async (tab: string, targetRole?: 'CITIZEN' | 'VOLUNTEER' | 'GOVERNMENT' | 'ADMIN') => {
    if (targetRole && user?.role !== targetRole) {
      await switchRole(targetRole);
    }
    onSelectTab(tab);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm text-slate-900 border-b border-slate-100 shadow-2xs">
        {/* Emergency Broadcast Ticker */}
        {activeBroadcast && (
          <div className="bg-rose-50 border-b border-rose-100 text-rose-900 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping flex-shrink-0"></span>
              <span className="uppercase tracking-wider font-bold text-[10px] text-rose-700">[{activeBroadcast.severity}]:</span>
              <span className="truncate text-slate-800">{activeBroadcast.title} — {activeBroadcast.message}</span>
            </div>
            <span className="text-[10px] text-rose-600 uppercase tracking-widest font-semibold whitespace-nowrap ml-2">Active Advisory</span>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                RL
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base tracking-tight text-slate-900 font-sans">
                    Relief<span className="text-indigo-600">Link</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal">Incident Coordination & Relief</p>
              </div>
            </div>

            {/* Universal Disaster Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                id="nav-tab-citizen-dashboard"
                onClick={() => handleTabClick('citizen', 'CITIZEN')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center ${
                  currentTab === 'citizen'
                    ? 'bg-slate-100 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    currentTab === 'citizen' ? 'bg-indigo-600' : 'bg-transparent border border-slate-300'
                  }`}
                ></span>
                Citizen SOS
              </button>

              <button
                id="nav-tab-live-map"
                onClick={() => onSelectTab('live-map')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center ${
                  currentTab === 'live-map'
                    ? 'bg-slate-100 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    currentTab === 'live-map' ? 'bg-indigo-600' : 'bg-transparent border border-slate-300'
                  }`}
                ></span>
                Tactical Map
              </button>

              <button
                id="nav-tab-volunteer-dashboard"
                onClick={() => handleTabClick('volunteer', 'VOLUNTEER')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center ${
                  currentTab === 'volunteer'
                    ? 'bg-slate-100 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    currentTab === 'volunteer' ? 'bg-indigo-600' : 'bg-transparent border border-slate-300'
                  }`}
                ></span>
                Volunteer Ops
              </button>

              <button
                id="nav-tab-gov-dashboard"
                onClick={() => handleTabClick('government', 'GOVERNMENT')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center ${
                  currentTab === 'government'
                    ? 'bg-slate-100 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    currentTab === 'government' ? 'bg-indigo-600' : 'bg-transparent border border-slate-300'
                  }`}
                ></span>
                NDRF Command
              </button>

              <button
                id="nav-tab-resources"
                onClick={() => handleTabClick('resources', 'GOVERNMENT')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center ${
                  currentTab === 'resources'
                    ? 'bg-slate-100 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    currentTab === 'resources' ? 'bg-indigo-600' : 'bg-transparent border border-slate-300'
                  }`}
                ></span>
                Resources
              </button>

              <button
                id="nav-tab-admin-dashboard"
                onClick={() => handleTabClick('admin', 'ADMIN')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center ${
                  currentTab === 'admin'
                    ? 'bg-slate-100 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    currentTab === 'admin' ? 'bg-indigo-600' : 'bg-transparent border border-slate-300'
                  }`}
                ></span>
                Admin Hub
              </button>
            </nav>

            {/* Quick Actions & User Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  <NotificationBell />

                  <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-100">
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-900 leading-tight">{user.fullName}</p>
                      <span className="inline-block text-[10px] font-medium text-indigo-600 uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-logout"
                    onClick={logout}
                    aria-label="Log out"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onSelectTab('login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Role & Perspective Switcher Bar */}
        <div className="bg-slate-900 text-slate-200 border-t border-slate-800 text-xs py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Perspective:
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-200 border border-indigo-700 font-bold text-[11px]">
                {user?.role || 'CITIZEN'} • {user?.fullName || 'Citizen User'}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">• National Disaster Response Grid</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1">Switch View & Role:</span>
              <button
                id="quick-role-citizen"
                onClick={() => handleTabClick('citizen', 'CITIZEN')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  user?.role === 'CITIZEN' && currentTab === 'citizen'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title="Switch to Citizen Emergency Reporting Perspective"
              >
                🚨 Citizen SOS
              </button>
              <button
                id="quick-role-volunteer"
                onClick={() => handleTabClick('volunteer', 'VOLUNTEER')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  user?.role === 'VOLUNTEER' && currentTab === 'volunteer'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title="Switch to Field Volunteer Responder Perspective"
              >
                🤝 Volunteer
              </button>
              <button
                id="quick-role-government"
                onClick={() => handleTabClick('government', 'GOVERNMENT')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  user?.role === 'GOVERNMENT' && currentTab === 'government'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title="Switch to Government / NDRF Incident Command Room"
              >
                🏛️ NDRF Command
              </button>
              <button
                id="quick-role-resources"
                onClick={() => handleTabClick('resources', 'GOVERNMENT')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  currentTab === 'resources'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title="Manage Relief Supplies & Warehouses"
              >
                📦 Resources
              </button>
              <button
                id="quick-role-admin"
                onClick={() => handleTabClick('admin', 'ADMIN')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  user?.role === 'ADMIN' && currentTab === 'admin'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title="Switch to NDMA System Admin & Security Audits"
              >
                🛡️ Admin
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
