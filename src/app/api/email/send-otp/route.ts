import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/services/email';

export async function POST(request: Request) {
  try {
    const { userId, email, phone } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required for verification.' }, { status: 400 });
    }

    // 1. Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

    // 2. Save validation credentials in Firestore
    if (userId && userId !== 'guest_checkout' && userId !== 'guest_scrap') {
      await adminDb.collection('users').doc(userId).update({
        tempOtpCode: code,
        tempOtpExpires: expiry,
      });
    } else {
      // Save guest validation credentials mapped to email
      await adminDb.collection('guest_otps').doc(email.trim().toLowerCase()).set({
        tempOtpCode: code,
        tempOtpExpires: expiry,
      });
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
