export type UserRole = 'admin' | 'staff' | 'customer' | 'wholesale';
export type CustomerType = 'individual' | 'retailer' | 'contractor' | 'builder' | 'hotel' | 'restaurant' | 'caterer' | 'business' | 'other';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type OrderStatus = 'PLACED' | 'PAYMENT_CONFIRMED' | 'PROCESSING' | 'PACKED' | 'READY_FOR_DISPATCH' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';
export type QuoteStatus = 'REQUESTED' | 'QUOTED' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
export type ScrapStatus = 'REQUESTED' | 'SCHEDULED' | 'COLLECTOR_ASSIGNED' | 'PICKED_UP' | 'WEIGHT_VERIFIED' | 'PRICE_CONFIRMED' | 'PAYMENT_COMPLETED' | 'CANCELLED';
export type ScrapMaterialType = 'steel' | 'stainless_steel' | 'copper' | 'brass' | 'aluminium' | 'mixed_metal' | 'plastic' | 'other';
export type OfferType = 'percentage' | 'fixed' | 'category' | 'product' | 'wholesale' | 'min_order' | 'festival';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  phone?: string;
  phoneVerified?: boolean;
  createdAt: any;
  updatedAt: any;
  creditTerms?: string; // Admin controlled
  customerType?: CustomerType; // For wholesale registration
  gstin?: string;
  companyName?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
}

export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  order: number;
  subcategories: string[];
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  subcategoryId?: string;
  brandId?: string;
  material: string;
  description: string;
  retailPrice: number;
  wholesalePrice: number;
  discountPrice?: number;
  gstRate: number; // e.g. 12, 18, etc.
  hsnCode: string;
  stockQuantity: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  minOrderQty: number;
  wholesaleMinQty: number;
  unit: string; // e.g. 'pcs', 'kg'
  weight?: number; // in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  capacity?: number; // in liters, ml etc.
  color?: string;
  variants?: ProductVariant[];
  tags: string[];
  keywords: string[];
  status: ProductStatus;
  featured: boolean;
  bestseller: boolean;
  createdAt: any;
  updatedAt: any;
  specifications: Record<string, string | number | boolean>; // Flexible key-values
  careInstructions?: string;
  deliveryInfo?: string;
  returnPolicy?: string;
  originalImage: string;
  views: string[]; // 24 angles URLs
  has360: boolean;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Size: 5 Liters", "Color: Copper Gloss"
  sku: string;
  retailPrice: number;
  wholesalePrice: number;
  discountPrice?: number;
  stockQuantity: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  image: string;
  price: number; // calculated item price (retail or wholesale depending on flow)
  gstRate: number;
  hsnCode: string;
  quantity: number;
  unit: string;
  weight?: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  gst: number;
  deliveryCharge: number;
  grandTotal: number;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  unit: string;
  gstRate: number;
  gstAmount: number;
  hsnCode: string;
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    gstin?: string;
    billingAddress: Address;
    shippingAddress: Address;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  gst: number;
  deliveryCharge: number;
  grandTotal: number;
  status: OrderStatus;
  paymentDetails: {
    method: 'COD' | 'ONLINE' | 'NEFT_RTGS' | 'CREDIT';
    transactionId?: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  };
  createdAt: any;
  updatedAt: any;
}

export interface QuoteItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  requestedPrice?: number; // Optional target price from user
  offeredPrice?: number; // Price quoted by admin
  gstRate: number;
  hsnCode: string;
}

export interface Quote {
  id: string;
  userId: string;
  customerDetails: {
    name: string;
    companyName?: string;
    phone: string;
    email: string;
    gstin?: string;
    customerType: CustomerType;
  };
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  gst: number;
  deliveryCharge: number;
  grandTotal: number;
  notes?: string;
  adminNotes?: string;
  expiryDate?: any;
  status: QuoteStatus;
  createdAt: any;
  updatedAt: any;
}

export interface ScrapRequest {
  id: string;
  userId: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    address: Address;
  };
  material: ScrapMaterialType;
  estimatedWeight: number; // customer's guess
  condition: string; // e.g. "old", "damaged", "good"
  image?: string; // scrap photo
  aiEstimate?: {
    material: string;
    confidence: number; // 0-1
    weightRange: string; // e.g. "4-5 kg"
    estimatedValueRange: string; // e.g. "₹800 - ₹1000"
  };
  status: ScrapStatus;
  preferredDate: string;
  preferredTime: string;
  actualWeight?: number; // scale verified
  actualRate?: number; // verified rate
  finalAmount?: number; // weight * rate
  collectorName?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ScrapRate {
  id: string; // e.g. "copper", "brass"
  material: string;
  currentRate: number; // Rs per kg
  previousRate: number;
  updatedAt: any;
}

export interface ScrapRateHistory {
  id: string;
  material: string;
  rate: number;
  timestamp: any;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  reviewText: string;
  photoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedPurchase: boolean;
  createdAt: any;
}

export interface Offer {
  id: string;
  name: string;
  description?: string;
  type: OfferType;
  value: number; // percent or raw value
  categoryId?: string;
  productId?: string;
  minOrderValue?: number;
  startDate: any;
  endDate: any;
  active: boolean;
}

export interface Notification {
  id: string;
  recipientId: string; // 'admin', 'staff', or userId
  title: string;
  message: string;
  type: 'order' | 'quote' | 'scrap' | 'stock' | 'system';
  read: boolean;
  createdAt: any;
}

export interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  gst: number;
  deliveryCharge: number;
  grandTotal: number;
  isWholesale: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown / HTML
  featuredImage: string;
  imageCaption?: string;
  category: 'Cookware Guides' | 'Health & Copper' | 'Scrap & Recycling' | 'Kitchen Tips' | 'Wholesale Insights';
  tags: string[];
  keywords: string[];
  author: string;
  published: boolean;
  publishedAt: any;
  updatedAt: any;
  readTimeMinutes: number;
  views: number;
  faqs?: Array<{ question: string; answer: string }>;
  relatedProductIds?: string[];
}

