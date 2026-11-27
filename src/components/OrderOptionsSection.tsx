"use client";

import React from "react";
import Link from "next/link";
import {
  Truck,
  Store,
  ArrowRight,
  Clock,
  ShieldCheck,
  MapPin,
  Sparkles,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  ADVANCE_PAYMENT_NOTE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  STORE_INFO,
} from "@/lib/constants";

export function OrderOptionsSection() {
  return (
    <section className="py-16 sm:py-20 bg-[#F4ECE0] border-y border-[#C8942D]/25 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A0E1B]/10 text-[#4A0E1B] text-xs font-bold uppercase tracking-wider mb-3 border border-[#4A0E1B]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#9E7018]" />
            <span>Flexible Shopping &amp; Fulfillment</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#2E0710] tracking-tight">
            Shop Online or Visit Our Dhupguri Boutique
          </h2>

          <p className="mt-3 text-stone-600 text-base sm:text-lg">
            Order directly from our price-marked design menu for cushioned doorstep courier
            delivery or reserve your size for quick counter pickup at Gobindapally.
          </p>
        </div>

        {/* Two Core Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Home Delivery / Courier Shipping */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#C8942D]/40 hover:border-[#C8942D] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF4EA] border border-[#C8942D]/40 flex items-center justify-center text-[#9E7018] group-hover:scale-110 transition-transform">
                  <Truck className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold bg-[#FAF4EA] text-[#4A0E1B] px-3 py-1 rounded-full border border-[#C8942D]/40">
                  Free Shipping ₹{FREE_SHIPPING_THRESHOLD}+
                </span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-[#2E0710] mb-2">
                Home Shipping &amp; Courier
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed mb-6">
                Select your favorite bangle sets and wrist sizes (2.3 – 2.6), enter your
                delivery address &amp; pincode, and confirm via UPI (full payment or 20% advance
                for Cash on Delivery).
              </p>

              <div className="space-y-2.5 text-xs text-stone-600 bg-[#FAF4EA]/70 rounded-2xl p-4 border border-stone-200 mb-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>Bubble-wrapped velvet boxes for zero glass breakage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#9E7018] flex-shrink-0" />
                  <span>
                    <strong>Dispatch:</strong> Same-day local / 2–4 days regional courier (₹
                    {STANDARD_SHIPPING_FEE} below ₹{FREE_SHIPPING_THRESHOLD})
                  </span>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-[#C8942D]/25 text-[#2E0710] font-medium">
                  <AlertCircle className="w-4 h-4 text-[#9E7018] flex-shrink-0 mt-0.5" />
                  <span>{ADVANCE_PAYMENT_NOTE}</span>
                </div>
              </div>
            </div>

            <Link
              href="/menu"
              className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#4A0E1B] to-[#6E1629] hover:from-[#2E0710] hover:to-[#4A0E1B] text-[#F6D98B] text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Browse Bangle Menu &amp; Order</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Boutique Pickup & Bridal Styling */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#4A0E1B]/20 hover:border-[#4A0E1B] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#4A0E1B]/10 border border-[#4A0E1B]/25 flex items-center justify-center text-[#4A0E1B] group-hover:scale-110 transition-transform">
                  <Store className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  Zero Shipping Fee
                </span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-[#2E0710] mb-2">
                Boutique Pickup &amp; Bridal Fitting
              </h3>

              <p className="text-stone-600 text-sm leading-relaxed mb-6">
                Book your bangle sets online and pick them up from our Gobindapally counter—or
                schedule a complimentary Bridal Chooda &amp; Shakha-Pola wrist sizing consultation.
              </p>

              <div className="space-y-2.5 text-xs text-stone-600 bg-[#FAF4EA]/70 rounded-2xl p-4 border border-stone-200 mb-6">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#4A0E1B] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Store:</strong> {STORE_INFO.fullAddress}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#9E7018] flex-shrink-0" />
                  <span>
                    <strong>Open Daily:</strong> {STORE_INFO.hoursDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>Custom Bridal Mix-and-Match &amp; Bulk Trousseau Guidance</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/book-table"
                className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#9E7018] hover:brightness-105 text-[#2E0710] text-sm font-bold shadow-md transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Bridal Styling Appointment</span>
              </Link>
              <Link
                href="/order"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 text-[#2E0710] text-xs font-bold transition-all"
              >
                <span>Go to Checkout / Bag</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-stone-600">
            Need help finding your bangle size (2.3 – 2.6) or bulk wedding orders? Call or
            WhatsApp:{" "}
            <a href={STORE_INFO.phoneHref} className="font-bold text-[#4A0E1B] hover:underline">
              {STORE_INFO.phoneDisplay}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
