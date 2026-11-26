"use client";

import React from "react";
import { Star, CheckCircle, MessageCircle } from "lucide-react";
import { STORE_INFO } from "@/lib/constants";

export function ReviewsSection() {
  const reviews = [
    {
      name: "Poulomi Chatterjee",
      role: "December Bride • Dhupguri",
      rating: 5,
      date: "2 weeks ago",
      text: "Bought my complete wedding Shakha-Pola and Maharani Crimson Chooda from Snigdho Bangles near Jalpaiguri Bus Stand. The gold filigree finishing and size 2.4 fit were flawless!",
      highlight: "Bridal Chooda & Shakha-Pola",
    },
    {
      name: "Sutapa Roy",
      role: "Verified Buyer • Jalpaiguri",
      rating: 5,
      date: "1 month ago",
      text: "Loved how clearly every bangle design and price is listed like a menu card. Ordered emerald Firozabad glass sets via home shipping—every single glass bangle arrived safely packed.",
      highlight: "Safe Courier Packaging",
    },
    {
      name: "Debashree Saha",
      role: "Festive Shopper • Falakata",
      rating: 5,
      date: "3 weeks ago",
      text: "Their Kundan Polki kadas and Nakshi gold-plated kangans look identical to real gold jewelry under wedding lights. Super polite guidance when choosing matching sets for sarees.",
      highlight: "Kundan & Gold-Plated Kadas",
    },
    {
      name: "Arpita Barman",
      role: "College Student • Dhupguri",
      rating: 5,
      date: "1 month ago",
      text: "The oxidized silver ghungroo cuffs and rose-gold AD slim stack are super lightweight and haven't tarnished at all. Easy store pickup right at Gobindapally!",
      highlight: "Daily Wear & Oxidized",
    },
  ];

  return (
    <section id="reviews" className="py-20 bg-white border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF4EA] text-[#4A0E1B] text-xs font-bold uppercase tracking-wider mb-3 border border-[#C8942D]/40">
            <Star className="w-3.5 h-3.5 fill-[#C8942D] text-[#C8942D]" />
            <span>4.9 ★ Rated by Brides &amp; Families</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#2E0710] tracking-tight">
            Adored Across Dhupguri &amp; Jalpaiguri
          </h2>

          <p className="mt-4 text-stone-600 text-base sm:text-lg">
            See why brides, families, and everyday shoppers trust Snigdho Bangles for weddings,
            pujas, and thoughtful gifts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-[#FAF4EA]/60 rounded-2xl p-6 border border-[#C8942D]/25 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1 text-[#C8942D]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C8942D] text-[#C8942D]" />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-400">{rev.date}</span>
                </div>

                <span className="inline-block px-2 py-0.5 rounded-full bg-[#4A0E1B]/10 text-[#4A0E1B] text-[10px] font-bold uppercase tracking-wider mb-2">
                  {rev.highlight}
                </span>

                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed italic">
                  &ldquo;{rev.text}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200/70 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#2E0710]">{rev.name}</h4>
                  <p className="text-[11px] text-stone-500">{rev.role}</p>
                </div>
                <span title="Verified Buyer">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href={STORE_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-xs font-bold shadow-md transition-all"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Ask for Custom Bridal Photos on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
}
