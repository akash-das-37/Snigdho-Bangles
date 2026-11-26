"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  User,
  Phone,
  Truck,
  Store,
  Clock,
  MapPin,
  AlertCircle,
  CreditCard,
  Trash2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useCart } from "@/context/CartContext";
import { generateWhatsAppOrderUrl } from "@/lib/validation";
import {
  ADVANCE_PAYMENT_NOTE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  STORE_INFO,
} from "@/lib/constants";

export function OrderTrayDrawer() {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    diningOption,
    setDiningOption,
    subtotal,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("Today (10:00 AM - 9:00 PM)");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});

  if (!isCartOpen) return null;

  const shippingFee =
    diningOption === "shipping" && items.length > 0 && subtotal < FREE_SHIPPING_THRESHOLD
      ? STANDARD_SHIPPING_FEE
      : 0;
  const grandTotal = subtotal + shippingFee;
  const advanceAmount = Math.ceil(grandTotal * 0.2);
  const remainingAmount = grandTotal - advanceAmount;

  const handleSendWhatsAppOrder = () => {
    const errors: { name?: string; phone?: string; address?: string } = {};

    if (!customerName.trim()) {
      errors.name = "Please provide your name";
    }
    if (!customerPhone.trim() || !/^[6-9]\d{9}$/.test(customerPhone.trim())) {
      errors.phone = "Enter a valid 10-digit mobile number";
    }
    if (diningOption === "shipping" && !shippingAddress.trim()) {
      errors.address = "Enter delivery address and pincode";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}

    const waUrl = generateWhatsAppOrderUrl({
      items,
      diningOption,
      customerName,
      customerPhone,
      addressOrTable:
        diningOption === "shipping" ? shippingAddress : `Store Pickup (${pickupTime})`,
      notes,
    });

    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF4EA] shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#2E0710] text-white flex items-center justify-between border-b border-[#C8942D]/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#9E7018] rounded-xl text-[#2E0710]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold">Your Bangle Bag</h3>
                <p className="text-xs text-stone-300">
                  {diningOption === "shipping"
                    ? `Home Shipping • ${items.length} ${items.length === 1 ? "design" : "designs"}`
                    : `Store Pickup • ${items.length} ${items.length === 1 ? "design" : "designs"}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Close Bangle Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Method Switcher */}
          <div className="p-4 bg-white border-b border-stone-200">
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setDiningOption("shipping")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  diningOption === "shipping"
                    ? "bg-[#4A0E1B] text-[#F6D98B] shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Home Shipping</span>
              </button>

              <button
                type="button"
                onClick={() => setDiningOption("pickup")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  diningOption === "pickup"
                    ? "bg-[#4A0E1B] text-[#F6D98B] shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Store Pickup</span>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-[#9E7018] mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-xl font-bold text-[#2E0710]">
                  Your Bangle Bag is Empty
                </h4>
                <p className="text-xs text-stone-500 mt-2 max-w-xs leading-relaxed">
                  Browse our menu-card bangle catalog and pick your size (`2.2` – `2.8`) to place an
                  order.
                </p>
                <Link
                  href="/menu"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-6 py-2.5 rounded-full bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-xs font-bold transition-all shadow-md"
                >
                  Browse Bangle Menu
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Selected Designs ({items.length})
                    </span>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="divide-y divide-stone-200/60 bg-white rounded-2xl border border-stone-200 p-2 shadow-sm">
                    {items.map(({ item, quantity, selectedSize }) => (
                      <div
                        key={`${item.id}_${selectedSize}`}
                        className="py-3 px-2 flex items-center justify-between gap-3"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs sm:text-sm font-semibold text-[#2E0710] truncate">
                            {item.name}
                          </h5>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Size <strong>{selectedSize}</strong> • ₹{item.price} each •{" "}
                            <strong className="text-[#2E0710]">₹{item.price * quantity}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1, selectedSize)}
                              className="w-6 h-6 rounded bg-white text-stone-600 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-[#2E0710]">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1, selectedSize)}
                              className="w-6 h-6 rounded bg-white text-stone-600 hover:bg-stone-200 flex items-center justify-center cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id, selectedSize)}
                            className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                    {diningOption === "shipping" ? "Shipping Details" : "Pickup Details"}
                  </span>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Poulomi Roy"
                        maxLength={50}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40"
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
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 9876543210"
                        maxLength={10}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40"
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[11px] text-red-500 mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  {diningOption === "shipping" ? (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Full Shipping Address &amp; Pincode *
                      </label>
                      <textarea
                        rows={2}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="House/Street, Landmark, City, PIN 735210"
                        maxLength={180}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40"
                      />
                      {formErrors.address && (
                        <p className="text-[11px] text-red-500 mt-1">{formErrors.address}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Preferred Store Pickup Time
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200"
                        >
                          <option value="Today (10:00 AM - 9:00 PM)">
                            Today (10:00 AM – 9:00 PM)
                          </option>
                          <option value="Tomorrow Morning (10:30 AM - 1:30 PM)">
                            Tomorrow Morning (10:30 AM – 1:30 PM)
                          </option>
                          <option value="Tomorrow Evening (4:00 PM - 8:30 PM)">
                            Tomorrow Evening (4:00 PM – 8:30 PM)
                          </option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Sizing / Gift Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Bridal gift packing"
                      maxLength={120}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200"
                    />
                  </div>
                </div>

                <div className="bg-stone-100 rounded-xl p-3 text-[11px] text-stone-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#9E7018] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Store Counter:</strong> {STORE_INFO.fullAddress}
                  </span>
                </div>
              </>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-4 sm:p-6 bg-white border-t border-stone-200 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Designs Subtotal</span>
                  <span className="font-semibold text-[#2E0710]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Shipping / Velvet Box</span>
                  <span className="text-emerald-700 font-semibold">
                    {shippingFee > 0 ? `₹${shippingFee}` : "FREE"}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#4A0E1B] font-medium pt-1 border-t border-dashed border-stone-200">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#9E7018]" />
                    <span>Min 20% UPI Advance</span>
                  </span>
                  <span className="font-bold">₹{advanceAmount}</span>
                </div>
                <div className="flex justify-between text-[11px] text-stone-500">
                  <span>Balance on Delivery / Pickup</span>
                  <span>₹{remainingAmount}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#2E0710] pt-1.5 border-t border-stone-200">
                  <span>Grand Total</span>
                  <span className="text-base">₹{grandTotal}</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{ADVANCE_PAYMENT_NOTE}</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Link
                  href="/order"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 px-4 rounded-xl bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-center font-bold text-xs shadow-md transition-all"
                >
                  Open Full UPI Checkout Page
                </Link>
                <button
                  type="button"
                  onClick={handleSendWhatsAppOrder}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Quick Order via WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
