import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  AlertTriangle,
  LifeBuoy,
  Clock,
  Phone,
  UserCheck,
  XCircle,
  MapPin,
  RefreshCw,
  Building2,
  Volume2,
  ShieldCheck,
  Flame,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Info,
  HeartHandshake,
  Navigation,
  Send,
  Radio,
  Truck,
  Compass,
  Activity,
  Check,
  Edit3,
} from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { DistressRequest, ReliefCenter } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { DistressForm } from '../components/DistressForm.js';
import { useAuth } from '../context/AuthContext.js';

function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const CitizenDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'tickets' | 'shelters' | 'helplines' | 'protocols' | 'volunteer_help'>('tickets');
  const [requests, setRequests] = useState<DistressRequest[]>([]);
  const [shelters, setShelters] = useState<ReliefCenter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sheltersLoading, setSheltersLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [cancelModalReq, setCancelModalReq] = useState<DistressRequest | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState<boolean>(false);

  // Hybrid Citizen-Volunteer Responder State
  const [nearbyRequests, setNearbyRequests] = useState<DistressRequest[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // "I Will Go and Help" Modal State
  const [respondModalReq, setRespondModalReq] = useState<DistressRequest | null>(null);
  const [responderNote, setResponderNote] = useState<string>('I am nearby and going to help.');
  const [responderEta, setResponderEta] = useState<string>('10');
  const [responderPhone, setResponderPhone] = useState<string>(user?.phone || '');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState<boolean>(false);
  const [responseNotice, setResponseNotice] = useState<string | null>(null);

  // Edit Volunteer Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profStatus, setProfStatus] = useState<string>(user?.volunteer_profile?.availability_status || 'AVAILABLE');
  const [profSkills, setProfSkills] = useState<string>((user?.volunteer_profile?.skills || ['First Aid', 'Neighborhood Evacuation']).join(', '));
  const [profVehicle, setProfVehicle] = useState<string>(user?.volunteer_profile?.vehicle_type || 'TWO_WHEELER');
  const [profPhone, setProfPhone] = useState<string>(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [gpsDetecting, setGpsDetecting] = useState<boolean>(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState<string | null>(null);

  const myLat = user?.volunteer_profile?.current_latitude || 13.0827;
  const myLon = user?.volunteer_profile?.current_longitude || 80.2707;
  const currentAvailability = user?.volunteer_profile?.availability_status || 'AVAILABLE';

  const fetchMyRequests = async () => {
    setLoading(true);
    const res = await apiRequest('/api/requests?mine=true');
    if (res.success && res.data?.requests) {
      setRequests(res.data.requests);
    }
    setLoading(false);
  };

  const fetchNearbyRequests = async () => {
    setNearbyLoading(true);
    const res = await apiRequest('/api/requests');
    if (res.success && res.data?.requests) {
      setNearbyRequests(res.data.requests);
    }
    setNearbyLoading(false);
  };

  const fetchShelters = async () => {
    setSheltersLoading(true);
    const res = await apiRequest('/api/disasters/relief-centers');
    if (res.success && res.data?.centers) {
      setShelters(res.data.centers);
    }
    setSheltersLoading(false);
  };

  useEffect(() => {
    fetchMyRequests();
    fetchNearbyRequests();
    fetchShelters();

    const socket = getSocket();

    const handleUpdate = () => {
      fetchMyRequests();
      fetchNearbyRequests();
      fetchShelters();
    };

    socket.on('request:created', handleUpdate);
    socket.on('request:claimed', handleUpdate);
    socket.on('request:status_changed', handleUpdate);
    socket.on('request:updated', handleUpdate);
    socket.on('request:community_responder_joined', handleUpdate);
    socket.on('request:rescue_team_assigned', handleUpdate);
    socket.on('relief_center:updated', handleUpdate);

    return () => {
      socket.off('request:created', handleUpdate);
      socket.off('request:claimed', handleUpdate);
      socket.off('request:status_changed', handleUpdate);
      socket.off('request:updated', handleUpdate);
      socket.off('request:community_responder_joined', handleUpdate);
      socket.off('request:rescue_team_assigned', handleUpdate);
      socket.off('relief_center:updated', handleUpdate);
    };
  }, []);

  // Quick Availability Switcher
  const handleQuickAvailability = async (newStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
    const res = await apiRequest('/api/volunteers/availability', {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.success) {
      refreshUser();
    }
  };

  // Live GPS Ping
  const handleDetectLiveGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsDetecting(true);
    setGpsSuccessMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await apiRequest('/api/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            currentLatitude: latitude,
            currentLongitude: longitude,
          }),
        });
        setGpsDetecting(false);
        if (res.success) {
          setGpsSuccessMsg(`GPS Updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          refreshUser();
          setTimeout(() => setGpsSuccessMsg(null), 4000);
        }
      },
      (err) => {
        setGpsDetecting(false);
        console.warn('GPS detection failed, fallback to sector base', err);
        setGpsSuccessMsg('Could not read GPS hardware. Using sector default.');
        setTimeout(() => setGpsSuccessMsg(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Submit "I Will Go and Help"
  const handleConfirmGoHelp = async () => {
    if (!respondModalReq) return;
    setIsSubmittingResponse(true);

    const res = await apiRequest(`/api/requests/${respondModalReq.id}/respond-help`, {
      method: 'POST',
      body: JSON.stringify({
        note: responderNote,
        etaMinutes: responderEta,
        contactPhone: responderPhone || user?.phone,
      }),
    });

    setIsSubmittingResponse(false);

    if (res.success) {
      setResponseNotice(`You declared "I will go and help" for ${respondModalReq.request_code}! Government & Admin Command have been alerted to dispatch rapid rescue backup.`);
      setRespondModalReq(null);
      fetchNearbyRequests();
      fetchMyRequests();
      refreshUser();
      setTimeout(() => setResponseNotice(null), 7000);
    }
  };

  // Save Responder Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const skillsArr = profSkills.split(',').map(s => s.trim()).filter(Boolean);
    const res = await apiRequest('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        phone: profPhone,
        availabilityStatus: profStatus,
        skills: skillsArr,
        vehicleType: profVehicle,
      }),
    });

    setIsSavingProfile(false);
    if (res.success) {
      setShowProfileModal(false);
      refreshUser();
    }
  };

  const playSirenTest = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);

      // EAS Two-tone alternating siren
      const now = audioCtx.currentTime;
      for (let i = 0; i < 6; i++) {
        osc.frequency.setValueAtTime(853, now + i * 0.4);
        osc.frequency.setValueAtTime(960, now + i * 0.4 + 0.2);
      }

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      setIsSirenPlaying(true);

      setTimeout(() => {
        try {
          osc.stop();
          audioCtx.close();
        } catch (e) {}
        setIsSirenPlaying(false);
      }, 2400);
    } catch (err) {
      console.warn('AudioContext not allowed or supported', err);
      setIsSirenPlaying(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelModalReq) return;
    setIsCancelling(true);
    const res = await apiRequest(`/api/requests/${cancelModalReq.id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: cancelReason }),
    });
    setIsCancelling(false);

    if (res.success) {
      setCancelModalReq(null);
      setCancelReason('');
      fetchMyRequests();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero / Emergency Dispatch Action */}
      <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-xs font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Emergency Response Ledger Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Citizen Emergency Dispatch</h1>
          <p className="text-sm text-rose-100 max-w-xl leading-relaxed">
            Submit immediate distress signals with accurate GPS. Emergency signals are instantly broadcast to field volunteers and the central command center.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
          <button
            onClick={playSirenTest}
            className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer ${
              isSirenPlaying ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-black/20 hover:bg-black/30 text-white'
            }`}
            title="Test Emergency Broadcast Siren Audio"
          >
            <Volume2 className="w-4 h-4" />
            {isSirenPlaying ? 'Siren Sounding...' : 'Test Siren Tone'}
          </button>

          <button
            id="btn-open-distress-form"
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3.5 bg-white text-rose-700 hover:bg-rose-50 font-black text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 flex-shrink-0 cursor-pointer transform active:scale-98"
          >
            <PlusCircle className="w-5 h-5 text-rose-600" />
            REPORT EMERGENCY DISTRESS
          </button>
        </div>
      </div>

      {/* Community Volunteer Responder Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              currentAvailability === 'AVAILABLE'
                ? 'bg-emerald-100 text-emerald-700'
                : currentAvailability === 'BUSY'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-900">
                  Citizen Volunteer Network
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  currentAvailability === 'AVAILABLE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : currentAvailability === 'BUSY'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  ● {currentAvailability}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                All registered citizens are empowered community responders. You receive neighborhood emergency requests and can declare <strong>"I will go and help"</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status Buttons */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => handleQuickAvailability('AVAILABLE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  currentAvailability === 'AVAILABLE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Set ready to help"
              >
                Available
              </button>
              <button
                onClick={() => handleQuickAvailability('BUSY')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  currentAvailability === 'BUSY'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mark currently responding"
              >
                Busy
              </button>
              <button
                onClick={() => handleQuickAvailability('OFFLINE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  currentAvailability === 'OFFLINE'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Go offline"
              >
                Offline
              </button>
            </div>

            <button
              onClick={handleDetectLiveGps}
              disabled={gpsDetecting}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Broadcast high-precision live coordinates"
            >
              <Navigation className={`w-3.5 h-3.5 text-indigo-600 ${gpsDetecting ? 'animate-spin' : ''}`} />
              {gpsDetecting ? 'Locating...' : 'Update Live GPS'}
            </button>

            <button
              onClick={() => {
                setProfStatus(currentAvailability);
                setProfSkills((user?.volunteer_profile?.skills || ['First Aid', 'Neighborhood Evacuation']).join(', '));
                setProfVehicle(user?.volunteer_profile?.vehicle_type || 'TWO_WHEELER');
                setProfPhone(user?.phone || '');
                setShowProfileModal(true);
              }}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>
        </div>

        {gpsSuccessMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{gpsSuccessMsg}</span>
          </div>
        )}

        {responseNotice && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-indigo-600 mt-0.5 animate-pulse flex-shrink-0" />
            <div>
              <strong className="font-bold block">Response Registered & Command Alerted</strong>
              <span>{responseNotice}</span>
            </div>
          </div>
        )}
      </div>

      {/* Citizen Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('volunteer_help');
            fetchNearbyRequests();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'volunteer_help'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          🤝 Community Volunteer & Go Help ({nearbyRequests.filter(r => r.status !== 'RESOLVED' && r.status !== 'CANCELLED').length})
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tickets'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          My Emergency Tickets ({requests.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('shelters');
            fetchShelters();
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'shelters'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Active Relief Shelters ({shelters.length})
        </button>

        <button
          onClick={() => setActiveTab('helplines')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'helplines'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Phone className="w-4 h-4" />
          Emergency Helplines (India)
        </button>

        <button
          onClick={() => setActiveTab('protocols')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'protocols'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Survival & Safety Protocols
        </button>
      </div>

      {/* TAB 1: Distress Signal History Section */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-rose-600" />
              My Emergency Distress Reports
            </h2>
            <p className="text-xs text-slate-500">Live authoritative tracking directly from disaster dispatch database</p>
          </div>

          <button
            onClick={fetchMyRequests}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Refresh requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Querying PostgreSQL dispatch ledger...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Active Distress Reports</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              You do not have any active emergency distress tickets logged. If you or someone nearby is in danger, click the button above to broadcast immediately.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Report Emergency Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {req.request_code}
                    </span>
                    <StatusBadge status={req.status} size="md" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {req.emergency_type} EMERGENCY
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reported: {new Date(req.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Distress Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-2">
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">
                      {req.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-slate-600 pt-1">
                      {req.landmark && (
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          <span>Landmark: {req.landmark}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Affected Individuals: <strong>{req.affected_count}</strong></span>
                      </div>
                      <div>
                        GPS Coordinates: <strong className="font-mono">{req.latitude.toFixed(5)}, {req.longitude.toFixed(5)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Field Responder & Rescue Team Assignment Card */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">
                      Dispatch & Response Status
                    </span>

                    {/* Official Rescue Team if assigned by Gov / Admin */}
                    {req.assigned_rescue_team ? (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-rose-800 text-xs">
                          <Truck className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                          <span>Official Rescue Team:</span>
                        </div>
                        <p className="text-xs font-bold text-rose-900">{req.assigned_rescue_team}</p>
                        <p className="text-[10px] text-rose-700 font-semibold">
                          Dispatched by Central Command • En route to scene
                        </p>
                      </div>
                    ) : null}

                    {/* Community Responder if citizen declared "I will go" */}
                    {req.community_responder_name ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-emerald-800 text-xs">
                          <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Community Volunteer Responder:</span>
                        </div>
                        <p className="text-xs font-bold text-emerald-950">{req.community_responder_name}</p>
                        {req.community_responder_phone && (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{req.community_responder_phone}</span>
                          </div>
                        )}
                        {req.community_responder_note && (
                          <p className="text-[10px] text-emerald-800 italic">
                            "{req.community_responder_note}"
                          </p>
                        )}
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          ● Volunteer on the way to help you
                        </p>
                      </div>
                    ) : null}

                    {/* Assigned Volunteer Operative */}
                    {req.assigned_volunteer_name ? (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <UserCheck className="w-4 h-4 text-sky-600" />
                          <span>{req.assigned_volunteer_name}</span>
                        </div>
                        {req.assigned_volunteer_phone && (
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{req.assigned_volunteer_phone}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          ● Field operative deployed to your pinned coordinates
                        </p>
                      </div>
                    ) : null}

                    {!req.assigned_volunteer_name && !req.community_responder_name && !req.assigned_rescue_team && (
                      <p className="text-xs text-amber-700 italic">
                        Awaiting volunteer claim or community responder. Broadcasted to nearby units and command.
                      </p>
                    )}
                  </div>
                </div>

                {/* Evidence Preview if exists */}
                {req.evidence_url && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Submitted Photographic Evidence:
                    </span>
                    <img
                      src={req.evidence_url}
                      alt="Emergency Evidence"
                      className="h-28 w-auto rounded-lg border border-slate-200 object-cover shadow-xs"
                    />
                  </div>
                )}

                {/* Action footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Priority Level: <strong className="text-slate-800">{req.priority}</strong>
                  </span>

                  {req.status !== 'RESOLVED' && req.status !== 'CANCELLED' && (
                    <button
                      onClick={() => setCancelModalReq(req)}
                      className="text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Distress Ticket
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* TAB 2: Relief Shelters & Evacuation Centers */}
      {activeTab === 'shelters' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Active Evacuation Shelters & Relief Camps
              </h2>
              <p className="text-xs text-slate-500">Live operational status, bed capacity, and relief supplies across Indian disaster zones</p>
            </div>

            <button
              onClick={fetchShelters}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh shelters"
            >
              <RefreshCw className={`w-4 h-4 ${sheltersLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {sheltersLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Fetching active relief center capacities...</p>
            </div>
          ) : shelters.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Shelters Found</h3>
              <p className="text-xs text-slate-500 mt-1">Shelters will appear here as soon as disaster response authorities register them.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {shelters.map((center) => {
                const occupancyPercent = center.capacity > 0 ? Math.min(100, Math.round((center.occupancy / center.capacity) * 100)) : 0;
                const availableBeds = Math.max(0, center.capacity - center.occupancy);
                const isFull = center.operating_status === 'FULL' || availableBeds === 0;

                return (
                  <div
                    key={center.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            center.operating_status === 'NORMAL'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : center.operating_status === 'NEAR_CAPACITY'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {center.operating_status.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">ID: {center.id.slice(0, 10)}</span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 leading-tight">{center.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{center.address || 'Designated Disaster Relief Camp'}</span>
                        </p>
                      </div>

                      {center.contact_phone && (
                        <a
                          href={`tel:${center.contact_phone}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors flex-shrink-0"
                          title="Call Relief Center Desk"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Camp</span>
                        </a>
                      )}
                    </div>

                    {/* Capacity Progress */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Shelter Capacity:</span>
                        <span className="font-bold text-slate-900">
                          {center.occupancy} / {center.capacity} Beds ({occupancyPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            occupancyPercent >= 90
                              ? 'bg-rose-600'
                              : occupancyPercent >= 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{isFull ? 'Camp at Full Capacity' : `${availableBeds} Vacant Spaces Available`}</span>
                        <span className="font-mono">Lat: {Number(center.latitude).toFixed(4)}, Lon: {Number(center.longitude).toFixed(4)}</span>
                      </div>
                    </div>

                    {/* Available Relief Supplies */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Camp Facilities & Rations:
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100 font-medium flex items-center gap-1">
                          💧 Purified Water
                        </span>
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-100 font-medium flex items-center gap-1">
                          🍲 Hot Food Rations
                        </span>
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 font-medium flex items-center gap-1">
                          🏥 Medical Triage
                        </span>
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-100 font-medium flex items-center gap-1">
                          🛏️ Safe Bedding
                        </span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-medium flex items-center gap-1">
                          ⚡ Generator Backup
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Emergency Helplines (India) */}
      {activeTab === 'helplines' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-amber-600" />
              National & State Emergency Helplines (India)
            </h2>
            <p className="text-xs text-slate-500">Direct toll-free lines for immediate distress, rescue response, and disaster management</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                number: '112',
                agency: 'National Emergency Response System (NERS)',
                desc: 'Single unified toll-free number for Police, Fire, Ambulance, and Disaster assistance across India.',
                tag: 'Unified Emergency',
                badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
              },
              {
                number: '1070',
                agency: 'National Disaster Management Authority (NDMA)',
                desc: 'National Disaster Control Room and Central Relief Operations under the Ministry of Home Affairs.',
                tag: 'National Disaster Control',
                badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
              },
              {
                number: '1078',
                agency: 'National Disaster Response Force (NDRF)',
                desc: 'Specialized search, rescue, flood boat evacuation, and cyclonic surge rapid action force.',
                tag: 'NDRF Rescue Ops',
                badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
              },
              {
                number: '1077',
                agency: 'District Emergency Operations Centre (DEOC)',
                desc: 'Direct line to the District Collectorate / Magistrate for local taluk rescue and relief assistance.',
                tag: 'District Emergency',
                badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              },
              {
                number: '108',
                agency: 'State Emergency Ambulance Service',
                desc: 'Free 24x7 emergency medical transport, trauma care, and paramedic dispatch.',
                tag: 'Ambulance & Trauma',
                badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
              },
              {
                number: '101',
                agency: 'Fire & Rescue Services',
                desc: 'Fire suppression, water salvage, collapsed building rescue, and dangerous tree clearance.',
                tag: 'Fire & Rescue',
                badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
              },
              {
                number: '100',
                agency: 'Police Control Room',
                desc: 'Law enforcement, perimeter security, anti-looting surveillance, and traffic cordoning.',
                tag: 'Police Control',
                badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
              },
              {
                number: '1098',
                agency: 'Childline Emergency Assistance',
                desc: 'Nationwide rescue and protection for separated, lost, or stranded children during disasters.',
                tag: 'Child Protection',
                badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
              },
              {
                number: '181',
                agency: "Women's Helpline (Crisis Response)",
                desc: 'Confidential support, shelter access, and emergency rescue assistance for women in distress.',
                tag: 'Women Safety',
                badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
              },
            ].map((hl, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${hl.badgeColor}`}>
                      {hl.tag}
                    </span>
                    <span className="font-mono text-xl font-black text-rose-600">{hl.number}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{hl.agency}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{hl.desc}</p>
                </div>

                <a
                  href={`tel:${hl.number}`}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call {hl.number} Toll-Free</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Disaster Survival Protocols & Checklists */}
      {activeTab === 'protocols' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              National Disaster Survival Protocols & Preparedness
            </h2>
            <p className="text-xs text-slate-500">Authoritative guidelines issued by the National Disaster Management Authority (NDMA)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cyclone Survival */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Severe Cyclonic Storm & Surge</h3>
                  <p className="text-xs text-slate-500">Actions during cyclone warnings & landfall</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Stay Indoors:</strong> Keep all windows and doors securely bolted. Stay away from glass panels.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Disconnect Utilities:</strong> Turn off main electrical breakers and LPG gas regulators before winds peak.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Store Clean Water:</strong> Fill clean buckets, vessels, and bottles with potable drinking water for 72 hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Eye of the Storm:</strong> If winds suddenly calm, do NOT step outside; the opposite side of the storm will return abruptly.</span>
                </li>
              </ul>
            </div>

            {/* Flood Inundation Survival */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Flash Flood & Water Inundation</h3>
                  <p className="text-xs text-slate-500">Actions when flood water levels rise rapidly</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Move to Upper Floors:</strong> Evacuate to higher building levels before escape routes are submerged.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Never Wade into Flowing Water:</strong> Just 15 cm (6 inches) of moving water can knock an adult off their feet.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Rooftop Distress Signal:</strong> Wave a brightly colored cloth or use a phone flashlight upward to signal rescue helicopters.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Submerged Vehicles:</strong> Abandon stranded vehicles immediately and move on foot to higher ground.</span>
                </li>
              </ul>
            </div>

            {/* Emergency Go-Bag Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Essential 72-Hour Emergency Go-Bag Checklist</h3>
                  <p className="text-xs text-slate-500">Keep these items packed in a waterproof backpack ready for quick evacuation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700 pt-2">
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl">
                  <strong className="text-slate-900 block font-bold border-b border-slate-200 pb-1">Essential Documents & Cash:</strong>
                  <ul className="space-y-1 text-slate-600">
                    <li>• Aadhaar / Voter ID in sealed plastic</li>
                    <li>• Essential medical prescriptions</li>
                    <li>• Physical cash (ATMs will lose power)</li>
                    <li>• Emergency contact phone numbers on paper</li>
                  </ul>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl">
                  <strong className="text-slate-900 block font-bold border-b border-slate-200 pb-1">Medical & First Aid:</strong>
                  <ul className="space-y-1 text-slate-600">
                    <li>• ORS (Oral Rehydration Salts)</li>
                    <li>• Antiseptic ointment & sterile bandages</li>
                    <li>• Paracetamol & chronic medications (7 days)</li>
                    <li>• Water purification chlorine tablets</li>
                  </ul>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl">
                  <strong className="text-slate-900 block font-bold border-b border-slate-200 pb-1">Tools & Power:</strong>
                  <ul className="space-y-1 text-slate-600">
                    <li>• LED flashlight with extra batteries</li>
                    <li>• High-capacity charged power bank</li>
                    <li>• Whistle (to signal search and rescue teams)</li>
                    <li>• High-energy dry biscuits/nuts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Community Volunteer Responder: Go & Help Nearby */}
      {activeTab === 'volunteer_help' && (
        <div className="space-y-6">
          {/* Header & Mission Explanation */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 sm:p-7 text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-xs">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Empowered Community Responder Network</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Neighborhood Distress Calls & Rapid Response
                </h2>
                <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                  As a registered citizen, you are an authorized first responder. If you are close to an emergency distress call and can safely assist, click <strong>"I Will Go and Help"</strong>. Government & Admin Command will be immediately alerted to coordinate an official rescue team (NDRF / SDRF) to your location.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={fetchNearbyRequests}
                  className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${nearbyLoading ? 'animate-spin' : ''}`} />
                  Refresh Signals
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-white/20 flex flex-wrap items-center justify-between text-xs text-emerald-100 gap-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-300" />
                <span>Your Active Dispatch Base: <strong>{myLat.toFixed(4)}, {myLon.toFixed(4)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span>Current Readiness:</span>
                <span className="font-bold text-white px-2 py-0.5 rounded bg-black/20">
                  {currentAvailability}
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'RESCUE', 'MEDICAL', 'FOOD', 'WATER', 'SHELTER'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Distress Types' : `${cat} Emergencies`}
              </button>
            ))}
          </div>

          {/* Distress Cards Stream */}
          {nearbyLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Scanning live emergency broadcast frequency...</p>
            </div>
          ) : nearbyRequests.filter(r => (categoryFilter === 'ALL' || r.emergency_type === categoryFilter) && r.status !== 'RESOLVED' && r.status !== 'CANCELLED').length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Open Distress Calls In This Category</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                All reported emergencies in this sector have been resolved or are currently inactive. Thank you for standing by to protect your neighborhood!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {nearbyRequests
                .filter(r => (categoryFilter === 'ALL' || r.emergency_type === categoryFilter) && r.status !== 'RESOLVED' && r.status !== 'CANCELLED')
                .map(req => {
                  const distKm = computeDistanceKm(myLat, myLon, req.latitude, req.longitude);
                  const isMeResponding = req.community_responder_id === user?.id;

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {req.request_code}
                          </span>
                          <StatusBadge status={req.status} size="md" />
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            {req.emergency_type} EMERGENCY
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Navigation className="w-3 h-3 text-emerald-600" />
                            {distKm} km from your location
                          </span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                        <div className="lg:col-span-2 space-y-2.5">
                          <p className="text-sm font-medium text-slate-900 leading-relaxed">
                            {req.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-slate-600 pt-1">
                            {req.landmark && (
                              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                                <span>Landmark: {req.landmark}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Trapped / In Danger: <strong>{req.affected_count} individuals</strong></span>
                            </div>
                            <div>
                              Sector GPS: <strong className="font-mono">{req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}</strong>
                            </div>
                          </div>

                          {/* Victim contact link if available */}
                          {req.contact_phone && (
                            <div className="pt-1 flex items-center gap-2">
                              <span className="text-slate-500">Caller Contact:</span>
                              <a
                                href={`tel:${req.contact_phone}`}
                                className="font-mono font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100"
                              >
                                <Phone className="w-3 h-3" />
                                {req.contact_phone}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Dispatch Status Box */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">
                              Rescue & Volunteer State
                            </span>

                            {/* Official Rescue Force Status */}
                            {req.assigned_rescue_team ? (
                              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                                <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs">
                                  <Truck className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                  <span>Official Rescue Team:</span>
                                </div>
                                <p className="text-xs font-black text-rose-900 mt-0.5">
                                  {req.assigned_rescue_team}
                                </p>
                                <p className="text-[10px] text-rose-700 font-semibold">
                                  Dispatched by Government Command
                                </p>
                              </div>
                            ) : (
                              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                                <span className="font-bold block">Official Rescue Team: Pending</span>
                                <span>Government will assign nearby rapid force upon citizen response.</span>
                              </div>
                            )}

                            {/* Community Responder status */}
                            {req.community_responder_name ? (
                              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Community Responder:</span>
                                </div>
                                <p className="text-xs font-black text-emerald-950 mt-0.5">
                                  {req.community_responder_name} {isMeResponding && '(You)'}
                                </p>
                                {req.community_responder_phone && (
                                  <p className="text-[11px] text-emerald-700 font-mono">
                                    Tel: {req.community_responder_phone}
                                  </p>
                                )}
                                {req.community_responder_note && (
                                  <p className="text-[10px] text-emerald-800 italic mt-0.5">
                                    "{req.community_responder_note}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500 italic">
                                No community volunteer en route yet.
                              </div>
                            )}
                          </div>

                          {/* ACTION BUTTON: "I Will Go and Help" */}
                          <div className="pt-2">
                            {isMeResponding ? (
                              <div className="w-full py-2 px-3 bg-emerald-700 text-white rounded-xl text-xs font-black text-center flex items-center justify-center gap-1.5 shadow-sm">
                                <Check className="w-4 h-4 text-emerald-200" />
                                You Are Responding (On The Way)
                              </div>
                            ) : req.community_responder_name ? (
                              <button
                                onClick={() => {
                                  setRespondModalReq(req);
                                  setResponderNote(`Assisting as co-responder alongside ${req.community_responder_name}.`);
                                  setResponderEta('10');
                                }}
                                className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <HeartHandshake className="w-4 h-4" />
                                Join as Backup Responder
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setRespondModalReq(req);
                                  setResponderNote('I am nearby and heading to assist.');
                                  setResponderEta('10');
                                }}
                                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transform active:scale-98"
                              >
                                <HeartHandshake className="w-4 h-4 text-emerald-200 animate-bounce" />
                                ✋ I WILL GO AND HELP
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Create Distress Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-rose-600 text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base">Broadcast Emergency Distress Signal</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <DistressForm
                onSuccess={() => {
                  setShowCreateModal(false);
                  fetchMyRequests();
                }}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Cancel Emergency Request {cancelModalReq.request_code}?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If help is no longer required or you have safely evacuated, please provide a brief reason to notify the rescue dispatch center:
            </p>
            <input
              type="text"
              placeholder="e.g. Safely evacuated to shelter / False alarm"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalReq(null)}
                disabled={isCancelling}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={isCancelling}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "I Will Go and Help" Action Modal */}
      {respondModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base">
                  Declare Response: {respondModalReq.request_code}
                </h3>
              </div>
              <button
                onClick={() => setRespondModalReq(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Alert notice about government rescue team dispatch */}
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Command Center & Official Force Notification</span>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  When you declare <strong>"I will go and help"</strong>, your status is immediately broadcasted to Government Control and Admin Dispatch. Authorities will be prompted to quickly assign a nearby professional rescue team (NDRF, SDRF, or Fire & Rescue) to backup and support your intervention.
                </p>
              </div>

              {/* Emergency Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wide">
                    {respondModalReq.emergency_type} Emergency • Urgency: {respondModalReq.urgency}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {computeDistanceKm(myLat, myLon, respondModalReq.latitude, respondModalReq.longitude)} km away
                  </span>
                </div>
                <p className="text-slate-700">{respondModalReq.description}</p>
                {respondModalReq.landmark && (
                  <p className="text-slate-600 font-medium">Landmark: {respondModalReq.landmark}</p>
                )}
              </div>

              {/* Form Inputs */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Your Contact Phone (for victim and rescue team coordination):
                  </label>
                  <input
                    type="tel"
                    value={responderPhone}
                    onChange={(e) => setResponderPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Estimated Time of Arrival (ETA in minutes):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={responderEta}
                    onChange={(e) => setResponderEta(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Equipment / Response Note (e.g. Two-wheeler, First Aid, Drinking Water, Ropes):
                  </label>
                  <textarea
                    rows={2}
                    value={responderNote}
                    onChange={(e) => setResponderNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Safety notice */}
              <p className="text-[11px] text-slate-500 leading-relaxed italic">
                Safety First: Do not put yourself in life-threatening danger without appropriate equipment. Official rescue teams are alerted in parallel.
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRespondModalReq(null)}
                disabled={isSubmittingResponse}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGoHelp}
                disabled={isSubmittingResponse}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-200" />
                {isSubmittingResponse ? 'Alerting Command...' : 'CONFIRM: I AM GOING TO HELP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-indigo-700 text-white">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-5 h-5 text-indigo-200" />
                <h3 className="font-bold text-base">
                  Citizen Volunteer Responder Profile
                </h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                As a registered citizen, you are part of the authorized community volunteer force. Keeping your readiness status and vehicle details current helps dispatchers coordinate rescue efforts.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Availability Status:
                  </label>
                  <select
                    value={profStatus}
                    onChange={(e) => setProfStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="AVAILABLE">AVAILABLE (Ready to receive distress alerts and help)</option>
                    <option value="BUSY">BUSY (Currently responding / helping elsewhere)</option>
                    <option value="OFFLINE">OFFLINE (Unavailable for response)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Emergency Contact Phone:
                  </label>
                  <input
                    type="tel"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Transport Vehicle:
                  </label>
                  <select
                    value={profVehicle}
                    onChange={(e) => setProfVehicle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="TWO_WHEELER">Two-Wheeler (Motorcycle / Scooter - agile in narrow alleys)</option>
                    <option value="FOUR_WHEELER">Four-Wheeler (Car / SUV / Van)</option>
                    <option value="BOAT">Inflatable Boat / Skiff (Flood rescue ready)</option>
                    <option value="CYCLE">Bicycle</option>
                    <option value="ON_FOOT">On Foot (Pedestrian rescue within neighborhood)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Skills & Capabilities (comma separated):
                  </label>
                  <input
                    type="text"
                    value={profSkills}
                    onChange={(e) => setProfSkills(e.target.value)}
                    placeholder="First Aid, Swimming, Evacuation, CPR, Doctor"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  disabled={isSavingProfile}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
