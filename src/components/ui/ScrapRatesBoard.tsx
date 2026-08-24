'use client';

import React, { useState, useEffect } from 'react';
import { ScrapRate, ScrapMaterialType } from '@/types';
import { Scale, TrendingUp, TrendingDown, ArrowRight, RefreshCw } from 'lucide-react';
import { subscribeDbCollection } from '@/lib/services/db';

interface ScrapRatesBoardProps {
  initialRates: ScrapRate[];
}

export default function ScrapRatesBoard({ initialRates }: ScrapRatesBoardProps) {
  const [rates, setRates] = useState<ScrapRate[]>(initialRates);
  const [selectedMaterial, setSelectedMaterial] = useState<ScrapMaterialType>('copper');
  const [weight, setWeight] = useState<number>(10);

  // Real-time rates subscription & commodity ticker simulation
  useEffect(() => {
    // 1. Subscribe to database rates
    const unsubscribe = subscribeDbCollection('scrapRates', (dbRates) => {
      if (dbRates && dbRates.length > 0) {
        // Map to ScrapRate type to satisfy TypeScript
        const mapped = dbRates.map(item => ({
          id: (item.id || item.material) as ScrapMaterialType,
          material: (item.material || item.id) as ScrapMaterialType,
          currentRate: item.currentRate || 0,
          previousRate: item.previousRate || item.currentRate || 0,
          updatedAt: item.updatedAt || { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
        }));
        setRates(mapped);
      }
    });

    // 2. Simulate live commodity pricing ticks
    const interval = window.setInterval(() => {
      setRates((prevRates) =>
        prevRates.map((rate) => {
          // 40% chance to fluctuate each rate on each tick
          if (Math.random() > 0.4) return rate;
          
          const changePercent = (Math.random() * 0.8 - 0.4); // fluctuate between -0.4% and +0.4%
          const delta = Math.round(rate.currentRate * (changePercent / 100) * 10) / 10;
          
          if (Math.abs(delta) < 0.1) return rate;

          const newRate = Math.max(10, Math.round((rate.currentRate + delta) * 10) / 10);
          
          return {
            ...rate,
            previousRate: rate.currentRate,
            currentRate: newRate,
            updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
          };
        })
      );
    }, 5000); // Ticks every 5 seconds

    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  // Helper to format material names
  const getMaterialLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Find active rate per kg
  const activeRateObj = rates.find((r) => r.id === selectedMaterial);
  const activeRate = activeRateObj ? activeRateObj.currentRate : 0;
  const estimatedTotal = weight * activeRate;

  // Render trend badge
  const renderTrend = (rate: ScrapRate) => {
    const diff = rate.currentRate - rate.previousRate;
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
          — Flat
        </span>
      );
    }
    
    const pctChange = ((diff / rate.previousRate) * 100).toFixed(1);
    
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <TrendingUp className="w-3 h-3" />
          +{pctChange}%
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
          <TrendingDown className="w-3 h-3" />
          {pctChange}%
        </span>
      );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full max-w-5xl mx-auto">
      
      {/* Daily Rates Board (3/5 width on desktop) */}
      <div className="md:col-span-3 bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-scrap rounded-full animate-pulse" />
              Today's Scrap Buying Rates
            </h3>
            <p className="text-xs text-stone-500">Prices are based on local market estimation & purity standards</p>
          </div>
          <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            Live Updates
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {rates.map((rate) => (
            <div key={rate.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 text-sm">
                  {getMaterialLabel(rate.id)}
                </span>
                <span className="text-[10px] text-stone-400 block">
                  Updated: {new Date(rate.updatedAt?.seconds * 1000 || Date.now()).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {renderTrend(rate)}
                <div className="text-right">
                  <span className="text-base font-bold text-stone-900">
                    ₹{rate.currentRate}
                  </span>
                  <span className="text-[10px] text-stone-500 block">/ kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instant Estimation Calculator (2/5 width) */}
      <div className="md:col-span-2 bg-gradient-to-br from-scrap to-scrap-dark rounded-2xl shadow-md text-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-teal-200" />
            <h3 className="text-lg font-bold">Instant Price Calculator</h3>
          </div>
          
          <p className="text-xs text-teal-100 mb-5">
            Estimate your payout instantly. Actual valuation is finalized upon verification of weight and metal grade.
          </p>

          <div className="space-y-4">
            {/* Material Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-teal-200 block mb-1">
                Select Scrap Material
              </label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value as ScrapMaterialType)}
                className="w-full bg-teal-900/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-300"
              >
                {rates.map((r) => (
                  <option key={r.id} value={r.id} className="text-stone-900">
                    {getMaterialLabel(r.id)}
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Weight */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-teal-200 block mb-1">
                Estimated Weight (in kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={weight}
                  onChange={(e) => setWeight(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-teal-900/40 border border-teal-500/30 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-teal-300"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-teal-300">
                  kg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Result */}
        <div className="mt-6 pt-4 border-t border-teal-600/40">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-teal-200 block">
                Calculated Value
              </span>
              <span className="text-xs text-teal-100">
                {weight} kg × ₹{activeRate}/kg
              </span>
            </div>
            <span className="text-2xl font-extrabold text-white">
              ₹{estimatedTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-[9px] text-teal-200/80 leading-relaxed">
            *Final payout is determined using certified digital scales during home pickup.
          </div>
        </div>
      </div>

    </div>
  );
}
