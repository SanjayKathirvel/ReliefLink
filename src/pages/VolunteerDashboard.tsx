import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  Phone,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { DistressRequest, VolunteerAvailability } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { LiveMap } from '../components/LiveMap.js';

export const VolunteerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'my-assignments' | 'map'>('feed');
  const [openRequests, setOpenRequests] = useState<DistressRequest[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [availability, setAvailability] = useState<VolunteerAvailability>('AVAILABLE');
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [claimLoadingId, setClaimLoadingId] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  const [gpsPingLoading, setGpsPingLoading] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const fetchOpenFeed = async () => {
    setLoading(true);
    const res = await apiRequest('/api/requests?status=OPEN');
    if (res.success && res.data?.requests) {
      setOpenRequests(res.data.requests);
    }
    setLoading(false);
  };

  const fetchMyAssignments = async () => {
    const res = await apiRequest('/api/volunteers/my-assignments');
    if (res.success && res.data?.assignments) {
      setMyAssignments(res.data.assignments);
    }
  };

  const fetchProfile = async () => {
    const res = await apiRequest('/api/auth/me');
    if (res.success && res.data?.profile?.availability_status) {
      setAvailability(res.data.profile.availability_status);
    }
  };

  useEffect(() => {
    fetchOpenFeed();
    fetchMyAssignments();
    fetchProfile();

    const socket = getSocket();

    const handleFeedUpdate = () => {
      fetchOpenFeed();
      fetchMyAssignments();
    };

    socket.on('request:created', handleFeedUpdate);
    socket.on('request:claimed', handleFeedUpdate);
    socket.on('request:status_changed', handleFeedUpdate);
    socket.on('request:updated', handleFeedUpdate);

    return () => {
      socket.off('request:created');
      socket.off('request:claimed');
      socket.off('request:status_changed');
      socket.off('request:updated');
    };
  }, []);

  // 1. ATOMIC CLAIM WITH CONCURRENT CLAIM CONFLICT PROTECTION
  const handleClaimRequest = async (requestId: string) => {
    setClaimLoadingId(requestId);
    setConflictError(null);

    const res = await apiRequest(`/api/requests/${requestId}/claim`, {
      method: 'POST',
    });

    setClaimLoadingId(null);

    if (res.success) {
      setAvailability('BUSY');
      fetchOpenFeed();
      fetchMyAssignments();
      setActiveTab('my-assignments');
    } else {
      // Show conflict error message directly
      setConflictError(
        res.error?.message ||
          'Conflict detected: Another volunteer has already claimed this emergency. The request feed has been refreshed.'
      );
      fetchOpenFeed(); // Refresh immediately so stale entry disappears
    }
  };

  // 2. Status Progression (CLAIMED -> EN_ROUTE -> ARRIVED -> IN_PROGRESS -> RESOLVED)
  const handleUpdateStatus = async (requestId: string, nextStatus: string) => {
    setStatusUpdateLoading(requestId);
    const res = await apiRequest(`/api/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus, reason: `Updated by field responder to ${nextStatus}` }),
    });
    setStatusUpdateLoading(null);

    if (res.success) {
      fetchMyAssignments();
      fetchOpenFeed();
      if (nextStatus === 'RESOLVED') {
        setAvailability('AVAILABLE');
      }
    }
  };

  // 3. Update Availability
  const handleSetAvailability = async (newStatus: VolunteerAvailability) => {
    const res = await apiRequest('/api/volunteers/availability', {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.success) {
      setAvailability(newStatus);
    }
  };

  // 4. Ping Live GPS
  const handlePingGps = () => {
    setGpsPingLoading(true);
    setGpsMessage(null);

    if (!navigator.geolocation) {
      setGpsMessage('Geolocation not supported by browser.');
      setGpsPingLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await apiRequest('/api/volunteers/location', {
          method: 'POST',
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        });
        setGpsPingLoading(false);
        if (res.success) {
          setGpsMessage(`Live GPS broadcasted: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          setTimeout(() => setGpsMessage(null), 4000);
        }
      },
      (err) => {
        setGpsPingLoading(false);
        setGpsMessage(`GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const filteredFeed = openRequests.filter(req => {
    if (filterUrgency === 'ALL') return true;
    return req.urgency === filterUrgency;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Volunteer Header & Status Controller */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl font-black tracking-tight">Volunteer Field Operations</h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time emergency dispatch queue with atomic concurrent-claim protection.
          </p>
        </div>

        {/* Tactical Controls: Availability & GPS Ping */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">Status:</span>
            {(['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK'] as VolunteerAvailability[]).map(st => (
              <button
                key={st}
                onClick={() => handleSetAvailability(st)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  availability === st
                    ? st === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : st === 'BUSY'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            id="btn-volunteer-gps-ping"
            onClick={handlePingGps}
            disabled={gpsPingLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${gpsPingLoading ? 'animate-spin' : ''}`} />
            {gpsPingLoading ? 'Broadcasting...' : 'Broadcast My GPS'}
          </button>
        </div>
      </div>

      {gpsMessage && (
        <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold rounded-xl animate-in fade-in">
          {gpsMessage}
        </div>
      )}

      {/* Concurrent Claim Conflict Alert */}
      {conflictError && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-xs flex items-start gap-3 shadow-md animate-in fade-in duration-150">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="text-sm font-bold block mb-0.5">CONCURRENCY CONFLICT DETECTED:</strong>
            <p className="leading-relaxed">{conflictError}</p>
          </div>
          <button
            onClick={() => setConflictError(null)}
            className="text-amber-800 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'feed'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Active Emergencies Feed ({openRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('my-assignments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'my-assignments'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            My Active Deployments ({myAssignments.filter(a => a.request_status !== 'RESOLVED' && a.request_status !== 'COMPLETED').length})
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'map'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Field Map View
          </button>
        </div>

        <button
          onClick={() => {
            fetchOpenFeed();
            fetchMyAssignments();
          }}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Refresh feeds"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 1. Open Emergencies Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Feed Filter Bar */}
          <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="font-bold uppercase tracking-wider">Filter Urgency:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(u => (
                <button
                  key={u}
                  onClick={() => setFilterUrgency(u)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    filterUrgency === u
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredFeed.length} unclaimed distress request(s)
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500">Querying PostgreSQL live dispatch queue...</p>
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Unclaimed Emergencies</h3>
              <p className="text-xs text-slate-500 mt-1">
                All reported distress incidents in this sector have been claimed or resolved.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeed.map(req => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {req.request_code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={req.priority} size="sm" />
                        <StatusBadge status={req.status} size="sm" />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {req.emergency_type} Emergency
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {req.description}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      {req.landmark && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          <span className="truncate">{req.landmark}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Affected: <strong className="text-slate-700">{req.affected_count} person(s)</strong></span>
                        <span>GPS: {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Atomic Claim Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Reported by: {req.citizen_name || 'Citizen'}
                    </span>

                    <button
                      id={`btn-claim-request-${req.id}`}
                      onClick={() => handleClaimRequest(req.id)}
                      disabled={claimLoadingId === req.id || availability === 'OFFLINE'}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {claimLoadingId === req.id ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Claiming...
                        </>
                      ) : (
                        <>
                          Claim Emergency <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. My Active Deployments Tab */}
      {activeTab === 'my-assignments' && (
        <div className="space-y-4">
          {myAssignments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <HeartHandshake className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Assignments Claimed Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Browse the Active Emergencies Feed to claim distress requests.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myAssignments.map(asg => {
                const isCompleted = asg.request_status === 'RESOLVED' || asg.request_status === 'CANCELLED';

                return (
                  <div
                    key={asg.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {asg.request_code}
                        </span>
                        <StatusBadge status={asg.request_status} size="md" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                          {asg.emergency_type} (Urgency: {asg.urgency})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Assigned at: {new Date(asg.assigned_at).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-sm text-slate-800 leading-relaxed font-medium mb-2">
                          {asg.description}
                        </p>
                        {asg.landmark && (
                          <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-600" />
                            <span>{asg.landmark}</span>
                          </div>
                        )}
                        <p className="text-slate-500">
                          Target Coordinates: <strong className="font-mono">{asg.latitude?.toFixed(5)}, {asg.longitude?.toFixed(5)}</strong>
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">
                          Requester / Citizen Contact
                        </span>
                        <p className="font-bold text-slate-900 text-sm">{asg.citizen_name}</p>
                        {asg.contact_phone && (
                          <div className="flex items-center gap-2 text-slate-700 font-mono">
                            <Phone className="w-3.5 h-3.5 text-sky-600" />
                            <a href={`tel:${asg.contact_phone}`} className="hover:underline">
                              {asg.contact_phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Stepper Progression */}
                    {!isCompleted && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Field Mission Pipeline:
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          {asg.request_status === 'CLAIMED' && (
                            <button
                              onClick={() => handleUpdateStatus(asg.request_id, 'EN_ROUTE')}
                              disabled={statusUpdateLoading === asg.request_id}
                              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              Mark EN ROUTE ➔
                            </button>
                          )}

                          {asg.request_status === 'EN_ROUTE' && (
                            <button
                              onClick={() => handleUpdateStatus(asg.request_id, 'ARRIVED')}
                              disabled={statusUpdateLoading === asg.request_id}
                              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              Mark ARRIVED ON SCENE ➔
                            </button>
                          )}

                          {asg.request_status === 'ARRIVED' && (
                            <button
                              onClick={() => handleUpdateStatus(asg.request_id, 'IN_PROGRESS')}
                              disabled={statusUpdateLoading === asg.request_id}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              Mark RESCUE IN PROGRESS ➔
                            </button>
                          )}

                          {(asg.request_status === 'IN_PROGRESS' || asg.request_status === 'ARRIVED' || asg.request_status === 'CLAIMED' || asg.request_status === 'EN_ROUTE') && (
                            <button
                              onClick={() => handleUpdateStatus(asg.request_id, 'RESOLVED')}
                              disabled={statusUpdateLoading === asg.request_id}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              ✓ Mark Fully RESOLVED
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Tactical Map View Tab */}
      {activeTab === 'map' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-medium">
            Tactical situational map indicating active emergencies in real-time.
          </p>
          <LiveMap requests={openRequests} heightClass="h-[600px]" />
        </div>
      )}
    </div>
  );
};
