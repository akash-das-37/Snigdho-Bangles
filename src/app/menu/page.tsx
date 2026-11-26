import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MenuSection } from "@/components/MenuSection";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { LocationFooter } from "@/components/LocationFooter";
import { ArrowLeft, Truck, Store, Sparkles } from "lucide-react";
import { fetchMenuItems } from "@/lib/firebase";
import { FREE_SHIPPING_THRESHOLD, STORE_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Bangle Design & Price Menu | Snigdho Bangles Dhupguri",
  description:
    "Browse 30+ handcrafted bangle designs with clear prices at Snigdho Bangles, Gobindapally (Nearby Jalpaiguri Bus Stand), Dhupguri 735210. Bridal Chooda, Shakha-Pola, Kundan Polki, Gold-Plated & Glass sets.",
  openGraph: {
    title: "Snigdho Bangles Price Menu | Dhupguri",
    description:
      "Shop our menu-card style bangle catalog across 6 royal collections. Available for home shipping & Gobindapally store pickup.",
    images: [
      {
        url: "/images/bangles/hero-boutique.jpg",
        width: 1200,
        height: 630,
        alt: "Snigdho Bangles Design Menu",
      },
    ],
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MenuPage() {
  const { items, source } = await fetchMenuItems();

  return (
    <main className="min-h-screen bg-[#FAF4EA] flex flex-col selection:bg-[#C8942D]/25 selection:text-[#2E0710]">
      <Navbar />

      {/* Top Hero Banner */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-[#2E0710] via-[#4A0E1B] to-[#2E0710] text-white relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#C8942D]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#6E1629]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 text-xs text-stone-300 mb-6">
            <Link
              href="/"
              className="hover:text-[#F6D98B] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <span>/</span>
            <span className="text-[#F6D98B] font-semibold">Bangle Design &amp; Price Menu</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8942D]/20 text-[#F6D98B] text-xs font-bold uppercase tracking-wider mb-4 border border-[#C8942D]/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>6 Royal Collections • 30+ Designs with Store Prices</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Snigdho Bangles Catalog
            </h1>

            <p className="mt-4 text-stone-200 text-sm sm:text-lg leading-relaxed">
              From bridal <strong className="text-[#F6D98B]">Crimson Choodas</strong> and
              traditional <strong className="text-[#F6D98B]">Bengali Shakha-Pola</strong> to
              Kundan Polki kadas, 22K gold-plated kangans &amp; everyday glass sets.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-[#C8942D]/30">
                <Truck className="w-4 h-4 text-[#F6D98B]" />
                <span>
                  <strong>Home Shipping:</strong> Free above ₹{FREE_SHIPPING_THRESHOLD} • 20% UPI
                  Advance for COD
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-[#C8942D]/30">
                <Store className="w-4 h-4 text-emerald-300" />
                <span>
                  <strong>Store Pickup:</strong> {STORE_INFO.addressLine1}, Dhupguri
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MenuSection initialDishes={items} initialSource={source} />
      <FloatingCartButton />
      <LocationFooter />
    </main>
  );
}
