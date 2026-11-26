"use client";

import React from "react";
import {
  Gem,
  Truck,
  Ruler,
  PackageCheck,
  Gift,
  CreditCard,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export function AmenitiesGrid() {
  const features = [
    {
      icon: Ruler,
      title: "Precision Size Guide (2.2 – 2.8)",
      desc: "Every design is stocked across Indian sizes 2.2, 2.4, 2.6, 2.8, and adjustable screw-lock kadas.",
      highlight: "Perfect Wrist Fit",
    },
    {
      icon: Gem,
      title: "Authentic Shakha & Pola",
      desc: "Traditional Bengali conch-finish Shakha and coral Pola paired with 22K micro-gold filigree patti.",
      highlight: "Bengali Bridal Pride",
    },
    {
      icon: Truck,
      title: "Pan-Region Courier & Store Pickup",
      desc: "Order online for doorstep shipping (Free ₹999+) or instant counter pickup at Gobindapally.",
      highlight: "Fast Fulfillment",
    },
    {
      icon: PackageCheck,
      title: "Zero-Breakage Velvet Packing",
      desc: "Delicate glass and lac bangles are cushioned inside rigid boxes with multi-layer bubble wrap.",
      highlight: "Transit Protected",
    },
    {
      icon: Gift,
      title: "Bridal & Wedding Return Gifting",
      desc: "Custom-packed matching glass and velvet bangle sets for Haldi, Mehendi & Shagun hampers.",
      highlight: "Bulk Discounts",
    },
    {
      icon: CreditCard,
      title: "UPI Direct & 20% Advance COD",
      desc: "Pay seamlessly via GPay, PhonePe, Paytm UPI QR, or lock your order with 20% UPI advance.",
      highlight: "Flexible Checkout",
    },
    {
      icon: Sparkles,
      title: "Skin-Safe Nickel-Free Finish",
      desc: "Smooth rounded inner edges and anti-tarnish lacquer coating built for comfortable all-day wear.",
      highlight: "Comfort Tested",
    },
    {
      icon: ShieldCheck,
      title: "Transparent Menu-Card Pricing",
      desc: "Every set lists clear per-pack pricing, exact piece counts, and materials upfront—no guesswork.",
      highlight: "Honest Store Rates",
    },
  ];

  return (
    <section id="amenities" className="py-20 bg-[#FAF4EA] border-y border-[#C8942D]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-[#4A0E1B]/10 text-[#4A0E1B] text-xs font-bold uppercase tracking-wider mb-3 border border-[#4A0E1B]/20">
            Why Brides &amp; Families Choose Us
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#2E0710] tracking-tight">
            Crafted for Beauty, Comfort &amp; Trust
          </h2>
          <p className="mt-4 text-[#2E0710]/75 text-base sm:text-lg">
            From selecting your exact wrist size to unwrapping your velvet bangle box, every detail
            at Snigdho Bangles is handled with care.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-[#C8942D]/25 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FAF4EA] text-[#9E7018] flex items-center justify-center mb-4 border border-[#C8942D]/35 shadow-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#4A0E1B]/10 text-[#4A0E1B] text-[10px] font-bold uppercase tracking-wider mb-2">
                    {item.highlight}
                  </span>

                  <h3 className="font-serif text-lg font-bold text-[#2E0710] mb-2">
                    {item.title}
                  </h3>

                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
