import { jsPDF } from 'jspdf';
import { Order, Quote, Address } from '@/types';

// Business Details Constant
export const BUSINESS_DETAILS = {
  name: 'ESHwar Home Needs',
  tagline: 'Smart Retail, Wholesale & Scrap Platform',
  address: 'Satkuri Upender, ESHwar Home Needs, Hanumakonda, Warangal, Telangana',
  gstin: '36AAAAE1234F1Z5', // Telangana GSTIN prefix
  phone: '+91 99494 08061',
  email: 'contact@eshwarhomeneeds.com',
  website: 'www.eshwarhomeneeds.com',
};

/**
 * Formats currency values in INR
 */
const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Draws a standard address block onto the PDF
 */
function drawAddress(doc: jsPDF, address: Address, x: number, y: number, title: string) {
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title, x, y);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(address.name, x, y + 5);
  doc.text(address.street, x, y + 10, { maxWidth: 85 });
  doc.text(`${address.city}, ${address.state} - ${address.pincode}`, x, y + 20);
  doc.text(`Phone: ${address.phone}`, x, y + 25);
}

/**
 * Generates a GST Tax Invoice PDF for a customer order
 */
export function generateInvoicePDF(order: Order): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page Dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // 1. Header (Company details left, Invoice title right)
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(184, 115, 51); // Copper metallic accent
  doc.text(BUSINESS_DETAILS.name, margin, 15);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(BUSINESS_DETAILS.tagline, margin, 20);
  doc.text(`GSTIN: ${BUSINESS_DETAILS.gstin} | Phone: ${BUSINESS_DETAILS.phone}`, margin, 24);
  doc.text(`Email: ${BUSINESS_DETAILS.email} | Web: ${BUSINESS_DETAILS.website}`, margin, 28);
  doc.text(BUSINESS_DETAILS.address, margin, 32, { maxWidth: 110 });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('TAX INVOICE', pageWidth - margin - 5, 18, { align: 'right' });
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Invoice No: ${order.id.slice(0, 8).toUpperCase()}`, pageWidth - margin - 5, 24, { align: 'right' });
  const dateStr = new Date(order.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('en-IN');
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 5, 29, { align: 'right' });
  doc.text(`Status: ${order.status}`, pageWidth - margin - 5, 34, { align: 'right' });

  // 2. Billing & Shipping Address Blocks
  let y = 50;
  drawAddress(doc, order.customerDetails.billingAddress, margin, y, 'BILLED TO:');
  
  // If wholesale order, add customer GSTIN
  if (order.customerDetails.gstin) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Customer GSTIN: ${order.customerDetails.gstin}`, margin, y + 30);
  }
  
  drawAddress(doc, order.customerDetails.shippingAddress, pageWidth / 2 + 5, y, 'SHIPPED TO:');

  // 3. Invoice Table Headers
  y = 90;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  
  doc.text('S.No', margin + 2, y + 5);
  doc.text('Item / SKU', margin + 12, y + 5);
  doc.text('HSN', margin + 72, y + 5);
  doc.text('Qty', margin + 92, y + 5, { align: 'right' });
  doc.text('Rate', margin + 112, y + 5, { align: 'right' });
  doc.text('GST %', margin + 132, y + 5, { align: 'right' });
  doc.text('GST Amt', margin + 152, y + 5, { align: 'right' });
  doc.text('Total', pageWidth - margin - 2, y + 5, { align: 'right' });

  // 4. Render Table Items
  doc.setFont('Helvetica', 'normal');
  y += 8;
  
  order.items.forEach((item, index) => {
    // Check if page overflow
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20; // reset y
      
      // Reprint headers on new page
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.text('S.No', margin + 2, y + 5);
      doc.text('Item / SKU', margin + 12, y + 5);
      doc.text('HSN', margin + 72, y + 5);
      doc.text('Qty', margin + 92, y + 5, { align: 'right' });
      doc.text('Rate', margin + 112, y + 5, { align: 'right' });
      doc.text('GST %', margin + 132, y + 5, { align: 'right' });
      doc.text('GST Amt', margin + 152, y + 5, { align: 'right' });
      doc.text('Total', pageWidth - margin - 2, y + 5, { align: 'right' });
      doc.setFont('Helvetica', 'normal');
      y += 8;
    }

    doc.text((index + 1).toString(), margin + 2, y + 5);
    
    // Wrap product name if long
    const itemName = `${item.name}\nSKU: ${item.sku}`;
    doc.text(itemName, margin + 12, y + 5, { maxWidth: 58 });
    
    doc.text(item.hsnCode, margin + 72, y + 5);
    doc.text(`${item.quantity} ${item.unit}`, margin + 92, y + 5, { align: 'right' });
    doc.text(formatINR(item.price), margin + 112, y + 5, { align: 'right' });
    doc.text(`${item.gstRate}%`, margin + 132, y + 5, { align: 'right' });
    doc.text(formatINR(item.gstAmount), margin + 152, y + 5, { align: 'right' });
    doc.text(formatINR(item.total), pageWidth - margin - 2, y + 5, { align: 'right' });

    // Calculate item block height
    const lineCount = doc.splitTextToSize(itemName, 58).length;
    y += Math.max(8, lineCount * 5);
    
    // Draw subtle row separator line
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageWidth - margin, y);
  });

  // 5. Summary calculations block
  y += 5;
  const summaryX = pageWidth - margin - 70;
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal:', summaryX, y);
  doc.text(formatINR(order.subtotal), pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.text('Discount:', summaryX, y);
  doc.text(`-${formatINR(order.discount)}`, pageWidth - margin, y, { align: 'right' });

  // Separate GST into CGST & SGST (Equal half for intra-state Karnataka trade)
  y += 5;
  doc.text(`CGST (9% avg):`, summaryX, y);
  doc.text(formatINR(order.gst / 2), pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.text(`SGST (9% avg):`, summaryX, y);
  doc.text(formatINR(order.gst / 2), pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.text('Delivery Charge:', summaryX, y);
  doc.text(formatINR(order.deliveryCharge), pageWidth - margin, y, { align: 'right' });

  // Total Row
  y += 6;
  doc.setFillColor(250, 240, 230);
  doc.rect(summaryX - 5, y - 4, 80, 7, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.text('Grand Total:', summaryX, y);
  doc.text(formatINR(order.grandTotal), pageWidth - margin, y, { align: 'right' });

  // 6. Signatures and Declaration
  y = pageHeight - 35;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('TERMS & CONDITIONS:', margin, y);
  doc.text('1. Goods once sold will not be taken back or exchanged.', margin, y + 4);
  doc.text('2. Interest @18% p.a. will be charged if payment is not received within due date.', margin, y + 8);
  doc.text('3. All disputes are subject to Bengaluru jurisdiction only.', margin, y + 12);

  // Auth signatory line
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`For ${BUSINESS_DETAILS.name}`, pageWidth - margin - 50, y, { align: 'center' });
  doc.setDrawColor(180, 180, 180);
  doc.line(pageWidth - margin - 75, y + 12, pageWidth - margin, y + 12);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorized Signatory', pageWidth - margin - 50, y + 16, { align: 'center' });

  return doc;
}

/**
 * Generates a GST-ready Wholesale RFQ / Quotation PDF
 */
export function generateQuotationPDF(quote: Quote): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // 1. Header (Company details left, Quote title right)
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(184, 115, 51); // Copper accent
  doc.text(BUSINESS_DETAILS.name, margin, 15);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(BUSINESS_DETAILS.tagline, margin, 20);
  doc.text(`GSTIN: ${BUSINESS_DETAILS.gstin} | Phone: ${BUSINESS_DETAILS.phone}`, margin, 24);
  doc.text(`Email: ${BUSINESS_DETAILS.email} | Web: ${BUSINESS_DETAILS.website}`, margin, 28);
  doc.text(BUSINESS_DETAILS.address, margin, 32, { maxWidth: 110 });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text('PROFORMA QUOTATION', pageWidth - margin - 5, 18, { align: 'right' });
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Quote Ref: ${quote.id.slice(0, 8).toUpperCase()}`, pageWidth - margin - 5, 24, { align: 'right' });
  const dateStr = new Date(quote.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('en-IN');
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 5, 29, { align: 'right' });
  doc.text(`Valid Till: ${quote.expiryDate ? new Date(quote.expiryDate?.seconds * 1000).toLocaleDateString('en-IN') : 'N/A'}`, pageWidth - margin - 5, 34, { align: 'right' });

  // 2. Client Details Address Block
  let y = 50;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('QUOTATION ISSUED TO:', margin, y);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(quote.customerDetails.name, margin, y + 5);
  if (quote.customerDetails.companyName) {
    doc.text(quote.customerDetails.companyName, margin, y + 10);
  }
  doc.text(`Type: ${quote.customerDetails.customerType.toUpperCase()}`, margin, y + 15);
  doc.text(`Phone: ${quote.customerDetails.phone} | Email: ${quote.customerDetails.email}`, margin, y + 20);
  if (quote.customerDetails.gstin) {
    doc.setFont('Helvetica', 'bold');
    doc.text(`Client GSTIN: ${quote.customerDetails.gstin}`, margin, y + 25);
  }

  // 3. Table Headers
  y = 85;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  
  doc.text('S.No', margin + 2, y + 5);
  doc.text('Item / SKU', margin + 12, y + 5);
  doc.text('HSN', margin + 72, y + 5);
  doc.text('Qty', margin + 92, y + 5, { align: 'right' });
  doc.text('Offered Price (ea)', margin + 122, y + 5, { align: 'right' });
  doc.text('GST %', margin + 147, y + 5, { align: 'right' });
  doc.text('Total', pageWidth - margin - 2, y + 5, { align: 'right' });

  // 4. Render Table Items
  doc.setFont('Helvetica', 'normal');
  y += 8;
  
  quote.items.forEach((item, index) => {
    if (y > pageHeight - 65) {
      doc.addPage();
      y = 20;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.text('S.No', margin + 2, y + 5);
      doc.text('Item / SKU', margin + 12, y + 5);
      doc.text('HSN', margin + 72, y + 5);
      doc.text('Qty', margin + 92, y + 5, { align: 'right' });
      doc.text('Offered Price (ea)', margin + 122, y + 5, { align: 'right' });
      doc.text('GST %', margin + 147, y + 5, { align: 'right' });
      doc.text('Total', pageWidth - margin - 2, y + 5, { align: 'right' });
      doc.setFont('Helvetica', 'normal');
      y += 8;
    }

    const priceToUse = item.offeredPrice || item.requestedPrice || 0;
    const total = priceToUse * item.quantity * (1 + item.gstRate / 100);

    doc.text((index + 1).toString(), margin + 2, y + 5);
    
    const itemName = `${item.name}\nSKU: ${item.sku}`;
    doc.text(itemName, margin + 12, y + 5, { maxWidth: 58 });
    
    doc.text(item.hsnCode, margin + 72, y + 5);
    doc.text(`${item.quantity} ${item.unit}`, margin + 92, y + 5, { align: 'right' });
    doc.text(formatINR(priceToUse), margin + 122, y + 5, { align: 'right' });
    doc.text(`${item.gstRate}%`, margin + 147, y + 5, { align: 'right' });
    doc.text(formatINR(total), pageWidth - margin - 2, y + 5, { align: 'right' });

    const lineCount = doc.splitTextToSize(itemName, 58).length;
    y += Math.max(8, lineCount * 5);
    
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageWidth - margin, y);
  });

  // 5. Quotation Summary Blocks
  y += 5;
  const summaryX = pageWidth - margin - 70;
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Taxable Subtotal:', summaryX, y);
  doc.text(formatINR(quote.subtotal), pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.text('Discount / Adjustment:', summaryX, y);
  doc.text(`-${formatINR(quote.discount)}`, pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.text('GST Total:', summaryX, y);
  doc.text(formatINR(quote.gst), pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.text('Est. Packing & Delivery:', summaryX, y);
  doc.text(formatINR(quote.deliveryCharge), pageWidth - margin, y, { align: 'right' });

  y += 6;
  doc.setFillColor(250, 240, 230);
  doc.rect(summaryX - 5, y - 4, 80, 7, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.text('Estimated Quote Total:', summaryX, y);
  doc.text(formatINR(quote.grandTotal), pageWidth - margin, y, { align: 'right' });

  // Notes if added by admin
  if (quote.notes || quote.adminNotes) {
    y += 12;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('NOTES:', margin, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(quote.adminNotes || quote.notes || '', margin, y + 4, { maxWidth: 100 });
  }

  // 6. Footer signatures
  y = pageHeight - 30;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('QUOTATION REMARKS:', margin, y);
  doc.text('1. This proforma quote is valid only until the stated validity date.', margin, y + 4);
  doc.text('2. Actual delivery charges may vary based on exact shipping distance/logistics.', margin, y + 8);
  doc.text('3. Confirmed order will be processed only after 50% advance payment receipt.', margin, y + 12);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`For ${BUSINESS_DETAILS.name}`, pageWidth - margin - 50, y, { align: 'center' });
  doc.setDrawColor(180, 180, 180);
  doc.line(pageWidth - margin - 75, y + 12, pageWidth - margin, y + 12);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorized Signatory', pageWidth - margin - 50, y + 16, { align: 'center' });

  return doc;
}
