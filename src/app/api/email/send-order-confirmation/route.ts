import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/services/email';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export async function POST(request: Request) {
  try {
    const { order } = await request.json();

    if (!order || !order.customerDetails?.email) {
      return NextResponse.json({ error: 'Order data with customer email is required.' }, { status: 400 });
    }

    const { customerDetails, items, subtotal, gst, deliveryCharge, grandTotal, id, paymentDetails } = order;
    const invoiceId = id.slice(0, 8).toUpperCase();

    // Build items rows
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f4; font-size: 13px;">
          <strong style="color: #1c1917;">${item.name}</strong><br/>
          <span style="color: #a8a29e; font-size: 11px;">${item.quantity} ${item.unit || 'pcs'} × ${formatCurrency(item.price)}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f5f5f4; text-align: right; font-weight: bold; color: #1c1917; font-size: 13px;">
          ${formatCurrency(item.price * item.quantity)}
        </td>
      </tr>
    `).join('');

    const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #fafaf9;">
      
      <!-- Header -->
      <div style="background: #1c1917; padding: 24px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-family: Georgia, serif;">ESHwar Home Needs</h1>
        <p style="color: #a8a29e; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 6px 0 0;">Smart Retail, Wholesale & Metal Scrap Solutions</p>
      </div>

      <!-- Body -->
      <div style="background: #ffffff; padding: 32px 24px; border-left: 1px solid #e7e5e4; border-right: 1px solid #e7e5e4;">
        
        <!-- Confirmation Badge -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 24px;">✅</span>
          <p style="font-size: 15px; font-weight: bold; color: #166534; margin: 8px 0 4px;">Order Confirmed!</p>
          <p style="font-size: 12px; color: #4ade80; margin: 0;">Invoice #${invoiceId}</p>
        </div>

        <!-- Greeting -->
        <p style="font-size: 14px; color: #1c1917; margin-bottom: 4px;"><strong>Dear ${customerDetails.name},</strong></p>
        <p style="font-size: 13px; color: #78716c; line-height: 1.6; margin-bottom: 24px;">
          Thank you for shopping with ESHwar Home Needs! Your order has been placed successfully and is being processed. Here's your order summary:
        </p>

        <!-- Order Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e7e5e4; font-size: 10px; text-transform: uppercase; color: #a8a29e; letter-spacing: 1px;">Item</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e7e5e4; font-size: 10px; text-transform: uppercase; color: #a8a29e; letter-spacing: 1px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="border-top: 2px solid #e7e5e4; padding-top: 12px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 13px; color: #78716c;">
            <tr>
              <td style="padding: 4px 0;">Subtotal</td>
              <td style="text-align: right;">${formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">GST (CGST + SGST)</td>
              <td style="text-align: right;">${formatCurrency(gst)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Delivery</td>
              <td style="text-align: right;">${deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 16px; font-weight: bold; color: #1c1917; border-top: 2px solid #1c1917;">Grand Total</td>
              <td style="text-align: right; padding: 8px 0; font-size: 16px; font-weight: bold; color: #b45309; border-top: 2px solid #1c1917;">${formatCurrency(grandTotal)}</td>
            </tr>
          </table>
        </div>

        <!-- Shipping & Payment -->
        <table style="width: 100%; font-size: 12px; margin-bottom: 24px;">
          <tr>
            <td style="vertical-align: top; width: 50%; padding-right: 12px;">
              <p style="font-size: 10px; text-transform: uppercase; color: #a8a29e; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px;">Delivery Address</p>
              <p style="color: #44403c; margin: 0; line-height: 1.5;">
                <strong>${customerDetails.shippingAddress?.name || customerDetails.name}</strong><br/>
                ${customerDetails.shippingAddress?.street || ''}<br/>
                ${customerDetails.shippingAddress?.city || ''}, ${customerDetails.shippingAddress?.state || ''} ${customerDetails.shippingAddress?.pincode || ''}
              </p>
            </td>
            <td style="vertical-align: top; width: 50%;">
              <p style="font-size: 10px; text-transform: uppercase; color: #a8a29e; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px;">Payment</p>
              <p style="color: #44403c; margin: 0; line-height: 1.5;">
                <strong>${paymentDetails?.method || 'COD'}</strong><br/>
                Ref: ${paymentDetails?.transactionId || 'Awaiting'}
              </p>
            </td>
          </tr>
        </table>

        <!-- Contact Info -->
        <div style="background: #fafaf9; border-radius: 12px; padding: 16px; text-align: center; font-size: 12px; color: #78716c;">
          <p style="margin: 0 0 4px;">Our agent will contact you shortly regarding delivery.</p>
          <p style="margin: 0; font-weight: bold; color: #44403c;">📞 WhatsApp: +91 99494 08061</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #1c1917; padding: 16px; text-align: center; border-radius: 0 0 16px 16px;">
        <p style="color: #a8a29e; font-size: 10px; margin: 0;">ESHwar Home Needs — Hanumakonda, Telangana, India</p>
        <p style="color: #57534e; font-size: 9px; margin: 4px 0 0;">This is an automated order confirmation. Please do not reply to this email.</p>
      </div>
    </div>
    `;

    const textVersion = `Order Confirmed! Invoice #${invoiceId}\n\nDear ${customerDetails.name},\n\nThank you for your order of ${formatCurrency(grandTotal)} (${items.length} items).\n\nPayment: ${paymentDetails?.method || 'COD'}\nDelivery to: ${customerDetails.shippingAddress?.city || 'N/A'}\n\nOur agent will contact you shortly.\nWhatsApp: +91 99494 08061\n\n— ESHwar Home Needs`;

    await sendEmail({
      to: customerDetails.email,
      subject: `🛒 Order Confirmed! Invoice #${invoiceId} — ESHwar Home Needs`,
      text: textVersion,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, message: 'Order confirmation email sent.' });
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return NextResponse.json({ error: `Failed to send confirmation email: ${(error as Error).message}` }, { status: 500 });
  }
}
