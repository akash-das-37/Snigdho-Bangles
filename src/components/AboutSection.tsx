"use client";

import React from "react";
import Image from "next/image";
import { Heart, Users, ShieldCheck } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-[#2E0710] text-[#FAF4EA] relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C8942D]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#6E1629]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Visual Showcase Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden shadow-2xl border border-[#C8942D]/30 group">
                <Image
                  src="/images/bangles/shakha-pola.jpg"
                  alt="Authentic Bengali Shakha Pola bangles at Snigdho Bangles"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 text-xs font-semibold text-[#F6D98B]">
                  Bengali Shakha-Pola Heritage
                </div>
              </div>

              <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border border-[#C8942D]/30 group">
                <Image
                  src="/images/bangles/glass-velvet.jpg"
                  alt="Vibrant Firozabad glass and velvet bangle sets"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 text-xs font-semibold text-[#F6D98B]">
                  Festive Glass &amp; Velvet Churis
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border border-[#C8942D]/30 group">
                <Image
                  src="/images/bangles/kundan-polki.jpg"
                  alt="Royal Kundan and Polki bridal kadas"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 text-xs font-semibold text-[#F6D98B]">
                  Royal Kundan &amp; Polki
                </div>
              </div>

              <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden shadow-2xl border border-[#C8942D]/30 group">
                <Image
                  src="/images/bangles/bridal-chooda.jpg"
                  alt="Crimson bridal chooda set at Snigdho Bangles"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 text-xs font-semibold text-[#F6D98B]">
                  Grand Bridal Choodas
                </div>
              </div>
            </div>
          </div>

          {/* Right Narrative */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8942D]/15 text-[#F6D98B] text-xs font-bold uppercase tracking-wider border border-[#C8942D]/35">
              <Heart className="w-3.5 h-3.5" />
              <span>Our Gobindapally Heritage</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.18]">
              Celebrating Every Wrist with Craftsmanship &amp; Grace
            </h2>

            <p className="text-stone-200 text-base sm:text-lg leading-relaxed">
              Located in <strong className="text-white">Gobindapally, Dhupguri</strong> (right near
              Jalpaiguri Bus Stand), <strong className="text-[#F6D98B]">Snigdho Bangles</strong>{" "}
              brings together Bengal&apos;s timeless bridal rituals and North India&apos;s finest
              artisan bangle traditions under one boutique roof.
            </p>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              From hand-carved <strong className="text-[#F6D98B]">Shakha-Pola</strong> and
              gold-plated Loha Badhano for Subho Bibaho ceremonies, to{" "}
              <strong className="text-[#F6D98B]">Rajasthani Lac &amp; Kundan Choodas</strong>,
              Firozabad glass stacks, and lightweight everyday rose-gold bracelets—every piece is
              hand-checked for smooth inner polish and lasting shine.
            </p>

            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#C8942D]/25">
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#F6D98B]">30+</p>
                <p className="text-xs text-stone-300 mt-1">Curated Bangle Sets</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#F6D98B]">2.2–2.8</p>
                <p className="text-xs text-stone-300 mt-1">All Standard Wrist Sizes</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-[#F6D98B]">100%</p>
                <p className="text-xs text-stone-300 mt-1">Skin-Safe Polish</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-stone-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Breakage-Safe Packaging
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#F6D98B]" />
                Bridal &amp; Trousseau Specialists
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
