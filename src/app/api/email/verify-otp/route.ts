import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { adminDb, isLiveAdmin } from '@/lib/firebase/admin';

const DB_FILE = path.join(process.cwd(), 'data-local.json');

function getLocalDb() {
  try {
    if (!fs.existsSync(DB_FILE)) return {};
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading local db:', err);
    return {};
  }
}

function writeLocalDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local db:', err);
  }
}

export async function POST(request: Request) {
  try {
    const { userId, email, phone, code, userProfile } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 });
    }

    let savedOtp: string | null = null;
    let savedExpiry: string | null = null;

    // 1. Fetch verification details from either production Firestore or local json
    if (isLiveAdmin) {
      // Production: use Admin SDK
      if (userId && userId !== 'guest_checkout' && userId !== 'guest_scrap') {
        const userSnap = await adminDb.collection('users').doc(userId).get();
        if (!userSnap.exists) {
          return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
        }
        const uData = userSnap.data();
        savedOtp = uData?.tempOtpCode || null;
        savedExpiry = uData?.tempOtpExpires || null;
      } else {
        const guestSnap = await adminDb.collection('guest_otps').doc(email.trim().toLowerCase()).get();
        if (!guestSnap.exists) {
          return NextResponse.json({ error: 'Verification session expired. Please request a new OTP.' }, { status: 400 });
        }
        const gData = guestSnap.data();
        savedOtp = gData?.tempOtpCode || null;
        savedExpiry = gData?.tempOtpExpires || null;
      }
    } else {
      // Development: use local json
      const dbData = getLocalDb();
      if (userId && userId !== 'guest_checkout' && userId !== 'guest_scrap') {
        const localUser = (dbData.users || []).find((u: any) => u.uid === userId);
        if (!localUser) {
          return NextResponse.json({ error: 'User profile not found in local database.' }, { status: 404 });
        }
        savedOtp = localUser.tempOtpCode || null;
        savedExpiry = localUser.tempOtpExpires || null;
      } else {
        const cleanEmail = email.trim().toLowerCase();
        const guestEntry = (dbData.guest_otps || []).find((g: any) => g.id === cleanEmail);
        if (!guestEntry) {
          return NextResponse.json({ error: 'Verification session expired. Please request a new OTP.' }, { status: 400 });
        }
        savedOtp = guestEntry.tempOtpCode || null;
        savedExpiry = guestEntry.tempOtpExpires || null;
      }
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

    // 3. OTP is valid! Commit updates
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

      if (isLiveAdmin) {
        await adminDb.collection('users').doc(userId).set(updatedProfile);
      } else {
        const dbData = getLocalDb();
        if (!dbData.users) dbData.users = [];
        const idx = (dbData.users as any[]).findIndex((u: any) => u.uid === userId);
        if (idx > -1) {
          dbData.users[idx] = { ...dbData.users[idx], ...updatedProfile };
        }
        writeLocalDb(dbData);
      }
    } else {
      if (isLiveAdmin) {
        await adminDb.collection('guest_otps').doc(email.trim().toLowerCase()).delete();
      } else {
        const dbData = getLocalDb();
        const cleanEmail = email.trim().toLowerCase();
        dbData.guest_otps = (dbData.guest_otps || []).filter((g: any) => g.id !== cleanEmail);
        writeLocalDb(dbData);
      }
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
