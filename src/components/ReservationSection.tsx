"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Users,
  CheckCircle2,
  Phone,
  User,
  Gem,
  Send,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  appointmentSchema,
  generateWhatsAppReservationUrl,
} from "@/lib/validation";
import { AppointmentFormData, AppointmentServiceType } from "@/types";
import { saveReservation } from "@/lib/firebase";
import { STORE_INFO } from "@/lib/constants";

export function ReservationSection() {
  const [formData, setFormData] = useState<{
    fullName: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    seatingPreference: AppointmentServiceType;
    specialRequests: string;
    botHoneypot: string;
  }>({
    fullName: "",
    phone: "",
    date: "",
    time: "16:30",
    guests: 2,
    seatingPreference: "Bridal Chooda & Shakha Consultation",
    specialRequests: "",
    botHoneypot: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [confirmedData, setConfirmedData] = useState<AppointmentFormData | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const timeSlots = [
    "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "14:00",
    "15:00", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
    "19:00", "19:30", "20:00",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (formData.botHoneypot) return;

    const result = appointmentSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (path) fieldErrors[path.toString()] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const ref = `SB-APT-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRef(ref);
    const validData = result.data as AppointmentFormData;
    setConfirmedData(validData);
    setIsSubmitted(true);

    saveReservation({
      id: ref,
      fullName: validData.fullName,
      phone: validData.phone,
      date: validData.date,
      time: validData.time,
      guests: validData.guests,
      seatingPreference: validData.seatingPreference,
      specialRequests: validData.specialRequests,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    }).then(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cafeyugen_reservations_updated"));
      }
    });

    try {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setConfirmedData(null);
    setFormData({
      fullName: "",
      phone: "",
      date: "",
      time: "16:30",
      guests: 2,
      seatingPreference: "Bridal Chooda & Shakha Consultation",
      specialRequests: "",
      botHoneypot: "",
    });
  };

  return (
    <section id="reservation" className="py-20 bg-[#FAF4EA] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-[#C8942D]/35 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5">
            <div className="md:col-span-2 bg-[#2E0710] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-[#C8942D]/20 text-[#F6D98B] text-xs font-bold uppercase tracking-wider mb-4 border border-[#C8942D]/40">
                  Boutique Styling Visit
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                  Book Bridal Bangle Styling
                </h3>
                <p className="mt-3 text-stone-300 text-xs sm:text-sm leading-relaxed">
                  Visit our Gobindapally boutique for private wrist measurement, bridal saree
                  matching, and custom Shakha-Pola selection.
                </p>

                <div className="mt-8 space-y-4 text-xs sm:text-sm text-stone-300">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#E5C158] flex-shrink-0" />
                    <span>Store Hours: {STORE_INFO.hoursDisplay}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-[#E5C158] flex-shrink-0" />
                    <span>Bride + Family Groups (1–15)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gem className="w-4 h-4 text-[#E5C158] flex-shrink-0" />
                    <span>Custom Chooda &amp; Trousseau Mixing</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link
                    href="/book-table"
                    className="inline-flex items-center gap-1.5 text-xs text-[#F6D98B] font-bold hover:underline"
                  >
                    <span>Open Full Bridal Styling Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 relative z-10 text-xs text-stone-400">
                <p>Questions? WhatsApp our store directly:</p>
                <a
                  href={STORE_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 font-bold text-[#F6D98B] flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {STORE_INFO.phoneDisplay}
                </a>
              </div>
            </div>

            <div className="md:col-span-3 p-8 sm:p-10">
              {isSubmitted && confirmedData ? (
                <div className="text-center py-6 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="font-serif text-2xl font-bold text-[#2E0710]">
                    Visit Scheduled, {confirmedData.fullName}!
                  </h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Booking Token: <strong>{bookingRef}</strong>
                  </p>
                  <div className="w-full mt-6 space-y-3">
                    <a
                      href={generateWhatsAppReservationUrl({ ...confirmedData, id: bookingRef })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Share Visit Details on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Book Another Visit</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      value={formData.botHoneypot}
                      onChange={(e) => setFormData({ ...formData, botHoneypot: e.target.value })}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        maxLength={60}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      10-Digit Mobile Phone *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Date *</label>
                      <input
                        type="date"
                        min={todayStr}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Time *</label>
                      <select
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm bg-white"
                      >
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot} hrs
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#4A0E1B] to-[#6E1629] text-[#F6D98B] font-semibold text-sm shadow-lg cursor-pointer"
                  >
                    Book Styling Appointment
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
