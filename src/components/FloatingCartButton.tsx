"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function FloatingCartButton() {
  const { totalCount, subtotal, isHydrated } = useCart();
  const pathname = usePathname();

  if (!isHydrated || totalCount === 0 || pathname === "/order") return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 animate-bounce-subtle mb-[env(safe-area-inset-bottom,0px)]">
      <Link
        href="/order"
        className="flex items-center gap-2.5 sm:gap-3 px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#4A0E1B] to-[#6E1629] text-[#F6D98B] shadow-2xl shadow-black/50 border border-[#C8942D]/60 hover:scale-105 active:scale-95 transition-all cursor-pointer group max-w-[calc(100vw-2rem)]"
        aria-label="View Bangle Bag & Checkout"
      >
        <div className="relative flex-shrink-0">
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-[#2E0710] text-[9px] sm:text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {totalCount}
          </span>
        </div>

        <div className="flex flex-col text-left min-w-0">
          <span className="text-xs font-bold leading-tight flex items-center gap-1 text-white">
            <span className="truncate">Bangle Bag Checkout</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F6D98B] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#F6D98B] font-medium">
            ₹{subtotal} • {totalCount} {totalCount === 1 ? "set" : "sets"}
          </span>
        </div>
      </Link>
    </div>
  );
}
