"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Sparkles,
  CheckCircle2,
  Phone,
  User,
  Gem,
  MessageCircle,
  Check,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Navbar } from "@/components/Navbar";
import { LocationFooter } from "@/components/LocationFooter";
import { useAuth } from "@/context/AuthContext";
import { saveReservation, fetchReservations } from "@/lib/firebase";
import { AppointmentRecord, AppointmentServiceType } from "@/types";
import { STORE_INFO } from "@/lib/constants";
import { generateWhatsAppReservationUrl } from "@/lib/validation";

const CONSULTATION_TYPES: AppointmentServiceType[] = [
  "Bridal Chooda & Shakha Consultation",
  "Custom Size & Wrist Measurement",
  "Bulk Wedding & Trousseau Order",
  "Festival & Gifting Selection",
];

const COLLECTIONS = [
  "Bridal & Chooda Sets",
  "Shakha-Pola & Bengali Heritage",
  "Kundan, Polki & Meenakari",
  "Gold-Plated & Temple Kada",
  "Glass, Lac & Velvet Sets",
  "Mixed Trousseau Selection",
];

const TIME_SLOTS = [
  {
    period: "Morning Boutique Hours",
    times: ["10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"],
  },
  {
    period: "Afternoon Styling",
    times: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"],
  },
  {
    period: "Evening Appointments",
    times: ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"],
  },
];

