import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  CopyCheck,
  FileSpreadsheet,
  Download,
  RefreshCw,
  AlertTriangle,
  History,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { User, DuplicateCandidate, AuditLog, UserRole } from '../types/index.js';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'duplicates' | 'users' | 'audits'>('duplicates');
  const [users, setUsers] = useState<User[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    const [uRes, dRes, aRes] = await Promise.all([
      apiRequest('/api/admin/users'),
      apiRequest('/api/admin/duplicate-candidates'),
      apiRequest('/api/admin/audit-logs'),
    ]);

    if (uRes.success && uRes.data?.users) setUsers(uRes.data.users);
    if (dRes.success && dRes.data?.candidates) setDuplicates(dRes.data.candidates);
    if (aRes.success && aRes.data?.logs) setAudits(aRes.data.logs);

    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Duplicate Resolution
  const handleResolveDuplicate = async (id: string, action: 'CONFIRM' | 'REJECT') => {
    const res = await apiRequest(`/api/admin/duplicate-candidates/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });

    if (res.success) {
      setActionFeedback(`Duplicate candidate marked as ${action === 'CONFIRM' ? 'CONFIRMED DUPLICATE' : 'REJECTED'}.`);
      setTimeout(() => setActionFeedback(null), 3000);
      fetchAdminData();
    }
  };

  // User Role / Status Update
  const handleUpdateUser = async (userId: string, role?: UserRole, status?: 'ACTIVE' | 'SUSPENDED') => {
    const res = await apiRequest(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role, status }),
    });

    if (res.success) {
      setActionFeedback('User access permissions successfully updated.');
      setTimeout(() => setActionFeedback(null), 3000);
      fetchAdminData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl font-black tracking-tight">System Administration & Audit Ledger</h1>
          </div>
          <p className="text-xs text-slate-400">
            Spatial duplicate resolution, role-based governance, and immutable audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/api/export/audit-logs"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Logs CSV
          </a>

          <button
            onClick={fetchAdminData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-in fade-in">
          {actionFeedback}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'duplicates'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CopyCheck className="w-4 h-4" />
          Spatial Duplicate Candidates ({duplicates.filter(d => d.status === 'PENDING_REVIEW').length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          User Permissions ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'audits'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          Immutable Audit Trail ({audits.length})
        </button>
      </div>

      {/* 1. Spatial Duplicate Review Queue */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
            The spatial duplicate engine flags distress requests submitted within 250 meters and 4 hours of each other.
            Review candidates below to prevent double allocation of rescue personnel.
          </div>

          {duplicates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Duplicates Flagged</h3>
              <p className="text-xs text-slate-500 mt-1">Spatial verification has verified all requests are unique.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map(d => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                        Similarity Confidence:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-xs">
                        {Math.round(d.confidence_score * 100)}% Match
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {d.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Primary Ticket */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-mono font-bold text-slate-900 block">
                        Original Request: {d.req_code} ({d.req_type})
                      </span>
                      <p className="text-slate-700 font-medium">"{d.req_desc}"</p>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        GPS: {d.req_lat?.toFixed(5)}, {d.req_lon?.toFixed(5)}
                      </span>
                    </div>

                    {/* Candidate Duplicate Ticket */}
                    <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2">
                      <span className="font-mono font-bold text-rose-900 block">
                        Potential Duplicate: {d.cand_code} ({d.cand_type})
                      </span>
                      <p className="text-slate-700 font-medium">"{d.cand_desc}"</p>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        GPS: {d.cand_lat?.toFixed(5)}, {d.cand_lon?.toFixed(5)}
                      </span>
                    </div>
                  </div>

                  {d.status === 'PENDING_REVIEW' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleResolveDuplicate(d.id, 'REJECT')}
                        className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Reject (Keep Both As Separate Incidents)
                      </button>
                      <button
                        onClick={() => handleResolveDuplicate(d.id, 'CONFIRM')}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        Confirm Duplicate (Merge & Flag)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. User Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Manage Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{u.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUser(u.id, e.target.value as UserRole)}
                        className="px-2 py-1 rounded border border-slate-300 font-bold text-[11px] bg-white"
                      >
                        <option value="CITIZEN">CITIZEN</option>
                        <option value="VOLUNTEER">VOLUNTEER</option>
                        <option value="GOVERNMENT">GOVERNMENT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          handleUpdateUser(u.id, undefined, u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                          u.status === 'ACTIVE'
                            ? 'text-rose-700 border-rose-300 hover:bg-rose-50'
                            : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Immutable Audit Logs Tab */}
      {activeTab === 'audits' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 font-sans">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {audits.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 font-semibold font-sans">
                      {log.actor_email || 'SYSTEM_WORKER'}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {log.actor_role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-rose-700">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.entity}</td>
                    <td className="py-2.5 px-4 text-slate-700 font-sans text-xs">
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
