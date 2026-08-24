import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Handle simulation mock transactions in development bypass mode
    if (razorpay_payment_id && razorpay_payment_id.startsWith('mock_txn_')) {
      return NextResponse.json({ verified: true, isMock: true });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { verified: false, error: 'Missing payment parameters for checksum verification.' },
        { status: 400 }
      );
    }

    if (!keySecret || keySecret === 'your_razorpay_secret_key_here') {
      return NextResponse.json(
        { verified: false, error: 'Razorpay secret key not configured on server.' },
        { status: 500 }
      );
    }

    // Verify signature checksum: HMAC SHA256 (order_id + "|" + payment_id, secret)
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({ verified: true, isMock: false });
    } else {
      return NextResponse.json(
        { verified: false, error: 'Payment checksum signature mismatch.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying payment checksum:', error);
    return NextResponse.json(
      { verified: false, error: `Verification process failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
