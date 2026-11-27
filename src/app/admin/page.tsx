"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Crown,
  Gem,
  Package,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Search,
  ArrowLeft,
  LogOut,
  RefreshCw,
  ExternalLink,
  Phone,
  Calendar,
  Users,
  TrendingUp,
  X,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserPlus,
  UserCheck,
  Shield,
  Key,
  Truck,
  Store,
  Upload,
  Link2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  BangleDesign,
  BangleCategory,
  BangleSize,
  OrderRecord,
  OrderStatus,
  AppointmentRecord,
  StaffMember,
} from "@/types";
import { INITIAL_BANGLE_DESIGNS } from "@/data/bangles";
import { BANGLE_SIZES, STORE_INFO } from "@/lib/constants";
import {
  fetchMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  seedMenuItems,
  fetchOrders,
  updateOrderStatus,
  fetchReservations,
  fetchStaffMembers,
  addStaffMember,
  deleteStaffMember,
  normalizeBangleSizes,
} from "@/lib/firebase";

const CATEGORIES: BangleCategory[] = [
  "All Designs",
  "Bridal & Chooda Sets",
  "Shakha-Pola & Bengali Heritage",
  "Kundan, Polki & Meenakari",
  "Gold-Plated & Temple Kada",
  "Glass, Lac & Velvet Sets",
  "Daily Wear & Oxidized",
];

const PRESET_BANGLE_IMAGES = [
  { label: "Bridal Chooda", url: "/images/bangles/bridal-chooda.jpg" },
  { label: "Shakha-Pola", url: "/images/bangles/shakha-pola.jpg" },
  { label: "Kundan Polki", url: "/images/bangles/kundan-polki.jpg" },
  { label: "Gold-Plated", url: "/images/bangles/gold-plated.jpg" },
  { label: "Pearl & Ruby Kada", url: "/images/bangles/pearl-kada.jpg" },
  { label: "Glass & Velvet", url: "/images/bangles/glass-velvet.jpg" },
  { label: "Oxidized Silver", url: "/images/bangles/oxidized-silver.jpg" },
  { label: "Daily Rose-Gold", url: "/images/bangles/daily-wear.jpg" },
];

/**
 * Resizes and compresses a selected bangle photo client-side so it fits safely
 * inside Firestore documents and works across both localhost and Vercel.
 */
