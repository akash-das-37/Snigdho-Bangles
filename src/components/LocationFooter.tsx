"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  Send,
  Gem,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { STORE_INFO } from "@/lib/constants";

export function LocationFooter() {
  const mapEmbedUrl = `https://maps.google.com/maps?q=${STORE_INFO.mapQuery}&hl=en&z=15&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${STORE_INFO.mapQuery}`;

  return (
    <footer
      id="location"
      className="bg-[#2E0710] text-[#FAF4EA] pt-16 pb-8 border-t border-[#C8942D]/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-14 border-b border-white/10">
          {/* Store Info */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#9E7018] flex items-center justify-center text-[#2E0710] shadow-md">
                <Gem className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold tracking-tight text-white">
                  {STORE_INFO.brandName}
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-[#F6D98B] font-medium">
                  Dhupguri • Gobindapally
                </p>
              </div>
            </div>

            <p className="text-stone-300 text-sm leading-relaxed">
              Handcrafted bridal choodas, traditional Bengali Shakha-Pola, Kundan Polki kadas,
              22K gold-plated kangans &amp; everyday glass bangles—serving Dhupguri and beyond.
            </p>

            <div className="pt-2 space-y-3 text-xs sm:text-sm text-stone-200">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#E5C158] flex-shrink-0 mt-0.5" />
                <span>{STORE_INFO.fullAddress}</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#E5C158] flex-shrink-0" />
                <a
                  href={STORE_INFO.phoneHref}
                  className="hover:text-[#F6D98B] font-medium transition-colors"
                >
                  {STORE_INFO.phoneDisplay}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#E5C158] flex-shrink-0" />
                <span>{STORE_INFO.hoursFull}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2.5">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#9E7018] text-[#2E0710] text-xs font-bold shadow-sm transition-all hover:brightness-110"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>

              <a
                href={STORE_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp Store</span>
              </a>
            </div>
          </div>

          {/* Embedded Map */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
                <MapPin className="w-3.5 h-3.5 text-[#E5C158]" />
                <span>{STORE_INFO.addressLine1} • PIN 735210</span>
              </div>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#F6D98B] hover:underline flex items-center gap-1"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#C8942D]/30 shadow-2xl relative bg-[#4A0E1B]">
              <iframe
                title="Snigdho Bangles Location Map Dhupguri Gobindapally"
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full contrast-105"
              />
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>
            © {new Date().getFullYear()} {STORE_INFO.brandName}, Gobindapally, Dhupguri. All Rights
            Reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              UPI Verified: {STORE_INFO.upiId}
            </span>
            <span>•</span>
            <Link href="/menu" className="hover:text-white transition-colors">
              Design Menu
            </Link>
            <span>•</span>
            <Link href="/book-table" className="hover:text-white transition-colors">
              Bridal Visits
            </Link>
            <span>•</span>
            <Link href="/order" className="hover:text-white transition-colors">
              Bag &amp; Checkout
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
