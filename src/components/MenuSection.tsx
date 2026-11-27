"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Gem,
  Crown,
  Sparkles,
  Heart,
  Layers,
  Search,
  Plus,
  Minus,
  X,
  Truck,
  Store,
  LayoutGrid,
  ListOrdered,
  Ruler,
  ArrowRight,
} from "lucide-react";
import { BangleDesign, BangleCategory, BangleSize } from "@/types";
import { INITIAL_BANGLE_DESIGNS } from "@/data/bangles";
import { fetchMenuItems } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";
import { sanitizeInput } from "@/lib/validation";
import { OrderModal } from "@/components/OrderModal";
import { ADVANCE_PAYMENT_NOTE, BANGLE_SIZES } from "@/lib/constants";

const CATEGORIES: { name: BangleCategory; icon: React.ElementType }[] = [
  { name: "All Designs", icon: Gem },
  { name: "Bridal & Chooda Sets", icon: Crown },
  { name: "Shakha-Pola & Bengali Heritage", icon: Heart },
  { name: "Kundan, Polki & Meenakari", icon: Sparkles },
  { name: "Gold-Plated & Temple Kada", icon: Crown },
  { name: "Glass, Lac & Velvet Sets", icon: Layers },
  { name: "Daily Wear & Oxidized", icon: Gem },
];

