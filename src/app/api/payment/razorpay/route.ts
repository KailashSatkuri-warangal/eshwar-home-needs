import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const { amount, receipt } = await request.json();

    if (!amount) {
      return NextResponse.json({ error: 'Payment amount is required.' }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Use a mock fallback if keys are not fully configured during dev
    if (!keyId || !keySecret || keyId === 'rzp_test_your_key_id' || keySecret === 'your_razorpay_secret_key_here') {
      console.warn('Razorpay keys not configured or using placeholders. Returning mock order details for local dev.');
      return NextResponse.json({
        id: `order_mock_${Math.random().toString(36).substring(2, 9)}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        keyId: keyId || 'rzp_test_your_key_id',
        isMock: true,
      });
    }

    const razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount * 100), // Amount in paise (paise = Rs * 100)
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      isMock: false,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: `Failed to create payment order: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
