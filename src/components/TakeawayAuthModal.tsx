"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogIn,
  UserPlus,
  LogOut,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { STORE_INFO } from "@/lib/constants";

interface TakeawayAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  title?: string;
  subtitle?: string;
}

export function TakeawayAuthModal({
  isOpen,
  onClose,
  initialMode,
  title,
  subtitle,
}: TakeawayAuthModalProps) {
  const router = useRouter();
  const {
    customer,
    authModalMode,
    signInWithEmail,
    registerUserWithEmailVerification,
    checkEmailVerificationStatus,
    resendEmailVerification,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "verify-email">(
    initialMode || authModalMode || "signin"
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      const targetMode = initialMode || authModalMode;
      if (customer && !customer.isVerified && customer.email) {
        setRegisteredEmail(customer.email);
        setMode("verify-email");
      } else if (targetMode) {
        setMode(targetMode);
      }
      setErrorMsg("");
      setSuccessMsg("");
      setPassword("");
      if (customer) {
        setName(customer.name || "");
        setPhone(customer.phone || "");
        setEmail(customer.email || "");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [initialMode, authModalMode, isOpen, customer]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    if (mode === "signup") {
      const cleanName = name.trim();
      const cleanPhone = phone.replace(/\D/g, "");

      if (!cleanName) {
        setErrorMsg("Please enter your full name.");
        setIsSubmitting(false);
        return;
      }

      if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        setErrorMsg("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
        setIsSubmitting(false);
        return;
      }

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
        setMode("verify-email");
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = await signInWithEmail(cleanEmail, password);
      setIsSubmitting(false);

      if (res.success) {
        if (res.needsVerification) {
          setRegisteredEmail(cleanEmail);
          setSuccessMsg(res.message);
          setResendCooldown(60);
          setMode("verify-email");
        } else {
          setSuccessMsg(res.message);
          setTimeout(() => {
            onClose();
            if (res.isAdmin || res.isWorker || res.isStaff) {
              router.push("/admin");
            }
          }, 500);
        }
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const handleCheckVerification = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsCheckingStatus(true);
    const res = await checkEmailVerificationStatus();
    setIsCheckingStatus(false);

    if (res.isVerified) {
      setSuccessMsg(res.message || `Email verified! Welcome to ${STORE_INFO.brandName}.`);
      setTimeout(() => onClose(), 1000);
    } else {
      setErrorMsg(res.message || "Email not verified yet. Please check your inbox.");
    }
  };

  const handleResendVerification = async () => {
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

  const handleSignOutFromModal = async () => {
    await logout();
    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setRegisteredEmail("");
    setMode("signin");
  };

  const displayTitle =
    mode === "verify-email"
      ? "Verify Your Email"
      : title ||
        (customer?.isVerified
          ? "My Boutique Account"
          : mode === "signin"
            ? `Sign In to ${STORE_INFO.brandName}`
            : "Create Customer Account");

  const displaySubtitle =
    mode === "verify-email"
      ? `Click the verification link sent to ${registeredEmail || email || "your inbox"} to activate your account.`
      : subtitle ||
        (customer?.isVerified
          ? "Manage your verified profile, delivery address & store pickup details."
          : mode === "signin"
            ? "Sign in with your email and password to manage orders & bridal visits."
            : "Register your name, mobile number & email for fast bangle checkout.");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-[#FAF4EA] rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-[#C8942D]/40 z-10 text-[#2E0710] my-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition-colors cursor-pointer"
          aria-label="Close Authentication Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A0E1B]/10 text-[#4A0E1B] text-xs font-bold uppercase tracking-wider mb-2 border border-[#C8942D]/40">
            <ShieldCheck className="w-3.5 h-3.5 text-[#9E7018]" />
            <span>{STORE_INFO.brandName} Customer Portal</span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2E0710]">
            {displayTitle}
          </h3>

          <p className="text-stone-600 text-xs sm:text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
            {displaySubtitle}
          </p>
        </div>

        {customer?.isVerified ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/90 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold text-base flex items-center justify-center uppercase shadow-sm">
                {customer.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={customer.avatar}
                    alt={customer.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  customer.name?.charAt(0) || "U"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-emerald-950 truncate">{customer.name}</h4>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold uppercase">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-emerald-800/90 mt-0.5 truncate">
                  {customer.email
                    ? customer.email
                    : customer.phone
                      ? `+91 ${customer.phone}`
                      : "Verified Account"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer text-center"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={handleSignOutFromModal}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white hover:bg-red-50 border border-stone-300 hover:border-red-300 text-red-600 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : mode === "verify-email" ? (
          <div className="space-y-4">
            <div className="relative w-16 h-16 mx-auto my-2 flex items-center justify-center">
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#4A0E1B] to-[#6E1629] text-[#F6D98B] flex items-center justify-center shadow-md">
                <Mail className="w-7 h-7" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-stone-600">Verification link sent to:</p>
              <p className="text-sm font-bold text-[#2E0710] mt-0.5 break-all">
                {registeredEmail || email}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold">{successMsg}</p>
              </div>
            )}

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

            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0}
                className="text-stone-600 hover:text-stone-900 font-semibold disabled:text-stone-400 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3 h-3 text-[#9E7018]" />
                <span>
                  {resendCooldown > 0
                    ? `Resend Link in ${resendCooldown}s`
                    : "Resend Verification Link"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                }}
                className="text-xs text-[#4A0E1B] hover:underline font-bold cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex p-1 bg-stone-200/70 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-white text-[#4A0E1B] shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-[#4A0E1B] shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold">{successMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <>
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
                        placeholder="e.g. Poulomi Roy"
                        required
                        maxLength={50}
                        className="w-full pl-10 pr-3.5 py-2.5 text-base sm:text-sm rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      10-Digit Mobile Number *
                    </label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-300 bg-stone-100 text-stone-600 text-xs sm:text-sm font-semibold">
                        +91
                      </span>
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="9876543210"
                          required
                          maxLength={10}
                          className="w-full pl-9 pr-3.5 py-2.5 text-base sm:text-sm rounded-r-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

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
                    className="w-full pl-10 pr-3.5 py-2.5 text-base sm:text-sm rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">Password *</label>
                  <span className="text-[10px] text-stone-500">Min 6 characters</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 text-base sm:text-sm rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#4A0E1B] to-[#6E1629] hover:from-[#2E0710] hover:to-[#4A0E1B] text-[#F6D98B] text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{mode === "signin" ? "Signing In..." : "Creating Account..."}</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>
                      {mode === "signin" ? "Sign In with Email" : "Create Account & Verify"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-3">
              {mode === "signin" ? (
                <p className="text-xs text-stone-500">
                  New to {STORE_INFO.brandName}?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setErrorMsg("");
                    }}
                    className="text-[#4A0E1B] hover:underline font-bold cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p className="text-xs text-stone-500">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setErrorMsg("");
                    }}
                    className="text-[#4A0E1B] hover:underline font-bold cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </>
        )}

        <div className="mt-5 pt-3 border-t border-stone-200/80 text-[10px] text-center text-stone-500">
          Your credentials are saved securely for fast bangle checkout &amp; store pickup.
        </div>
      </div>
    </div>
  );
}
