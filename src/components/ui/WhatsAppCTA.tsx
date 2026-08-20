'use client';

import React from 'react';

interface WhatsAppCTAProps {
  productName: string;
  sku: string;
  quantity?: number;
  type?: 'retail' | 'wholesale' | 'general';
  variantName?: string;
  className?: string;
}

export default function WhatsAppCTA({
  productName,
  sku,
  quantity = 1,
  type = 'retail',
  variantName,
  className = '',
}: WhatsAppCTAProps) {
  // Public Business WhatsApp phone number
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'; // Default Indian code prefix +91

  const generateWhatsAppLink = () => {
    let message = '';
    
    if (type === 'wholesale') {
      message = `Hello ESHwar Home Needs,\n\nI am interested in placing a bulk/wholesale enquiry for:\nProduct: ${productName}${variantName ? ` (${variantName})` : ''}\nSKU: ${sku}\nEstimated Quantity: ${quantity} units.\n\nPlease share the custom pricing sheet, GST breakdown, and shipping terms.\n\nThank you!`;
    } else if (type === 'general') {
      message = `Hello ESHwar Home Needs,\n\nI have a general question about:\nProduct: ${productName}\nSKU: ${sku}\n\nCould you please assist me?\n\nThank you!`;
    } else {
      // Retail
      message = `Hello ESHwar Home Needs,\n\nI am interested in buying:\nProduct: ${productName}${variantName ? ` (${variantName})` : ''}\nSKU: ${sku}\nQuantity: ${quantity}\n\nIs this in stock for delivery?\n\nThank you!`;
    }

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <a
      href={generateWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all duration-200 text-sm ${className}`}
    >
      {/* WhatsApp SVG Icon */}
      <svg
        className="w-4 h-4 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.717-1.465L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.453 5.461 0 9.898-4.432 9.9-9.893.002-2.647-1.02-5.136-2.878-6.997-1.859-1.862-4.343-2.887-6.993-2.888-5.465 0-9.907 4.435-9.911 9.898-.002 1.777.464 3.51 1.347 5.03L1.87 21.05l5.223-1.37a9.855 9.855 0 0 0 4.823 1.25l-.014-.012zm11.488-7.794c-.305-.153-1.808-.891-2.088-.992-.28-.101-.484-.153-.688.153-.203.305-.788.992-.966 1.196-.178.203-.356.229-.661.076-.305-.153-1.288-.475-2.454-1.517-.9-.803-1.507-1.795-1.685-2.1-.178-.305-.019-.47.133-.621.137-.137.305-.356.457-.534.153-.178.203-.305.305-.509.102-.203.051-.381-.025-.534-.076-.153-.688-1.657-.942-2.268-.247-.595-.5-.51-.688-.519-.178-.009-.382-.01-.585-.01a1.13 1.13 0 0 0-.814.381c-.28.305-1.068 1.042-1.068 2.54 0 1.499 1.093 2.951 1.246 3.154.153.203 2.15 3.284 5.21 4.6.727.314 1.295.502 1.737.643.73.232 1.393.199 1.917.121.584-.087 1.808-.737 2.062-1.45.254-.712.254-1.323.178-1.45-.076-.127-.28-.203-.585-.356z" />
      </svg>
      <span>
        {type === 'wholesale' ? 'Request Wholesale Quote' : 'Enquire on WhatsApp'}
      </span>
    </a>
  );
}
