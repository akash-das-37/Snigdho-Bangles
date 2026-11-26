import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Snigdho Bangles | Bridal, Shakha-Pola & Designer Bangles in Dhupguri",
  description:
    "Discover handcrafted Indian bridal choodas, traditional Bengali Shakha-Pola, Kundan & Polki kadas, 22K gold-plated kangans, and velvet glass bangles at Snigdho Bangles, Gobindapally (Nearby Jalpaiguri Bus Stand), Dhupguri 735210. Order online for home shipping or store pickup.",
  keywords: [
    "Snigdho Bangles",
    "Bangles shop Dhupguri",
    "Bridal Chooda Dhupguri",
    "Shakha Pola Jalpaiguri",
    "Kundan Bangles West Bengal",
    "Gobindapally bangle boutique",
    "Gold plated kangan Dhupguri",
    "Designer bangles online India",
  ],
  authors: [{ name: "Snigdho Bangles" }],
  creator: "Snigdho Bangles",
  publisher: "Snigdho Bangles",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Snigdho Bangles",
    title: "Snigdho Bangles | Royal Bridal & Heritage Bangle Boutique, Dhupguri",
    description:
      "Shop our menu-card style bangle catalog with prices: Bridal Chooda, Shakha-Pola, Kundan Polki, Gold-Plated Kada & Glass Bangle sets. Home delivery & Dhupguri store pickup.",
    images: [
      {
        url: "/images/bangles/hero-boutique.jpg",
        width: 1200,
        height: 630,
        alt: "Snigdho Bangles Royal Boutique Showcase",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Snigdho Bangles | Dhupguri, West Bengal",
    description:
      "Handcrafted Bridal Chooda, Shakha-Pola, Kundan & Everyday Bangles in Gobindapally, Dhupguri.",
    images: ["/images/bangles/hero-boutique.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#4A0E1B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${jakarta.variable} scroll-smooth`}
    >
      <body className="min-h-screen flex flex-col bg-[#FAF4EA] text-[#2E0710] antialiased selection:bg-[#C8942D]/25 selection:text-[#2E0710]">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
