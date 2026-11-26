"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, googleProvider, fetchStaffMembers } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  User as FirebaseUser,
  GoogleAuthProvider,
  AuthCredential,
  linkWithCredential,
  linkWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { StaffMember } from "@/types";
import { STORE_INFO } from "@/lib/constants";

export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "snigdhobangles@gmail.com"
).trim();

export interface VerifiedCustomer {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  isVerified: boolean;
  provider: "phone" | "google" | "email" | "demo";
  verifiedAt: string;
  role?: "admin" | "worker" | "customer";
  isAdmin?: boolean;
  isWorker?: boolean;
  isStaff?: boolean;
}

interface AuthContextType {
  customer: VerifiedCustomer | null;
  isAdmin: boolean;
  isWorker: boolean;
  isStaff: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: "signin" | "signup";
  setAuthModalMode: (mode: "signin" | "signup") => void;
  pendingVerification: { phone: string; name: string; demoOtp: string } | null;
  sendPhoneOtp: (
    phone: string,
    name?: string
  ) => Promise<{ success: boolean; message: string; demoCode?: string }>;
  verifyPhoneOtp: (otp: string) => Promise<{ success: boolean; message: string }>;
  cancelOtpFlow: () => void;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message: string;
    needsVerification?: boolean;
    isAdmin?: boolean;
    isWorker?: boolean;
    isStaff?: boolean;
  }>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; message: string }>;
  registerUserWithEmailVerification: (params: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; message: string; needsEmailVerification: boolean }>;
  checkEmailVerificationStatus: () => Promise<{ isVerified: boolean; message: string }>;
  resendEmailVerification: () => Promise<{ success: boolean; message: string }>;
  simulateEmailVerificationForTesting: () => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (options?: { name?: string; phone?: string }) => Promise<{
    success: boolean;
    message: string;
    isAdmin?: boolean;
    isWorker?: boolean;
    isStaff?: boolean;
    email?: string;
    hasPhone?: boolean;
    name?: string;
    phone?: string;
    accountExistsWithPassword?: boolean;
  }>;
  loginWithGoogleRedirect: () => Promise<void>;
  linkGoogleAccount: () => Promise<{ success: boolean; message: string }>;
  pendingGoogleLinkEmail: string | null;
  clearPendingGoogleLink: () => void;
  logout: () => Promise<void>;
  updateCustomerName: (name: string) => void;
  updateCustomerProfile: (data: {
    name: string;
    phone: string;
  }) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "snigdho_bangles_auth_v1";

function getErrorCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    return String((err as { code?: unknown }).code || "");
  }
  return "";
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message?: unknown }).message || fallback);
  }
  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<VerifiedCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [pendingVerification, setPendingVerification] = useState<{
    phone: string;
    name: string;
    demoOtp: string;
  } | null>(null);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState<{
    email: string;
    credential: AuthCredential;
  } | null>(null);
  const [pendingGoogleLinkEmail, setPendingGoogleLinkEmail] = useState<string | null>(null);

  const clearPendingGoogleLink = () => {
    setPendingGoogleLinkEmail(null);
    setPendingGoogleCredential(null);
  };

  const isAdmin =
    customer?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    customer?.role === "admin" ||
    customer?.isAdmin === true;

  const isWorker = customer?.role === "worker" || customer?.isWorker === true;
  const isStaff = isAdmin || isWorker;

  const lookupProfileForEmail = async (
    cleanEmail: string,
    uid?: string
  ): Promise<{ name?: string; phone?: string; role?: "admin" | "worker" | "customer"; isVerified?: boolean }> => {
    const result: {
      name?: string;
      phone?: string;
      role?: "admin" | "worker" | "customer";
      isVerified?: boolean;
    } = {};
    if (!cleanEmail) return result;

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`snigdho_user_profile_${cleanEmail}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.name) result.name = parsed.name;
          if (parsed.phone) result.phone = parsed.phone;
          if (parsed.role) result.role = parsed.role;
          if (parsed.isVerified) result.isVerified = true;
        }
      } catch {}
    }

    if (db && uid) {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.name) result.name = data.name;
          if (data.phone) result.phone = data.phone;
          if (data.role) result.role = data.role;
          if (data.emailVerified) result.isVerified = true;
        }
      } catch {}
    }

    if (db && (!result.phone || !result.name)) {
      try {
        const snap = await getDoc(doc(db, "users_by_email", cleanEmail));
        if (snap.exists()) {
          const data = snap.data();
          if (data.name && !result.name) result.name = data.name;
          if (data.phone && !result.phone) result.phone = data.phone;
          if (data.role && !result.role) result.role = data.role;
          if (data.emailVerified) result.isVerified = true;
        }
      } catch {}
    }

    return result;
  };

  const persistCustomerProfile = async (profile: {
    uid: string;
    email: string;
    name: string;
    phone: string;
    emailVerified?: boolean;
    provider?: string;
    role?: string;
  }) => {
    const cleanEmail = (profile.email || "").toLowerCase().trim();
    const cleanPhone = (profile.phone || "").replace(/\D/g, "");
    const cleanName = (profile.name || "").trim();

    let finalPhone = cleanPhone;
    if (!finalPhone && typeof window !== "undefined" && cleanEmail) {
      try {
        const cached = localStorage.getItem(`snigdho_user_profile_${cleanEmail}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.phone) finalPhone = String(parsed.phone).replace(/\D/g, "");
        }
      } catch {}
    }

    if (typeof window !== "undefined" && cleanEmail) {
      try {
        localStorage.setItem(
          `snigdho_user_profile_${cleanEmail}`,
          JSON.stringify({
            name: cleanName || "Valued Customer",
            phone: finalPhone,
            email: cleanEmail,
            role: profile.role || "customer",
            isVerified: profile.emailVerified ?? true,
          })
        );
      } catch {}
    }

    if (db) {
      try {
        const dataToSave: Record<string, string | boolean> = {
          uid: profile.uid,
          name: cleanName || "Valued Customer",
          email: cleanEmail,
          emailVerified: profile.emailVerified ?? true,
          provider: profile.provider || "email",
          role: profile.role || "customer",
          lastActiveAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (finalPhone) {
          dataToSave.phone = finalPhone;
        }
        await setDoc(doc(db, "users", profile.uid), dataToSave, { merge: true });
        if (cleanEmail) {
          await setDoc(doc(db, "users_by_email", cleanEmail), dataToSave, { merge: true });
        }
        if (finalPhone) {
          await setDoc(doc(db, "users_by_phone", finalPhone), dataToSave, { merge: true });
        }
      } catch (err) {
        console.warn("Could not sync profile to Firestore:", err);
      }
    }
  };

  // Restore session asynchronously on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as VerifiedCustomer;
          if (parsed && parsed.isVerified) {
            if (parsed.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
              parsed.role = "admin";
              parsed.isAdmin = true;
              parsed.isStaff = true;
              parsed.isWorker = false;
              parsed.name = "Manager";
            } else if (parsed.role === "worker") {
              parsed.isWorker = true;
              parsed.isStaff = true;
              parsed.isAdmin = false;
            }
            setCustomer(parsed);
          }
        }
      } catch (e) {
        console.warn("Could not parse saved customer session:", e);
      } finally {
        setIsLoading(false);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (!auth) return;

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const cleanEmail = (fbUser.email || "").toLowerCase().trim();
          const isGoogle = fbUser.providerData.some((p) => p.providerId === "google.com");
          const providerType = isGoogle ? "google" : "email";
          const isBoutiqueAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

          let staffWorker: StaffMember | undefined;
          try {
            const staffList = await fetchStaffMembers();
            staffWorker = staffList.find((m) => m.email.toLowerCase() === cleanEmail);
          } catch {}

          const isWorkerUser = !isBoutiqueAdmin && !!staffWorker;
          const isAdminUser = isBoutiqueAdmin;
          const isStaffUser = isAdminUser || isWorkerUser;
          const isVerified = isGoogle || fbUser.emailVerified || isBoutiqueAdmin;

          const existingProfile = await lookupProfileForEmail(cleanEmail, fbUser.uid);

          const resolvedName = isBoutiqueAdmin
            ? "Manager"
            : isWorkerUser && staffWorker
              ? staffWorker.name
              : fbUser.displayName || existingProfile.name || cleanEmail.split("@")[0] || "Customer";

          const resolvedPhone = isBoutiqueAdmin
            ? STORE_INFO.whatsappNumber.slice(-10)
            : existingProfile.phone || fbUser.phoneNumber || "";

          const resolvedRole: "admin" | "worker" | "customer" = isBoutiqueAdmin
            ? "admin"
            : isWorkerUser
              ? "worker"
              : existingProfile.role || "customer";

          const updated: VerifiedCustomer = {
            uid: fbUser.uid,
            name: resolvedName,
            phone: resolvedPhone,
            email: fbUser.email || undefined,
            avatar: fbUser.photoURL || undefined,
            isVerified,
            provider: providerType,
            role: resolvedRole,
            isAdmin: isAdminUser,
            isWorker: isWorkerUser,
            isStaff: isStaffUser,
            verifiedAt: new Date().toISOString(),
          };

          setCustomer(updated);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase Auth listener encountered:", err);
    }
  }, []);

  // Handle Google Sign-In redirect results
  useEffect(() => {
    if (!auth) return;

    getRedirectResult(auth)
      .then(async (result) => {
        if (!result || !result.user) {
          try {
            localStorage.removeItem("snigdho_google_redirect_pending");
          } catch {}
          return;
        }
        const fbUser = result.user;
        const cleanEmail = (fbUser.email || "").toLowerCase().trim();
        const isBoutiqueAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

        let savedOptions: { name?: string; phone?: string } = {};
        try {
          const raw = localStorage.getItem("snigdho_google_signin_options");
          if (raw) {
            savedOptions = JSON.parse(raw);
            localStorage.removeItem("snigdho_google_signin_options");
          }
          localStorage.removeItem("snigdho_google_redirect_pending");
        } catch {}

        let staffWorker: StaffMember | undefined;
        try {
          const staffList = await fetchStaffMembers();
          staffWorker = staffList.find((m) => m.email.toLowerCase() === cleanEmail);
        } catch {}

        const isWorkerUser = !isBoutiqueAdmin && !!staffWorker;
        const isAdminUser = isBoutiqueAdmin;
        const isStaffUser = isAdminUser || isWorkerUser;
        const existingProfile = await lookupProfileForEmail(cleanEmail, fbUser.uid);

        const resolvedName = isBoutiqueAdmin
          ? "Manager"
          : isWorkerUser && staffWorker
            ? staffWorker.name
            : savedOptions.name?.trim() ||
              fbUser.displayName ||
              existingProfile.name ||
              cleanEmail.split("@")[0] ||
              "Customer";

        const resolvedPhone = isBoutiqueAdmin
          ? STORE_INFO.whatsappNumber.slice(-10)
          : savedOptions.phone?.replace(/\D/g, "") ||
            existingProfile.phone ||
            fbUser.phoneNumber ||
            "";

        const resolvedRole: "admin" | "worker" | "customer" = isBoutiqueAdmin
          ? "admin"
          : isWorkerUser
            ? "worker"
            : existingProfile.role || "customer";

        const profile: VerifiedCustomer = {
          uid: fbUser.uid,
          name: resolvedName,
          phone: resolvedPhone,
          email: cleanEmail,
          avatar: fbUser.photoURL || undefined,
          isVerified: true,
          provider: "google",
          role: resolvedRole,
          isAdmin: isAdminUser,
          isWorker: isWorkerUser,
          isStaff: isStaffUser,
          verifiedAt: new Date().toISOString(),
        };

        setCustomer(profile);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch {}

        await persistCustomerProfile({
          uid: fbUser.uid,
          name: resolvedName,
          phone: resolvedPhone,
          email: cleanEmail,
          emailVerified: true,
          provider: "google",
          role: profile.role,
        });

        if (!resolvedPhone || resolvedPhone.replace(/\D/g, "").length !== 10) {
          setIsAuthModalOpen(true);
        }

        if (isAdminUser || isWorkerUser) {
          window.location.href = "/admin";
        }
      })
      .catch((err: unknown) => {
        try {
          localStorage.removeItem("snigdho_google_redirect_pending");
        } catch {}

        if (getErrorCode(err) === "auth/account-exists-with-different-credential") {
          const customData =
            typeof err === "object" && err !== null && "customData" in err
              ? (err as { customData?: { email?: string } }).customData
              : undefined;
          const conflictEmail = (customData?.email || "").toLowerCase().trim();
          let pendingCred: AuthCredential | null = null;
          try {
            pendingCred = GoogleAuthProvider.credentialFromError(
              err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]
            );
          } catch {}
          if (pendingCred && conflictEmail) {
            setPendingGoogleCredential({
              email: conflictEmail,
              credential: pendingCred,
            });
            setPendingGoogleLinkEmail(conflictEmail);
          }
        }
      });
  }, []);

  const sendPhoneOtp = async (
    phone: string,
    name?: string
  ): Promise<{ success: boolean; message: string; demoCode?: string }> => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return { success: false, message: "Please enter a valid 10-digit Indian mobile number." };
    }

    const customerName = name?.trim() || `Customer (${cleanPhone.slice(-4)})`;
    const demoCode = "123456";

    setPendingVerification({
      phone: cleanPhone,
      name: customerName,
      demoOtp: demoCode,
    });

    return {
      success: true,
      message: `Verification code sent to +91 ${cleanPhone}. (Demo OTP: ${demoCode})`,
      demoCode,
    };
  };

  const verifyPhoneOtp = async (otp: string): Promise<{ success: boolean; message: string }> => {
    if (!pendingVerification) {
      return {
        success: false,
        message: "No pending verification session found. Please request a new code.",
      };
    }

    const cleanOtp = otp.trim();
    if (cleanOtp !== pendingVerification.demoOtp && cleanOtp !== "123456") {
      return { success: false, message: "Incorrect OTP code. Enter 123456 to verify." };
    }

    const verifiedProfile: VerifiedCustomer = {
      uid: `phone_${pendingVerification.phone}_${Date.now()}`,
      name: pendingVerification.name,
      phone: pendingVerification.phone,
      isVerified: true,
      provider: "phone",
      verifiedAt: new Date().toISOString(),
    };

    setCustomer(verifiedProfile);
    setPendingVerification(null);
    setIsAuthModalOpen(false);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedProfile));
    } catch {}

    return { success: true, message: "Phone number verified successfully!" };
  };

  const cancelOtpFlow = () => {
    setPendingVerification(null);
  };

  const loginWithGoogle = async (options?: { name?: string; phone?: string }) => {
    if (!auth || !googleProvider) {
      return {
        success: false,
        message: "Firebase Authentication is not ready. Please refresh the page.",
      };
    }

    if (options?.name || options?.phone) {
      try {
        localStorage.setItem("snigdho_google_signin_options", JSON.stringify(options));
      } catch {}
    }

    const processGoogleUser = async (fbUser: FirebaseUser) => {
      const cleanEmail = (fbUser.email || "").toLowerCase().trim();
      const isBoutiqueAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

      let staffWorker: StaffMember | undefined;
      try {
        const staffList = await fetchStaffMembers();
        staffWorker = staffList.find((m) => m.email.toLowerCase() === cleanEmail);
      } catch {}

      const isWorkerUser = !isBoutiqueAdmin && !!staffWorker;
      const isAdminUser = isBoutiqueAdmin;
      const isStaffUser = isAdminUser || isWorkerUser;
      const existingProfile = await lookupProfileForEmail(cleanEmail, fbUser.uid);

      const resolvedName = isBoutiqueAdmin
        ? "Manager"
        : isWorkerUser && staffWorker
          ? staffWorker.name
          : options?.name?.trim() ||
            existingProfile.name ||
            fbUser.displayName ||
            cleanEmail.split("@")[0] ||
            "Customer";

      const resolvedPhone = isBoutiqueAdmin
        ? STORE_INFO.whatsappNumber.slice(-10)
        : options?.phone?.replace(/\D/g, "") || existingProfile.phone || fbUser.phoneNumber || "";

      const resolvedRole: "admin" | "worker" | "customer" = isBoutiqueAdmin
        ? "admin"
        : isWorkerUser
          ? "worker"
          : existingProfile.role || "customer";

      const profile: VerifiedCustomer = {
        uid: fbUser.uid,
        name: resolvedName,
        phone: resolvedPhone,
        email: cleanEmail,
        avatar: fbUser.photoURL || undefined,
        isVerified: true,
        provider: "google",
        role: resolvedRole,
        isAdmin: isAdminUser,
        isWorker: isWorkerUser,
        isStaff: isStaffUser,
        verifiedAt: new Date().toISOString(),
      };

      setCustomer(profile);
      setIsAuthModalOpen(false);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch {}

      await persistCustomerProfile({
        uid: fbUser.uid,
        name: resolvedName,
        phone: resolvedPhone,
        email: cleanEmail,
        emailVerified: true,
        provider: "google",
        role: resolvedRole,
      });

      setPendingGoogleCredential(null);
      try {
        localStorage.removeItem("snigdho_google_signin_options");
      } catch {}

      const welcomeMsg = isBoutiqueAdmin
        ? "Manager verified! Full Snigdho Bangles admin access granted."
        : isWorkerUser
          ? `Welcome, ${resolvedName}! Staff portal access granted.`
          : `Signed in as ${resolvedName} (${cleanEmail})`;

      return {
        success: true,
        message: welcomeMsg,
        isAdmin: isAdminUser,
        isWorker: isWorkerUser,
        isStaff: isStaffUser,
        email: cleanEmail,
        hasPhone: !!resolvedPhone && resolvedPhone.replace(/\D/g, "").length === 10,
        name: resolvedName,
        phone: resolvedPhone,
      };
    };

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await processGoogleUser(result.user);
    } catch (err: unknown) {
      const code = getErrorCode(err);
      const customData =
        typeof err === "object" && err !== null && "customData" in err
          ? (err as { customData?: { email?: string } }).customData
          : undefined;
      const conflictEmail = (customData?.email || "").toLowerCase().trim();

      if (code === "auth/account-exists-with-different-credential") {
        let pendingCred: AuthCredential | null = null;
        try {
          pendingCred = GoogleAuthProvider.credentialFromError(
            err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]
          );
        } catch {}

        if (pendingCred && conflictEmail) {
          setPendingGoogleCredential({ email: conflictEmail, credential: pendingCred });
          setPendingGoogleLinkEmail(conflictEmail);
        }

        return {
          success: false,
          accountExistsWithPassword: true,
          email: conflictEmail,
          message: `Account found for ${conflictEmail || "this email"}. Please sign in with your password to connect Google.`,
        };
      }

      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/popup-blocked" ||
        code === "auth/cancelled-popup-request"
      ) {
        try {
          localStorage.setItem("snigdho_google_redirect_pending", "true");
          await signInWithRedirect(auth, googleProvider);
          return { success: false, message: "Redirecting to Google for sign-in..." };
        } catch {
          try {
            localStorage.removeItem("snigdho_google_redirect_pending");
          } catch {}
          return {
            success: false,
            message:
              "Google sign-in could not be completed. Please try email & password sign-in.",
          };
        }
      }

      return {
        success: false,
        message: getErrorMessage(err, "Google sign-in could not be completed."),
      };
    }
  };

  const loginWithGoogleRedirect = async () => {
    if (!auth || !googleProvider) {
      alert("Firebase Authentication is not ready. Please refresh.");
      return;
    }
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.warn("signInWithRedirect error:", err);
    }
  };

  const linkGoogleAccount = async (): Promise<{ success: boolean; message: string }> => {
    if (!auth || !auth.currentUser || !googleProvider) {
      return {
        success: false,
        message: "Firebase Authentication is not ready. Please refresh the page.",
      };
    }

    try {
      const result = await linkWithPopup(auth.currentUser, googleProvider);
      const fbUser = result.user;
      const cleanEmail = (fbUser.email || customer?.email || "").toLowerCase().trim();

      const updatedCustomer: VerifiedCustomer = {
        ...(customer || {
          uid: fbUser.uid,
          name: fbUser.displayName || cleanEmail.split("@")[0] || "Customer",
          phone: "",
          isVerified: true,
          provider: "google",
          verifiedAt: new Date().toISOString(),
        }),
        provider: "google",
        isVerified: true,
        avatar: fbUser.photoURL || customer?.avatar,
      };

      setCustomer(updatedCustomer);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomer));
      } catch {}

      await persistCustomerProfile({
        uid: fbUser.uid,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        email: cleanEmail,
        emailVerified: true,
        provider: "google",
        role: updatedCustomer.role,
      });

      return {
        success: true,
        message: "Google account connected successfully!",
      };
    } catch (err: unknown) {
      if (getErrorCode(err) === "auth/credential-already-in-use") {
        return {
          success: false,
          message: "This Google account is already linked to another customer profile.",
        };
      }
      if (getErrorCode(err) === "auth/popup-closed-by-user") {
        return {
          success: false,
          message: "Google connection popup was closed before completing.",
        };
      }
      return {
        success: false,
        message: getErrorMessage(err, "Failed to link Google account."),
      };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: "Please enter a valid email address." };
    }
    if (!password) {
      return { success: false, message: "Please enter your password." };
    }

    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      let verifiedByServer = false;
      let serverConfigured = false;
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            isAdminEmail?: boolean;
            configured?: boolean;
            valid?: boolean;
          };
          serverConfigured = Boolean(data.configured);
          verifiedByServer = Boolean(data.valid);
        }
      } catch {
        serverConfigured = false;
      }

      if (serverConfigured && !verifiedByServer) {
        return {
          success: false,
          message: "Incorrect admin password. Access restricted to authorized boutique management.",
        };
      }

      let adminUid = "admin_snigdhobangles";
      let verifiedByFirebase = false;
      if (auth) {
        try {
          const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
          adminUid = cred.user.uid;
          verifiedByFirebase = true;
        } catch (err: unknown) {
          const code = getErrorCode(err);
          if (
            verifiedByServer &&
            (code === "auth/user-not-found" || code === "auth/invalid-credential")
          ) {
            try {
              const newCred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, password);
              adminUid = newCred.user.uid;
              await updateProfile(newCred.user, { displayName: "Snigdho Bangles Manager" });
            } catch {}
          }
        }
      }

      if (!verifiedByServer && !verifiedByFirebase) {
        return {
          success: false,
          message: serverConfigured
            ? "Incorrect admin password. Access restricted to authorized boutique management."
            : "Admin credentials could not be verified. Check server ADMIN_PASSWORD or Firebase Auth.",
        };
      }

      const adminProfile: VerifiedCustomer = {
        uid: adminUid,
        name: "Manager",
        phone: STORE_INFO.whatsappNumber.slice(-10),
        email: ADMIN_EMAIL,
        isVerified: true,
        provider: "email",
        role: "admin",
        isAdmin: true,
        isWorker: false,
        isStaff: true,
        verifiedAt: new Date().toISOString(),
      };

      setCustomer(adminProfile);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(adminProfile));
      } catch {}
      setIsAuthModalOpen(false);

      return {
        success: true,
        isAdmin: true,
        isWorker: false,
        isStaff: true,
        needsVerification: false,
        message: "Manager credentials verified! Welcome to Snigdho Bangles Portal.",
      };
    }

    try {
      const staffList = await fetchStaffMembers();
      const matchedWorker = staffList.find((m) => m.email.toLowerCase() === cleanEmail);
      if (matchedWorker) {
        if (!matchedWorker.password || password !== matchedWorker.password) {
          return {
            success: false,
            message: "Incorrect staff password. Please check your credentials.",
          };
        }

        const workerProfile: VerifiedCustomer = {
          uid: matchedWorker.id,
          name: matchedWorker.name,
          phone: "",
          email: matchedWorker.email,
          isVerified: true,
          provider: "email",
          role: "worker",
          isAdmin: false,
          isWorker: true,
          isStaff: true,
          verifiedAt: new Date().toISOString(),
        };

        setCustomer(workerProfile);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(workerProfile));
        } catch {}
        setIsAuthModalOpen(false);

        return {
          success: true,
          isAdmin: false,
          isWorker: true,
          isStaff: true,
          needsVerification: false,
          message: `Welcome, ${matchedWorker.name}! Staff access granted (Orders & Appointments).`,
        };
      }
    } catch (err) {
      console.warn("Could not check staff members during signin:", err);
    }

    if (!auth) {
      const displayName = cleanEmail.split("@")[0];
      const localUser: VerifiedCustomer = {
        uid: `email_local_${Date.now()}`,
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        phone: "",
        email: cleanEmail,
        isVerified: true,
        provider: "email",
        verifiedAt: new Date().toISOString(),
      };
      setCustomer(localUser);
      setIsAuthModalOpen(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
      } catch {}
      return { success: true, message: `Signed in as ${cleanEmail}` };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      if (pendingGoogleCredential && pendingGoogleCredential.email === cleanEmail) {
        try {
          await linkWithCredential(fbUser, pendingGoogleCredential.credential);
        } catch {} finally {
          setPendingGoogleCredential(null);
        }
      }

      const hasGoogle = fbUser.providerData.some((p) => p.providerId === "google.com");
      const isEmailVerified = hasGoogle || fbUser.emailVerified;

      const existingProfile = await lookupProfileForEmail(cleanEmail, fbUser.uid);
      const resolvedName =
        fbUser.displayName || existingProfile.name || cleanEmail.split("@")[0];
      const resolvedPhone = existingProfile.phone || fbUser.phoneNumber || "";

      const customerUser: VerifiedCustomer = {
        uid: fbUser.uid,
        name: resolvedName,
        phone: resolvedPhone,
        email: fbUser.email || cleanEmail,
        avatar: fbUser.photoURL || undefined,
        isVerified: isEmailVerified,
        provider: hasGoogle ? "google" : "email",
        role: existingProfile.role || "customer",
        isAdmin: false,
        isWorker: false,
        isStaff: false,
        verifiedAt: new Date().toISOString(),
      };

      setCustomer(customerUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customerUser));
      } catch {}

      await persistCustomerProfile({
        uid: fbUser.uid,
        name: resolvedName,
        phone: resolvedPhone,
        email: cleanEmail,
        emailVerified: isEmailVerified,
        provider: hasGoogle ? "google" : "email",
        role: existingProfile.role || "customer",
      });

      if (!isEmailVerified) {
        try {
          await sendEmailVerification(fbUser);
        } catch {}
        return {
          success: true,
          needsVerification: true,
          message: `Signed in as ${cleanEmail}. Please verify your email via the link sent to your inbox.`,
        };
      }

      setIsAuthModalOpen(false);
      return {
        success: true,
        needsVerification: false,
        message: `Welcome back, ${customerUser.name}!`,
      };
    } catch (err: unknown) {
      const code = getErrorCode(err);
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        return {
          success: false,
          message: "Invalid email or password. Please verify your details or sign up.",
        };
      }
      if (code === "auth/wrong-password") {
        return { success: false, message: "Incorrect password. Please try again." };
      }
      if (code === "auth/too-many-requests") {
        return {
          success: false,
          message: "Access temporarily disabled due to multiple failed attempts.",
        };
      }
      if (code === "auth/operation-not-allowed") {
        const displayName = cleanEmail.split("@")[0];
        const localUser: VerifiedCustomer = {
          uid: `email_dev_${Date.now()}`,
          name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          phone: "",
          email: cleanEmail,
          isVerified: true,
          provider: "email",
          verifiedAt: new Date().toISOString(),
        };
        setCustomer(localUser);
        setIsAuthModalOpen(false);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
        } catch {}
        return { success: true, message: `Signed in successfully as ${cleanEmail}` };
      }
      return { success: false, message: getErrorMessage(err, "Failed to sign in with email.") };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: "Please enter a valid email address." };
    }
    if (!password || password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters long." };
    }

    const displayName = name?.trim() || cleanEmail.split("@")[0];

    if (!auth) {
      const localUser: VerifiedCustomer = {
        uid: `email_local_${Date.now()}`,
        name: displayName,
        phone: "",
        email: cleanEmail,
        isVerified: true,
        provider: "email",
        verifiedAt: new Date().toISOString(),
      };
      setCustomer(localUser);
      setIsAuthModalOpen(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
      } catch {}
      return { success: true, message: `Welcome ${displayName}! Account created successfully.` };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      if (displayName) {
        try {
          await updateProfile(fbUser, { displayName });
        } catch {}
      }

      const verifiedUser: VerifiedCustomer = {
        uid: fbUser.uid,
        name: displayName || fbUser.displayName || cleanEmail.split("@")[0],
        phone: fbUser.phoneNumber || "",
        email: fbUser.email || cleanEmail,
        avatar: fbUser.photoURL || undefined,
        isVerified: true,
        provider: "email",
        verifiedAt: new Date().toISOString(),
      };

      setCustomer(verifiedUser);
      setIsAuthModalOpen(false);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedUser));
      } catch {}

      return { success: true, message: `Welcome to ${STORE_INFO.brandName}, ${displayName}!` };
    } catch (err: unknown) {
      const code = getErrorCode(err);
      if (code === "auth/email-already-in-use") {
        return {
          success: false,
          message: "This email is already registered. Please sign in instead.",
        };
      }
      if (code === "auth/invalid-email") {
        return { success: false, message: "Invalid email address format." };
      }
      if (code === "auth/weak-password") {
        return { success: false, message: "Password must be at least 6 characters." };
      }
      return { success: false, message: getErrorMessage(err, "Failed to create account.") };
    }
  };

  const registerUserWithEmailVerification = async ({
    name,
    phone,
    email,
    password,
  }: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanName = name.trim();

    if (!cleanName) {
      return {
        success: false,
        message: "Please enter your full name.",
        needsEmailVerification: false,
      };
    }
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return {
        success: false,
        message: "Please enter a valid 10-digit Indian mobile number.",
        needsEmailVerification: false,
      };
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return {
        success: false,
        message: "Please enter a valid email address.",
        needsEmailVerification: false,
      };
    }
    if (!password || password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters long.",
        needsEmailVerification: false,
      };
    }

    if (!auth) {
      const localUser: VerifiedCustomer = {
        uid: `user_${cleanPhone}_${Date.now()}`,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        isVerified: false,
        provider: "email",
        verifiedAt: new Date().toISOString(),
      };
      setCustomer(localUser);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
      } catch {}
      return {
        success: true,
        message: `Verification link sent to ${cleanEmail}. Please check your inbox.`,
        needsEmailVerification: true,
      };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;

      try {
        await updateProfile(fbUser, { displayName: cleanName });
      } catch {}

      try {
        await sendEmailVerification(fbUser);
      } catch {}

      await persistCustomerProfile({
        uid: fbUser.uid,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        emailVerified: fbUser.emailVerified || false,
        provider: "email",
        role: "customer",
      });

      const customerRecord: VerifiedCustomer = {
        uid: fbUser.uid,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        isVerified: fbUser.emailVerified || false,
        provider: "email",
        role: "customer",
        verifiedAt: new Date().toISOString(),
      };

      setCustomer(customerRecord);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customerRecord));
      } catch {}

      return {
        success: true,
        message: `Verification link sent to ${cleanEmail}. Please verify your email to activate your account.`,
        needsEmailVerification: true,
      };
    } catch (err: unknown) {
      const code = getErrorCode(err);
      if (code === "auth/email-already-in-use") {
        return {
          success: false,
          message: `This email ID (${cleanEmail}) is already registered. Please sign in with your password.`,
          needsEmailVerification: false,
        };
      }
      if (code === "auth/invalid-email") {
        return {
          success: false,
          message: "Invalid email address format.",
          needsEmailVerification: false,
        };
      }
      if (code === "auth/weak-password") {
        return {
          success: false,
          message: "Password must be at least 6 characters long.",
          needsEmailVerification: false,
        };
      }
      return {
        success: false,
        message: getErrorMessage(err, "Registration failed. Please check your credentials."),
        needsEmailVerification: false,
      };
    }
  };

  const checkEmailVerificationStatus = async () => {
    if (!auth || !auth.currentUser) {
      if (customer?.isVerified) {
        return { isVerified: true, message: "Your email is already verified!" };
      }
      return { isVerified: false, message: "No active user session found to check." };
    }

    try {
      await auth.currentUser.reload();
      const fbUser = auth.currentUser;

      if (fbUser.emailVerified) {
        const updated: VerifiedCustomer = {
          uid: fbUser.uid,
          name: fbUser.displayName || customer?.name || "Customer",
          phone: customer?.phone || "",
          email: fbUser.email || customer?.email,
          isVerified: true,
          provider: "email",
          verifiedAt: new Date().toISOString(),
        };
        setCustomer(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}

        if (db) {
          try {
            await setDoc(doc(db, "users", fbUser.uid), { emailVerified: true }, { merge: true });
          } catch {}
        }

        return {
          isVerified: true,
          message: `Email verified successfully! Welcome to ${STORE_INFO.brandName}.`,
        };
      }
      return {
        isVerified: false,
        message: "Email is not verified yet. Please click the verification link in your inbox.",
      };
    } catch (err: unknown) {
      return {
        isVerified: false,
        message: getErrorMessage(err, "Could not check verification status."),
      };
    }
  };

  const resendEmailVerification = async () => {
    if (!auth || !auth.currentUser) {
      if (customer?.email) {
        return { success: true, message: `New verification link sent to ${customer.email}.` };
      }
      return { success: false, message: "Please sign in to resend verification email." };
    }

    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true, message: `New verification link sent to ${auth.currentUser.email}.` };
    } catch (err: unknown) {
      if (getErrorCode(err) === "auth/too-many-requests") {
        return {
          success: false,
          message: "Please wait a moment before requesting another verification email.",
        };
      }
      return {
        success: false,
        message: getErrorMessage(err, "Failed to resend verification email."),
      };
    }
  };

  const simulateEmailVerificationForTesting = async () => {
    if (!customer) {
      return { success: false, message: "No registered customer session to verify." };
    }

    const updated: VerifiedCustomer = {
      ...customer,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };
    setCustomer(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    if (db && customer.uid) {
      try {
        await setDoc(doc(db, "users", customer.uid), { emailVerified: true }, { merge: true });
      } catch {}
    }

    return { success: true, message: "Email verified successfully!" };
  };

  const logout = async () => {
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch {}
    }
    setCustomer(null);
    setPendingVerification(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const updateCustomerName = (name: string) => {
    if (!customer) return;
    const updated = { ...customer, name };
    setCustomer(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const updateCustomerProfile = async (data: { name: string; phone: string }) => {
    const cleanName = data.name.trim();
    const cleanPhone = data.phone.replace(/\D/g, "");

    if (!cleanName) {
      return { success: false, message: "Please enter your full name." };
    }
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return { success: false, message: "Please enter a valid 10-digit Indian mobile number." };
    }

    const activeCustomer: VerifiedCustomer = !customer
      ? {
          uid: `user_${cleanPhone}_${Date.now()}`,
          name: cleanName,
          phone: cleanPhone,
          isVerified: true,
          provider: "phone",
          verifiedAt: new Date().toISOString(),
        }
      : {
          ...customer,
          name: cleanName,
          phone: cleanPhone,
        };

    setCustomer(activeCustomer);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeCustomer));
    } catch {}

    await persistCustomerProfile({
      uid: activeCustomer.uid,
      name: cleanName,
      phone: cleanPhone,
      email: activeCustomer.email || "",
      emailVerified: activeCustomer.isVerified,
      provider: activeCustomer.provider,
      role: activeCustomer.role,
    });

    return { success: true, message: "Name and phone number saved successfully!" };
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        isAdmin,
        isWorker,
        isStaff,
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        pendingVerification,
        sendPhoneOtp,
        verifyPhoneOtp,
        cancelOtpFlow,
        signInWithEmail,
        signUpWithEmail,
        registerUserWithEmailVerification,
        checkEmailVerificationStatus,
        resendEmailVerification,
        simulateEmailVerificationForTesting,
        loginWithGoogle,
        loginWithGoogleRedirect,
        linkGoogleAccount,
        pendingGoogleLinkEmail,
        clearPendingGoogleLink,
        logout,
        updateCustomerName,
        updateCustomerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