export function MenuSection({
  initialDishes,
  initialSource = "firestore",
}: {
  initialDishes?: BangleDesign[];
  initialSource?: "firestore" | "local" | "fallback";
}) {
  const [designs, setDesigns] = useState<BangleDesign[]>(() => {
    if (initialDishes && initialDishes.length > 0) return initialDishes;
    return INITIAL_BANGLE_DESIGNS;
  });
  const [selectedCategory, setSelectedCategory] = useState<BangleCategory>("All Designs");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "price-menu">("grid");
  const [selectedSizes, setSelectedSizes] = useState<Record<string, BangleSize>>({});
  const [dataSource, setDataSource] = useState<"firestore" | "local" | "fallback">(initialSource);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  const { addToCart, updateQuantity, getItemQuantity } = useCart();

  useEffect(() => {
    let isMounted = true;
    async function loadDesigns() {
      try {
        const { items: liveDesigns, source } = await fetchMenuItems();
        if (isMounted && liveDesigns && liveDesigns.length > 0) {
          setDesigns(liveDesigns);
          setDataSource(source);
        }
      } catch (err) {
        console.warn("Using verified offline bangle catalog:", err);
      }
    }
    loadDesigns();

    const handleMenuUpdated = () => loadDesigns();
    window.addEventListener("cafeyugen_menu_updated", handleMenuUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("cafeyugen_menu_updated", handleMenuUpdated);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const cleanQuery = sanitizeInput(searchQuery).toLowerCase();

    return designs.filter((item) => {
      if (selectedCategory !== "All Designs" && item.category !== selectedCategory) {
        return false;
      }
      if (sizeFilter !== "all" && !(item.sizes || []).includes(sizeFilter as BangleSize)) {
        return false;
      }
      if (cleanQuery) {
        const matchesName = item.name.toLowerCase().includes(cleanQuery);
        const matchesDesc = item.description.toLowerCase().includes(cleanQuery);
        const matchesCat = item.category.toLowerCase().includes(cleanQuery);
        const matchesMat = (item.material || "").toLowerCase().includes(cleanQuery);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesMat) return false;
      }
      return true;
    });
  }, [designs, selectedCategory, sizeFilter, searchQuery]);

  // Group items by collection for the Menu-Card Price List view
  const groupedForPriceMenu = useMemo(() => {
    const groups = new Map<BangleCategory, BangleDesign[]>();
    for (const item of filteredItems) {
      const list = groups.get(item.category) || [];
      list.push(item);
      groups.set(item.category, list);
    }
    return Array.from(groups.entries());
  }, [filteredItems]);

  const getActiveSize = (design: BangleDesign): BangleSize =>
    selectedSizes[design.id] || design.sizes?.[0] || "2.4";

  return (
    <section id="menu-content" className="py-12 bg-[#FAF4EA] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Store Catalog Intro Banner */}
        <div className="mb-10 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#C8942D]/35">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A0E1B] text-[#F6D98B] text-xs font-bold">
                  <Gem className="w-3.5 h-3.5" />
                  <span>Boutique Price Menu</span>
                </span>
                <span className="text-xs text-stone-500">
                  Gobindapally, Nearby Jalpaiguri Bus Stand, Dhupguri
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E0710]">
                Interactive Store Design &amp; Price Menu
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
                Pick your bangle size (2.3, 2.4, 2.5, 2.6, or Free Size), add designs to
                your bag, and choose cushioned Home Shipping or Dhupguri Store Pickup.
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium">
                <span className="font-bold text-amber-800">Policy:</span>
                <span>{ADVANCE_PAYMENT_NOTE}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#FAF4EA] hover:bg-[#F1E4D0] border border-[#C8942D]/50 text-[#4A0E1B] text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Truck className="w-4 h-4 text-[#9E7018]" />
                <span>Shipping &amp; Store Pickup Info</span>
                <Store className="w-3.5 h-3.5 text-[#4A0E1B]" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter & View Switcher Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-[#C8942D]/25 mb-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Shakha, Chooda, Kundan, Glass, 22K..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={60}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#FAF4EA]/60 border border-stone-200 text-base sm:text-sm text-[#2E0710] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40 focus:border-[#C8942D]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                  aria-label="Clear Search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Size Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <span className="text-xs font-semibold text-stone-500 hidden sm:inline-flex items-center gap-1 mr-1">
                  <Ruler className="w-3.5 h-3.5 text-[#9E7018]" />
                  Size:
                </span>
                <button
                  type="button"
                  onClick={() => setSizeFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    sizeFilter === "all"
                      ? "bg-[#4A0E1B] text-[#F6D98B]"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  All
                </button>
                {BANGLE_SIZES.map(({ size }) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSizeFilter(size)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      sizeFilter === size
                        ? "bg-[#4A0E1B] text-[#F6D98B]"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* View Mode Switcher: Visual Cards vs Menu Price List */}
              <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-[#4A0E1B] shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Photo Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("price-menu")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === "price-menu"
                      ? "bg-white text-[#4A0E1B] shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Menu Price Card</span>
                </button>
              </div>
            </div>
          </div>

          {/* Collection Tabs */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map(({ name, icon: Icon }) => {
              const count =
                name === "All Designs"
                  ? designs.length
                  : designs.filter((i) => i.category === name).length;
              const isSelected = selectedCategory === name;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedCategory(name)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? "bg-gradient-to-r from-[#4A0E1B] to-[#6E1629] text-[#F6D98B] shadow-md scale-[1.02]"
                      : "bg-[#FAF4EA]/80 hover:bg-[#FAF4EA] text-[#2E0710] border border-[#C8942D]/25"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-[#C8942D]/30 text-[#F6D98B]" : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results & Live Sync Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 text-xs text-stone-600">
          <p>
            Showing <strong className="text-[#2E0710]">{filteredItems.length}</strong>{" "}
            {filteredItems.length === 1 ? "design" : "bangle designs"} in{" "}
            <span className="font-semibold text-[#4A0E1B]">{selectedCategory}</span>
          </p>

          <div className="inline-flex items-center gap-1.5 text-xs text-[#2E0710]/70 bg-white px-3 py-1 rounded-full border border-[#C8942D]/30">
            <span
              className={`w-2 h-2 rounded-full ${
                dataSource === "firestore" ? "bg-emerald-500" : "bg-[#C8942D]"
              }`}
            />
            <span>
              {dataSource === "firestore"
                ? "Live Boutique Catalog Synced"
                : "Verified Snigdho Bangles Catalog"}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#C8942D]/30 p-8 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAF4EA] flex items-center justify-center text-[#9E7018] mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2E0710]">No Bangles Found</h3>
            <p className="text-xs text-stone-500 mt-2">
              No designs matched your filters. Reset filters to view all 30+ boutique designs.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSizeFilter("all");
                setSelectedCategory("All Designs");
              }}
              className="mt-4 px-5 py-2.5 bg-[#4A0E1B] text-[#F6D98B] rounded-xl text-xs font-bold cursor-pointer"
            >
              Show All Bangles
            </button>
          </div>
        ) : viewMode === "price-menu" ? (
          /* CLASSIC MENU-CARD PRICE LIST VIEW */
          <div className="space-y-8">
            {groupedForPriceMenu.map(([categoryName, items]) => (
              <div
                key={categoryName}
                className="bg-white rounded-3xl border-2 border-[#C8942D]/35 shadow-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#2E0710] via-[#4A0E1B] to-[#2E0710] px-6 py-4 flex items-center justify-between border-b border-[#C8942D]/40">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#F6D98B] font-bold block">
                      Snigdho Bangles Collection
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                      {categoryName}
                    </h3>
                  </div>
                  <span className="text-xs font-bold bg-[#C8942D]/20 text-[#F6D98B] px-3 py-1 rounded-full border border-[#C8942D]/40">
                    {items.length} Designs
                  </span>
                </div>

                <div className="divide-y divide-stone-200/80">
                  {items.map((design) => {
                    const activeSize = getActiveSize(design);
                    const qty = getItemQuantity(design.id, activeSize);
                    return (
                      <div
                        key={design.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF4EA]/60 transition-colors"
                      >
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 border border-[#C8942D]/30 flex-shrink-0">
                            <Image
                              src={design.image}
                              alt={design.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={
                                  design.inStock ? "bangle-badge-instock" : "bangle-badge-craft"
                                }
                                title={design.inStock ? "Ready in Stock" : "Made to Order"}
                              />
                              <h4 className="font-serif text-base sm:text-lg font-bold text-[#2E0710]">
                                {design.name}
                              </h4>
                              {design.badge && (
                                <span className="text-[10px] font-bold bg-[#FAF4EA] text-[#4A0E1B] px-2 py-0.5 rounded-full border border-[#C8942D]/40">
                                  {design.badge}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                              {design.description}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                              <span className="font-semibold text-[#4A0E1B]">
                                {design.packCount}
                              </span>
                              <span>•</span>
                              <span>{design.material}</span>
                              <span>•</span>
                              <div className="inline-flex items-center gap-1">
                                <span className="font-semibold">Size:</span>
                                {(design.sizes || ["2.4", "2.6"]).map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() =>
                                      setSelectedSizes((prev) => ({ ...prev, [design.id]: sz }))
                                    }
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                                      activeSize === sz
                                        ? "bg-[#4A0E1B] text-[#F6D98B] border-[#4A0E1B]"
                                        : "bg-white text-stone-700 border-stone-200"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Price & Add Controls */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                              Store Price
                            </span>
                            <span className="font-serif text-xl font-extrabold text-[#4A0E1B]">
                              ₹{design.price}
                            </span>
                          </div>

                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1 border border-stone-200">
                              <button
                                type="button"
                                onClick={() => updateQuantity(design.id, -1, activeSize)}
                                className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-[#2E0710]">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(design.id, 1, activeSize)}
                                className="w-7 h-7 rounded-lg bg-[#4A0E1B] text-[#F6D98B] hover:bg-[#2E0710] flex items-center justify-center cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(design, activeSize)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A0E1B] hover:bg-[#C8942D] hover:text-[#2E0710] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add ({activeSize})</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* PHOTO GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((design) => {
              const activeSize = getActiveSize(design);
              const qty = getItemQuantity(design.id, activeSize);

              return (
                <div
                  key={design.id}
                  className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border ${
                    design.isFavorite
                      ? "border-[#C8942D] ring-2 ring-[#C8942D]/20"
                      : "border-stone-200 hover:border-[#C8942D]"
                  }`}
                >
                  <div className="relative h-52 w-full overflow-hidden bg-stone-100">
                    <Image
                      src={design.image}
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

                    {(design.badge || design.isFavorite) && (
                      <div
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md ${
                          design.isFavorite
                            ? "bg-gradient-to-r from-[#D4AF37] to-[#9E7018] text-[#2E0710]"
                            : "bg-[#2E0710]/90 text-[#F6D98B] border border-[#C8942D]/40"
                        }`}
                      >
                        {design.badge || "Bestseller"}
                      </div>
                    )}

                    {design.dispatchTime && (
                      <div className="absolute bottom-3 left-3 text-[11px] font-medium text-white/95 bg-black/45 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                        {design.dispatchTime}
                      </div>
                    )}

                    <div
                      suppressHydrationWarning
                      className="absolute bottom-3 right-3 text-[#F6D98B] bg-[#2E0710]/85 px-2.5 py-0.5 rounded-lg font-bold text-lg drop-shadow-md border border-[#C8942D]/40"
                    >
                      ₹{design.price}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E7018]">
                        {design.category}
                      </span>
                      <h3 className="font-serif text-base sm:text-lg font-bold text-[#2E0710] group-hover:text-[#6E1629] transition-colors mt-0.5">
                        {design.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {design.description}
                      </p>

                      <p className="mt-2 text-[11px] text-stone-500">
                        <strong className="text-stone-700">Material:</strong> {design.material}
                      </p>

                      {/* Interactive Size Selector */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-stone-500 uppercase mr-0.5">
                          Select Size:
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
                                : "bg-[#FAF4EA]/70 text-stone-700 border-stone-200 hover:border-[#C8942D]"
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone-500 font-medium">
                          Size {activeSize}
                        </span>
                        <span className="text-base font-extrabold text-[#2E0710]">
                          ₹{design.price}
                        </span>
                      </div>

                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1 border border-stone-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(design.id, -1, activeSize)}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-[#2E0710]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(design.id, 1, activeSize)}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-[#4A0E1B] text-[#F6D98B] hover:bg-[#2E0710] flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(design, activeSize)}
                          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#4A0E1B] hover:bg-[#C8942D] hover:text-[#2E0710] text-white text-xs font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Size {activeSize}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Checkout Strip */}
        <div className="mt-10 bg-white rounded-2xl p-5 border border-[#C8942D]/35 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-xs sm:text-sm text-stone-600">
            <strong className="text-[#2E0710]">Unsure of your wrist bangle size?</strong> Visit our{" "}
            <Link href="/book-table" className="text-[#4A0E1B] font-bold underline">
              Bridal Styling &amp; Sizing Page
            </Link>{" "}
            or message us on WhatsApp.
          </div>
          <Link
            href="/order"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-xs font-bold transition shadow-sm flex-shrink-0"
          >
            <span>Proceed to Bag &amp; Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <OrderModal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} />
    </section>
  );
}
