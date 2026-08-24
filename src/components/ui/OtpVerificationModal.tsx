'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, Mail, RotateCw } from 'lucide-react';

interface OtpVerificationModalProps {
  phone: string;
  email: string;
  userId: string;
  userProfile: any;
  onSuccess: (updatedProfile: any) => void;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function OtpVerificationModal({
  phone,
  email,
  userId,
  userProfile,
  onSuccess,
  onClose,
  showToast
}: OtpVerificationModalProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = window.setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [timer]);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, phone }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setOtpSent(true);
      setTimer(60); // 60 seconds resend timer
      showToast(`🔑 Verification OTP code sent to your email: ${email}!`, 'success');
    } catch (err) {
      console.error('Error triggering OTP email:', err);
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      showToast('Please enter the 6-digit OTP code.', 'error');
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('/api/email/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, phone, code: otpCode, userProfile }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      showToast('Mobile number verified successfully!', 'success');
      onSuccess(data.updatedProfile || { ...userProfile, phone, phoneVerified: true });
    } catch (err) {
      console.error('OTP verification failed:', err);
      showToast((err as Error).message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 bg-copper/10 text-copper rounded-full flex items-center justify-center mx-auto">
          {otpSent ? <Lock className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-stone-900 font-serif">
            {otpSent ? 'Enter Verification Code' : 'Verify Mobile Number'}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            {otpSent 
              ? `A 6-digit OTP code has been sent to your email address: ${email}`
              : `To verify your contact number ${phone}, we will send an OTP code to your registered email address ${email}`}
          </p>
        </div>

        {!otpSent ? (
          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full bg-copper hover:bg-copper-dark text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" /> Sending Email...
              </>
            ) : (
              'Send Verification OTP'
            )}
          </button>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              required
              placeholder="Enter 6-digit OTP"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-center text-sm font-bold tracking-widest focus:outline-none focus:border-copper"
            />
            
            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-copper hover:bg-copper-dark text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {verifying ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Verify &amp; Confirm
                </>
              )}
            </button>

            <div className="text-center">
              {timer > 0 ? (
                <span className="text-[10px] text-stone-400 font-medium">Resend OTP in {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-[10px] font-bold text-copper hover:underline cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Resending...' : 'Resend Verification OTP'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
