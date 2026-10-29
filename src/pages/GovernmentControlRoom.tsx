import React, { useState, useEffect } from 'react';
import {
  Building2,
  AlertTriangle,
  Users,
  ShieldAlert,
  Radio,
  Download,
  MapPin,
  RefreshCw,
  Plus,
  Home,
  CheckCircle2,
  Truck,
  HeartHandshake,
  Clock,
  Phone,
  Send,
  Navigation,
  Check,
} from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import {
  AnalyticsOverview,
  ReliefCenter,
  Disaster,
  DisasterZone,
  DistressRequest,
  VolunteerItem,
  RescueTeam,
} from '../types/index.js';
import { LiveMap } from '../components/LiveMap.js';

export const GovernmentControlRoom: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [reliefCenters, setReliefCenters] = useState<ReliefCenter[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [zones, setZones] = useState<DisasterZone[]>([]);
  const [requests, setRequests] = useState<DistressRequest[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [bTitle, setBTitle] = useState<string>('');
  const [bMessage, setBMessage] = useState<string>('');
  const [bSeverity, setBSeverity] = useState<'CRITICAL' | 'HIGH' | 'ADVISORY'>('CRITICAL');
  const [bAudience, setBAudience] = useState<string>('ALL');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  // Rescue Team Dispatch Modal State
  const [assignRescueReq, setAssignRescueReq] = useState<DistressRequest | null>(null);
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>([]);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [rescueEta, setRescueEta] = useState<string>('15');
  const [rescueNotes, setRescueNotes] = useState<string>('Dispatched by Government Command Center.');
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);
  const [dispatchTabFilter, setDispatchTabFilter] = useState<'RESPONDING' | 'ALL'>('RESPONDING');

  // Shelter Occupancy Update Modal
  const [editCenter, setEditCenter] = useState<ReliefCenter | null>(null);
  const [newOccupancy, setNewOccupancy] = useState<number>(0);

  // Zone Creation Modal
  const [showZoneModal, setShowZoneModal] = useState<boolean>(false);
  const [zoneName, setZoneName] = useState<string>('');
  const [zoneType, setZoneType] = useState<'HIGH_RISK' | 'EVACUATION' | 'SAFE'>('HIGH_RISK');
  const [zoneLat, setZoneLat] = useState<number>(13.0827);
  const [zoneLon, setZoneLon] = useState<number>(80.2707);
  const [zoneRadius, setZoneRadius] = useState<number>(2500);

  const fetchOverview = async () => {
    setLoading(true);
    const [aRes, cRes, dRes, rRes, vRes] = await Promise.all([
      apiRequest('/api/analytics/overview'),
      apiRequest('/api/disasters/relief-centers'),
      apiRequest('/api/disasters'),
      apiRequest('/api/requests'),
      apiRequest('/api/volunteers'),
    ]);

    if (aRes.success && aRes.data) setAnalytics(aRes.data);
    if (cRes.success && cRes.data?.centers) setReliefCenters(cRes.data.centers);
    if (dRes.success && dRes.data?.disasters) {
      setDisasters(dRes.data.disasters);
      const allZones: DisasterZone[] = [];
      dRes.data.disasters.forEach((d: Disaster) => {
        if (d.zones) allZones.push(...d.zones);
      });
      setZones(allZones);
    }
    if (rRes.success && rRes.data?.requests) setRequests(rRes.data.requests);
    if (vRes.success && vRes.data?.volunteers) setVolunteers(vRes.data.volunteers);

    setLoading(false);
  };

  useEffect(() => {
    fetchOverview();

    const socket = getSocket();
    const handleLiveChange = () => {
      fetchOverview();
    };

    socket.on('request:created', handleLiveChange);
    socket.on('request:claimed', handleLiveChange);
    socket.on('request:status_changed', handleLiveChange);
    socket.on('request:escalated', handleLiveChange);
    socket.on('request:community_responder_joined', handleLiveChange);
    socket.on('request:rescue_team_assigned', handleLiveChange);
    socket.on('center:updated', handleLiveChange);
    socket.on('broadcast:emergency', handleLiveChange);

    return () => {
      socket.off('request:created', handleLiveChange);
      socket.off('request:claimed', handleLiveChange);
      socket.off('request:status_changed', handleLiveChange);
      socket.off('request:escalated', handleLiveChange);
      socket.off('request:community_responder_joined', handleLiveChange);
      socket.off('request:rescue_team_assigned', handleLiveChange);
      socket.off('center:updated', handleLiveChange);
      socket.off('broadcast:emergency', handleLiveChange);
    };
  }, []);

  // Open Rescue Modal
  const openRescueModal = async (req: DistressRequest) => {
    setAssignRescueReq(req);
    setLoadingTeams(true);
    setRescueNotes(`Authorized deployment by Government Command to reinforce sector coordinates ${req.latitude.toFixed(4)}, ${req.longitude.toFixed(4)}.`);
    setRescueEta('15');

    const res = await apiRequest(`/api/requests/rescue-teams?latitude=${req.latitude}&longitude=${req.longitude}`);
    setLoadingTeams(false);
    if (res.success && res.data?.rescueTeams) {
      setRescueTeams(res.data.rescueTeams);
      if (res.data.rescueTeams.length > 0) {
        setSelectedTeamId(res.data.rescueTeams[0].id);
      }
    }
  };

  // Dispatch Rescue Team
  const handleConfirmDispatch = async () => {
    if (!assignRescueReq || !selectedTeamId) return;
    setIsDispatching(true);
    const team = rescueTeams.find(t => t.id === selectedTeamId);

    const res = await apiRequest(`/api/requests/${assignRescueReq.id}/assign-rescue-team`, {
      method: 'POST',
      body: JSON.stringify({
        teamId: selectedTeamId,
        teamName: team?.name || 'National Disaster Response Force',
        etaMinutes: rescueEta,
        notes: rescueNotes,
      }),
    });

    setIsDispatching(false);

    if (res.success) {
      setDispatchFeedback(`Official unit ${team?.name} dispatched to ${assignRescueReq.request_code}! Citizen responder and field command updated.`);
      setAssignRescueReq(null);
      fetchOverview();
      setTimeout(() => setDispatchFeedback(null), 6000);
    }
  };

  // Submit Emergency Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle || !bMessage) return;

    setIsBroadcasting(true);
    const res = await apiRequest('/api/broadcasts', {
      method: 'POST',
      body: JSON.stringify({
        title: bTitle,
        message: bMessage,
        severity: bSeverity,
        targetAudience: bAudience,
      }),
    });
    setIsBroadcasting(false);

    if (res.success) {
      setShowBroadcastModal(false);
      setBTitle('');
      setBMessage('');
    }
  };

  // Update Shelter Occupancy
  const handleUpdateOccupancy = async () => {
    if (!editCenter) return;
    const res = await apiRequest(`/api/disasters/relief-centers/${editCenter.id}/occupancy`, {
      method: 'PATCH',
      body: JSON.stringify({ occupancy: Number(newOccupancy) }),
    });
    if (res.success) {
      setEditCenter(null);
      fetchOverview();
    }
  };

  // Create Hazard Zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryDisaster = disasters[0];
    if (!primaryDisaster) return;

    const res = await apiRequest(`/api/disasters/${primaryDisaster.id}/zones`, {
      method: 'POST',
      body: JSON.stringify({
        name: zoneName,
        zoneType,
        severity: 'CRITICAL',
        latitude: zoneLat,
        longitude: zoneLon,
        radiusMeters: zoneRadius,
      }),
    });

    if (res.success) {
      setShowZoneModal(false);
      fetchOverview();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Control Room Top Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl font-black tracking-tight">Government Incident Command Room</h1>
          </div>
          <p className="text-xs text-slate-400">
            Authoritative multi-agency disaster operations, SLA escalations & emergency broadcast control.
          </p>
        </div>

        {/* Global Dispatch Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-trigger-emergency-broadcast"
            onClick={() => setShowBroadcastModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            ISSUE EMERGENCY BROADCAST
          </button>

          <a
            href="/api/export/requests"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>

          <button
            onClick={fetchOverview}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dispatch Success Alert Banner */}
      {dispatchFeedback && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 flex-shrink-0" />
            <span className="text-xs font-bold">{dispatchFeedback}</span>
          </div>
          <button
            onClick={() => setDispatchFeedback(null)}
            className="text-emerald-200 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Metrics Grid */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Requests
            </span>
            <span className="text-2xl font-black text-slate-900">{analytics.requests.total_requests}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Logged in dispatch</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
              Open (Unclaimed)
            </span>
            <span className="text-2xl font-black text-rose-600">{analytics.requests.open_requests}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Need field response</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 block mb-1">
              Active Missions
            </span>
            <span className="text-2xl font-black text-sky-600">{analytics.requests.active_operations}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Responders en route</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
              Resolved
            </span>
            <span className="text-2xl font-black text-emerald-600">{analytics.requests.resolved_requests}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Missions completed</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
              Auto-Escalated
            </span>
            <span className="text-2xl font-black text-amber-600">{analytics.requests.escalated_requests}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">SLA timeout breaches</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Field Units
            </span>
            <span className="text-2xl font-black text-slate-900">
              {analytics.volunteers.available_volunteers} <span className="text-xs text-slate-400 font-normal">/ {analytics.volunteers.total_volunteers}</span>
            </span>
            <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">Available for dispatch</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Shelter Occupancy
            </span>
            <span className="text-2xl font-black text-slate-900">
              {analytics.shelters.total_occupancy} <span className="text-xs text-slate-400 font-normal">/ {analytics.shelters.total_capacity}</span>
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">{analytics.shelters.available_capacity} beds free</span>
          </div>
        </div>
      )}

      {/* Interactive Situational Map with Zones and Centers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-600" />
              Live Situational Tactical Map
            </h2>
            <p className="text-xs text-slate-500">
              Real-time synchronization of distress signals, hazard zones, field operatives, and relief centers.
            </p>
          </div>

          <button
            onClick={() => setShowZoneModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Disaster Hazard Zone
          </button>
        </div>

        <LiveMap
          requests={requests}
          volunteers={volunteers}
          reliefCenters={reliefCenters}
          zones={zones}
          heightClass="h-[550px]"
        />
      </div>

      {/* Relief Centers & Evacuation Shelters Management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Home className="w-5 h-5 text-indigo-600" />
              Shelters & Relief Centers Capacity Control
            </h3>
            <p className="text-xs text-slate-500">
              Real-time monitoring of shelter occupancy, bed capacity, and operational status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reliefCenters.map(center => {
            const isFull = center.operating_status === 'FULL';
            const pct = Math.min(100, center.occupancy_percentage || 0);

            return (
              <div
                key={center.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{center.name}</h4>
                    <span className="text-[11px] text-slate-500">{center.center_type} Relief Hub</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                      isFull ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {center.operating_status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Occupancy: {center.occupancy} / {center.capacity}</span>
                    <span className={pct > 90 ? 'text-rose-600' : 'text-slate-700'}>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct >= 100 ? 'bg-rose-600' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Available beds: <strong>{center.available_beds}</strong>
                  </span>
                </div>

                <button
                  onClick={() => {
                    setEditCenter(center);
                    setNewOccupancy(center.occupancy);
                  }}
                  className="w-full py-1.5 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Update Live Occupancy
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Responders En Route & Rapid Rescue Team Assignment Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 mb-1">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>Rescue Command & Tactical Force Deployment</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
              <span>Citizen Community Responders & Rapid Rescue Force Assignment</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-3xl">
              When citizens declare <strong>"I will go and help"</strong>, Government & Admin Command must immediately assign and deploy a nearby official rescue force (NDRF, SDRF, or Fire & Rescue) to back up the citizen in the field and ensure victim safety.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDispatchTabFilter('RESPONDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                dispatchTabFilter === 'RESPONDING'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              🏃 Citizens Responding (
              {
                requests.filter(
                  (r) =>
                    (r.community_responder_status === 'I_WILL_GO' || !!r.community_responder_name) &&
                    r.status !== 'RESOLVED' &&
                    r.status !== 'CANCELLED'
                ).length
              }
              )
            </button>
            <button
              onClick={() => setDispatchTabFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                dispatchTabFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Active Signals (
              {requests.filter((r) => r.status !== 'RESOLVED' && r.status !== 'CANCELLED').length})
            </button>
          </div>
        </div>

        {/* List of distress requests */}
        {(() => {
          const filtered = requests.filter((r) => {
            if (r.status === 'RESOLVED' || r.status === 'CANCELLED') return false;
            if (dispatchTabFilter === 'RESPONDING') {
              return r.community_responder_status === 'I_WILL_GO' || !!r.community_responder_name;
            }
            return true;
          });

          if (filtered.length === 0) {
            return (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {dispatchTabFilter === 'RESPONDING'
                    ? 'No citizens currently en route. Standing by for incoming "I Will Go" citizen declarations.'
                    : 'All emergency requests have been resolved or are currently inactive.'}
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((req) => {
                const hasCitizen =
                  req.community_responder_status === 'I_WILL_GO' || !!req.community_responder_name;
                const hasOfficialTeam = !!req.assigned_rescue_team;

                return (
                  <div
                    key={req.id}
                    className={`rounded-xl border p-4 sm:p-5 transition-all space-y-3 ${
                      hasCitizen && !hasOfficialTeam
                        ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                        : hasCitizen && hasOfficialTeam
                        ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-900 shadow-xs">
                          {req.request_code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-rose-600 text-white">
                          {req.emergency_type}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          Urgency: <strong className="text-rose-700">{req.urgency}</strong>
                        </span>
                        <span className="text-xs text-slate-500">
                          • Stranded: <strong>{req.affected_count} persons</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}
                        </span>
                        {req.landmark && (
                          <span className="font-sans font-semibold text-slate-700">
                            ({req.landmark})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Description */}
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {req.description}
                    </p>

                    {/* Dual Cards: Citizen Responder + Official Force Assignment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* Community Citizen Volunteer Block */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                            Community Citizen Responder
                          </span>
                          {hasCitizen ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-black">
                              ✋ EN ROUTE (I WILL GO)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">None yet</span>
                          )}
                        </div>

                        {hasCitizen ? (
                          <div className="text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{req.community_responder_name || 'Registered Citizen'}</span>
                              {req.community_responder_phone && (
                                <a
                                  href={`tel:${req.community_responder_phone}`}
                                  className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                                >
                                  <Phone className="w-3 h-3" />
                                  {req.community_responder_phone}
                                </a>
                              )}
                            </div>
                            {req.community_responder_eta && (
                              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>ETA: ~{req.community_responder_eta} minutes</span>
                              </div>
                            )}
                            {req.community_responder_note && (
                              <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                                "{req.community_responder_note}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            No citizen has marked "I will go" for this request yet.
                          </p>
                        )}
                      </div>

                      {/* Official Rescue Force Block */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-rose-600" />
                              Official Rescue Force (Government)
                            </span>
                            {hasOfficialTeam ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-black">
                                DISPATCHED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-black">
                                PENDING ASSIGNMENT
                              </span>
                            )}
                          </div>

                          {hasOfficialTeam ? (
                            <div className="text-xs space-y-1">
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                                <span>{req.assigned_rescue_team}</span>
                              </p>
                              {req.assigned_rescue_team_eta && (
                                <p className="text-[11px] text-rose-700 font-semibold flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" />
                                  <span>Official ETA: ~{req.assigned_rescue_team_eta} mins</span>
                                </p>
                              )}
                              {req.assigned_rescue_team_notes && (
                                <p className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded">
                                  Order: {req.assigned_rescue_team_notes}
                                </p>
                              )}
                            </div>
                          ) : hasCitizen ? (
                            <div className="p-2 bg-amber-100/70 border border-amber-300 rounded-lg text-[11px] text-amber-900 leading-tight">
                              <strong>⚠️ Alert:</strong> Citizen is in the field alone without
                              official backup! Assign an NDRF/SDRF rapid rescue unit now.
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">
                              Awaiting command dispatch decision.
                            </p>
                          )}
                        </div>

                        {/* Dispatch Action Button */}
                        <div className="pt-1">
                          <button
                            onClick={() => openRescueModal(req)}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                              hasOfficialTeam
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                                : 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                            }`}
                          >
                            <Truck className="w-3.5 h-3.5" />
                            {hasOfficialTeam
                              ? 'Reassign / Deploy Additional Unit'
                              : '🚒 ASSIGN NEARBY RESCUE TEAM NOW'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Coverage Gap Analysis Table */}
      {analytics && analytics.coverageGaps && analytics.coverageGaps.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-black text-slate-900">
              Identified Coverage Gaps ({analytics.coverageGaps.length} Unserved Clusters)
            </h3>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            The spatial engine has flagged distress incidents with zero active volunteers within immediate 15km operational range.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Request Code</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Urgency</th>
                  <th className="py-2.5 px-3">Affected</th>
                  <th className="py-2.5 px-3">Nearest Field Unit</th>
                  <th className="py-2.5 px-3">Gap Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.coverageGaps.map(gap => (
                  <tr key={gap.requestId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{gap.requestCode}</td>
                    <td className="py-2.5 px-3 font-semibold">{gap.emergencyType}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-rose-700 font-bold">{gap.urgency}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold">{gap.affectedCount} persons</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {gap.nearestVolunteerDistKm ? `${gap.nearestVolunteerDistKm} km` : 'No units in sector'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                        {gap.gapSeverity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Emergency Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-rose-600 text-white">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base">Issue Public Emergency Broadcast</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1 rounded-lg text-rose-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Broadcast Alert Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH FLOOD RED ALERT - EVACUATE SECTOR 4"
                  value={bTitle}
                  onChange={(e) => setBTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Detailed Advisory Message <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Dam spillway open. Seek higher ground immediately. Shelters open at East High School..."
                  value={bMessage}
                  onChange={(e) => setBMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Alert Severity
                  </label>
                  <select
                    value={bSeverity}
                    onChange={(e) => setBSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold text-rose-700"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="ADVISORY">ADVISORY</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={bAudience}
                    onChange={(e) => setBAudience(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="ALL">All Citizens & Responders</option>
                    <option value="CITIZENS">Citizens Only</option>
                    <option value="VOLUNTEERS">Volunteers Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isBroadcasting ? 'Broadcasting...' : 'TRANSMIT BROADCAST NOW'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shelter Occupancy Modal */}
      {editCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Update Occupancy: {editCenter.name}</h3>
            <p className="text-xs text-slate-500">
              Total Center Bed Capacity: <strong>{editCenter.capacity}</strong>
            </p>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Current Registered Occupants
              </label>
              <input
                type="number"
                min="0"
                max={editCenter.capacity * 2}
                value={newOccupancy}
                onChange={(e) => setNewOccupancy(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditCenter(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateOccupancy}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-sm"
              >
                Save Occupancy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Creator Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Define Hazard / Evacuation Zone</h3>
            <form onSubmit={handleCreateZone} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adyar Estuary & Coastal Evacuation Sector"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Zone Type</label>
                <select
                  value={zoneType}
                  onChange={(e) => setZoneType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="HIGH_RISK">HIGH RISK (Danger - Imminent Threat)</option>
                  <option value="EVACUATION">EVACUATION (Mandatory Evacuation)</option>
                  <option value="SAFE">SAFE (Designated Safe Assembly Point)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={zoneLat}
                    onChange={(e) => setZoneLat(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={zoneLon}
                    onChange={(e) => setZoneLon(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Radius (Meters)</label>
                <input
                  type="number"
                  step="100"
                  min="200"
                  max="50000"
                  value={zoneRadius}
                  onChange={(e) => setZoneRadius(parseInt(e.target.value) || 1000)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowZoneModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Create Disaster Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Rescue Team Assignment & Dispatch Modal */}
      {assignRescueReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">
                  Dispatch Official Rescue Unit: {assignRescueReq.request_code}
                </h3>
              </div>
              <button
                onClick={() => setAssignRescueReq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Emergency context card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-rose-700 uppercase">
                    {assignRescueReq.emergency_type} Emergency • Urgency: {assignRescueReq.urgency}
                  </span>
                  <span className="font-mono text-slate-600">
                    Target: {assignRescueReq.latitude.toFixed(4)}, {assignRescueReq.longitude.toFixed(4)}
                  </span>
                </div>
                <p className="text-slate-700">{assignRescueReq.description}</p>
                {assignRescueReq.landmark && (
                  <p className="text-slate-600 font-semibold">Landmark: {assignRescueReq.landmark}</p>
                )}

                {/* Citizen responder indicator if en route */}
                {assignRescueReq.community_responder_name && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-900">
                    <div className="flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Citizen Responder: <strong>{assignRescueReq.community_responder_name}</strong> is en route.
                      </span>
                    </div>
                    {assignRescueReq.community_responder_phone && (
                      <span className="font-mono text-emerald-700 text-[11px]">
                        Tel: {assignRescueReq.community_responder_phone}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Team selection */}
              <div className="space-y-2 text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-700 block">
                  Select Rapid Deployment Rescue Force (Sorted by Proximity)
                </label>

                {loadingTeams ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-slate-500">Locating available tactical rescue units...</p>
                  </div>
                ) : rescueTeams.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    No active rescue units found in this sector.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {rescueTeams.map((team) => {
                      const isSelected = selectedTeamId === team.id;

                      return (
                        <div
                          key={team.id}
                          onClick={() => setSelectedTeamId(team.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-400 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{team.name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {team.unit_type}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                              <span>Base: {team.station_location}</span>
                              <span>• Operatives: {team.available_personnel}</span>
                              <span className="font-mono">Tel: {team.contact_phone}</span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            {team.distanceKm != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-xs rounded-md">
                                <Navigation className="w-3 h-3 text-rose-600" />
                                {team.distanceKm} km
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ETA and directives */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ETA (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={rescueEta}
                    onChange={(e) => setRescueEta(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Operational Orders & Directives
                  </label>
                  <input
                    type="text"
                    value={rescueNotes}
                    onChange={(e) => setRescueNotes(e.target.value)}
                    placeholder="e.g. Carry inflatable rafts and high-volume pumps"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssignRescueReq(null)}
                disabled={isDispatching}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={isDispatching || !selectedTeamId}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Truck className="w-4 h-4 text-rose-200" />
                {isDispatching ? 'Transmitting Deployment Order...' : 'CONFIRM & DISPATCH RESCUE TEAM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
