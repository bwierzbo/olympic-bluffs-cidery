import type { Metadata } from "next";
import { Figtree, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { CartProvider } from "@/components/shop/CartProvider";
import { getTodayHours } from "@/lib/hours";
import { getNextEventAll } from "@/lib/events/listing";
import { SITE_URL } from "@/lib/site-url";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "Between the Strait and the Olympics: estate cider, farm-grown lavender, a bed and breakfast, and a working farm on the bluffs outside Port Angeles, Washington.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Olympic Bluffs Cidery & Lavender Farm",
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Olympic Bluffs Cidery & Lavender Farm",
    title: "Olympic Bluffs Cidery & Lavender Farm",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const today = getTodayHours();
  const nextEvent = await getNextEventAll();

  return (
    <html lang="en" className={`${figtree.variable} ${newsreader.variable}`}>
      <body className="font-sans">
        <CartProvider>
          <SiteHeader
            hoursLabel={today.headerLabel}
            eventPill={
              nextEvent
                ? { label: nextEvent.shortLabel, href: nextEvent.href }
                : null
            }
          />
          <main className="min-h-screen">{children}</main>
          <SiteFooter />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
