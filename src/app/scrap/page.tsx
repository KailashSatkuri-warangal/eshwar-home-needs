'use client';

import React, { useState } from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ScrapRatesBoard from '@/components/ui/ScrapRatesBoard';
import { MOCK_SCRAP_RATES } from '@/lib/mockData';
import { useApp } from '@/context/AppContext';
import { ScrapMaterialType, ScrapStatus, ScrapRequest } from '@/types';
import { db } from '@/lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Scale, Upload, Sparkles, Calendar, Clock, RotateCw, 
  MapPin, CheckCircle2, AlertCircle, Trash2 
} from 'lucide-react';
import Link from 'next/link';

export default function ScrapPage() {
  const { user, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [pickupCreated, setPickupCreated] = useState<ScrapRequest | null>(null);

  // Form states
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Shipping details
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  
  // Schedule
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00 - 13:00');
  const [notes, setNotes] = useState('');

  // Scrap details
  const [material, setMaterial] = useState<ScrapMaterialType>('stainless_steel');
  const [estimatedWeight, setEstimatedWeight] = useState<number>(5);
  const [condition, setCondition] = useState<string>('old');

  // AI Prediction states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiPredicting, setAiPredicting] = useState(false);
  const [aiResult, setAiResult] = useState<{
    material: string;
    confidence: number;
    weightRange: string;
    estimatedValueRange: string;
  } | null>(null);

  // Handle image file upload preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size exceeds 5MB limit.', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setAiResult(null); // Clear previous prediction
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAiResult(null);
  };

  // Trigger AI Estimation from image preview
  const triggerAiEstimation = async () => {
    if (!imagePreview) {
      showToast('Please upload a scrap photo first.', 'info');
      return;
    }

    setAiPredicting(true);
    try {
      const mime = imageFile?.type || 'image/jpeg';
      const response = await fetch('/api/ai/predict-scrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: mime,
          material,
          estimatedWeight,
          condition
        })
      });

      if (!response.ok) {
        throw new Error('Server returned error status');
      }

      const result = await response.json();

      setAiResult(result);
      
      // Auto-fill form parameters based on AI outputs
      setMaterial(result.material);
      
      // Parse average weight from range (e.g. "3.5 - 4.5 kg" -> 4)
      const avgWeightMatch = result.weightRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
      if (avgWeightMatch && avgWeightMatch[1] && avgWeightMatch[2]) {
        const avg = (parseFloat(avgWeightMatch[1]) + parseFloat(avgWeightMatch[2])) / 2;
        setEstimatedWeight(Math.round(avg));
      }

      showToast('AI Estimate generated!', 'success');
    } catch (err) {
      console.error(err);
      showToast('AI Predictor failed. Please enter details manually.', 'error');
    } finally {
      setAiPredicting(false);
    }
  };

  // Book Doorstep pickup request
  const handlePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce mobile verification gate for Selling
    if (!user) {
      showToast('Please sign in or register to verify your mobile number and book a doorstep scrap pickup.', 'info');
      return;
    }
    if (!user.phoneVerified) {
      showToast('Mobile verification is required before booking a scrap pickup. Please verify your phone number in your Account Profile.', 'error');
      return;
    }

    if (!name || !phone || !street || !pincode || !preferredDate) {
      showToast('Please fill all required customer and schedule details.', 'error');
      return;
    }

    setLoading(true);
    try {
      const requestId = `scrp_${Math.random().toString(36).substring(2, 9)}`;
      const address = { name, street, city, state, pincode, phone };

      const newPickupRequest: ScrapRequest = {
        id: requestId,
        userId: user?.uid || 'guest_scrap',
        customerDetails: {
          name,
          phone,
          email,
          address,
        },
        material,
        estimatedWeight,
        condition,
        image: imagePreview || undefined,
        aiEstimate: aiResult ? {
          material: aiResult.material,
          confidence: aiResult.confidence,
          weightRange: aiResult.weightRange,
          estimatedValueRange: aiResult.estimatedValueRange,
        } : undefined,
        status: 'REQUESTED',
        preferredDate,
        preferredTime,
        notes,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      };

      // Write Pickup to Firestore
      await setDoc(doc(db, 'scrapRequests', requestId), newPickupRequest);

      // Create Admin Notification
      const notificationId = `notif_${Math.random().toString(36).substring(2, 9)}`;
      await setDoc(doc(db, 'notifications', notificationId), {
        id: notificationId,
        recipientId: 'admin',
        title: 'New Scrap Pickup Request',
        message: `Customer ${name} requested doorstep pickup ${requestId.toUpperCase()} for ${estimatedWeight}kg of ${material}.`,
        type: 'scrap',
        read: false,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      });

      setPickupCreated(newPickupRequest);
      removeUploadedImage();
      showToast('Scrap pickup scheduled successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to schedule pickup. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMaterialLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // SUCCESS SCREEN
  if (pickupCreated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow max-w-lg mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 bg-scrap/10 text-scrap rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold font-serif text-stone-900">Scrap Pickup Scheduled!</h2>
            <p className="text-xs text-stone-500">
              Doorstep collector will visit you shortly. Request ID: <strong>{pickupCreated.id.toUpperCase()}</strong>.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 text-xs text-left space-y-2.5 shadow-sm">
            <h3 className="font-bold text-stone-800 uppercase tracking-wider text-[10px] pb-1.5 border-b border-stone-100">
              Schedule Details
            </h3>
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-semibold text-stone-700">{pickupCreated.preferredDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Time Slot:</span>
              <span className="font-semibold text-stone-700">{pickupCreated.preferredTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Material Type:</span>
              <span className="font-semibold text-stone-700 capitalize">{getMaterialLabel(pickupCreated.material)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimate Weight:</span>
              <span className="font-semibold text-stone-700">{pickupCreated.estimatedWeight} kg</span>
            </div>
          </div>

          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Please keep your metal scraps grouped together. The collector will weigh them on certified digital scales and calculate final cash payouts at the active rate card.
          </p>

          <Link
            href="/"
            className="inline-flex items-center bg-scrap hover:bg-scrap-dark text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase"
          >
            Back to Homepage
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Intro banner */}
        <div className="bg-gradient-to-br from-scrap to-scrap-dark rounded-3xl text-white p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="max-w-2xl space-y-4 relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-teal-200 border border-white/10">
              ♻️ Smart Scrap Platform
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif leading-tight">
              Sell Kitchenware &amp; Metal Scrap Online
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm leading-relaxed">
              Recycle responsibly and get paid. We buy copper, brass, stainless steel, aluminium, and recyclable plastic at transparent daily weights.
            </p>
          </div>
        </div>

        {/* 1. Scrap rates board */}
        <ScrapRatesBoard initialRates={MOCK_SCRAP_RATES} />

        {/* 2. Photo Uploader & Booking Form */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Uploader & AI Estimator (2/5 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-scrap animate-float" /> AI Scrap Predictor
              </h3>

              <p className="text-[11px] text-stone-500 leading-normal">
                Upload a clear photo of your scrap pile, select a target material guess, and let our vision system estimate category confidence and approximate value range.
              </p>

              {/* Uploader UI */}
              {!imagePreview ? (
                <label className="border-2 border-dashed border-stone-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-scrap/50 hover:bg-stone-50/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                  <Upload className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-xs font-bold text-stone-700">Upload Scrap Photo</span>
                  <span className="text-[10px] text-stone-400 mt-1">JPEG, PNG up to 5MB</span>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Scrap Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={removeUploadedImage}
                      className="absolute top-2 right-2 p-1.5 bg-stone-900/80 text-white hover:bg-stone-900 rounded-full cursor-pointer shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={triggerAiEstimation}
                    disabled={aiPredicting}
                    className="w-full bg-scrap hover:bg-scrap-dark text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {aiPredicting ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing image...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Run AI Estimation</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* AI Prediction results display */}
              {aiResult && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-1.5">
                    <span className="font-bold text-teal-800 uppercase tracking-wider text-[9px]">AI Prediction:</span>
                    {aiResult.confidence && (
                      <span className="bg-teal-600 text-white font-semibold text-[8px] px-1.5 py-0.5 rounded-full">
                        {Math.round(aiResult.confidence * 100)}% Confidence
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span>Detected Material:</span>
                    <span className="font-bold text-stone-800 capitalize">{getMaterialLabel(aiResult.material)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Weight:</span>
                    <span className="font-bold text-stone-800">{aiResult.weightRange}</span>
                  </div>
                  <div className="flex justify-between border-t border-teal-200/50 pt-1.5 font-bold text-teal-900">
                    <span>Estimated Value:</span>
                    <span>{aiResult.estimatedValueRange}</span>
                  </div>
                  <p className="text-[9px] text-teal-600 italic mt-2">
                    ⚠️ Note: AI estimates are for reference only. Final weights and payouts are certified physically.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Pickup Booking form (3/5 width) */}
          <div className="lg:col-span-3">
            <form onSubmit={handlePickupSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2 font-serif">
                Schedule Doorstep Scrap Collection
              </h3>

              <div className="space-y-4 text-xs text-stone-600">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9900011223"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Material Purity/Type *</label>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value as ScrapMaterialType)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2 py-2 focus:outline-none"
                    >
                      <option value="stainless_steel">Stainless Steel (SS)</option>
                      <option value="copper">Copper</option>
                      <option value="brass">Brass</option>
                      <option value="aluminium">Aluminium</option>
                      <option value="steel">Iron / General Steel</option>
                      <option value="plastic">Recyclable Plastic</option>
                      <option value="mixed_metal">Mixed Metals</option>
                      <option value="other">Other Materials</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Estimated Weight (kg) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={estimatedWeight}
                      onChange={(e) => setEstimatedWeight(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Scrap Condition *</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2 py-2 focus:outline-none"
                    >
                      <option value="old">Very Old / Worn out</option>
                      <option value="damaged">Damaged / Broken</option>
                      <option value="good">Good Purity / Intact</option>
                    </select>
                  </div>
                </div>

                {/* Pickup Address */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1">Street Address for Pickup *</label>
                    <input
                      type="text"
                      required
                      placeholder="Door no, building, layout details"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 block mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        placeholder="560001"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-500 block mb-1">City</label>
                      <input
                        type="text"
                        disabled
                        value={city}
                        className="w-full bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 focus:outline-none text-stone-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferred Date and Time slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-scrap" /> Preferred Pickup Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-500 block mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-scrap" /> Preferred Time Slot *
                    </label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-2 focus:outline-none"
                    >
                      <option value="10:00 - 13:00">Morning (10:00 AM - 1:00 PM)</option>
                      <option value="13:00 - 16:00">Afternoon (1:00 PM - 4:00 PM)</option>
                      <option value="16:00 - 19:00">Evening (4:00 PM - 7:00 PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-stone-500 block mb-1">Collector Notes / Remarks (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Provide landmarks or detail metal grades (e.g. Copper vessels mixed with electrical wires)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-scrap hover:bg-scrap-dark text-white font-bold py-3 rounded-lg text-xs uppercase flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Scheduling Pickup...</span>
                      </>
                    ) : (
                      <>
                        <span>Book doorstep collection</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
