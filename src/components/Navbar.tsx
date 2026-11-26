"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gem,
  ShoppingBag,
  Phone,
  Menu as MenuIcon,
  X,
  ShieldCheck,
  User,
  ChevronDown,
  LogOut,
  Crown,
  ClipboardList,
  Sparkles,
  Calendar,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { OrderModal } from "@/components/OrderModal";
import { TakeawayAuthModal } from "@/components/TakeawayAuthModal";
import { STORE_INFO } from "@/lib/constants";

export function Navbar() {
  const router = useRouter();
  const { totalCount } = useCart();
  const {
    customer,
    isAdmin,
    isWorker,
    isAuthModalOpen,
    setIsAuthModalOpen,
    setAuthModalMode,
    logout,
  } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Store hours: 10:00 AM - 9:00 PM IST
  useEffect(() => {
    const checkOpenStatus = () => {
      try {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const istDate = new Date(utc + 3600000 * 5.5);
        const hours = istDate.getHours();
        setIsOpenNow(hours >= 10 && hours < 21);
      } catch {
        setIsOpenNow(true);
      }
    };
    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOrderClick = () => {
    if (totalCount > 0) {
      router.push("/order");
    } else {
      setIsOrderModalOpen(true);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-[#2E0710] border-b border-[#C8942D]/25 ${
          isScrolled ? "py-3 shadow-xl bg-[#2E0710]/95 backdrop-blur-md" : "py-4 shadow-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="group flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#9E7018] flex items-center justify-center text-[#2E0710] shadow-md shadow-black/40 group-hover:scale-105 transition-transform flex-shrink-0">
                <Gem className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-[#E5C158] transition-colors leading-tight">
                  {STORE_INFO.brandName}
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#FAF4EA]/75 font-medium">
                  Gobindapally • Dhupguri
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7">
              <Link
                href="/"
                className="text-sm font-medium text-[#FAF4EA]/90 hover:text-[#E5C158] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/menu"
                className="text-sm font-medium text-[#FAF4EA]/90 hover:text-[#E5C158] transition-colors flex items-center gap-1.5"
              >
                <span>Bangle Menu</span>
                <span className="text-[9px] bg-[#C8942D]/25 text-[#F6D98B] px-1.5 py-0.5 rounded-full font-bold uppercase border border-[#C8942D]/40">
                  30+
                </span>
              </Link>
              <Link
                href="/#about"
                className="text-sm font-medium text-[#FAF4EA]/90 hover:text-[#E5C158] transition-colors"
              >
                Heritage
              </Link>
              <Link
                href="/#amenities"
                className="text-sm font-medium text-[#FAF4EA]/90 hover:text-[#E5C158] transition-colors"
              >
                Craft &amp; Sizing
              </Link>
              <Link
                href="/#reviews"
                className="text-sm font-medium text-[#FAF4EA]/90 hover:text-[#E5C158] transition-colors"
              >
                Reviews
              </Link>
              <Link
                href="/book-table"
                className="text-sm font-medium text-[#FAF4EA]/90 hover:text-[#E5C158] transition-colors"
              >
                Bridal Styling
              </Link>
              <Link
                href="/#location"
                className="text-sm font-medium text-[#FAF4EA]/90 hover:text-[#E5C158] transition-colors"
              >
                Visit Store
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <a
                href={STORE_INFO.phoneHref}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/90 hover:text-white bg-[#4A0E1B] hover:bg-[#6E1629] border border-[#C8942D]/35 transition-all"
                title={`Call ${STORE_INFO.brandName}`}
              >
                <Phone className="w-3.5 h-3.5 text-[#E5C158]" />
                <span>{STORE_INFO.phoneDisplay}</span>
              </a>

              <button
                type="button"
                onClick={handleOrderClick}
                className="relative flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#9E7018] text-[#2E0710] text-xs sm:text-sm font-bold shadow-lg shadow-black/30 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                aria-label="Shopping Bag & Order Options"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Bag</span>
                {mounted && totalCount > 0 && (
                  <span className="inline-flex items-center justify-center bg-[#2E0710] text-[#F6D98B] text-[10px] sm:text-xs font-bold rounded-full w-4.5 h-4.5 sm:w-5 sm:h-5 ml-0.5">
                    {totalCount}
                  </span>
                )}
              </button>

              {mounted &&
                (customer?.isVerified ? (
                  <div className="relative flex items-center gap-2">
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#2E0710] bg-gradient-to-r from-[#F6D98B] via-[#D4AF37] to-[#F6D98B] hover:brightness-110 shadow-md transition-all cursor-pointer"
                        title="Open Snigdho Bangles Admin Portal"
                      >
                        <Crown className="w-3.5 h-3.5 text-[#2E0710]" />
                        <span>Admin Panel</span>
                      </Link>
                    ) : isWorker ? (
                      <Link
                        href="/admin"
                        className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-100 bg-[#4A0E1B] hover:bg-[#6E1629] border border-[#C8942D]/50 shadow-md transition-all cursor-pointer"
                        title="Open Staff Orders & Appointments Portal"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-[#E5C158]" />
                        <span>Orders &amp; Visits</span>
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/75 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-200 transition-all cursor-pointer shadow-sm"
                      title={`Signed in as: ${customer.name}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-700/80 border border-emerald-400/40 flex items-center justify-center text-[11px] font-bold text-white uppercase overflow-hidden">
                        {customer.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={customer.avatar}
                            alt={customer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{customer.name?.charAt(0) || "U"}</span>
                        )}
                      </div>
                      <span className="max-w-[100px] truncate text-white font-medium">
                        {customer.name?.split(" ")[0] || "Account"}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                          isAdmin
                            ? "bg-[#D4AF37] text-[#2E0710]"
                            : isWorker
                              ? "bg-blue-500 text-white"
                              : "bg-emerald-500/25 text-emerald-300"
                        }`}
                      >
                        {isAdmin ? "Manager" : isWorker ? "Staff" : "Verified"}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 ${
                          profileDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {profileDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setProfileDropdownOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-64 bg-[#2E0710] border border-[#C8942D]/40 rounded-2xl shadow-2xl p-2.5 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                          <div className="p-3 bg-[#4A0E1B]/80 rounded-xl border border-[#C8942D]/25 mb-2">
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-200 font-bold flex items-center justify-center text-xs uppercase border border-emerald-500/30">
                                {customer.name?.charAt(0) || "U"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-white truncate">
                                  {customer.name}
                                </p>
                                <p className="text-[11px] text-stone-300 truncate">
                                  {customer.phone
                                    ? `+91 ${customer.phone}`
                                    : customer.email || "Verified Customer"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>
                                {isAdmin
                                  ? "Manager (Store Owner)"
                                  : isWorker
                                    ? "Boutique Staff"
                                    : "Verified Customer"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            {(isAdmin || isWorker) && (
                              <Link
                                href="/admin"
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl bg-[#C8942D]/20 hover:bg-[#C8942D]/30 text-[#F6D98B] font-bold border border-[#C8942D]/40 transition mb-1.5"
                              >
                                <Crown className="w-3.5 h-3.5 text-[#E5C158]" />
                                <span>
                                  {isAdmin ? "Admin Panel (Manager)" : "Staff Portal"}
                                </span>
                              </Link>
                            )}
                            <Link
                              href="/order"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-white/10 text-stone-200 transition"
                            >
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="w-3.5 h-3.5 text-[#E5C158]" />
                                <span>My Bangle Bag</span>
                              </div>
                              {totalCount > 0 && (
                                <span className="bg-[#D4AF37] text-[#2E0710] font-bold px-2 py-0.5 rounded-full text-[10px]">
                                  {totalCount}
                                </span>
                              )}
                            </Link>
                            <Link
                              href="/menu"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-white/10 text-stone-200 transition"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#E5C158]" />
                              <span>Browse Bangle Menu</span>
                            </Link>
                            <Link
                              href="/book-table"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-white/10 text-stone-200 transition"
                            >
                              <Calendar className="w-3.5 h-3.5 text-[#E5C158]" />
                              <span>Bridal Styling Visit</span>
                            </Link>
                          </div>

                          <div className="my-1.5 border-t border-white/10" />

                          <button
                            type="button"
                            onClick={async () => {
                              setProfileDropdownOpen(false);
                              await logout();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-950/50 rounded-xl transition cursor-pointer text-left"
                          >
                            <LogOut className="w-3.5 h-3.5 text-red-400" />
                            <span>Sign Out / Switch Account</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("signin");
                      setIsAuthModalOpen(true);
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-[#C8942D]/40 backdrop-blur-sm transition-all cursor-pointer group"
                    title="Sign In or Sign Up"
                  >
                    <div className="w-4.5 h-4.5 rounded-full bg-[#C8942D]/25 text-[#F6D98B] flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-[#2E0710] transition-colors">
                      <User className="w-3 h-3" />
                    </div>
                    <span>Sign In / Up</span>
                  </button>
                ))}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-white/90 hover:text-white focus:outline-none cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#2E0710] border-b border-[#C8942D]/30 px-6 py-6 shadow-2xl">
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-xs text-white/80">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOpenNow ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span>
                  {isOpenNow ? `Open Today: ${STORE_INFO.hoursDisplay}` : "Opens at 10:00 AM"}
                </span>
              </div>

              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-[#E5C158] py-1"
              >
                Home
              </Link>
              <Link
                href="/menu"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[#F6D98B] hover:text-white py-1 flex items-center justify-between"
              >
                <span>Bangle Design Menu (30+)</span>
                <span className="text-xs bg-[#C8942D]/25 text-[#F6D98B] px-2 py-0.5 rounded-full font-bold">
                  View Prices
                </span>
              </Link>
              <Link
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-[#E5C158] py-1"
              >
                Heritage &amp; Story
              </Link>
              <Link
                href="/#amenities"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-[#E5C158] py-1"
              >
                Craftsmanship &amp; Sizing
              </Link>
              <Link
                href="/book-table"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-[#E5C158] py-1"
              >
                Book Bridal Styling Visit
              </Link>
              <Link
                href="/#location"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white/90 hover:text-[#E5C158] py-1"
              >
                Store Location (Gobindapally)
              </Link>

              <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
                {mounted &&
                  (customer?.isVerified ? (
                    <div className="flex flex-col gap-2 p-3 bg-emerald-950/60 rounded-2xl border border-emerald-500/30">
                      <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>{customer.name}</span>
                        </div>
                        <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                          {customer.phone ? `+91 ${customer.phone}` : "Verified"}
                        </span>
                      </div>
                      {(isAdmin || isWorker) && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#F6D98B] to-[#D4AF37] text-[#2E0710] font-bold text-xs shadow-md"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>{isAdmin ? "Admin Portal" : "Staff Portal"}</span>
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          setMobileMenuOpen(false);
                          await logout();
                        }}
                        className="py-1.5 px-3 rounded-lg bg-red-950/50 text-red-300 text-xs font-semibold flex items-center justify-center gap-1 border border-red-500/20 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAuthModalMode("signin");
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 text-white text-xs font-semibold border border-white/15 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#E5C158]" />
                      <span>Sign In / Sign Up</span>
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOrderClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#9E7018] text-[#2E0710] text-sm font-bold shadow-md cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Order Bangles (Shipping / Pickup)</span>
                  {mounted && totalCount > 0 && (
                    <span className="bg-[#2E0710] text-[#F6D98B] text-xs font-bold px-2 py-0.5 rounded-full">
                      {totalCount}
                    </span>
                  )}
                </button>

                <a
                  href={STORE_INFO.phoneHref}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15"
                >
                  <Phone className="w-4 h-4 text-[#E5C158]" />
                  <span>Call {STORE_INFO.phoneDisplay}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
      <TakeawayAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
