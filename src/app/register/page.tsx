"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Send,
  ArrowLeft,
  Gem,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LocationFooter } from "@/components/LocationFooter";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { STORE_INFO } from "@/lib/constants";

export default function RegisterPage() {
  const { totalCount } = useCart();
  const {
    customer,
    registerUserWithEmailVerification,
    checkEmailVerificationStatus,
    resendEmailVerification,
    setIsAuthModalOpen,
    setAuthModalMode,
  } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step, setStep] = useState<"form" | "verify-email" | "success">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const effectiveStep = customer?.isVerified && step === "verify-email" ? "success" : step;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    const res = await registerUserWithEmailVerification({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      password,
    });
    setIsSubmitting(false);

    if (res.success) {
      setRegisteredEmail(cleanEmail);
      setSuccessMsg(res.message);
      setResendCooldown(60);
      setStep("verify-email");
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCheckVerification = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsCheckingStatus(true);
    const res = await checkEmailVerificationStatus();
    setIsCheckingStatus(false);

    if (res.isVerified) {
      setSuccessMsg(res.message);
      setStep("success");
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg("");
    setSuccessMsg("");

    const res = await resendEmailVerification();
    if (res.success) {
      setSuccessMsg(res.message);
      setResendCooldown(60);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#2E0710] text-[#FAF4EA] flex flex-col font-sans selection:bg-[#C8942D]/30">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-24 pb-16">
        <div className="w-full max-w-xl">
          <div className="text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#F6D98B] hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {STORE_INFO.brandName} Home</span>
            </Link>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {effectiveStep === "form" && "Create Customer Account"}
              {effectiveStep === "verify-email" && "Verify Your Email"}
              {effectiveStep === "success" && "Account Activated!"}
            </h1>

            <p className="text-stone-300 text-xs sm:text-sm mt-2 max-w-md mx-auto">
              {effectiveStep === "form" &&
                "Register with your name, mobile number, and email for seamless bangle orders & store pickups."}
              {effectiveStep === "verify-email" &&
                "Check your inbox to confirm your email address and activate your customer profile."}
              {effectiveStep === "success" &&
                `Your email is verified. Welcome to ${STORE_INFO.brandName}!`}
            </p>
          </div>

          <div className="bg-[#FAF4EA] text-[#2E0710] rounded-2xl sm:rounded-3xl p-5 sm:p-9 shadow-2xl border border-[#C8942D]/40 relative">
            {effectiveStep === "form" && (
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-200/80 mb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A0E1B]/10 text-[#4A0E1B] text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#9E7018]" />
                    <span>Customer Registration</span>
                  </div>
                  <span className="text-xs text-stone-500 font-medium">Step 1 of 2</span>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3.5 bg-red-50 rounded-2xl border border-red-200 text-red-800 text-xs flex flex-col gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMsg}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Poulomi Chatterjee"
                        required
                        maxLength={60}
                        className="w-full pl-10 pr-3.5 py-3 text-base sm:text-sm rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      10-Digit Mobile Number *
                    </label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-stone-300 bg-stone-100 text-stone-700 text-xs sm:text-sm font-bold">
                        +91
                      </span>
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="9876543210"
                          required
                          maxLength={10}
                          className="w-full pl-10 pr-3.5 py-3 text-base sm:text-sm rounded-r-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-10 pr-3.5 py-3 text-base sm:text-sm rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pl-10 pr-10 py-3 text-base sm:text-sm rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="w-full pl-10 pr-10 py-3 text-base sm:text-sm rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-4 px-5 rounded-2xl bg-gradient-to-r from-[#4A0E1B] to-[#6E1629] hover:from-[#2E0710] hover:to-[#4A0E1B] text-[#F6D98B] text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Registering &amp; Sending Verification...</span>
                      </>
                    ) : (
                      <>
                        <span>Register &amp; Verify Email</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 pt-4 border-t border-stone-200/80 text-center">
                  <p className="text-xs text-stone-600">
                    Already registered at {STORE_INFO.brandName}?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode("signin");
                        setIsAuthModalOpen(true);
                      }}
                      className="text-[#4A0E1B] hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Sign In Here</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </p>
                </div>
              </div>
            )}

            {effectiveStep === "verify-email" && (
              <div className="text-center py-2">
                <div className="relative w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-tr from-[#4A0E1B] to-[#6E1629] text-[#F6D98B] flex items-center justify-center shadow-lg">
                  <Mail className="w-8 h-8" />
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#2E0710]">Check Your Inbox</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-sm mx-auto">
                  We have sent a verification link to{" "}
                  <strong className="text-[#2E0710] break-all">{registeredEmail}</strong>.
                </p>

                {errorMsg && (
                  <div className="mt-4 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs flex items-start gap-2 text-left">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mt-4 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={isCheckingStatus}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isCheckingStatus ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Checking Verification Status...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>I Have Verified My Email</span>
                      </>
                    )}
                  </button>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="text-xs text-stone-600 hover:text-stone-900 font-semibold cursor-pointer disabled:text-stone-400 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {resendCooldown > 0
                          ? `Resend link in ${resendCooldown}s`
                          : "Resend Verification Email"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep("form")}
                      className="text-xs text-stone-500 hover:underline cursor-pointer"
                    >
                      Change Email Address
                    </button>
                  </div>
                </div>
              </div>
            )}

            {effectiveStep === "success" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4 shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E0710]">
                  Welcome to {STORE_INFO.brandName}!
                </h3>

                <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-sm mx-auto">
                  Your customer profile is saved and verified.
                </p>

                <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-left text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                    <span className="text-stone-500 font-medium">Customer Name:</span>
                    <strong className="text-[#2E0710] font-bold">{customer?.name || name}</strong>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                    <span className="text-stone-500 font-medium">Phone Number:</span>
                    <strong className="text-[#2E0710] font-bold">
                      +91 {customer?.phone || phone}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 font-medium">Verified Email:</span>
                    <strong className="text-emerald-800 font-bold flex items-center gap-1">
                      <span>{customer?.email || registeredEmail || email}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </strong>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/order"
                    className="py-3.5 px-4 rounded-2xl bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Bangle Bag {totalCount > 0 ? `(${totalCount})` : ""}</span>
                  </Link>

                  <Link
                    href="/menu"
                    className="py-3.5 px-4 rounded-2xl bg-white hover:bg-stone-50 border border-stone-300 text-[#2E0710] text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Gem className="w-4 h-4 text-[#9E7018]" />
                    <span>Browse Bangle Menu</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <LocationFooter />
    </div>
  );
}
