import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { LocalBusinessJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.eshwarhomeneeds.shop'),
  title: {
    default: "ESHwar Home Needs — Smart Retail, Wholesale & Scrap Platform",
    template: "%s | ESHwar Home Needs",
  },
  description: "Premium kitchenware, stainless steel vessels, heavy tri-ply cookware, pure brass urlis, and hammered copper bottles in Hanumakonda, Warangal, Telangana. B2B wholesale quotations & doorstep scrap metal collection at certified rates.",
  keywords: [
    "kitchenware warangal",
    "steel vessels hanumakonda",
    "triply cookware telangana",
    "pure copper bottle online",
    "brass pooja items",
    "wholesale kitchenware supplier",
    "doorstep scrap pickup warangal",
    "copper scrap rate today",
    "ESHwar home needs"
  ],
  authors: [{ name: "Kailash Satkuri", url: "https://www.eshwarhomeneeds.shop" }],
  creator: "ESHwar Home Needs",
  publisher: "ESHwar Home Needs",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  openGraph: {
    title: "ESHwar Home Needs — Smart Retail, Wholesale & Metal Scrap Platform",
    description: "Authentic stainless steel vessels, heavy tri-ply cookware, pure brass, hammered copper, B2B wholesale supply, and digital doorstep scrap pickup.",
    url: "https://www.eshwarhomeneeds.shop",
    siteName: "ESHwar Home Needs",
    images: [
      {
        url: "/shop/IMG_1497965090816371006 (1).jpg",
        width: 1200,
        height: 630,
        alt: "ESHwar Home Needs Premium Kitchenware & Scrap Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ESHwar Home Needs — Retail, Wholesale & Scrap Metal",
    description: "Quality kitchenware, wholesale quotes, and doorstep scrap pickup in Telangana.",
    images: ["/shop/IMG_1497965090816371006 (1).jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://www.eshwarhomeneeds.shop",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <LocalBusinessJsonLd />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-stone-900 font-sans">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

