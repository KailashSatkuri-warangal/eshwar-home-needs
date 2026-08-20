import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "ESHwar Home Needs — Smart Retail, Wholesale & Scrap Platform",
  description: "Premium kitchenware, steel vessels, brass, copper, and home needs. Request wholesale bulk quotations or sell scrap metal at the best daily rates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-cream text-stone-900 font-sans">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
