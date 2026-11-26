"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  MapPin,
  Gem,
  Calendar,
  Sparkles,
  ChevronRight,
  Heart,
  Truck,
  Store,
} from "lucide-react";
import { OrderModal } from "@/components/OrderModal";
import { STORE_INFO } from "@/lib/constants";

export function Hero() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-[#2E0710]">
        {/* Royal Boutique Background Showcase */}
        <div className="absolute inset-0 z-0 opacity-45">
          <Image
            src="/images/bangles/hero-boutique.jpg"
            alt="Snigdho Bangles royal maroon velvet bangle showcase"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2E0710] via-[#4A0E1B]/75 to-[#2E0710]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Top Location & Rating Pill */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-3.5 py-1.5 sm:px-5 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#C8942D]/35 text-xs sm:text-sm text-[#FAF4EA] mb-6 sm:mb-8 shadow-lg">
            <div className="flex items-center gap-1.5 text-[#F6D98B] font-semibold">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#F6D98B] text-[#F6D98B]" />
              <span>Trusted Bridal &amp; Heritage Bangles</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1 text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{STORE_INFO.hoursDisplay}</span>
            </div>
            <span className="hidden sm:inline text-white/30">•</span>
            <div className="hidden sm:flex items-center gap-1 text-white/90">
              <MapPin className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>Gobindapally, Dhupguri 735210</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.16] max-w-4xl">
            Timeless Tradition Meets{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F6D98B] via-[#D4AF37] to-[#FCEBB6]">
              Royal Bangle Craft
            </span>{" "}
            in Dhupguri
          </h1>

          {/* Subhead */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-[#FAF4EA]/90 max-w-2xl font-normal leading-relaxed">
            Explore our menu-card style bangle catalog featuring authentic Bengali{" "}
            <strong className="text-[#F6D98B] font-semibold underline decoration-[#C8942D]/60 underline-offset-4">
              Shakha-Pola
            </strong>
            , crimson Bridal Choodas, Kundan Polki kadas, hand made choodas &amp; Firozabad
            glass sets—near Dhupguri Bus Stand.
          </p>

          {/* Primary CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/menu"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#C8942D] to-[#9E7018] text-[#2E0710] text-sm sm:text-base font-bold shadow-xl shadow-black/45 hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 group"
            >
              <Gem className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
              <span>View Design &amp; Price Menu</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-7 sm:py-4 rounded-full bg-[#FAF4EA] text-[#2E0710] hover:bg-white text-sm sm:text-base font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-[#6E1629]" />
              <span>Order Online</span>
              <span className="text-[10px] sm:text-[11px] bg-[#4A0E1B]/10 text-[#4A0E1B] font-bold px-2 py-0.5 rounded-full">
                Shipping / Pickup
              </span>
            </button>

            <Link
              href="/book-table"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:px-6 sm:py-4 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF4EA] text-sm sm:text-base font-semibold border border-[#C8942D]/40 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#F6D98B]" />
              <span>Bridal Styling Visit</span>
            </Link>
          </div>

          {/* Highlight Strip */}
          <div className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-4xl pt-6 sm:pt-8 border-t border-[#C8942D]/25 text-left">
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 sm:p-2.5 rounded-lg bg-[#C8942D]/25 text-[#F6D98B] flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">30+ Store Designs</p>
                <p className="text-white/65 text-xs">Clear Price Menu</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-300">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Bridal Heritage</p>
                <p className="text-white/65 text-xs">Chooda &amp; Shakha-Pola</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Home Shipping</p>
                <p className="text-white/65 text-xs">Free Above ₹999</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-[#F6D98B]">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Store Pickup</p>
                <p className="text-white/65 text-xs">Gobindapally Counter</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
    </>
  );
}
