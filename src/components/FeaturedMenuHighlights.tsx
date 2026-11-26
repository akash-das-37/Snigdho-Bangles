"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, Heart, Plus, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BangleDesign, BangleSize } from "@/types";
import { INITIAL_BANGLE_DESIGNS } from "@/data/bangles";
import { fetchMenuItems } from "@/lib/firebase";

const FEATURED_DESIGN_IDS = ["bc-1", "sp-1", "kp-1", "gp-1", "gv-1", "do-1"];

export function FeaturedMenuHighlights({
  initialDishes,
}: {
  initialDishes?: BangleDesign[];
}) {
  const { addToCart, getItemQuantity } = useCart();

  const resolveFeatured = (sourceList: BangleDesign[]) =>
    FEATURED_DESIGN_IDS.map((id) => {
      const match = sourceList.find((item) => item.id === id);
      return (
        match ||
        INITIAL_BANGLE_DESIGNS.find((item) => item.id === id) ||
        INITIAL_BANGLE_DESIGNS[0]
      );
    });

  const [featuredItems, setFeaturedItems] = useState<BangleDesign[]>(() =>
    resolveFeatured(
      initialDishes && initialDishes.length > 0 ? initialDishes : INITIAL_BANGLE_DESIGNS
    )
  );
  const [selectedSizes, setSelectedSizes] = useState<Record<string, BangleSize>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadLiveFeatured() {
      try {
        const { items: allDesigns } = await fetchMenuItems();
        if (isMounted && allDesigns && allDesigns.length > 0) {
          setFeaturedItems(resolveFeatured(allDesigns));
        }
      } catch (err) {
        console.warn("Could not load live featured bangles:", err);
      }
    }

    loadLiveFeatured();

    const handleMenuUpdated = () => loadLiveFeatured();
    window.addEventListener("cafeyugen_menu_updated", handleMenuUpdated);
    window.addEventListener("storage", handleMenuUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("cafeyugen_menu_updated", handleMenuUpdated);
      window.removeEventListener("storage", handleMenuUpdated);
    };
  }, []);

  return (
    <section className="py-12 sm:py-20 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF4EA] text-[#4A0E1B] text-xs font-bold uppercase tracking-wider mb-2 border border-[#C8942D]/40">
              <Heart className="w-3.5 h-3.5 fill-[#4A0E1B] text-[#4A0E1B]" />
              <span>Signature Store Showcase</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-[#2E0710] tracking-tight">
              Dhupguri&apos;s Most Loved Bangles
            </h2>
            <p className="mt-2 text-stone-600 text-xs sm:text-base max-w-xl">
              A curated preview of our customer favorites. Browse all 30+ bangle designs with full
              prices, sizes &amp; materials in our interactive Menu Card Catalog.
            </p>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-xs sm:text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all group self-start md:self-auto"
          >
            <span>Open Full Price Menu (30+ Designs)</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 6 Featured Design Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {featuredItems.map((design) => {
            const activeSize: BangleSize =
              selectedSizes[design.id] || design.sizes?.[0] || "2.4";
            const qty = getItemQuantity(design.id, activeSize);

            return (
              <div
                key={design.id}
                className="group relative bg-[#FAF4EA]/60 rounded-2xl overflow-hidden border border-[#C8942D]/30 hover:border-[#C8942D] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-52 w-full overflow-hidden bg-stone-100">
                  <Image
                    src={design.image || "/images/bangles/bridal-chooda.jpg"}
                    alt={design.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2E0710]/70 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 text-[10px] font-bold text-[#2E0710]">
                    <span
                      className={design.inStock ? "bangle-badge-instock" : "bangle-badge-craft"}
                    />
                    <span>{design.packCount}</span>
                  </div>

                  {design.badge && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md bg-gradient-to-r from-[#D4AF37] to-[#9E7018] text-[#2E0710]">
                      {design.badge}
                    </div>
                  )}

                  <div
                    suppressHydrationWarning
                    className="absolute bottom-3 right-3 text-[#F6D98B] bg-[#2E0710]/85 px-2.5 py-1 rounded-lg font-bold text-base drop-shadow-md border border-[#C8942D]/40"
                  >
                    ₹{design.price}
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E7018]">
                      {design.category}
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#2E0710] group-hover:text-[#6E1629] transition-colors mt-0.5">
                      {design.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {design.description}
                    </p>

                    {/* Quick Size Selector */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-stone-500 uppercase mr-0.5">
                        Size:
                      </span>
                      {(design.sizes || ["2.4", "2.6"]).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() =>
                            setSelectedSizes((prev) => ({ ...prev, [design.id]: sz }))
                          }
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                            activeSize === sz
                              ? "bg-[#4A0E1B] text-[#F6D98B] border-[#4A0E1B]"
                              : "bg-stone-50 text-stone-700 border-stone-200 hover:border-[#C8942D]"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-stone-500 truncate">
                      {design.material}
                    </span>

                    <button
                      type="button"
                      onClick={() => addToCart(design, activeSize)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                        qty > 0
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-[#4A0E1B] hover:bg-[#C8942D] hover:text-[#2E0710] text-white"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{qty > 0 ? `In Bag (${qty})` : `Add (${activeSize})`}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-10 sm:mt-12 bg-gradient-to-r from-[#2E0710] via-[#4A0E1B] to-[#2E0710] rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl border border-[#C8942D]/30">
          <div className="flex items-center gap-3.5 sm:gap-4 text-center sm:text-left">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#C8942D]/20 text-[#F6D98B] flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="font-serif text-lg sm:text-2xl font-bold">
                Explore the Full Price-Card Bangle Menu
              </h4>
              <p className="text-xs sm:text-sm text-stone-200 mt-1">
                Switch between Grid Cards and Menu Price List view across Bridal Chooda,
                Shakha-Pola, Kundan, Gold-Plated &amp; Glass stacks.
              </p>
            </div>
          </div>

          <Link
            href="/menu"
            className="w-full sm:w-auto justify-center px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#9E7018] hover:brightness-110 text-[#2E0710] text-xs sm:text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Gem className="w-4 h-4" />
            <span>Open Store Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
