# ESHwar Home Needs — Smart Retail, Wholesale & Scrap Platform

A full-stack e-commerce platform I built for ESHwar Home Needs, a retail store in Andhra Pradesh dealing in kitchenware, home essentials, wholesale distribution, and doorstep scrap collection. Built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **Firebase**, and **Google Gemini AI**.

🔗 **Live:** [eshwarhomeneeds.com](https://eshwarhomeneeds.com)

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Next.js API Routes (Serverless), Firebase Admin SDK
- **Database:** Cloud Firestore + Local JSON fallback for dev
- **Auth:** Firebase Authentication (Email/Password, Google, Phone)
- **AI:** Google Gemini 3.6 Flash (Vision + Text)
- **Payments:** Razorpay (Online + COD + NEFT/RTGS)
- **Email:** Nodemailer with Gmail SMTP
- **Hosting:** Vercel

---

## Features

### Storefront
- Dynamic homepage with category grids, bestseller carousels, customer reviews, and a Google Maps store locator
- Product catalog with search, price/material/induction filters, and an **AI-powered natural language search** (e.g. "induction vessel under 2000")
- Product detail pages with **interactive 360° rotation viewer**, care guides, and WhatsApp inquiry links
- Full shopping cart with quantity controls, wholesale pricing toggle, and checkout flow

### B2B Wholesale Portal
- Business customers can submit RFQ (Request for Quotation) lists with quantities and target prices
- Admin quotes editor with item-level discounts, freight rates, GST breakdowns, validity dates, and PDF export

### Doorstep Scrap Collection
- Live scrap rate cards per kg with a real-time commodity price ticker
- Instant price estimator calculator
- Pickup scheduling with address and photo uploads
- **AI Scrap Predictor** — upload a photo of scrap material and Gemini Vision identifies the type (copper, steel, brass), confidence score, and estimated value

### Payments & Orders
- Razorpay integration with server-side HMAC-SHA256 signature verification
- COD and NEFT/RTGS bank transfer options
- "Pay Online Again" recovery flow for failed payments
- UTR submission for bank transfer verification
- Simulated transactional email client with styled invoice previews
- Smart product recommendations with bundle discounts at checkout

### Admin Dashboard
- Real-time analytics: today's revenue, order counts, weekly volume charts, low stock alerts
- Live notification center with bell icon, unread badges, and audio chime alerts
- Product manager (CRUD), scrap pickup manager, wholesale quotes manager
- Role-based access control (Admin vs Staff) with page-level and action-level permissions

### Security & Verification
- **Email OTP verification** for phone number confirmation — sends a 6-digit code to the user's email via Nodemailer/Gmail SMTP
- Verification gates on: Add to Cart, Place Order, Scrap Booking, Wholesale Quotation
- One phone number per account enforcement (server-side duplicate check)
- Auto-resume cart action after successful verification
- Profile phone editing resets verification status
- Password change center with "Forgot Password" recovery link
- Master admin auto-provisioning for `satkurikailash@gmail.com`

---

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Back-office dashboard, products, quotes, scrap
│   ├── api/                # Serverless API routes
│   │   ├── ai/             # Gemini AI endpoints (search, scrap predictor)
│   │   ├── email/          # OTP send & verify endpoints
│   │   ├── payment/        # Razorpay order creation & signature verification
│   │   ├── drive/          # Google Drive image importer
│   │   └── db/             # Local JSON database API (dev fallback)
│   ├── account/            # Customer dashboard
│   ├── checkout/           # Checkout flow
│   ├── shop/               # Catalog & product detail pages
│   ├── scrap/              # Scrap collection portal
│   └── wholesale/          # B2B quotation portal
├── components/ui/          # Reusable UI components
├── context/                # Global app state (auth, cart, toast)
├── lib/
│   ├── firebase/           # Firebase client & admin config
│   └── services/           # Email, AI, database, invoice helpers
└── types/                  # TypeScript interfaces
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Firestore, Auth, and Storage enabled
- Google Gemini API key
- Razorpay account (test mode works fine)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/your-repo/eshwar-home-needs.git
   cd eshwar-home-needs
   npm install
   ```

2. Create a `.env.local` file with your credentials:
   ```env
   # Firebase Client
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Firebase Admin
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

   # Gemini AI
   GEMINI_API_KEY=your_gemini_key

   # Razorpay
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret

   # Email OTP (Gmail SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_google_app_password
   SMTP_FROM=orders@yourdomain.com

   # WhatsApp
   NEXT_PUBLIC_WHATSAPP_NUMBER=your_number
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
```

---

## Database Fallback

The app uses a dual-mode database strategy:
- **Production (Vercel):** Reads/writes directly to Cloud Firestore via Firebase Admin SDK
- **Local Development:** Falls back to `data-local.json` when Firestore permissions fail, so you can develop without any Firebase setup issues

This applies to all API routes including the OTP verification system.

---

## Scripts

| Script | Description |
|:---|:---|
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `node scripts/reset-users.js` | Reset all users and provision master admin |
| `node scripts/test-gemini.js` | Test Gemini API connectivity |

---

## Deployment

Deployed on **Vercel**. Push to `main` branch triggers auto-deployment.

Make sure all environment variables from `.env.local` are added to your Vercel project settings under **Settings → Environment Variables**.

---

## License

Private project. Built for ESHwar Home Needs, Andhra Pradesh, India.
