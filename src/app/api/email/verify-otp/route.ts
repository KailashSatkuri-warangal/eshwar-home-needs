import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { userId, email, phone, code, userProfile } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 });
    }

    let savedOtp: string | null = null;
    let savedExpiry: string | null = null;

    // 1. Fetch verification details from Firestore
    if (userId && userId !== 'guest_checkout' && userId !== 'guest_scrap') {
      const userSnap = await adminDb.collection('users').doc(userId).get();
      if (!userSnap.exists) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
      }
      const uData = userSnap.data();
      savedOtp = uData?.tempOtpCode || null;
      savedExpiry = uData?.tempOtpExpires || null;
    } else {
      // Guest
      const guestSnap = await adminDb.collection('guest_otps').doc(email.trim().toLowerCase()).get();
      if (!guestSnap.exists) {
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
        updatedAt: new Date(),
      };
      // Save changes securely server-side
      await adminDb.collection('users').doc(userId).set(updatedProfile);
    } else {
      // Clear guest temp validation
      await adminDb.collection('guest_otps').doc(email.trim().toLowerCase()).delete();
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
