"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LocationFooter } from "@/components/LocationFooter";
import { useAuth } from "@/context/AuthContext";
import { STORE_INFO } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    const res = await signInWithEmail(cleanEmail, password);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        if (res.isAdmin || res.isWorker || res.isStaff) {
          router.push("/admin");
        } else {
          router.push("/order");
        }
      }, 500);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#2E0710] text-[#FAF4EA] flex flex-col font-sans selection:bg-[#C8942D]/30">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-24 pb-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#F6D98B] hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {STORE_INFO.brandName}</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8942D]/20 text-[#F6D98B] text-xs font-bold uppercase tracking-wider mb-2 border border-[#C8942D]/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Customer Sign In</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Sign In to Your Account
            </h1>

            <p className="text-stone-300 text-xs sm:text-sm mt-2 max-w-md mx-auto">
              Manage your bangle orders, shipping addresses &amp; bridal styling appointments at{" "}
              {STORE_INFO.brandName}.
            </p>
          </div>

          <div className="bg-[#FAF4EA] text-[#2E0710] rounded-2xl sm:rounded-3xl p-5 sm:p-9 shadow-2xl border border-[#C8942D]/40">
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-red-50 rounded-2xl border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed font-semibold">{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#4A0E1B] to-[#6E1629] hover:from-[#2E0710] hover:to-[#4A0E1B] text-[#F6D98B] text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Sign In with Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-stone-200/80 text-center">
              <p className="text-xs text-stone-600">
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/register"
                  className="text-[#4A0E1B] hover:underline font-bold inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register &amp; Verify Email</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <LocationFooter />
    </div>
  );
}
