import React, { useState, useEffect } from 'react';
import {
  Package,
  PlusCircle,
  ArrowDownCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { ResourceItem, ReliefCenter, DistressRequest } from '../types/index.js';

export const ResourcesManagement: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [reliefCenters, setReliefCenters] = useState<ReliefCenter[]>([]);
  const [openRequests, setOpenRequests] = useState<DistressRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newCat, setNewCat] = useState<string>('FOOD');
  const [newQty, setNewQty] = useState<number>(100);
  const [newUnit, setNewUnit] = useState<string>('kits');
  const [newCenterId, setNewCenterId] = useState<string>('');

  // Stock Adjustment Modal
  const [adjustItem, setAdjustItem] = useState<ResourceItem | null>(null);
  const [adjustType, setAdjustType] = useState<string>('DAMAGED');
  const [adjustQty, setAdjustQty] = useState<number>(5);
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Allocate Resource Modal
  const [showAllocateModal, setShowAllocateModal] = useState<boolean>(false);
  const [allocResourceId, setAllocResourceId] = useState<string>('');
  const [allocRequestId, setAllocRequestId] = useState<string>('');
  const [allocQty, setAllocQty] = useState<number>(10);
  const [allocFeedback, setAllocFeedback] = useState<string | null>(null);
  const [isAllocating, setIsAllocating] = useState<boolean>(false);

  const fetchResources = async () => {
    setLoading(true);
    const [resRes, centRes, reqRes] = await Promise.all([
      apiRequest('/api/resources'),
      apiRequest('/api/disasters/relief-centers'),
      apiRequest('/api/requests'),
    ]);

    if (resRes.success && resRes.data?.resources) {
      setResources(resRes.data.resources);
      if (resRes.data.resources.length > 0 && !allocResourceId) {
        setAllocResourceId(resRes.data.resources[0].id);
      }
    }
    if (centRes.success && centRes.data?.centers) {
      setReliefCenters(centRes.data.centers);
      if (centRes.data.centers.length > 0 && !newCenterId) {
        setNewCenterId(centRes.data.centers[0].id);
      }
    }
    if (reqRes.success && reqRes.data?.requests) {
      setOpenRequests(reqRes.data.requests);
      if (reqRes.data.requests.length > 0 && !allocRequestId) {
        setAllocRequestId(reqRes.data.requests[0].id);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchResources();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchResources();
    };

    socket.on('resource:inventory_changed', handleUpdate);
    socket.on('request:created', handleUpdate);

    return () => {
      socket.off('resource:inventory_changed');
      socket.off('request:created');
    };
  }, []);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/api/resources', {
      method: 'POST',
      body: JSON.stringify({
        name: newName,
        category: newCat,
        totalQuantity: Number(newQty),
        unit: newUnit,
        reliefCenterId: newCenterId || undefined,
      }),
    });

    if (res.success) {
      setShowAddModal(false);
      setNewName('');
      fetchResources();
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;

    const res = await apiRequest(`/api/resources/${adjustItem.id}/transaction`, {
      method: 'POST',
      body: JSON.stringify({
        movementType: adjustType,
        quantity: Number(adjustQty),
        notes: adjustNotes,
      }),
    });

    if (res.success) {
      setAdjustItem(null);
      fetchResources();
    }
  };

  // ATOMIC CONCURRENT ALLOCATION WITH ZERO-STOCK PROTECTION
  const handleAllocateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAllocating(true);
    setAllocFeedback(null);

    const res = await apiRequest(`/api/resources/${allocResourceId}/allocate`, {
      method: 'POST',
      body: JSON.stringify({
        requestId: allocRequestId,
        quantity: Number(allocQty),
      }),
    });

    setIsAllocating(false);

    if (res.success) {
      const data = res.data;
      if (data.status === 'PARTIALLY_ALLOCATED') {
        setAllocFeedback(
          `Notice: Only ${data.allocatedQuantity} units were available in inventory. Request was partially fulfilled without overselling!`
        );
      } else {
        setAllocFeedback('✓ Allocation verified and atomically reserved in ledger.');
      }
      fetchResources();
      setTimeout(() => {
        setShowAllocateModal(false);
        setAllocFeedback(null);
      }, 2500);
    } else {
      setAllocFeedback(`Error: ${res.error?.message || 'Failed to allocate resource.'}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl font-black tracking-tight">Emergency Resource & Supply Inventory</h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time stock ledger, atomic allocations, and relief depot supply chain distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-open-allocate-modal"
            onClick={() => setShowAllocateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            ALLOCATE TO EMERGENCY
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            Add Supply Batch
          </button>

          <button
            onClick={fetchResources}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Inventory Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              Depot Stock Ledger ({resources.length} Tracked Categories)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atomic inventory reservations prevent negative balances during concurrent disaster distribution.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Querying PostgreSQL supply ledger...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No resources found in database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Supply Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Storage Center</th>
                  <th className="py-3 px-4 text-right">Available Stock</th>
                  <th className="py-3 px-4 text-right">Allocated</th>
                  <th className="py-3 px-4 text-right">Delivered</th>
                  <th className="py-3 px-4 text-right">Damaged</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {resources.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 text-sm block">{item.name}</span>
                      <span className="text-[11px] text-slate-400">ID: {item.id.substring(0, 8)}...</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] tracking-wide border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.relief_center_name || 'Central Logistics Hub'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`text-sm font-black ${item.available_quantity < 20 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {item.available_quantity} {item.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">
                      {item.allocated_quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right text-teal-700 font-semibold">
                      {item.delivered_quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600 font-semibold">
                      {item.damaged_quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setAdjustItem(item)}
                        className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded border border-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Adjust / Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocate to Emergency Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-rose-600 text-white">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base">Atomic Emergency Resource Allocation</h3>
              </div>
              <button onClick={() => setShowAllocateModal(false)} className="p-1 rounded text-rose-200 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAllocateResource} className="p-6 space-y-4 text-xs text-slate-700">
              {allocFeedback && (
                <div
                  className={`p-3 rounded-lg border text-xs font-semibold ${
                    allocFeedback.startsWith('✓')
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : allocFeedback.startsWith('Notice')
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {allocFeedback}
                </div>
              )}

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select Target Distress Request <span className="text-rose-600">*</span>
                </label>
                <select
                  value={allocRequestId}
                  onChange={(e) => setAllocRequestId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                  required
                >
                  {openRequests.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.request_code} — {r.emergency_type} ({r.affected_count} people) - {r.description?.substring(0, 40)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select Resource to Allocate <span className="text-rose-600">*</span>
                </label>
                <select
                  value={allocResourceId}
                  onChange={(e) => setAllocResourceId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                  required
                >
                  {resources.map(res => (
                    <option key={res.id} value={res.id}>
                      {res.name} (Available: {res.available_quantity} {res.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Quantity to Allocate <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={allocQty}
                  onChange={(e) => setAllocQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAllocating}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isAllocating ? 'Verifying & Reserving...' : 'Commit Atomic Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supply Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Log New Supply Batch</h3>
            <form onSubmit={handleCreateResource} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High-Calorie Food Ration Kits"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="FOOD">FOOD</option>
                    <option value="WATER">WATER</option>
                    <option value="MEDICINE">MEDICINE</option>
                    <option value="BLANKETS">BLANKETS</option>
                    <option value="EMERGENCY_KITS">EMERGENCY KITS</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="boxes / liters / sets"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Storage Center Depot</label>
                <select
                  value={newCenterId}
                  onChange={(e) => setNewCenterId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Central Logistics Hub (Default)</option>
                  {reliefCenters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Adjust Stock: {adjustItem.name}</h3>
            <form onSubmit={handleStockAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Reason / Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="DAMAGED">DAMAGED (Spoiled / Water Damage)</option>
                  <option value="EXPIRED">EXPIRED (Past Medical / Food Date)</option>
                  <option value="ADJUSTED">INVENTORY COUNT ADJUSTMENT</option>
                  <option value="RECEIVED">ADDITIONAL RESTOCK RECEIVED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Log Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Damaged due to rain in depot sector B"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Commit Audit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
