"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Truck,
  Store,
  ArrowRight,
  Phone,
  Clock,
  MapPin,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import {
  ADVANCE_PAYMENT_NOTE,
  FREE_SHIPPING_THRESHOLD,
  STORE_INFO,
} from "@/lib/constants";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const { totalCount, setDiningOption } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-[#FAF4EA] rounded-2xl sm:rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl border border-[#C8942D]/35 z-10 text-[#2E0710] my-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-500 hover:text-[#2E0710] hover:bg-stone-200/70 rounded-full transition-colors cursor-pointer"
          aria-label="Close Order Options"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#4A0E1B] bg-[#C8942D]/20 px-3 py-1 rounded-full border border-[#C8942D]/40 mb-2">
            {STORE_INFO.brandName} • Dhupguri
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2E0710]">
            Choose Your Order Method
          </h3>
          <p className="text-stone-600 text-sm mt-1.5 max-w-md mx-auto">
            Order online for cushioned doorstep shipping or pick up directly at our Gobindapally
            store counter.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Option 1: Home Shipping */}
          <div className="bg-white rounded-2xl p-5 border-2 border-stone-200 hover:border-[#C8942D] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FAF4EA] border border-[#C8942D]/40 flex items-center justify-center text-[#9E7018] mb-3 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif text-lg font-bold text-[#2E0710]">Home Shipping</h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Courier
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Safely packed courier delivery across West Bengal &amp; India. Free shipping on
                orders ₹{FREE_SHIPPING_THRESHOLD}+.
              </p>
              <div className="mt-3 p-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{ADVANCE_PAYMENT_NOTE}</span>
              </div>
            </div>

            <div className="mt-5">
              <Link
                href={totalCount > 0 ? "/order" : "/menu"}
                onClick={() => {
                  setDiningOption("shipping");
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <span>
                  {totalCount > 0 ? `Checkout for Shipping (${totalCount})` : "Browse Designs"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Option 2: Store Pickup */}
          <div className="bg-white rounded-2xl p-5 border-2 border-stone-200 hover:border-[#4A0E1B] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#4A0E1B]/10 border border-[#4A0E1B]/25 flex items-center justify-center text-[#4A0E1B] mb-3 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif text-lg font-bold text-[#2E0710]">Store Pickup</h4>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  Dhupguri
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Reserve your bangle size online and collect directly from our Gobindapally
                boutique.
              </p>

              <div className="mt-3 space-y-1.5 text-[11px] text-stone-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#9E7018]" />
                  <span>{STORE_INFO.hoursDisplay} Daily</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#4A0E1B]" />
                  <span>{STORE_INFO.addressLine1}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Link
                href={totalCount > 0 ? "/order" : "/menu"}
                onClick={() => {
                  setDiningOption("pickup");
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#9E7018] text-[#2E0710] text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <span>
                  {totalCount > 0 ? `Store Pickup (${totalCount})` : "Select Bangles for Pickup"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/book-table"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition"
              >
                <Calendar className="w-3 h-3 text-[#4A0E1B]" />
                <span>Book Bridal Styling Visit</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-600">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#9E7018]" />
            <span>Need sizing or custom bridal help?</span>
          </div>
          <a
            href={STORE_INFO.phoneHref}
            className="font-bold text-[#4A0E1B] hover:text-[#9E7018] transition-colors"
          >
            {STORE_INFO.phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  );
}