async function optimizeUploadedBangleImage(
  file: File
): Promise<{ dataUrl: string; sizeKb: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file (JPG, PNG, or WEBP).");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Image file is too large. Please pick a photo under 15 MB.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read this image format."));
      el.src = objectUrl;
    });

    const renderCompressed = (maxDim: number, quality: number): string => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Browser canvas is unavailable to process this image.");
      }
      ctx.fillStyle = "#FAF4EA";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", quality);
    };

    let dataUrl = renderCompressed(760, 0.8);
    if (dataUrl.length > 260_000) {
      dataUrl = renderCompressed(560, 0.65);
    }

    const sizeKb = Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024));
    return { dataUrl, sizeKb };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { customer, isAdmin, isWorker, isStaff, isLoading, logout, signInWithEmail } = useAuth();

  const [activeTab, setActiveTab] = useState<"designs" | "orders" | "appointments" | "members">(
    "designs"
  );

  // Designs state
  const [designs, setDesigns] = useState<BangleDesign[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BangleCategory>("All Designs");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(true);

  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<BangleDesign | null>(null);
  const [designToDelete, setDesignToDelete] = useState<BangleDesign | null>(null);

  const [designName, setDesignName] = useState("");
  const [designCategory, setDesignCategory] = useState<BangleCategory>("Bridal & Chooda Sets");
  const [designPrice, setDesignPrice] = useState<number>(899);
  const [designDesc, setDesignDesc] = useState("");
  const [designMaterial, setDesignMaterial] = useState("22K Gold-Plated Brass");
  const [designPackCount, setDesignPackCount] = useState("Pair (2 Bangles)");
  const [designSizes, setDesignSizes] = useState<BangleSize[]>(["2.3", "2.4", "2.5", "2.6"]);
  const [designInStock, setDesignInStock] = useState(true);
  const [designBadge, setDesignBadge] = useState("");
  const [designImage, setDesignImage] = useState(PRESET_BANGLE_IMAGES[0].url);
  const [designDispatchTime, setDesignDispatchTime] = useState("Same-Day Dispatch");
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [imageUploadStatus, setImageUploadStatus] = useState("");
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "all" | "new" | "preparing" | "ready" | "completed"
  >("all");
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Appointments state
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  // Staff state
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberDepartment, setNewMemberDepartment] = useState("Dispatch & Store Pickup");
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loadAllDesigns = useCallback(async () => {
    setIsLoadingDesigns(true);
    try {
      const { items } = await fetchMenuItems();
      setDesigns(items);
    } catch {
      setDesigns(INITIAL_BANGLE_DESIGNS);
    } finally {
      setIsLoadingDesigns(false);
    }
  }, []);

  const loadAllOrders = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingOrders(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      console.warn("Could not load orders:", e);
    } finally {
      if (!silent) setIsLoadingOrders(false);
    }
  }, []);

  const loadAllAppointments = useCallback(async () => {
    setIsLoadingAppointments(true);
    try {
      const data = await fetchReservations();
      setAppointments(data);
    } catch (e) {
      console.warn("Could not load appointments:", e);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, []);

  const loadAllStaff = useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const data = await fetchStaffMembers();
      setStaffMembers(data);
    } catch (e) {
      console.warn("Could not load staff members:", e);
    } finally {
      setIsLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    if (!isStaff) return;
    const frame = requestAnimationFrame(() => {
      if (isAdmin) {
        loadAllDesigns();
        loadAllStaff();
      }
      loadAllOrders();
      loadAllAppointments();
    });

    const handleOrdersUpdated = () => loadAllOrders(true);
    window.addEventListener("cafeyugen_orders_updated", handleOrdersUpdated);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("cafeyugen_orders_updated", handleOrdersUpdated);
    };
  }, [isAdmin, isStaff, loadAllDesigns, loadAllStaff, loadAllOrders, loadAllAppointments]);

  useEffect(() => {
    if (!feedbackMsg) return;
    const t = setTimeout(() => setFeedbackMsg(null), 4000);
    return () => clearTimeout(t);
  }, [feedbackMsg]);

  const effectiveTab =
    isWorker && !isAdmin && (activeTab === "designs" || activeTab === "members")
      ? "orders"
      : activeTab;

  const handleAdminDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    const res = await signInWithEmail(loginEmail.trim(), loginPassword);
    setIsLoggingIn(false);

    if (res.success && (res.isAdmin || res.isWorker || res.isStaff)) {
      setFeedbackMsg({
        type: "success",
        text: res.isWorker
          ? "Staff access granted to Orders & Bridal Visits."
          : `Welcome, Manager! ${STORE_INFO.brandName} portal ready.`,
      });
      if (res.isWorker) setActiveTab("orders");
    } else {
      setLoginError(res.message || "Invalid credentials. Access restricted.");
    }
  };

  const handleCreateStaffMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMember(true);
    const res = await addStaffMember({
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      password: newMemberPassword.trim(),
      department: newMemberDepartment,
      createdBy: "Manager",
      role: "worker",
    });
    setIsSavingMember(false);

    if (res.success) {
      setFeedbackMsg({ type: "success", text: res.message });
      setIsAddMemberModalOpen(false);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberPassword("");
      await loadAllStaff();
    } else {
      setFeedbackMsg({ type: "error", text: res.message });
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    const name = memberToDelete.name;
    const res = await deleteStaffMember(memberToDelete.id);
    setMemberToDelete(null);

    if (res.success) {
      setFeedbackMsg({ type: "success", text: `Staff member "${name}" removed.` });
      await loadAllStaff();
    } else {
      setFeedbackMsg({ type: "error", text: res.message });
    }
  };

  const handleOpenCreateDesign = () => {
    setEditingDesign(null);
    setDesignName("");
    setDesignCategory("Bridal & Chooda Sets");
    setDesignPrice(899);
    setDesignDesc("");
    setDesignMaterial("22K Gold-Plated Brass");
    setDesignPackCount("Pair (2 Bangles)");
    setDesignSizes(["2.3", "2.4", "2.5", "2.6"]);
    setDesignInStock(true);
    setDesignBadge("");
    setDesignImage(PRESET_BANGLE_IMAGES[0].url);
    setDesignDispatchTime("Same-Day Dispatch");
    setImageUploadError("");
    setImageUploadStatus("");
    setShowUrlFallback(false);
    setIsDesignModalOpen(true);
  };

  const handleOpenEditDesign = (design: BangleDesign) => {
    setEditingDesign(design);
    setDesignName(design.name);
    setDesignCategory(design.category);
    setDesignPrice(design.price);
    setDesignDesc(design.description);
    setDesignMaterial(design.material || "Brass & Glass");
    setDesignPackCount(design.packCount || "Pair (2 Bangles)");
    setDesignSizes(normalizeBangleSizes(design.sizes));
    setDesignInStock(design.inStock ?? true);
    setDesignBadge(design.badge || "");
    setDesignImage(design.image);
    setDesignDispatchTime(design.dispatchTime || "Same-Day Dispatch");
    setImageUploadError("");
    setImageUploadStatus(
      design.image?.startsWith("data:image/") ? "Custom uploaded bangle photo" : ""
    );
    setShowUrlFallback(false);
    setIsDesignModalOpen(true);
  };

  const handleBanglePhotoUpload = async (file?: File | null) => {
    if (!file) return;
    setImageUploadError("");
    setIsUploadingImage(true);
    try {
      const { dataUrl, sizeKb } = await optimizeUploadedBangleImage(file);
      setDesignImage(dataUrl);
      setImageUploadStatus(`Uploaded photo ready (${sizeKb} KB)`);
    } catch (err: unknown) {
      setImageUploadError(
        err instanceof Error ? err.message : "Could not process selected photo."
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleDesignSize = (sz: BangleSize) => {
    setDesignSizes((prev) =>
      prev.includes(sz) ? (prev.length > 1 ? prev.filter((s) => s !== sz) : prev) : [...prev, sz]
    );
  };

  const handleSaveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designName.trim() || !designPrice || designPrice <= 0) {
      alert("Please enter a valid bangle name and price.");
      return;
    }

    setIsSavingDesign(true);
    const payload: BangleDesign = {
      id: editingDesign
        ? editingDesign.id
        : `sb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: designName.trim(),
      category: designCategory,
      price: Number(designPrice),
      description: designDesc.trim(),
      material: designMaterial.trim() || "Brass & Alloy",
      packCount: designPackCount.trim() || "Pair (2 Bangles)",
      sizes: designSizes,
      inStock: designInStock,
      badge: designBadge.trim() || undefined,
      image: designImage.trim() || PRESET_BANGLE_IMAGES[0].url,
      dispatchTime: designDispatchTime.trim() || "Same-Day Dispatch",
      isFavorite: editingDesign ? editingDesign.isFavorite : false,
    };

    const res = editingDesign ? await updateMenuItem(payload) : await addMenuItem(payload);
    setIsSavingDesign(false);

    if (res.success) {
      setFeedbackMsg({ type: "success", text: res.message });
      setIsDesignModalOpen(false);
      await loadAllDesigns();
    } else {
      setFeedbackMsg({ type: "error", text: res.message });
    }
  };

  const handleConfirmDeleteDesign = async () => {
    if (!designToDelete) return;
    const name = designToDelete.name;
    const res = await deleteMenuItem(designToDelete.id);
    setDesignToDelete(null);

    if (res.success) {
      setFeedbackMsg({ type: "success", text: `"${name}" removed from catalog.` });
      await loadAllDesigns();
    } else {
      setFeedbackMsg({ type: "error", text: res.message });
    }
  };

  const handleResetCatalog = async () => {
    if (!confirm("Re-seed all 30 default Snigdho Bangles designs into Cloud Firestore?")) return;
    const res = await seedMenuItems();
    if (res.success) {
      setFeedbackMsg({
        type: "success",
        text: `Successfully synced ${res.count} bangle designs to Firestore!`,
      });
      await loadAllDesigns();
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Failed to sync catalog." });
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    const res = await updateOrderStatus(orderId, status);
    if (res.success) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      setFeedbackMsg({
        type: "success",
        text: `Order ${orderId} updated to "${status.toUpperCase()}".`,
      });
    }
  };

  const filteredDesigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return designs.filter((d) => {
      const matchesCat = selectedCategory === "All Designs" || d.category === selectedCategory;
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.material || "").toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [designs, selectedCategory, searchQuery]);

  const orderCounts = useMemo(() => {
    return {
      all: orders.length,
      new: orders.filter((o) => o.status === "pending").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      completed: orders.filter((o) => o.status === "completed").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const getPriority = (s?: string) =>
      s === "pending" ? 1 : s === "preparing" ? 2 : s === "ready" ? 3 : s === "completed" ? 4 : 5;
    const q = orderSearchQuery.trim().toLowerCase();

    return orders
      .filter((order) => {
        const matchesStatus =
          orderStatusFilter === "all"
            ? true
            : orderStatusFilter === "new"
              ? order.status === "pending"
              : order.status === orderStatusFilter;
        const matchesSearch =
          !q ||
          order.id.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.customerPhone.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const diff = getPriority(a.status) - getPriority(b.status);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.status !== "cancelled" ? Number(o.totalAmount || 0) : 0),
      0
    );
    const activeOrders = orders.filter(
      (o) => o.status === "pending" || o.status === "preparing"
    ).length;
    return {
      totalDesigns: designs.length,
      totalOrders: orders.length,
      activeOrders,
      totalRevenue,
      appointmentsCount: appointments.length,
    };
  }, [designs, orders, appointments]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#2E0710] text-[#FAF4EA] flex items-center justify-center font-sans">
        <div className="text-center p-8">
          <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-300 font-medium">
            Loading {STORE_INFO.brandName} Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#2E0710] text-[#FAF4EA] flex flex-col font-sans">
        <header className="p-6 border-b border-[#C8942D]/30 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#C8942D]/20 text-[#F6D98B] flex items-center justify-center border border-[#C8942D]/40">
              <Gem className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-white block leading-none">
                {STORE_INFO.brandName}
              </span>
              <span className="text-[10px] text-stone-300 tracking-widest uppercase">
                Gobindapally, Dhupguri
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-200 hover:text-white px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-[#FAF4EA] text-[#2E0710] rounded-3xl p-6 sm:p-9 shadow-2xl border border-[#C8942D]/40">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4A0E1B] to-[#6E1629] text-[#F6D98B] flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4A0E1B]/10 text-[#4A0E1B] text-xs font-bold uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Authorized Personnel Only</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2E0710]">
                Boutique Admin &amp; Staff Portal
              </h1>
              <p className="text-xs text-stone-600 mt-1.5">
                Sign in with your Manager or Staff credentials to manage bangle designs, prices,
                orders &amp; bridal appointments.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminDirectLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="manager@snigdhobangles.com"
                    required
                    className="w-full pl-10 pr-3.5 py-3 text-base sm:text-sm rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 text-base sm:text-sm rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#C8942D]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#4A0E1B] to-[#6E1629] text-[#F6D98B] text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>{isLoggingIn ? "Verifying..." : "Sign In to Boutique Portal"}</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#20050B] text-[#FAF4EA] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#2E0710]/95 backdrop-blur-md border-b border-[#C8942D]/35 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
                isAdmin
                  ? "bg-gradient-to-tr from-[#D4AF37] to-[#9E7018] text-[#2E0710]"
                  : "bg-blue-600 text-white"
              }`}
            >
              {isAdmin ? <Crown className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base sm:text-lg font-bold text-white">
                  {STORE_INFO.brandName} {isAdmin ? "Admin" : "Staff"} Portal
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isAdmin ? "bg-[#D4AF37] text-[#2E0710]" : "bg-blue-500 text-white"
                  }`}
                >
                  {isAdmin ? "Manager" : "Staff"}
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                Signed in as <strong className="text-[#F6D98B]">{customer?.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-stone-200 transition"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3 h-3 text-[#F6D98B]" />
            </Link>

            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-500/30 text-xs font-semibold text-red-200 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {feedbackMsg && (
        <div className="fixed top-16 right-4 sm:right-8 z-50">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border ${
              feedbackMsg.type === "success"
                ? "bg-emerald-950 text-emerald-200 border-emerald-500/50"
                : "bg-red-950 text-red-200 border-red-500/50"
            }`}
          >
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metrics */}
        {isAdmin ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-[#2E0710] border border-[#C8942D]/30">
              <div className="flex items-center justify-between text-stone-300 text-xs mb-2">
                <span>Active Orders</span>
                <Package className="w-4 h-4 text-[#F6D98B]" />
              </div>
              <div className="text-2xl font-bold font-serif text-white">{metrics.activeOrders}</div>
              <p className="text-[11px] text-[#F6D98B] mt-1">Awaiting Dispatch / Pickup</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#2E0710] border border-[#C8942D]/30">
              <div className="flex items-center justify-between text-stone-300 text-xs mb-2">
                <span>Total Revenue</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-serif text-emerald-400">
                ₹{metrics.totalRevenue}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">From {metrics.totalOrders} orders</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#2E0710] border border-[#C8942D]/30">
              <div className="flex items-center justify-between text-stone-300 text-xs mb-2">
                <span>Bangle Designs</span>
                <Gem className="w-4 h-4 text-[#F6D98B]" />
              </div>
              <div className="text-2xl font-bold font-serif text-white">{metrics.totalDesigns}</div>
              <p className="text-[11px] text-stone-400 mt-1">Live in Store Menu</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#2E0710] border border-[#C8942D]/30">
              <div className="flex items-center justify-between text-stone-300 text-xs mb-2">
                <span>Bridal Visits</span>
                <Calendar className="w-4 h-4 text-[#F6D98B]" />
              </div>
              <div className="text-2xl font-bold font-serif text-white">
                {metrics.appointmentsCount}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Scheduled Consultations</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#2E0710] border border-[#C8942D]/30 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-stone-300 text-xs mb-2">
                <span>Boutique Staff</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-serif text-white">{staffMembers.length}</div>
              <p className="text-[11px] text-blue-300 mt-1">Active staff accounts</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#2E0710] border border-[#C8942D]/30">
              <span className="text-xs text-stone-300">Active Orders</span>
              <div className="text-2xl font-bold font-serif text-[#F6D98B] mt-1">
                {metrics.activeOrders}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#2E0710] border border-white/10">
              <span className="text-xs text-stone-300">Total Orders</span>
              <div className="text-2xl font-bold font-serif text-white mt-1">
                {metrics.totalOrders}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#2E0710] border border-white/10">
              <span className="text-xs text-stone-300">Bridal Appointments</span>
              <div className="text-2xl font-bold font-serif text-white mt-1">
                {metrics.appointmentsCount}
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 text-xs font-bold gap-2 overflow-x-auto pb-1">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("designs")}
              className={`py-3 px-5 rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                effectiveTab === "designs"
                  ? "bg-[#4A0E1B] text-[#F6D98B] border-t-2 border-[#D4AF37]"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Gem className="w-4 h-4" />
              <span>Bangle Designs ({designs.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`py-3 px-5 rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
              effectiveTab === "orders"
                ? "bg-[#4A0E1B] text-[#F6D98B] border-t-2 border-[#D4AF37]"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders &amp; Dispatch ({orders.length})</span>
            {orderCounts.new > 0 && (
              <span className="bg-[#D4AF37] text-[#2E0710] font-black text-[10px] px-1.5 rounded-full">
                {orderCounts.new} NEW
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("appointments")}
            className={`py-3 px-5 rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
              effectiveTab === "appointments"
                ? "bg-[#4A0E1B] text-[#F6D98B] border-t-2 border-[#D4AF37]"
                : "text-stone-400 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bridal Visits ({appointments.length})</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`py-3 px-5 rounded-t-2xl transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                effectiveTab === "members"
                  ? "bg-[#4A0E1B] text-[#F6D98B] border-t-2 border-[#D4AF37]"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff ({staffMembers.length})</span>
            </button>
          )}
        </div>

        {/* TAB 1: BANGLE DESIGNS */}
        {effectiveTab === "designs" && isAdmin && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#2E0710] p-4 rounded-2xl border border-[#C8942D]/30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCreateDesign}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#9E7018] text-[#2E0710] text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Bangle Design</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCatalog}
                  className="px-3.5 py-2.5 rounded-xl bg-[#4A0E1B] hover:bg-[#6E1629] text-stone-200 text-xs font-medium cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync / Seed All 30</span>
                </button>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bangle design or material..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#20050B] border border-white/15 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#D4AF37] text-[#2E0710] font-bold"
                      : "bg-[#2E0710] text-stone-300 border border-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {isLoadingDesigns ? (
              <div className="text-center py-16">
                <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto mb-2" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="p-4 bg-[#2E0710] rounded-2xl border border-[#C8942D]/25 flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="relative h-44 w-full rounded-xl overflow-hidden mb-3 bg-black/30">
                        <Image
                          src={design.image}
                          alt={design.name}
                          fill
                          sizes="400px"
                          className="object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-[#F6D98B] text-xs font-bold px-2.5 py-1 rounded-lg">
                          ₹{design.price}
                        </div>
                        <div className="absolute top-2 left-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {design.packCount}
                        </div>
                      </div>
                      <h4 className="font-serif text-base font-bold text-white line-clamp-1">
                        {design.name}
                      </h4>
                      <span className="text-[11px] text-[#F6D98B]">{design.category}</span>
                      <p className="text-xs text-stone-300 mt-2 line-clamp-2">
                        {design.description}
                      </p>
                      <div className="mt-2 text-[11px] text-stone-400">
                        Sizes: {(design.sizes || []).join(", ")} • {design.material}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 mt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => handleOpenEditDesign(design)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#4A0E1B] hover:bg-[#6E1629] text-stone-100 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#F6D98B]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDesignToDelete(design)}
                        className="py-1.5 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {effectiveTab === "orders" && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#2E0710] p-4 rounded-2xl border border-[#C8942D]/30">
              <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto">
                {(["all", "new", "preparing", "ready", "completed"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl cursor-pointer whitespace-nowrap ${
                      orderStatusFilter === st
                        ? "bg-[#D4AF37] text-[#2E0710] font-bold"
                        : "bg-[#20050B] text-stone-300"
                    }`}
                  >
                    {st === "all"
                      ? `All (${orderCounts.all})`
                      : st === "new"
                        ? `New (${orderCounts.new})`
                        : st === "preparing"
                          ? `Packing (${orderCounts.preparing})`
                          : st === "ready"
                            ? `Dispatched / Ready (${orderCounts.ready})`
                            : `Completed (${orderCounts.completed})`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search order ID, name or phone..."
                  className="px-3.5 py-1.5 rounded-xl bg-[#20050B] text-xs text-white border border-white/15"
                />
                <button
                  type="button"
                  onClick={() => loadAllOrders(false)}
                  className="p-2 rounded-xl bg-[#4A0E1B] text-[#F6D98B] cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-[#2E0710] rounded-2xl border border-white/10 p-8">
                <Package className="w-10 h-10 text-stone-500 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-white">No matching orders</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-5 bg-[#2E0710] rounded-2xl border border-[#C8942D]/30 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-[#F6D98B]">
                            {order.id}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white">
                            {order.deliveryMethod === "shipping" ? (
                              <>
                                <Truck className="w-3 h-3 text-[#F6D98B]" />
                                <span>Courier Shipping</span>
                              </>
                            ) : (
                              <>
                                <Store className="w-3 h-3 text-emerald-300" />
                                <span>Store Pickup</span>
                              </>
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className="bg-[#20050B] border border-[#C8942D]/40 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <option value="pending">New Order</option>
                        <option value="preparing">Packing / Crafting</option>
                        <option value="ready">Dispatched / Ready</option>
                        <option value="completed">Delivered / Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-[#20050B]/70 p-3 rounded-xl border border-white/10">
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">
                          Customer
                        </span>
                        <span className="font-bold text-white">{order.customerName}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">
                          Phone &amp; WhatsApp
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`tel:+91${order.customerPhone}`}
                            className="text-[#F6D98B] font-bold hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>+91 {order.customerPhone}</span>
                          </a>
                          <a
                            href={`https://wa.me/91${order.customerPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">
                          {order.deliveryMethod === "shipping" ? "Shipping Address" : "Pickup Slot"}
                        </span>
                        <span className="text-stone-200">
                          {order.deliveryMethod === "shipping"
                            ? `${order.shippingAddress || ""} ${
                                order.pincode ? `(PIN ${order.pincode})` : ""
                              }`
                            : order.pickupTime}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {(order.items || []).map((ci, idx) => (
                        <div
                          key={`${ci.item?.id || idx}_${ci.selectedSize || idx}`}
                          className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-[#20050B]/50 border border-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F6D98B]">{ci.quantity}x</span>
                            <span className="text-stone-100">{ci.item?.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#4A0E1B] text-[#F6D98B] font-bold">
                              Size {ci.selectedSize || "2.4"}
                            </span>
                          </div>
                          <span className="font-mono text-stone-200">
                            ₹{(ci.item?.price || 0) * ci.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                      <span className="text-emerald-300 font-semibold">
                        UPI Paid: ₹{order.advancePaidAmount || 0}{" "}
                        {order.advanceTxnId ? `[Ref: ${order.advanceTxnId}]` : ""}
                      </span>
                      <div>
                        <span className="text-stone-400 mr-2">Grand Total:</span>
                        <span className="font-serif text-base font-bold text-white">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BRIDAL VISITS */}
        {effectiveTab === "appointments" && (
          <div className="space-y-4">
            <div className="bg-[#2E0710] p-4 rounded-2xl border border-[#C8942D]/30 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">
                  Bridal Styling &amp; Custom Order Visits
                </h3>
                <p className="text-xs text-stone-300">
                  Scheduled Gobindapally store consultations
                </p>
              </div>
              <button
                type="button"
                onClick={loadAllAppointments}
                className="px-3 py-1.5 rounded-xl bg-[#4A0E1B] text-xs text-white flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingAppointments ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 bg-[#2E0710] rounded-2xl border border-[#C8942D]/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-base font-bold text-white">{apt.fullName}</h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">
                      {apt.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-300">
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">
                        Date &amp; Time
                      </span>
                      <span>
                        {apt.date} at {apt.time}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">
                        Visitors
                      </span>
                      <span>{apt.guests} Guests</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">
                        Consultation
                      </span>
                      <span className="text-[#F6D98B]">{apt.seatingPreference}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block uppercase font-bold">
                        Phone
                      </span>
                      <a href={`tel:+91${apt.phone}`} className="text-[#F6D98B] hover:underline">
                        +91 {apt.phone}
                      </a>
                    </div>
                  </div>
                  {apt.specialRequests && (
                    <p className="text-xs p-2.5 bg-[#20050B] rounded-lg text-stone-300">
                      <strong>Notes:</strong> {apt.specialRequests}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STAFF MEMBERS */}
        {effectiveTab === "members" && isAdmin && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#2E0710] rounded-2xl border border-[#C8942D]/30">
              <div>
                <h3 className="font-serif text-xl font-bold text-white">
                  Boutique Staff Accounts
                </h3>
                <p className="text-xs text-stone-300 mt-1">
                  Staff accounts can manage Orders, Courier Dispatch, and Bridal Appointments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewMemberName("");
                  setNewMemberEmail("");
                  setNewMemberPassword(`sb${Math.floor(1000 + Math.random() * 9000)}`);
                  setIsAddMemberModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#9E7018] text-[#2E0710] text-xs font-bold cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff Account</span>
              </button>
            </div>

            {isLoadingStaff ? (
              <div className="text-center py-12">
                <RefreshCw className="w-7 h-7 animate-spin text-[#D4AF37] mx-auto" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-5 bg-[#2E0710] rounded-2xl border border-[#C8942D]/30 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif text-base font-bold text-white">{member.name}</h4>
                        <span className="text-[10px] text-[#F6D98B]">{member.department}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMemberToDelete(member)}
                        className="p-2 rounded-xl bg-red-950/60 text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-[#20050B] rounded-xl p-3 space-y-2 text-xs">
                      <div className="font-mono text-stone-200 truncate">{member.email}</div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#F6D98B]">
                          {visiblePasswords[member.id] ? member.password : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setVisiblePasswords((p) => ({ ...p, [member.id]: !p[member.id] }))
                          }
                          className="text-[10px] text-stone-400 hover:text-white cursor-pointer"
                        >
                          {visiblePasswords[member.id] ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ADD / EDIT DESIGN MODAL */}
      {isDesignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsDesignModalOpen(false)}
          />
          <div className="relative bg-[#FAF4EA] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#C8942D]/40 z-10 text-[#2E0710] my-4 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsDesignModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-2xl font-bold mb-4">
              {editingDesign ? "Edit Bangle Design" : "Add New Bangle Design"}
            </h3>

            <form onSubmit={handleSaveDesign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Design Name *</label>
                <input
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Collection *</label>
                  <select
                    value={designCategory}
                    onChange={(e) => setDesignCategory(e.target.value as BangleCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300"
                  >
                    {CATEGORIES.filter((c) => c !== "All Designs").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Store Price (₹) *</label>
                  <input
                    type="number"
                    value={designPrice || ""}
                    onChange={(e) => setDesignPrice(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Material</label>
                  <input
                    type="text"
                    value={designMaterial}
                    onChange={(e) => setDesignMaterial(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Pack / Piece Count</label>
                  <input
                    type="text"
                    value={designPackCount}
                    onChange={(e) => setDesignPackCount(e.target.value)}
                    placeholder="e.g. Pair (2 Bangles)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Available Wrist Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {BANGLE_SIZES.map(({ size }) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleDesignSize(size)}
                      className={`px-3 py-1 rounded-lg border font-bold cursor-pointer ${
                        designSizes.includes(size)
                          ? "bg-[#4A0E1B] text-[#F6D98B] border-[#4A0E1B]"
                          : "bg-white text-stone-600 border-stone-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Description *</label>
                <textarea
                  rows={2}
                  value={designDesc}
                  onChange={(e) => setDesignDesc(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    value={designBadge}
                    onChange={(e) => setDesignBadge(e.target.value)}
                    placeholder="e.g. Bridal Bestseller"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Dispatch Estimate</label>
                  <input
                    type="text"
                    value={designDispatchTime}
                    onChange={(e) => setDesignDispatchTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={designInStock}
                    onChange={(e) => setDesignInStock(e.target.checked)}
                  />
                  <span>Ready in Stock</span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold">Bangle Photo *</label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4A0E1B] hover:underline cursor-pointer"
                  >
                    <Link2 className="w-3 h-3" />
                    <span>{showUrlFallback ? "Hide URL input" : "Use URL / path instead"}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-2.5">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#C8942D]/50 bg-stone-100 flex-shrink-0">
                    <Image
                      src={designImage || PRESET_BANGLE_IMAGES[0].url}
                      alt="Selected bangle preview"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(true);
                    }}
                    onDragLeave={() => setIsDraggingPhoto(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(false);
                      void handleBanglePhotoUpload(e.dataTransfer.files?.[0]);
                    }}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 px-4 py-3.5 rounded-2xl border-2 border-dashed transition-colors cursor-pointer text-center ${
                      isDraggingPhoto
                        ? "border-[#4A0E1B] bg-[#4A0E1B]/10"
                        : "border-[#C8942D]/60 bg-white hover:bg-amber-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        void handleBanglePhotoUpload(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-1.5 font-bold text-[#4A0E1B]">
                      {isUploadingImage ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>
                        {isUploadingImage
                          ? "Optimizing Photo..."
                          : "Upload Bangle Photo from Device"}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      {imageUploadStatus || "Click or drag & drop JPG, PNG, or WEBP"}
                    </span>
                  </label>
                </div>

                {imageUploadError && (
                  <p className="text-[11px] text-red-600 font-semibold mb-2">
                    {imageUploadError}
                  </p>
                )}

                {showUrlFallback && (
                  <input
                    type="text"
                    value={designImage}
                    onChange={(e) => {
                      setDesignImage(e.target.value);
                      setImageUploadStatus("");
                    }}
                    placeholder="/images/bangles/bridal-chooda.jpg or https://..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-300 mb-2.5 text-xs"
                  />
                )}

                <span className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Or pick a studio preset photo:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESET_BANGLE_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setDesignImage(preset.url);
                        setImageUploadStatus("");
                        setImageUploadError("");
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-semibold truncate cursor-pointer ${
                        designImage === preset.url
                          ? "bg-[#4A0E1B] text-[#F6D98B] border-[#4A0E1B]"
                          : "bg-white text-stone-700 border-stone-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDesignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-200 text-stone-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDesign}
                  className="px-6 py-2.5 rounded-xl bg-[#4A0E1B] text-[#F6D98B] font-bold shadow-md cursor-pointer"
                >
                  {isSavingDesign ? "Saving..." : editingDesign ? "Save Changes" : "Add Design"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DESIGN CONFIRMATION */}
      {designToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setDesignToDelete(null)}
          />
          <div className="relative bg-[#FAF4EA] rounded-3xl max-w-sm w-full p-6 z-10 text-[#2E0710] text-center">
            <h3 className="font-serif text-xl font-bold">
              Delete &quot;{designToDelete.name}&quot;?
            </h3>
            <p className="text-xs text-stone-600 mt-2">
              This will remove the design from your Snigdho Bangles catalog.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDesignToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-200 text-xs font-semibold cursor-pointer"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDesign}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD WORKER MODAL */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setIsAddMemberModalOpen(false)}
          />
          <div className="relative bg-[#FAF4EA] rounded-3xl max-w-md w-full p-6 z-10 text-[#2E0710]">
            <h3 className="font-serif text-xl font-bold mb-4">Add Boutique Staff Account</h3>
            <form onSubmit={handleCreateStaffMember} className="space-y-3 text-xs">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Staff Name"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white"
              />
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="staff@snigdhobangles.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white"
              />
              <input
                type="text"
                value={newMemberPassword}
                onChange={(e) => setNewMemberPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white font-mono"
              />
              <select
                value={newMemberDepartment}
                onChange={(e) => setNewMemberDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white"
              >
                <option value="Dispatch & Store Pickup">Dispatch &amp; Store Pickup</option>
                <option value="Bridal Styling Desk">Bridal Styling Desk</option>
                <option value="Packaging & Quality Check">Packaging &amp; Quality Check</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMember}
                  className="flex-1 py-2.5 rounded-xl bg-[#4A0E1B] text-[#F6D98B] font-bold cursor-pointer"
                >
                  {isSavingMember ? "Creating..." : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE STAFF MODAL */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80" onClick={() => setMemberToDelete(null)} />
          <div className="relative bg-[#FAF4EA] rounded-3xl max-w-sm w-full p-6 z-10 text-[#2E0710] text-center">
            <h3 className="font-serif text-xl font-bold">
              Remove &quot;{memberToDelete.name}&quot;?
            </h3>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-200 text-xs font-semibold cursor-pointer"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
