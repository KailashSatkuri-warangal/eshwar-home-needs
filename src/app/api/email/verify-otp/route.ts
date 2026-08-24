import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { userId, email, phone, code, userProfile } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 });
    }

    let savedOtp: string | null = null;
    let savedExpiry: string | null = null;

    // 1. Fetch verification details from Firestore using client config SDK
    if (userId && userId !== 'guest_checkout' && userId !== 'guest_scrap') {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
      }
      const uData = userSnap.data();
      savedOtp = uData?.tempOtpCode || null;
      savedExpiry = uData?.tempOtpExpires || null;
    } else {
      // Guest
      const guestRef = doc(db, 'guest_otps', email.trim().toLowerCase());
      const guestSnap = await getDoc(guestRef);
      if (!guestSnap.exists()) {
        return NextResponse.json({ error: 'Verification session expired. Please request a new OTP.' }, { status: 400 });
      }
      const gData = guestSnap.data();
      savedOtp = gData?.tempOtpCode || null;
      savedExpiry = gData?.tempOtpExpires || null;
    }

    // 2. Validate OTP value and expiry
    if (!savedOtp || !savedExpiry) {
      return NextResponse.json({ error: 'No active OTP verification session found.' }, { status: 400 });
    }

    if (new Date() > new Date(savedExpiry)) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new code.' }, { status: 400 });
    }

    if (code.trim() !== savedOtp) {
      return NextResponse.json({ error: 'Invalid verification OTP. Please try again.' }, { status: 400 });
    }

    // 3. OTP is valid! Commit updates to Firestore and return success profile
    let updatedProfile = { ...userProfile };

    if (userId && userId !== 'guest_checkout' && userId !== 'guest_scrap') {
      updatedProfile = {
        ...userProfile,
        phone,
        phoneVerified: true,
        tempOtpCode: null,
        tempOtpExpires: null,
        updatedAt: new Date().toISOString(),
      };
      // Save changes securely server-side using client config SDK
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, updatedProfile);
    } else {
      // Clear guest temp validation
      const guestRef = doc(db, 'guest_otps', email.trim().toLowerCase());
      await deleteDoc(guestRef);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Mobile number verified successfully via email confirmation.',
      updatedProfile 
    });
  } catch (error) {
    console.error('Error in verify-email-otp API:', error);
    return NextResponse.json({ error: `Verification failed: ${(error as Error).message}` }, { status: 500 });
  }
}
