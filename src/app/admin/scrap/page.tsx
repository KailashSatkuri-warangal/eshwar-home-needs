'use client';

import React, { useState, useEffect } from 'react';
import { ScrapRequest, ScrapRate, ScrapMaterialType, ScrapStatus } from '@/types';
import { getDbDocs, setDbDoc } from '@/lib/services/db';
import { MOCK_SCRAP_RATES } from '@/lib/mockData';
import { useApp } from '@/context/AppContext';
import { 
  Scale, Calendar, MapPin, Truck, RefreshCw, Save, 
  ChevronRight, CheckCircle2, UserCheck, X 
} from 'lucide-react';

const getMaterialLabel = (type: string) => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function AdminScrapPage() {
  const { showToast } = useApp();
  const [pickups, setPickups] = useState<ScrapRequest[]>([]);
  const [rates, setRates] = useState<ScrapRate[]>(MOCK_SCRAP_RATES);
  const [loading, setLoading] = useState(false);

  // Rate config form fields
  const [copperRate, setCopperRate] = useState(645);
  const [brassRate, setBrassRate] = useState(425);
  const [ssRate, setSsRate] = useState(48);
  const [steelRate, setSteelRate] = useState(28);
  const [aluminiumRate, setAluminiumRate] = useState(135);
  const [plasticRate, setPlasticRate] = useState(14);

  // Inspector / Verified Details Modal States
  const [editingRequest, setEditingRequest] = useState<ScrapRequest | null>(null);
  const [collectorName, setCollectorName] = useState('');
  const [actualWeight, setActualWeight] = useState(0);
  const [actualRate, setActualRate] = useState(0);

  const fetchScrapData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Rates
      const ratesList = await getDbDocs('scrapRates') as ScrapRate[];
      if (ratesList.length > 0) {
        setRates(ratesList);
        // Sync form values
        const cop = ratesList.find(r => r.id === 'copper');
        if (cop) setCopperRate(cop.currentRate);
        const br = ratesList.find(r => r.id === 'brass');
        if (br) setBrassRate(br.currentRate);
        const ss = ratesList.find(r => r.id === 'stainless_steel');
        if (ss) setSsRate(ss.currentRate);
        const st = ratesList.find(r => r.id === 'steel');
        if (st) setSteelRate(st.currentRate);
        const al = ratesList.find(r => r.id === 'aluminium');
        if (al) setAluminiumRate(al.currentRate);
        const pl = ratesList.find(r => r.id === 'plastic');
        if (pl) setPlasticRate(pl.currentRate);
      }

      // 2. Fetch Pickup requests
      const list = await getDbDocs('scrapRequests') as ScrapRequest[];
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() / 1000 : 0) || 0;
        const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() / 1000 : 0) || 0;
        return timeB - timeA;
      });
      setPickups(list);
    } catch (e) {
      console.error(e);
      setPickups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScrapData();
  }, []);

  // Update scrap buying rates in Firestore
  const handleRatesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newRates: Record<ScrapMaterialType, number> = {
      copper: copperRate,
      brass: brassRate,
      stainless_steel: ssRate,
      steel: steelRate,
      aluminium: aluminiumRate,
      plastic: plasticRate,
      mixed_metal: 35,
      other: 15,
    };

    try {
      const keys = Object.keys(newRates) as ScrapMaterialType[];
      
      for (const key of keys) {
        const prev = rates.find(r => r.id === key);
        const prevRate = prev ? prev.currentRate : newRates[key];

        await setDbDoc('scrapRates', key, {
          id: key,
          material: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          currentRate: newRates[key],
          previousRate: prevRate,
          updatedAt: new Date()
        });

        // Log rate history entry
        const historyId = `hist_${key}_${Date.now()}`;
        await setDbDoc('scrapRateHistory', historyId, {
          id: historyId,
          material: key,
          rate: newRates[key],
          timestamp: new Date()
        });
      }

      showToast('Daily scrap rates updated successfully!', 'success');
      fetchScrapData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update scrap rates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditRequest = (req: ScrapRequest) => {
    setEditingRequest(req);
    setCollectorName(req.collectorName || 'Ramesh (ESHwar Collector)');
    setActualWeight(req.actualWeight || req.estimatedWeight);
    
    // Default rate from active card
    const activeRateObj = rates.find(r => r.id === req.material);
    setActualRate(activeRateObj ? activeRateObj.currentRate : 0);
  };

  // Save inspection values
  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    const finalAmount = actualWeight * actualRate;

    try {
      // Update scrap request document (with local JSON fallback)
      await setDbDoc('scrapRequests', editingRequest.id, {
        ...editingRequest,
        collectorName,
        actualWeight,
        actualRate,
        finalAmount,
        status: 'PAYMENT_COMPLETED' as const,
        updatedAt: new Date()
      });

      // Update local state
      setPickups(pickups.map(p => 
        p.id === editingRequest.id 
          ? { ...p, collectorName, actualWeight, actualRate, finalAmount, status: 'PAYMENT_COMPLETED' } 
          : p
      ));

      showToast('Pickup completed & payment verified!', 'success');
      setEditingRequest(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to log pickup verification.', 'error');
    }
  };

  const getStatusColor = (status: ScrapStatus) => {
    switch (status) {
      case 'PAYMENT_COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'SCHEDULED':
      case 'COLLECTOR_ASSIGNED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex justify-between items-center pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-serif">Scrap Operations Panel</h1>
          <p className="text-xs text-stone-500 mt-0.5">Configure daily buying rates per kg and inspect doorstep pick-up schedules</p>
        </div>
        <button onClick={fetchScrapData} className="p-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-full">
          <RefreshCw className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Grid: Rates Configuration left, Pickup requests right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Rate configuration (2/5 width) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleRatesSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4 text-xs text-stone-600">
            <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2 flex items-center gap-1.5">
              <Scale className="w-4.5 h-4.5 text-copper" /> Configure Scrap Rates (per kg)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-stone-500 block mb-1">Copper Rate (₹)</label>
                <input
                  type="number" required value={copperRate} onChange={(e) => setCopperRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-500 block mb-1">Brass Rate (₹)</label>
                <input
                  type="number" required value={brassRate} onChange={(e) => setBrassRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-500 block mb-1">Stainless Steel Rate (₹)</label>
                <input
                  type="number" required value={ssRate} onChange={(e) => setSsRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-500 block mb-1">Iron/Steel Rate (₹)</label>
                <input
                  type="number" required value={steelRate} onChange={(e) => setSteelRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-500 block mb-1">Aluminium Rate (₹)</label>
                <input
                  type="number" required value={aluminiumRate} onChange={(e) => setAluminiumRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-500 block mb-1">Plastic Rate (₹)</label>
                <input
                  type="number" required value={plasticRate} onChange={(e) => setPlasticRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit" disabled={loading}
                className="w-full bg-copper hover:bg-copper-dark text-white font-bold py-2.5 rounded-lg text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Save Buying Rates
              </button>
            </div>
          </form>
        </div>

        {/* Pickup requests list (3/5 width) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Booking Verification form */}
          {editingRequest && (
            <form onSubmit={handleInspectSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs text-stone-600">
              <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                <h3 className="font-bold text-stone-900 text-sm font-serif">
                  Scale Verification: Request ID {editingRequest.id.toUpperCase()}
                </h3>
                <button type="button" onClick={() => setEditingRequest(null)} className="p-1">
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Collector Name *</label>
                  <input
                    type="text" required value={collectorName} onChange={(e) => setCollectorName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Verified Weight (kg) *</label>
                  <input
                    type="number" required value={actualWeight} onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Buying Rate (₹/kg) *</label>
                  <input
                    type="number" required value={actualRate} onChange={(e) => setActualRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none font-bold text-stone-900"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-700">Calculated Cash Paid: ₹{actualWeight * actualRate}</span>
                <div className="flex gap-2">
                  <button
                    type="button" onClick={() => setEditingRequest(null)}
                    className="bg-stone-100 text-stone-700 font-bold px-3 py-1.5 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-scrap hover:bg-scrap-dark text-white font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Log Completed Payout
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Table List of Pickup Requests */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 bg-stone-50/50">
              <span className="font-bold text-stone-900 text-xs">Doorstep collection requests</span>
            </div>
            
            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-400 uppercase font-bold text-[9px] tracking-wider">
                    <th className="p-4">Client / Slot</th>
                    <th className="p-4">Material</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {pickups.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="p-4">
                        <span className="font-bold text-stone-900 block">{p.customerDetails.name}</span>
                        <span className="text-[9px] text-stone-400 block mt-0.5">
                          Phone: {p.customerDetails.phone} | Slot: {p.preferredDate} ({p.preferredTime.split(' ')[0]})
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block capitalize">{getMaterialLabel(p.material)}</span>
                        <span className="text-[10px] text-stone-400 block mt-0.5">Est. {p.estimatedWeight} kg</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 border rounded-full font-bold uppercase text-[8px] ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {p.status === 'REQUESTED' && (
                          <button
                            onClick={() => startEditRequest(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-scrap hover:bg-scrap-dark text-white rounded text-[9px] font-bold cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" /> Log Pickup
                          </button>
                        )}
                        {p.status === 'PAYMENT_COMPLETED' && (
                          <div className="text-[10px] font-semibold text-emerald-600">
                            Verified {p.actualWeight}kg (₹{p.finalAmount} paid)
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
