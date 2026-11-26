"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  X,
  CheckCircle2,
  QrCode,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { STORE_INFO } from "@/lib/constants";

interface DemoUpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  advanceAmount: number;
  totalAmount: number;
  paymentModeLabel?: string;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  onPaymentSuccess: (txnId: string) => void;
}

export function DemoUpiPaymentModal({
  isOpen,
  onClose,
  advanceAmount,
  totalAmount,
  paymentModeLabel = "20% Advance",
  customerName,
  customerPhone,
  orderNumber,
  onPaymentSuccess,
}: DemoUpiPaymentModalProps) {
  const [paymentState, setPaymentState] = useState<"choose" | "processing" | "success">("choose");
  const [selectedTab, setSelectedTab] = useState<"qr" | "apps">("qr");
  const [upiRefInput, setUpiRefInput] = useState("");
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [txnId, setTxnId] = useState("");

  if (!isOpen) return null;

  const vpaAddress = STORE_INFO.upiId;
  const remainingAmount = Math.max(0, totalAmount - advanceAmount);

  const handleClose = () => {
    if (paymentState === "processing") return;
    setPaymentState("choose");
    onClose();
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(vpaAddress);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleConfirmPayment = () => {
    setPaymentState("processing");
    const enteredRef = upiRefInput.trim();

    setTimeout(() => {
      const generatedTxn =
        enteredRef.length >= 6
          ? enteredRef.toUpperCase()
          : `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      setTxnId(generatedTxn);
      setPaymentState("success");

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      onPaymentSuccess(generatedTxn);
    }, 1200);
  };

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(vpaAddress)}&pn=${encodeURIComponent(
    STORE_INFO.upiBeneficiary
  )}&am=${advanceAmount}&tn=${encodeURIComponent(
    `Snigdho Bangles Order ${orderNumber}`
  )}&cu=INR`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border border-[#C8942D]/40 z-10 text-[#2E0710] my-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {paymentState !== "processing" && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close Payment Modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {paymentState === "processing" ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF4EA] border-2 border-[#C8942D]/40 flex items-center justify-center text-[#9E7018] mb-5 animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#2E0710]">
              Verifying {paymentModeLabel}
            </h3>
            <p className="text-xs text-stone-500 mt-2 max-w-xs">
              Recording UPI payment of <strong>₹{advanceAmount}</strong> to{" "}
              <strong>{STORE_INFO.upiBeneficiary}</strong>...
            </p>
            <div className="mt-6 flex items-center gap-2 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{vpaAddress}</span>
            </div>
          </div>
        ) : paymentState === "success" ? (
          <div className="py-4 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              UPI Payment Recorded
            </span>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E0710]">
              ₹{advanceAmount} Received!
            </h3>

            <p className="text-xs text-stone-600 mt-1 max-w-sm">
              Thank you! Click below to finalize and submit order{" "}
              <strong>{orderNumber}</strong> to {STORE_INFO.brandName}.
            </p>

            <div className="mt-5 w-full bg-[#FAF4EA] rounded-2xl p-4 border border-[#C8942D]/35 text-left text-xs space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Order Token:</span>
                <span className="font-bold text-[#2E0710]">{orderNumber}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>UPI Ref / UTR:</span>
                <span className="font-mono font-semibold text-[#2E0710] text-[11px]">
                  {txnId}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Paid To:</span>
                <span className="font-semibold text-[#2E0710]">{STORE_INFO.upiBeneficiary}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Customer:</span>
                <span className="font-semibold text-[#2E0710]">
                  {customerName} (+91 {customerPhone})
                </span>
              </div>
              <div className="flex justify-between text-stone-600 pt-2 border-t border-stone-200">
                <span>Amount Paid via UPI:</span>
                <span className="font-bold text-emerald-700">₹{advanceAmount}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Balance Remaining:</span>
                <span className="font-bold text-[#2E0710]">₹{remainingAmount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="mt-6 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-sm shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue to Place Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF4EA] text-[#4A0E1B] text-[11px] font-bold border border-[#C8942D]/40 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#9E7018]" />
                <span>Official Store UPI Payment</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2E0710]">
                Pay ₹{advanceAmount} ({paymentModeLabel})
              </h3>
              <p className="text-stone-600 text-xs mt-1">
                Scan QR with any UPI app to pay <strong>{STORE_INFO.upiBeneficiary}</strong> for
                order <strong>{orderNumber}</strong>.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-2xl mb-4">
              <button
                type="button"
                onClick={() => setSelectedTab("qr")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTab === "qr"
                    ? "bg-white text-[#4A0E1B] shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <QrCode className="w-4 h-4 text-[#9E7018]" />
                <span>Scan Store QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab("apps")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTab === "apps"
                    ? "bg-white text-[#4A0E1B] shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Pay via UPI App / ID</span>
              </button>
            </div>

            {selectedTab === "qr" ? (
              <div className="text-center space-y-3">
                <div className="inline-block p-2.5 bg-white border-2 border-[#C8942D]/40 rounded-2xl shadow-sm">
                  <div className="relative w-56 h-72 sm:w-64 sm:h-80 mx-auto rounded-xl overflow-hidden bg-stone-50">
                    <Image
                      src={STORE_INFO.upiQrImage}
                      alt={`UPI QR Code for ${STORE_INFO.upiBeneficiary}`}
                      fill
                      sizes="256px"
                      className="object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 text-xs text-stone-700 bg-[#FAF4EA] px-3.5 py-1.5 rounded-full border border-[#C8942D]/35">
                    <span>
                      UPI ID: <strong className="text-[#4A0E1B]">{vpaAddress}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyVpa}
                      className="text-[#9E7018] hover:text-[#4A0E1B] p-0.5 cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedVpa ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Scan using <strong>GPay, PhonePe, Paytm, or BHIM</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#FAF4EA] border border-[#C8942D]/35 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Payee Name</span>
                    <strong className="text-[#2E0710]">{STORE_INFO.upiBeneficiary}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">UPI ID</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="font-mono text-[#4A0E1B]">{vpaAddress}</strong>
                      <button
                        type="button"
                        onClick={handleCopyVpa}
                        className="p-1 rounded bg-white border border-stone-200 cursor-pointer"
                      >
                        {copiedVpa ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-stone-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Payable Amount</span>
                    <strong className="text-[#4A0E1B] text-sm">₹{advanceAmount}</strong>
                  </div>
                </div>

                <a
                  href={upiDeepLink}
                  className="w-full py-3 px-4 rounded-xl bg-[#4A0E1B] hover:bg-[#2E0710] text-[#F6D98B] text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open Installed UPI App (₹{advanceAmount})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Optional UTR / Transaction Ref Entry + Confirm */}
            <div className="mt-5 pt-4 border-t border-stone-100 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Enter UPI Transaction ID / UTR (Optional after paying)
                </label>
                <input
                  type="text"
                  value={upiRefInput}
                  onChange={(e) => setUpiRefInput(e.target.value)}
                  placeholder="e.g. 432198765432 (leave blank for instant confirmation)"
                  maxLength={32}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-base sm:text-xs focus:outline-none focus:ring-2 focus:ring-[#C8942D]/40 focus:border-[#C8942D]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-600 bg-[#FAF4EA] p-3 rounded-xl border border-[#C8942D]/30">
                <span>Payable Now ({paymentModeLabel}):</span>
                <span className="font-extrabold text-[#4A0E1B] text-base">₹{advanceAmount}</span>
              </div>

              <button
                type="button"
                onClick={handleConfirmPayment}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-sm shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>I Have Paid ₹{advanceAmount} — Confirm Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
