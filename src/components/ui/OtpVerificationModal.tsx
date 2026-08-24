'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, Smartphone, RotateCw } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { setDbDoc } from '@/lib/services/db';

interface OtpVerificationModalProps {
  phone: string;
  userId: string;
  userProfile: any;
  onSuccess: (updatedProfile: any) => void;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function OtpVerificationModal({
  phone,
  userId,
  userProfile,
  onSuccess,
  onClose,
  showToast
}: OtpVerificationModalProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
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

  // Clean up recaptcha verifier when component unmounts
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {}
      }
    };
  }, []);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      // 1. Format the phone number to ensure +91 prefix for Indian numbers if not already present
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+91' + formattedPhone.substring(1);
        } else if (formattedPhone.length === 10) {
          formattedPhone = '+91' + formattedPhone;
        } else {
          formattedPhone = '+' + formattedPhone;
        }
      }

      // 2. Initialize and clear reCAPTCHA container DOM to prevent duplicate rendering errors
      const container = document.getElementById('recaptcha-container');
      if (!container) {
        throw new Error('Recaptcha container element not found in DOM.');
      }
      container.innerHTML = ''; 
      
      // Clean up previous global instances
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {}
      }

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('Recaptcha solved');
        }
      });
      (window as any).recaptchaVerifier = verifier;

      // 3. Trigger Firebase Phone Auth SMS
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setTimer(60); // 60 seconds resend timer
      showToast(`🔑 Verification SMS sent to ${formattedPhone}! Please check your mobile.`, 'success');
    } catch (err) {
      console.error('Error sending OTP:', err);
      const errMsg = (err as Error).message;
      if (errMsg.includes('auth/operation-not-allowed')) {
        showToast('Phone provider settings blocked in GCP. Enable India (+91) region under SMS Region Policy inside Identity Platform settings!', 'error');
      } else {
        showToast('Failed to send SMS: ' + errMsg, 'error');
      }
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
    if (!confirmationResult) {
      showToast('No active verification session found. Please request a new OTP.', 'error');
      return;
    }

    setVerifying(true);
    try {
      // Verify via actual Firebase Phone confirmation
      await confirmationResult.confirm(otpCode);

      const updatedProfile = {
        ...userProfile,
        phone,
        phoneVerified: true,
        updatedAt: new Date()
      };
      
      await setDbDoc('users', userId, updatedProfile);
      showToast('Mobile number verified successfully!', 'success');
      
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {}
      }
      
      onSuccess(updatedProfile);
    } catch (err) {
      console.error('OTP confirmation failed:', err);
      showToast('Invalid OTP code. Please check your SMS and try again.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-4">
      {/* Invisible Recaptcha Container required by Firebase Phone Auth */}
      <div id="recaptcha-container" className="invisible absolute"></div>

      <div className="bg-white border border-stone-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 bg-copper/10 text-copper rounded-full flex items-center justify-center mx-auto">
          {otpSent ? <Lock className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-stone-900 font-serif">
            {otpSent ? 'Enter Verification Code' : 'Verify Mobile Number'}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            {otpSent 
              ? `A 6-digit OTP code has been dispatched to ${phone}`
              : `To verify your account, please verify your mobile number ${phone}`}
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
                <RotateCw className="w-3.5 h-3.5 animate-spin" /> Sending SMS...
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