export default function BookBridalStylingPage() {
  const { customer, setIsAuthModalOpen, setAuthModalMode } = useAuth();

  const todayStr = new Date().toISOString().split("T")[0];

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState("16:30");
  const [guests, setGuests] = useState(2);
  const [consultationType, setConsultationType] = useState<AppointmentServiceType>(
    "Bridal Chooda & Shakha Consultation"
  );
  const [preferredCollection, setPreferredCollection] = useState("Bridal & Chooda Sets");
  const [specialRequests, setSpecialRequests] = useState("");
  const [botHoneypot, setBotHoneypot] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<AppointmentRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [viewTab, setViewTab] = useState<"book" | "my_visits">("book");
  const [myVisits, setMyVisits] = useState<AppointmentRecord[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");

  useEffect(() => {
    if (!customer) return;
    const frame = requestAnimationFrame(() => {
      if (customer.name && !fullName) setFullName(customer.name);
      if (customer.phone && !phone) setPhone(customer.phone);
    });
    return () => cancelAnimationFrame(frame);
  }, [customer, fullName, phone]);

  const loadCustomerVisits = async (targetPhone?: string) => {
    setIsLoadingVisits(true);
    try {
      const all = await fetchReservations();
      const phoneToMatch = (targetPhone || phone || customer?.phone || lookupPhone || "").trim();
      const nameToMatch = (fullName || customer?.name || "").trim().toLowerCase();

      const matched = all.filter((r) => {
        if (phoneToMatch && r.phone && r.phone.includes(phoneToMatch.slice(-10))) return true;
        if (nameToMatch && r.fullName && r.fullName.toLowerCase() === nameToMatch) return true;
        return false;
      });
      setMyVisits(matched);
    } catch (e) {
      console.warn("Could not load appointments:", e);
    } finally {
      setIsLoadingVisits(false);
    }
  };

  const quickDates = [0, 1, 2, 3].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().split("T")[0];
    const label =
      offset === 0
        ? "Today"
        : offset === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
    return { dateStr, label };
  });

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (botHoneypot) return;

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\D/g, "");

    if (!cleanName) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!selectedDate) {
      setErrorMessage("Please select an appointment date.");
      return;
    }
    if (!selectedTime) {
      setErrorMessage("Please select a visit slot.");
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingId = `SB-APT-${Math.floor(100000 + Math.random() * 900000)}`;
      const record: AppointmentRecord = {
        id: bookingId,
        fullName: cleanName,
        phone: cleanPhone,
        date: selectedDate,
        time: selectedTime,
        guests: Number(guests) || 2,
        seatingPreference: consultationType,
        preferredCollection,
        specialRequests: specialRequests.trim(),
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };

      const res = await saveReservation(record);
      if (res.success) {
        setConfirmedAppointment(record);
        try {
          confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
        } catch {}
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cafeyugen_reservations_updated"));
        }
      } else {
        setErrorMessage("Could not save appointment. Please WhatsApp us directly.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForNewBooking = () => {
    setConfirmedAppointment(null);
    setSpecialRequests("");
    setSelectedDate(todayStr);
    setSelectedTime("16:30");
  };

  return (
    <div className="min-h-screen bg-[#2E0710] text-[#FAF4EA] flex flex-col font-sans selection:bg-[#C8942D]/30">
      <Navbar />

      <section className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 bg-gradient-to-b from-[#4A0E1B] via-[#2E0710] to-[#2E0710] border-b border-[#C8942D]/30 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C8942D]/20 border border-[#C8942D]/40 text-[#F6D98B] text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{STORE_INFO.brandName} • Bridal Styling &amp; Custom Orders</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-3 leading-tight">
            Book a <span className="text-[#F6D98B]">Bridal Bangle Styling</span> Visit
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-base text-stone-200 leading-relaxed">
            Visit our boutique at Gobindapally (Nearby Jalpaiguri Bus Stand) for personal wrist
            measurement (2.3 – 2.6), saree-matched Chooda &amp; Shakha-Pola sets, and bulk
            wedding gifting orders.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs text-stone-200">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Free Wrist Sizing &amp; Fitting</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15">
              <Clock className="w-3.5 h-3.5 text-[#F6D98B]" />
              <span>Open {STORE_INFO.hoursDisplay} Daily</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15">
              <MapPin className="w-3.5 h-3.5 text-rose-300" />
              <span>Gobindapally, Dhupguri 735210</span>
            </span>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex p-1 bg-black/30 rounded-2xl border border-[#C8942D]/30">
              <button
                type="button"
                onClick={() => setViewTab("book")}
                className={`py-2 px-5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
                  viewTab === "book"
                    ? "bg-[#D4AF37] text-[#2E0710] shadow-md"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Book New Visit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewTab("my_visits");
                  loadCustomerVisits();
                }}
                className={`py-2 px-5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
                  viewTab === "my_visits"
                    ? "bg-[#D4AF37] text-[#2E0710] shadow-md"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>My Appointments</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {confirmedAppointment ? (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#4A0E1B] border-2 border-emerald-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <span className="text-[11px] uppercase tracking-widest font-bold text-emerald-300 bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-500/30">
                Boutique Visit Confirmed
              </span>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-3">
                We Look Forward to Hosting You, {confirmedAppointment.fullName}!
              </h2>

              <p className="text-xs sm:text-sm text-stone-200 mt-2 max-w-md mx-auto">
                Your bridal styling table &amp; sample tray will be ready at {STORE_INFO.addressLine1}.
              </p>

              <div className="mt-6 bg-[#2E0710] border border-[#C8942D]/40 rounded-2xl p-5 text-left space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Appointment Token
                    </span>
                    <span className="font-mono text-lg font-extrabold text-[#F6D98B] tracking-wider">
                      {confirmedAppointment.id}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                    Confirmed
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Date</span>
                    <span className="font-bold text-white text-sm">{confirmedAppointment.date}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Time</span>
                    <span className="font-bold text-[#F6D98B] text-sm">
                      {confirmedAppointment.time}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">
                      Visitors
                    </span>
                    <span className="font-bold text-white text-sm">
                      {confirmedAppointment.guests} Guests
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">
                      Phone
                    </span>
                    <span className="font-bold text-stone-200 text-sm">
                      +91 {confirmedAppointment.phone}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 text-xs space-y-1">
                  <div>
                    <span className="text-stone-400">Consultation: </span>
                    <strong className="text-[#F6D98B]">
                      {confirmedAppointment.seatingPreference}
                    </strong>
                  </div>
                  {confirmedAppointment.preferredCollection && (
                    <div>
                      <span className="text-stone-400">Collection: </span>
                      <span className="text-white">{confirmedAppointment.preferredCollection}</span>
                    </div>
                  )}
                  {confirmedAppointment.specialRequests && (
                    <div>
                      <span className="text-stone-400">Custom Notes: </span>
                      <span className="text-stone-200">{confirmedAppointment.specialRequests}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={generateWhatsAppReservationUrl({
                    id: confirmedAppointment.id,
                    fullName: confirmedAppointment.fullName,
                    phone: confirmedAppointment.phone,
                    date: confirmedAppointment.date,
                    time: confirmedAppointment.time,
                    guests: confirmedAppointment.guests,
                    seatingPreference: confirmedAppointment.seatingPreference as AppointmentServiceType,
                    preferredCollection: confirmedAppointment.preferredCollection,
                    specialRequests: confirmedAppointment.specialRequests,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Visit Card on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={resetForNewBooking}
                  className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-[#2E0710] hover:bg-black/40 border border-[#C8942D]/40 text-stone-200 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  Book Another Visit
                </button>

                <Link
                  href="/menu"
                  className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-[#D4AF37] text-[#2E0710] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                >
                  <Gem className="w-4 h-4" />
                  <span>Browse Price Menu</span>
                </Link>
              </div>
            </div>
          </div>
        ) : viewTab === "book" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            <div className="lg:col-span-8 bg-[#4A0E1B] border border-[#C8942D]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <input
                  type="text"
                  name="bot_field"
                  value={botHoneypot}
                  onChange={(e) => setBotHoneypot(e.target.value)}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Step 1: Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#F6D98B] uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Step 1: Select Visit Date</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {quickDates.map((q) => (
                      <button
                        key={q.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(q.dateStr)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                          selectedDate === q.dateStr
                            ? "bg-[#C8942D]/25 border-[#D4AF37] text-[#F6D98B]"
                            : "bg-[#2E0710]/70 border-white/10 text-stone-300 hover:bg-[#2E0710]"
                        }`}
                      >
                        <div className="font-bold">{q.label}</div>
                        <div className="text-[10px] text-stone-400 mt-0.5">{q.dateStr}</div>
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    min={todayStr}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2E0710] border border-white/15 text-base sm:text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                {/* Step 2: Time */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#F6D98B] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Step 2: Select Time Slot</span>
                    </label>
                    <span className="text-[11px] text-[#F6D98B] font-medium">
                      Selected: {selectedTime}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {TIME_SLOTS.map((group) => (
                      <div key={group.period} className="space-y-1.5">
                        <span className="text-[11px] text-stone-300 font-semibold block">
                          {group.period}
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                          {group.times.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
                                selectedTime === slot
                                  ? "bg-[#D4AF37] text-[#2E0710] font-extrabold shadow-md"
                                  : "bg-[#2E0710] text-stone-200 hover:bg-black/40 border border-white/10"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Consultation Type & Collection */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="text-xs font-bold text-[#F6D98B] uppercase tracking-wider flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5" />
                    <span>Step 3: Consultation Focus &amp; Collection</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CONSULTATION_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setConsultationType(type)}
                        className={`p-3 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
                          consultationType === type
                            ? "bg-[#C8942D]/25 border-[#D4AF37] text-[#F6D98B]"
                            : "bg-[#2E0710]/70 border-white/10 text-stone-300 hover:bg-[#2E0710]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] text-stone-300 block mb-1">
                        Preferred Collection
                      </span>
                      <select
                        value={preferredCollection}
                        onChange={(e) => setPreferredCollection(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#2E0710] border border-white/15 text-xs text-white"
                      >
                        {COLLECTIONS.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-stone-300 block mb-1">
                        Bride &amp; Family Visitors
                      </span>
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#2E0710] border border-white/15 text-xs">
                        <span>{guests} {guests === 1 ? "Visitor" : "Visitors"}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setGuests((g) => Math.max(1, g - 1))}
                            className="w-7 h-7 rounded-lg bg-[#4A0E1B] text-white font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuests((g) => Math.min(15, g + 1))}
                            className="w-7 h-7 rounded-lg bg-[#4A0E1B] text-white font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Matching Banarasi maroon saree, size 2.4, wedding date Dec 12..."
                    maxLength={200}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2E0710] border border-white/15 text-base sm:text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>

                {/* Step 4: Customer Details */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#F6D98B] uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Step 4: Contact Details</span>
                    </label>
                    {!customer?.isVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode("signin");
                          setIsAuthModalOpen(true);
                        }}
                        className="text-[11px] text-[#F6D98B] hover:underline cursor-pointer font-medium"
                      >
                        Sign In to Autofill
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-stone-300 block mb-1">Full Name *</span>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Riya Chakraborty"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#2E0710] border border-white/15 text-base sm:text-xs text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-300 block mb-1">
                        10-Digit Mobile / WhatsApp *
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#2E0710] border border-white/15 text-base sm:text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#9E7018] hover:brightness-110 text-[#2E0710] text-sm font-extrabold shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  <span>
                    {isSubmitting
                      ? "Scheduling Appointment..."
                      : "Confirm Bridal Styling Appointment (Free)"}
                  </span>
                </button>
              </form>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[#4A0E1B] border border-[#C8942D]/40 rounded-3xl p-5 shadow-lg space-y-4">
                <span className="text-[10px] font-bold text-[#F6D98B] uppercase tracking-widest block">
                  Appointment Summary
                </span>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-white/10">
                    <span className="text-stone-300">Date</span>
                    <strong className="text-white">{selectedDate}</strong>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/10">
                    <span className="text-stone-300">Time</span>
                    <strong className="text-[#F6D98B]">{selectedTime}</strong>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/10">
                    <span className="text-stone-300">Focus</span>
                    <strong className="text-white text-right max-w-[170px]">
                      {consultationType}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-300">Consultation Fee</span>
                    <strong className="text-emerald-300">₹0 (Complimentary)</strong>
                  </div>
                </div>
              </div>

              <div className="bg-[#4A0E1B] border border-white/10 rounded-3xl p-5 space-y-3 text-xs">
                <h4 className="font-serif text-sm font-bold text-white">Boutique Location</h4>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  {STORE_INFO.fullAddress}
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-stone-300">Direct Phone:</span>
                  <a
                    href={STORE_INFO.phoneHref}
                    className="text-[#F6D98B] font-bold hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{STORE_INFO.phoneDisplay}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#4A0E1B] p-5 rounded-2xl border border-[#C8942D]/35 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="Enter 10-digit phone number to look up appointments..."
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-[#2E0710] text-white border border-white/15"
                />
              </div>
              <button
                type="button"
                onClick={() => loadCustomerVisits(lookupPhone)}
                disabled={isLoadingVisits}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#D4AF37] text-[#2E0710] font-bold text-xs cursor-pointer"
              >
                {isLoadingVisits ? "Searching..." : "Search Visits"}
              </button>
            </div>

            {myVisits.length === 0 ? (
              <div className="text-center py-16 bg-[#4A0E1B] rounded-3xl border border-white/10 p-8 space-y-3">
                <CalendarIcon className="w-12 h-12 text-stone-400 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-white">No appointments found</h3>
                <button
                  type="button"
                  onClick={() => setViewTab("book")}
                  className="py-2 px-4 rounded-xl bg-[#D4AF37] text-[#2E0710] text-xs font-bold cursor-pointer"
                >
                  Schedule a Store Visit
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myVisits.map((res) => (
                  <div
                    key={res.id}
                    className="p-5 bg-[#4A0E1B] rounded-2xl border border-[#C8942D]/30 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-mono text-sm font-extrabold text-[#F6D98B]">
                        {res.id}
                      </span>
                      <span className="text-xs text-stone-300">
                        {res.date} • {res.time}
                      </span>
                    </div>
                    <p className="text-xs text-white font-semibold">{res.seatingPreference}</p>
                    <p className="text-xs text-stone-300">
                      {res.fullName} (+91 {res.phone}) • {res.guests} Visitors
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <LocationFooter />
    </div>
  );
}
