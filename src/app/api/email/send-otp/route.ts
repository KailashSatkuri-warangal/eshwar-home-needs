import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { adminDb, isLiveAdmin } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/services/email';

const DB_FILE = path.join(process.cwd(), 'data-local.json');

// Write helpers for local json database (Development Fallback)
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

function updateLocalDbUser(userId: string, data: any) {
  try {
    const dbData = getLocalDb();
    if (!dbData.users) dbData.users = [];
    const idx = dbData.users.findIndex((u: any) => u.uid === userId);
    if (idx > -1) {
      dbData.users[idx] = { ...dbData.users[idx], ...data };
    } else {
      dbData.users.push({ uid: userId, ...data });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error updating local db user:', err);
  }
}

function updateLocalDbGuestOtp(email: string, data: any) {
  try {
    const dbData = getLocalDb();
    if (!dbData.guest_otps) dbData.guest_otps = [];
    const cleanEmail = email.trim().toLowerCase();
    const idx = dbData.guest_otps.findIndex((g: any) => g.id === cleanEmail);
    if (idx > -1) {
      dbData.guest_otps[idx] = { ...dbData.guest_otps[idx], ...data };
    } else {
      dbData.guest_otps.push({ id: cleanEmail, ...data });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error updating local db guest otp:', err);
  }
}

export async function POST(request: Request) {
  try {
    const { userId, email, phone } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required for verification.' }, { status: 400 });
    }

    // 1. Enforce phone uniqueness — one number per account only
    if (phone && userId && userId !== 'guest_checkout' && userId !== 'guest_scrap') {
      let phoneTaken = false;

      if (isLiveAdmin) {
        const snapshot = await adminDb.collection('users')
          .where('phone', '==', phone)
          .where('phoneVerified', '==', true)
          .get();
        phoneTaken = snapshot.docs.some(doc => doc.id !== userId);
      } else {
        const dbData = getLocalDb();
        const allUsers = dbData.users || [];
        phoneTaken = allUsers.some((u: any) => u.uid !== userId && u.phone === phone && u.phoneVerified === true);
      }

      if (phoneTaken) {
        return NextResponse.json({ 
          error: 'This phone number is already verified by another account. Each number can only be linked to one account.' 
        }, { status: 409 });
      }
    }

    // 2. Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

    // 2. Save validation credentials either in production Firestore or local json database
    if (isLiveAdmin) {
      console.log('[API OTP] Writing OTP to live production Firestore...');
      if (userId && userId !== 'guest_checkout' && userId !== 'guest_scrap') {
        await adminDb.collection('users').doc(userId).update({
          tempOtpCode: code,
          tempOtpExpires: expiry,
        });
      } else {
        await adminDb.collection('guest_otps').doc(email.trim().toLowerCase()).set({
          tempOtpCode: code,
          tempOtpExpires: expiry,
        });
      }
    } else {
      console.log('[API OTP] Writing OTP to local json database (data-local.json)...');
      if (userId && userId !== 'guest_checkout' && userId !== 'guest_scrap') {
        updateLocalDbUser(userId, {
          tempOtpCode: code,
          tempOtpExpires: expiry,
        });
      } else {
        updateLocalDbGuestOtp(email, {
          tempOtpCode: code,
          tempOtpExpires: expiry,
        });
      }
    }

    // 3. Send email via Nodemailer
    const emailSubject = `🔑 Verification OTP: ${code} - ESHwar Home Needs`;
    const emailText = `Your ESHwar Home Needs verification code is: ${code}. This code expires in 10 minutes.`;
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 24px; color: #1c1917; background-color: #fafaf9; border-radius: 16px; border: 1px solid #e7e5e4; max-width: 480px; margin: 0 auto;">
        <h2 style="font-family: serif; color: #854d0e; margin-bottom: 8px;">ESHwar Home Needs</h2>
        <p style="font-size: 14px; margin-bottom: 24px;">Confirm your contact details to authorize your transaction.</p>
        <div style="background-color: #fef08a; border: 1px solid #fef08a; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #854d0e; font-weight: bold; display: block;">Verification Code</span>
          <strong style="font-size: 28px; font-family: monospace; tracking: 0.1em; color: #713f12; display: block; margin-top: 8px;">${code}</strong>
        </div>
        <p style="font-size: 12px; color: #78716c; line-height: 1.5;">This verification code is valid for 10 minutes. Please do not share this code with anyone.</p>
      </div>
    `;

    await sendEmail({
      to: email.trim().toLowerCase(),
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, message: 'OTP verification code sent successfully to your email.' });
  } catch (error) {
    console.error('Error in send-email-otp API:', error);
    return NextResponse.json({ error: `Failed to dispatch email: ${(error as Error).message}` }, { status: 500 });
  }
}
