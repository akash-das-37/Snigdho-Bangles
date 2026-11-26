"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Send,
  User,
  Phone,
  Sparkles,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Truck,
  Store,
  X,
  Gem,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LocationFooter } from "@/components/LocationFooter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { getRecommendedItems } from "@/lib/recommendations";
import { generateWhatsAppOrderUrl } from "@/lib/validation";
import {
  BANGLE_SIZES,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  STORE_INFO,
} from "@/lib/constants";
import { DemoUpiPaymentModal } from "@/components/DemoUpiPaymentModal";
import { TakeawayAuthModal } from "@/components/TakeawayAuthModal";
import { saveOrder, getLatestItemPriceSync } from "@/lib/firebase";
import { BangleSize, OrderRecord, PaymentMode } from "@/types";

export default function BangleCheckoutPage() {
  const {
    items,
    updateQuantity,
    updateItemSize,
    removeFromCart,
    clearCart,
    subtotal,
    addToCart,
    diningOption,
    setDiningOption,
    refreshCartPrices,
    syncWithServer,
  } = useCart();
  const { customer, isAuthModalOpen, setIsAuthModalOpen, updateCustomerProfile } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [pickupTime, setPickupTime] = useState("Today (10:00 AM – 9:00 PM)");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("upi_advance_cod");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
    pincode?: string;
  }>({});

  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [advancePaidTxn, setAdvancePaidTxn] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("#SB-ORDER");

  const [showPaymentRequiredModal, setShowPaymentRequiredModal] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState<OrderRecord | null>(null);
  const [orderNotice, setOrderNotice] = useState<{
    type: "warning" | "success" | "error";
    message: string;
  } | null>(null);

  // Hydrate client state and verify live prices safely
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
      setOrderNumber(`SB-${Math.floor(100000 + Math.random() * 900000)}`);
      refreshCartPrices();
      syncWithServer().then((res) => {
        if (res && res.updated) {
          setOrderNotice({
            type: "warning",
            message:
              "Notice: Store catalog prices were updated. Subtotal and UPI amount have been refreshed.",
          });
        }
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [refreshCartPrices, syncWithServer]);

  // Autofill verified customer info if fields are empty
  useEffect(() => {
    if (!customer?.isVerified) return;
    const frame = requestAnimationFrame(() => {
      if (customer.name && !customerName) setCustomerName(customer.name);
      if (customer.phone && !customerPhone) setCustomerPhone(customer.phone);
    });
    return () => cancelAnimationFrame(frame);
  }, [customer, customerName, customerPhone]);

  const recommendations = useMemo(() => getRecommendedItems(items), [items]);

  const shippingFee =
    diningOption === "shipping" && items.length > 0 && subtotal < FREE_SHIPPING_THRESHOLD
      ? STANDARD_SHIPPING_FEE
      : 0;
  const grandTotal = subtotal + shippingFee;
  const payableNow =
    paymentMode === "upi_full" ? grandTotal : Math.ceil(grandTotal * 0.2);
  const remainingAmount = Math.max(0, grandTotal - payableNow);

  const validateCheckoutFields = (): boolean => {
    const errors: { name?: string; phone?: string; address?: string; pincode?: string } = {};
    if (!customerName.trim()) {
      errors.name = "Please enter your full name";
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = "Enter a valid 10-digit Indian mobile number";
    }
    if (diningOption === "shipping") {
      if (!shippingAddress.trim() || shippingAddress.trim().length < 6) {
        errors.address = "Please enter your complete street/house address";
      }
      if (!/^\d{6}$/.test(pincode.trim())) {
        errors.pincode = "Enter a valid 6-digit PIN code (e.g. 735210)";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenUpiModal = async () => {
    if (!validateCheckoutFields()) {
      setOrderNotice({
        type: "warning",
        message: "Please complete your name, phone number, and delivery details first.",
      });
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    try {
      await updateCustomerProfile({ name: customerName.trim(), phone: cleanPhone });
    } catch {}

    const res = await syncWithServer();
    if (res && res.updated) {
      setOrderNotice({
        type: "warning",
        message:
          "Prices refreshed to match current store rates. Please review totals before paying.",
      });
      return;
    }

    setIsUpiModalOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (!advancePaidTxn) {
      setOrderNotice({
        type: "error",
        message: `Please complete your ${
          paymentMode === "upi_full" ? "UPI payment" : "20% UPI advance"
        } first to confirm order.`,
      });
      setShowPaymentRequiredModal(true);
      return;
    }

    if (!validateCheckoutFields()) return;

    const priceRes = await syncWithServer();
    if (priceRes && priceRes.updated) {
      setOrderNotice({
        type: "warning",
        message: "Store prices updated. Please verify the refreshed total and confirm payment.",
      });
      setAdvancePaidTxn(null);
      setShowPaymentRequiredModal(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const cleanPhone = customerPhone.replace(/\D/g, "");
      const orderData: OrderRecord = {
        id: orderNumber,
        customerId: customer?.uid,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        deliveryMethod: diningOption,
        shippingAddress: diningOption === "shipping" ? shippingAddress.trim() : undefined,
        pincode: diningOption === "shipping" ? pincode.trim() : undefined,
        pickupTime:
          diningOption === "shipping" ? "Courier Dispatch (1-3 Days)" : pickupTime,
        items: [...items],
        subtotal,
        shippingFee,
        totalAmount: grandTotal,
        paymentMode,
        advancePaidAmount: payableNow,
        advanceTxnId: advancePaidTxn,
        notes: notes.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await saveOrder(orderData);
      setPlacedOrderDetails(orderData);
      setIsOrderSuccessOpen(true);
      clearCart();
      setOrderNotice({
        type: "success",
        message: `Order ${orderNumber} placed successfully! Visible in ${STORE_INFO.brandName} Admin & Staff portals.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order.";
      setOrderNotice({ type: "error", message: msg });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF4EA] flex flex-col selection:bg-[#C8942D]/25 selection:text-[#2E0710]">
      <Navbar />

      {/* Top Banner */}
      <section className="pt-28 pb-8 bg-[#2E0710] text-white border-b border-[#C8942D]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-stone-300 mb-4">
            <Link href="/" className="hover:text-[#F6D98B] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/menu" className="hover:text-[#F6D98B] transition-colors">
              Bangle Menu
            </Link>
            <span>/</span>
            <span className="text-[#F6D98B] font-semibold">Bag &amp; Checkout</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8942D]/20 text-[#F6D98B] text-xs font-bold uppercase tracking-wider mb-2 border border-[#C8942D]/40">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Home Shipping &amp; Gobindapally Store Pickup</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Review &amp; Checkout Your Bangles
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-stone-300 max-w-xl">
                Confirm your wrist sizes, select Home Shipping or Store Pickup, and pay securely via
                UPI QR ({STORE_INFO.upiBeneficiary}).
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-[#C8942D]/35 text-right self-start md:self-auto">
              <span className="text-[10px] uppercase tracking-wider text-[#F6D98B] block font-bold">
                Order Reference
              </span>
              <span className="font-mono text-lg font-extrabold text-white">{orderNumber}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!isMounted ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-[#C8942D]/30 p-8 max-w-lg mx-auto shadow-sm">
              <div className="w-10 h-10 rounded-full border-3 border-[#4A0E1B] border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-xs text-stone-500 font-semibold">Loading your bangle bag...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#C8942D]/30 p-8 max-w-lg mx-auto shadow-sm">
              <div className="w-20 h-20 rounded-full bg-[#FAF4EA] flex items-center justify-center text-[#9E7018] mx-auto mb-5 border border-[#C8942D]/40">
                <ShoppingBag className="w-10 h-10" />
              </div>

              <h2 className="font-serif text-2xl font-bold text-[#2E0710]">
                Your Bangle Bag is Empty
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-sm mx-auto leading-relaxed">
                Explore our menu-card style catalog of Bridal Choodas, Shakha-Pola, Kundan Polki,
                and Glass Bangle sets.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/menu"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#4A0E1B] to-[#6E1629] text-[#F6D98B] text-xs font-bold shadow-md hover:scale-105 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Browse Bangle Menu (30+ Designs)</span>
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {orderNotice && (
                <div
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                    orderNotice.type === "success"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : orderNotice.type === "error"
                        ? "bg-red-50 border-red-300 text-red-900"
                        : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {orderNotice.type === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-xs sm:text-sm font-semibold">{orderNotice.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderNotice(null)}
                    className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                    aria-label="Dismiss Notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column */}
                <div className="lg:col-span-7 space-y-8">
                  {/* 1. Delivery Method & Customer Form */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-[#C8942D]/30 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2E0710]">
                          Delivery &amp; Customer Details
                        </h2>
                        <p className="text-xs text-stone-500">
                          Choose courier shipping or store pickup at Gobindapally, Dhupguri.
                        </p>
                      </div>

                      {customer?.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full self-start">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Account</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAuthModalOpen(true)}
                          className="text-xs font-bold text-[#4A0E1B] hover:underline cursor-pointer self-start"
                        >
                          Sign in to autofill
                        </button>
                      )}
                    </div>

                    {/* Shipping vs Pickup Toggle */}
                    <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-[#FAF4EA] rounded-2xl border border-[#C8942D]/30">
                      <button
                        type="button"
                        onClick={() => setDiningOption("shipping")}
                        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          diningOption === "shipping"
                            ? "bg-[#4A0E1B] text-[#F6D98B] shadow-sm"
                            : "text-stone-700 hover:bg-white/70"
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>Home Shipping</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDiningOption("pickup")}
                        className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          diningOption === "pickup"
                            ? "bg-[#4A0E1B] text-[#F6D98B] shadow-sm"
                            : "text-stone-700 hover:bg-white/70"
                        }`}
                      >
                        <Store className="w-4 h-4" />
                        <span>Store Pickup (Dhupguri)</span>
                      </button>
                    </div>

                    {/* Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. Poulomi Roy"
                            maxLength={50}
                            className="w-full pl-10 pr-3 py-2.5 text-base sm:text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40"
                          />
                        </div>
                        {formErrors.name && (
                          <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          10-Digit Mobile Number *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="e.g. 9876543210"
                            maxLength={10}
                            className="w-full pl-10 pr-3 py-2.5 text-base sm:text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40"
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="text-[11px] text-red-500 mt-1">{formErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Address or Store Pickup Details */}
                    {diningOption === "shipping" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Full Delivery Address (House, Road, Landmark, City) *
                          </label>
                          <input
                            type="text"
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="e.g. Gobindapally, Near Bus Stand, Dhupguri"
                            maxLength={160}
                            className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40"
                          />
                          {formErrors.address && (
                            <p className="text-[11px] text-red-500 mt-1">{formErrors.address}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            PIN Code *
                          </label>
                          <input
                            type="text"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                            placeholder="735210"
                            maxLength={6}
                            className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40"
                          />
                          {formErrors.pincode && (
                            <p className="text-[11px] text-red-500 mt-1">{formErrors.pincode}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Preferred Store Pickup Window
                          </label>
                          <div className="relative">
                            <Clock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <select
                              value={pickupTime}
                              onChange={(e) => setPickupTime(e.target.value)}
                              className="w-full pl-10 pr-3 py-2.5 text-base sm:text-xs rounded-xl bg-stone-50 border border-stone-200 appearance-none"
                            >
                              <option value="Today (10:00 AM – 9:00 PM)">
                                Today (10:00 AM – 9:00 PM)
                              </option>
                              <option value="Tomorrow Morning (10:30 AM – 1:30 PM)">
                                Tomorrow Morning (10:30 AM – 1:30 PM)
                              </option>
                              <option value="Tomorrow Evening (4:00 PM – 8:30 PM)">
                                Tomorrow Evening (4:00 PM – 8:30 PM)
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="p-3 bg-[#FAF4EA] rounded-2xl border border-[#C8942D]/30 flex items-start gap-2.5 text-xs text-stone-700">
                          <MapPin className="w-4 h-4 text-[#9E7018] flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Pickup Boutique:</strong> {STORE_INFO.fullAddress}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Custom Gift Wrap / Sizing Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Pack separately in velvet bridal gift box"
                        maxLength={140}
                        className="w-full px-3.5 py-2.5 text-base sm:text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40"
                      />
                    </div>
                  </div>

                  {/* 2. Bag Line Items */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm border border-[#C8942D]/30">
                    <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
                      <div>
                        <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2E0710]">
                          Selected Bangle Designs ({items.length})
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Verify wrist size (`2.2` – `2.8`) and quantity before payment
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-xs text-red-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Bag</span>
                      </button>
                    </div>

                    <div className="divide-y divide-stone-100">
                      {items.map(({ item, quantity, selectedSize }) => {
                        const livePrice = getLatestItemPriceSync(item.id, item.price);
                        return (
                          <div
                            key={`${item.id}_${selectedSize}`}
                            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 border border-[#C8942D]/30">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              </div>

                              <div>
                                <h3 className="text-xs sm:text-sm font-bold text-[#2E0710]">
                                  {item.name}
                                </h3>
                                <span className="text-[11px] text-stone-500 block mt-0.5">
                                  {item.packCount} • ₹{livePrice} each
                                </span>

                                <div className="mt-1.5 flex items-center gap-2">
                                  <span className="text-[11px] font-semibold text-stone-600">
                                    Size:
                                  </span>
                                  <select
                                    value={selectedSize}
                                    onChange={(e) =>
                                      updateItemSize(
                                        item.id,
                                        selectedSize,
                                        e.target.value as BangleSize
                                      )
                                    }
                                    className="px-2 py-0.5 rounded-lg border border-[#C8942D]/40 bg-[#FAF4EA] text-[11px] font-bold text-[#4A0E1B]"
                                  >
                                    {(item.sizes || BANGLE_SIZES.map((s) => s.size)).map((sz) => (
                                      <option key={sz} value={sz}>
                                        {sz}
                                      </option>
                                    ))}
                                  </select>
                                  <span className="text-xs font-bold text-[#2E0710]">
                                    Total: ₹{livePrice * quantity}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                              <div className="flex items-center gap-1.5 bg-stone-100 rounded-xl p-1 border border-stone-200">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1, selectedSize)}
                                  className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-[#2E0710]">
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 1, selectedSize)}
                                  className="w-7 h-7 rounded-lg bg-[#4A0E1B] text-[#F6D98B] hover:bg-[#2E0710] flex items-center justify-center cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id, selectedSize)}
                                className="p-1.5 text-stone-400 hover:text-red-500 cursor-pointer"
                                title="Remove design"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                      <Link
                        href="/menu"
                        className="text-xs font-bold text-[#4A0E1B] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add More Bangle Designs</span>
                      </Link>
                      <span className="text-xs text-stone-600">
                        Subtotal: <strong>₹{subtotal}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 3. Complementary Bangle Pairings */}
                  {recommendations.length > 0 && (
                    <div className="bg-gradient-to-br from-[#FAF4EA] via-white to-[#FAF4EA] rounded-3xl p-6 border border-[#C8942D]/35 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#4A0E1B]/10 rounded-xl text-[#4A0E1B]">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold text-[#2E0710]">
                              Complete Your Wrist Stack
                            </h3>
                            <p className="text-xs text-stone-500">
                              Recommended pairings matching your bag
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                        {recommendations.map(({ dish, reason }) => (
                          <div
                            key={dish.id}
                            className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm hover:border-[#C8942D] transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="relative h-28 w-full rounded-xl overflow-hidden bg-stone-100 mb-2.5">
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  fill
                                  sizes="200px"
                                  className="object-cover"
                                />
                                <span className="absolute bottom-2 right-2 bg-[#2E0710]/85 text-[#F6D98B] font-bold text-xs px-2 py-0.5 rounded-md">
                                  ₹{dish.price}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-[#2E0710] line-clamp-1">
                                {dish.name}
                              </h4>
                              <p className="text-[10px] text-[#4A0E1B] mt-1 line-clamp-2 leading-relaxed bg-[#FAF4EA] p-1.5 rounded-lg">
                                {reason}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => addToCart(dish, dish.sizes?.[0] || "2.4")}
                              className="mt-3 w-full py-1.5 px-2.5 rounded-xl bg-[#FAF4EA] hover:bg-[#4A0E1B] hover:text-[#F6D98B] text-[#2E0710] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#C8942D]/30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add (₹{dish.price})</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Payment Summary */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-md border border-[#C8942D]/40 space-y-5">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#9E7018] font-bold block mb-1">
                        Billing Summary
                      </span>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2E0710]">
                        Payment Breakdown
                      </h3>
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMode("upi_advance_cod");
                          setAdvancePaidTxn(null);
                        }}
                        className={`py-2 px-2.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          paymentMode === "upi_advance_cod"
                            ? "bg-white text-[#4A0E1B] shadow-xs"
                            : "text-stone-600"
                        }`}
                      >
                        20% UPI + Balance COD
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMode("upi_full");
                          setAdvancePaidTxn(null);
                        }}
                        className={`py-2 px-2.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          paymentMode === "upi_full"
                            ? "bg-white text-[#4A0E1B] shadow-xs"
                            : "text-stone-600"
                        }`}
                      >
                        100% Full UPI Payment
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Designs Subtotal ({items.length} sets)</span>
                        <span className="font-semibold text-[#2E0710]">₹{subtotal}</span>
                      </div>

                      <div className="flex justify-between text-stone-600">
                        <span>
                          {diningOption === "shipping"
                            ? `Courier & Velvet Box (Free ₹${FREE_SHIPPING_THRESHOLD}+)`
                            : "Store Pickup Packaging"}
                        </span>
                        <span
                          className={`font-semibold ${
                            shippingFee === 0 ? "text-emerald-700" : "text-[#2E0710]"
                          }`}
                        >
                          {shippingFee > 0 ? `₹${shippingFee}` : "FREE"}
                        </span>
                      </div>

                      <div className="flex justify-between text-[#2E0710] pt-2 border-t border-stone-100">
                        <span className="font-semibold">Grand Total</span>
                        <span className="text-base font-extrabold">₹{grandTotal}</span>
                      </div>

                      <div className="bg-[#FAF4EA] rounded-2xl p-4 border border-[#C8942D]/40 space-y-2">
                        <div className="flex justify-between items-center text-xs text-[#2E0710]">
                          <span className="font-bold flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-[#9E7018]" />
                            <span>
                              {paymentMode === "upi_full"
                                ? "Full UPI Payment:"
                                : "Min 20% UPI Advance:"}
                            </span>
                          </span>
                          <span className="text-base font-black text-[#4A0E1B]">
                            ₹{payableNow}
                          </span>
                        </div>

                        {remainingAmount > 0 && (
                          <div className="flex justify-between text-[11px] text-stone-600">
                            <span>
                              Balance on{" "}
                              {diningOption === "shipping" ? "Delivery (COD)" : "Store Pickup"}:
                            </span>
                            <span className="font-semibold">₹{remainingAmount}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#C8942D]/25 text-[11px] text-stone-600">
                          UPI Payee: <strong>{STORE_INFO.upiBeneficiary}</strong> (
                          <span className="font-mono">{STORE_INFO.upiId}</span>)
                        </div>
                      </div>
                    </div>

                    {advancePaidTxn ? (
                      <div className="p-4 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>UPI Payment Confirmed (₹{payableNow})</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-mono">
                          UPI Ref: {advancePaidTxn}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenUpiModal}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#9E7018] hover:brightness-105 text-[#2E0710] font-extrabold text-sm shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>
                          Pay ₹{payableNow} via UPI QR (
                          {paymentMode === "upi_full" ? "Full" : "20% Advance"})
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder}
                      className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                        advancePaidTxn
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                          : "bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] border border-[#C8942D]/40"
                      }`}
                    >
                      <Gem className="w-4 h-4" />
                      <span>
                        {isPlacingOrder
                          ? "Confirming Order..."
                          : advancePaidTxn
                            ? "Confirm & Place Bangle Order"
                            : "Place Order"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* UPI QR Modal */}
      <DemoUpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        advanceAmount={payableNow}
        totalAmount={grandTotal}
        paymentModeLabel={paymentMode === "upi_full" ? "Full UPI" : "20% Advance"}
        customerName={customerName}
        customerPhone={customerPhone}
        orderNumber={orderNumber}
        onPaymentSuccess={(txn) => {
          setAdvancePaidTxn(txn);
          setOrderNotice({
            type: "success",
            message: `UPI payment of ₹${payableNow} confirmed! Click "Confirm & Place Bangle Order" below.`,
          });
        }}
      />

      <TakeawayAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={`Sign In to ${STORE_INFO.brandName}`}
        subtitle="Sign in to autofill your saved name and mobile number."
      />

      {/* Payment Required Prompt Modal */}
      {showPaymentRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowPaymentRequiredModal(false)}
          />
          <div className="relative bg-[#FAF4EA] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#C8942D]/40 z-10 text-[#2E0710]">
            <button
              type="button"
              onClick={() => setShowPaymentRequiredModal(false)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-[#9E7018] flex items-center justify-center mx-auto mb-3 border border-[#C8942D]/40">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#2E0710]">
                Complete UPI Payment First
              </h3>
              <p className="text-stone-600 text-xs mt-1.5 leading-relaxed">
                Pay ₹{payableNow} via our store UPI QR to lock your selected bangle sizes and
                confirm dispatch or pickup.
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentRequiredModal(false);
                  handleOpenUpiModal();
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#9E7018] text-[#2E0710] text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Open Store UPI QR (₹{payableNow})</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentRequiredModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal (Fixed to read it.item.name / it.item.price & selectedSize) */}
      {isOrderSuccessOpen && placedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsOrderSuccessOpen(false)}
          />
          <div className="relative bg-[#FAF4EA] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#C8942D]/40 z-10 text-[#2E0710]">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Order Saved &amp; Sent to Boutique</span>
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E0710]">
                Order Confirmed!
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm mt-1">
                Thank you, <strong>{placedOrderDetails.customerName}</strong>!
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200 mb-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">
                    Order Token
                  </span>
                  <span className="text-lg font-mono font-extrabold text-[#4A0E1B]">
                    {placedOrderDetails.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">
                    Fulfillment
                  </span>
                  <span className="text-xs font-bold text-[#2E0710]">
                    {placedOrderDetails.deliveryMethod === "shipping"
                      ? `Courier (${placedOrderDetails.pincode})`
                      : "Gobindapally Store Pickup"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">Grand Total</span>
                  <span className="font-bold text-[#2E0710]">
                    ₹{placedOrderDetails.totalAmount}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="text-[10px] text-emerald-700 block">Paid via UPI</span>
                  <span className="font-extrabold">
                    ₹{placedOrderDetails.advancePaidAmount || 0}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                  <span className="text-[10px] text-amber-800 block">Balance</span>
                  <span className="font-extrabold">
                    ₹
                    {Math.max(
                      0,
                      placedOrderDetails.totalAmount - (placedOrderDetails.advancePaidAmount || 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <span className="text-[11px] font-bold text-stone-700 block mb-1">
                  Ordered Designs ({placedOrderDetails.items.length}):
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs text-stone-600">
                  {placedOrderDetails.items.map((ci, idx) => (
                    <div key={`${ci.item.id}_${ci.selectedSize}_${idx}`} className="flex justify-between py-0.5">
                      <span className="line-clamp-1">
                        {ci.quantity}x {ci.item?.name} (Size {ci.selectedSize})
                      </span>
                      <span className="font-semibold text-[#2E0710]">
                        ₹{(ci.item?.price || 0) * ci.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const waUrl = generateWhatsAppOrderUrl({
                    items: placedOrderDetails.items,
                    diningOption: placedOrderDetails.deliveryMethod,
                    customerName: placedOrderDetails.customerName,
                    customerPhone: placedOrderDetails.customerPhone,
                    addressOrTable:
                      placedOrderDetails.deliveryMethod === "shipping"
                        ? `${placedOrderDetails.shippingAddress}, PIN ${placedOrderDetails.pincode}`
                        : `Store Pickup (${placedOrderDetails.pickupTime})`,
                    notes: placedOrderDetails.notes,
                    advancePaidAmount: placedOrderDetails.advancePaidAmount,
                    advanceTxnId: placedOrderDetails.advanceTxnId,
                    orderRef: placedOrderDetails.id,
                  });
                  window.open(waUrl, "_blank", "noopener,noreferrer");
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Order Copy on WhatsApp</span>
              </button>

              <div className="flex gap-2">
                <Link
                  href="/menu"
                  onClick={() => setIsOrderSuccessOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold text-center"
                >
                  Continue Browsing
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOrderSuccessOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-xs font-semibold text-center cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LocationFooter />
    </main>
  );
}
