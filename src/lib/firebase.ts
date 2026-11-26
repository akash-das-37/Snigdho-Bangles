import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  BangleDesign,
  OrderRecord,
  OrderStatus,
  AppointmentRecord,
  StaffMember,
  StaffRole,
} from "@/types";
import { INITIAL_BANGLE_DESIGNS } from "@/data/bangles";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (
  typeof window !== "undefined" ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: "select_account" });
    } catch (err) {
      console.warn("Firebase initialization skipped or encountered error:", err);
    }
  }
}

export { app, db, auth, googleProvider };

// Dedicated Firestore collection names for Snigdho Bangles
const DESIGNS_COLLECTION = "bangle_designs";
const ORDERS_COLLECTION = "bangle_orders";
const APPOINTMENTS_COLLECTION = "boutique_appointments";
const STAFF_COLLECTION = "bangle_staff_members";

export const LOCAL_MENU_KEY = "snigdho_bangles_designs_v1";
export const LOCAL_ORDERS_KEY = "snigdho_bangles_orders_v1";
export const LOCAL_RESERVATIONS_KEY = "snigdho_bangles_appointments_v1";
export const LOCAL_STAFF_KEY = "snigdho_bangles_staff_v1";

/**
 * Synchronously retrieves the latest bangle designs from local cache,
 * falling back to INITIAL_BANGLE_DESIGNS.
 */
export function getLatestMenuItemsSync(): BangleDesign[] {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_MENU_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, BangleDesign>();
          INITIAL_BANGLE_DESIGNS.forEach((i) => map.set(i.id, i));
          parsed.forEach((i: BangleDesign) => {
            if (i && i.id) map.set(i.id, i);
          });
          return Array.from(map.values());
        }
      }
    } catch {}
  }
  return INITIAL_BANGLE_DESIGNS;
}

/**
 * Synchronously gets the latest verified live price of a bangle design by ID.
 */
export function getLatestItemPriceSync(itemId: string, fallbackPrice?: number): number {
  const items = getLatestMenuItemsSync();
  const found = items.find((i) => i.id === itemId);
  if (found && typeof found.price === "number") {
    return found.price;
  }
  if (typeof fallbackPrice === "number") return fallbackPrice;
  const initial = INITIAL_BANGLE_DESIGNS.find((i) => i.id === itemId);
  return initial?.price || 0;
}

/**
 * Fetches bangle designs with multi-tier persistence:
 * 1. Cloud Firestore collection "bangle_designs"
 * 2. Local browser admin cache
 * 3. Verified static fallback INITIAL_BANGLE_DESIGNS
 */
export async function fetchMenuItems(): Promise<{
  items: BangleDesign[];
  source: "firestore" | "local" | "fallback";
}> {
  let cachedItems: BangleDesign[] | null = null;
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_MENU_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, BangleDesign>();
          INITIAL_BANGLE_DESIGNS.forEach((i) => map.set(i.id, i));
          parsed.forEach((i: BangleDesign) => {
            if (i && i.id) map.set(i.id, i);
          });
          cachedItems = Array.from(map.values());
        }
      }
    } catch {}
  }

  if (db) {
    try {
      const menuRef = collection(db, DESIGNS_COLLECTION);
      const snapshot = await getDocs(menuRef);

      if (!snapshot.empty) {
        const firestoreMap = new Map<string, BangleDesign>();
        INITIAL_BANGLE_DESIGNS.forEach((item) => firestoreMap.set(item.id, item));
        snapshot.forEach((docSnapshot) => {
          firestoreMap.set(docSnapshot.id, {
            id: docSnapshot.id,
            ...(docSnapshot.data() as Omit<BangleDesign, "id">),
          });
        });
        const items = Array.from(firestoreMap.values());
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(items));
            window.dispatchEvent(new Event("cafeyugen_menu_updated"));
          } catch {}
        }
        return { items, source: "firestore" };
      }
    } catch (error) {
      console.warn("Firestore fetch error, using local cache:", error);
    }
  }

  if (cachedItems && cachedItems.length > 0) {
    return { items: cachedItems, source: "local" };
  }

  return { items: INITIAL_BANGLE_DESIGNS, source: "fallback" };
}

/**
 * Adds or updates a bangle design (persists to Firestore and Local Storage)
 */
export async function addMenuItem(
  item: BangleDesign
): Promise<{ success: boolean; message: string }> {
  try {
    if (db) {
      await setDoc(doc(db, DESIGNS_COLLECTION, item.id), item);
    }

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_MENU_KEY);
        let items: BangleDesign[] = cached ? JSON.parse(cached) : [...INITIAL_BANGLE_DESIGNS];
        const existingIdx = items.findIndex((i) => i.id === item.id);
        if (existingIdx >= 0) {
          items[existingIdx] = item;
        } else {
          items = [item, ...items];
        }
        localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event("cafeyugen_menu_updated"));
      } catch {}

      fetch("/api/menu/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", item }),
      }).catch(() => {});
    }

    return { success: true, message: `Design "${item.name}" updated successfully!` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to save bangle design.";
    console.error("Error adding design:", err);
    return { success: false, message: errorMsg };
  }
}

export async function updateMenuItem(
  item: BangleDesign
): Promise<{ success: boolean; message: string }> {
  return addMenuItem(item);
}

/**
 * Deletes a bangle design from the catalog
 */
export async function deleteMenuItem(
  itemId: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (db) {
      await deleteDoc(doc(db, DESIGNS_COLLECTION, itemId));
    }

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(LOCAL_MENU_KEY);
        let items: BangleDesign[] = cached ? JSON.parse(cached) : [...INITIAL_BANGLE_DESIGNS];
        items = items.filter((i) => i.id !== itemId);
        localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(items));
        window.dispatchEvent(new Event("cafeyugen_menu_updated"));
      } catch {}

      fetch("/api/menu/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", itemId }),
      }).catch(() => {});
    }

    return { success: true, message: "Design deleted from catalog successfully!" };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete design.";
    console.error("Error deleting design:", err);
    return { success: false, message: errorMsg };
  }
}

/**
 * Seeds or resets all 30 default bangle designs to Firestore
 */
export async function seedMenuItems(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  if (!db) {
    return { success: false, count: 0, error: "Firestore is not initialized." };
  }

  try {
    let count = 0;
    for (const item of INITIAL_BANGLE_DESIGNS) {
      const itemRef = doc(db, DESIGNS_COLLECTION, item.id);
      await setDoc(itemRef, item, { merge: true });
      count++;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_MENU_KEY, JSON.stringify(INITIAL_BANGLE_DESIGNS));
      window.dispatchEvent(new Event("cafeyugen_menu_updated"));
    }
    return { success: true, count };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: errorMsg };
  }
}

/**
 * Order Management: Save Order
 */
export async function saveOrder(order: OrderRecord): Promise<{ success: boolean }> {
  if (db) {
    try {
      await setDoc(doc(db, ORDERS_COLLECTION, order.id), order, { merge: true });
    } catch (err) {
      console.warn("Could not write order to Firestore:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const existing = localStorage.getItem(LOCAL_ORDERS_KEY);
      const orders: OrderRecord[] = existing ? JSON.parse(existing) : [];
      const updated = [order, ...orders.filter((o) => o.id !== order.id)];
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("cafeyugen_orders_updated"));
    } catch {}
  }

  return { success: true };
}

/**
 * Order Management: Fetch all orders for Admin/Staff
 */
export async function fetchOrders(): Promise<OrderRecord[]> {
  const allOrders: OrderRecord[] = [];

  if (db) {
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const snapshot = await getDocs(ordersRef);
      snapshot.forEach((d) => {
        const data = d.data() as Partial<OrderRecord>;
        allOrders.push({
          id: data.id || d.id,
          customerId: data.customerId,
          customerName: data.customerName || "Customer",
          customerPhone: data.customerPhone || "",
          deliveryMethod: data.deliveryMethod || "pickup",
          shippingAddress: data.shippingAddress || "",
          pincode: data.pincode || "",
          items: Array.isArray(data.items) ? data.items : [],
          subtotal: data.subtotal,
          shippingFee: data.shippingFee,
          totalAmount: typeof data.totalAmount === "number" ? data.totalAmount : 0,
          paymentMode: data.paymentMode || "upi_advance_cod",
          status: (data.status as OrderStatus) || "pending",
          createdAt: data.createdAt || new Date().toISOString(),
          pickupTime: data.pickupTime || "Standard Dispatch",
          notes: data.notes || "",
          advancePaidAmount: data.advancePaidAmount,
          advanceTxnId: data.advanceTxnId,
        });
      });
    } catch (err) {
      console.warn("Could not fetch orders from Firestore:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id && !allOrders.some((o) => o.id === item.id)) {
              allOrders.push({
                id: item.id,
                customerId: item.customerId,
                customerName: item.customerName || "Customer",
                customerPhone: item.customerPhone || "",
                deliveryMethod: item.deliveryMethod || "pickup",
                shippingAddress: item.shippingAddress || "",
                pincode: item.pincode || "",
                items: Array.isArray(item.items) ? item.items : [],
                subtotal: item.subtotal,
                shippingFee: item.shippingFee,
                totalAmount: typeof item.totalAmount === "number" ? item.totalAmount : 0,
                paymentMode: item.paymentMode || "upi_advance_cod",
                status: (item.status as OrderStatus) || "pending",
                createdAt: item.createdAt || new Date().toISOString(),
                pickupTime: item.pickupTime || "Standard Dispatch",
                notes: item.notes || "",
                advancePaidAmount: item.advancePaidAmount,
                advanceTxnId: item.advanceTxnId,
              });
            }
          }
        }
      }
    } catch {}
  }

  allOrders.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  if (allOrders.length === 0) {
    return DEMO_ORDERS;
  }

  return allOrders;
}

/**
 * Order Management: Update Order Status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean }> {
  const updatedAt = new Date().toISOString();

  if (db) {
    try {
      await setDoc(doc(db, ORDERS_COLLECTION, orderId), { status, updatedAt }, { merge: true });
    } catch (err) {
      console.warn("Could not update order status in Firestore:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (local) {
        const parsed: OrderRecord[] = JSON.parse(local);
        const updated = parsed.map((o) =>
          o.id === orderId ? { ...o, status, updatedAt } : o
        );
        localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("cafeyugen_orders_updated"));
      }
    } catch {}
  }

  return { success: true };
}

/**
 * Boutique Appointment Management: Save Appointment
 */
export async function saveReservation(
  res: AppointmentRecord
): Promise<{ success: boolean }> {
  if (db) {
    try {
      await setDoc(doc(db, APPOINTMENTS_COLLECTION, res.id), res, { merge: true });
    } catch (err) {
      console.warn("Could not save appointment to Firestore:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const existing = localStorage.getItem(LOCAL_RESERVATIONS_KEY);
      const list: AppointmentRecord[] = existing ? JSON.parse(existing) : [];
      const updated = [res, ...list.filter((r) => r.id !== res.id)];
      localStorage.setItem(LOCAL_RESERVATIONS_KEY, JSON.stringify(updated));
    } catch {}
  }

  return { success: true };
}

/**
 * Boutique Appointment Management: Fetch all appointments
 */
export async function fetchReservations(): Promise<AppointmentRecord[]> {
  const list: AppointmentRecord[] = [];

  if (db) {
    try {
      const snap = await getDocs(collection(db, APPOINTMENTS_COLLECTION));
      snap.forEach((d) => {
        const data = d.data() as Partial<AppointmentRecord>;
        list.push({
          id: data.id || d.id,
          fullName: data.fullName || "Guest",
          phone: data.phone || "",
          date: data.date || new Date().toISOString().split("T")[0],
          time: data.time || "16:00",
          guests: typeof data.guests === "number" ? data.guests : 2,
          seatingPreference:
            data.seatingPreference || "Bridal Chooda & Shakha Consultation",
          preferredCollection: data.preferredCollection || "",
          specialRequests: data.specialRequests || "",
          status: data.status || "confirmed",
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
    } catch (err) {
      console.warn("Could not fetch appointments from Firestore:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(LOCAL_RESERVATIONS_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          for (const r of parsed) {
            if (r && r.id && !list.some((item) => item.id === r.id)) {
              list.push({
                id: r.id,
                fullName: r.fullName || "Guest",
                phone: r.phone || "",
                date: r.date || new Date().toISOString().split("T")[0],
                time: r.time || "16:00",
                guests: typeof r.guests === "number" ? r.guests : 2,
                seatingPreference:
                  r.seatingPreference || "Bridal Chooda & Shakha Consultation",
                preferredCollection: r.preferredCollection || "",
                specialRequests: r.specialRequests || "",
                status: r.status || "confirmed",
                createdAt: r.createdAt || new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch {}
  }

  list.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  if (list.length === 0) {
    return DEMO_APPOINTMENTS;
  }

  return list;
}

const DEMO_ORDERS: OrderRecord[] = [
  {
    id: "SB-20261126-8421",
    customerName: "Ananya Roy",
    customerPhone: "9832104592",
    deliveryMethod: "shipping",
    shippingAddress: "Station Road, Near Main Bazaar, Jalpaiguri",
    pincode: "735101",
    items: [
      {
        item: INITIAL_BANGLE_DESIGNS[0],
        quantity: 1,
        selectedSize: "2.4",
      },
      {
        item: INITIAL_BANGLE_DESIGNS[5],
        quantity: 1,
        selectedSize: "2.4",
      },
    ],
    subtotal: 3098,
    shippingFee: 0,
    totalAmount: 3098,
    paymentMode: "upi_advance_cod",
    advancePaidAmount: 620,
    advanceTxnId: "UPI/DEMO/8421-4991",
    pickupTime: "Express Courier (2-3 Days)",
    notes: "Gift box packaging for bridal trousseau.",
    status: "preparing",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "SB-20261126-7294",
    customerName: "Mousumi Das",
    customerPhone: "9734182931",
    deliveryMethod: "pickup",
    items: [
      {
        item: INITIAL_BANGLE_DESIGNS[10],
        quantity: 1,
        selectedSize: "2.6",
      },
      {
        item: INITIAL_BANGLE_DESIGNS[20],
        quantity: 2,
        selectedSize: "2.6",
      },
    ],
    subtotal: 1997,
    shippingFee: 0,
    totalAmount: 1997,
    paymentMode: "upi_advance_cod",
    advancePaidAmount: 400,
    advanceTxnId: "UPI/DEMO/7294-8113",
    pickupTime: "Today Evening (5:00 PM - 7:00 PM)",
    notes: "Store pickup at Gobindapally counter.",
    status: "ready",
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
];

const DEMO_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: "APT-20261126-101",
    fullName: "Riya Chakraborty",
    phone: "9832049182",
    date: "2026-11-28",
    time: "16:30",
    guests: 3,
    seatingPreference: "Bridal Chooda & Shakha Consultation",
    preferredCollection: "Bridal & Chooda Sets",
    specialRequests: "Need matching Shakha-Pola and golden kadas for December wedding.",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "APT-20261126-102",
    fullName: "Subhamita Sen",
    phone: "9474182901",
    date: "2026-11-29",
    time: "12:30",
    guests: 4,
    seatingPreference: "Bulk Wedding & Trousseau Order",
    preferredCollection: "Glass, Lac & Velvet Sets",
    specialRequests: "Selecting 15 return-gift glass bangle sets in mixed sizes.",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
];

const DEMO_STAFF: StaffMember[] = [];

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  const members: StaffMember[] = [];

  if (db) {
    try {
      const snap = await getDocs(collection(db, STAFF_COLLECTION));
      snap.forEach((d) => {
        const data = d.data() as Partial<StaffMember>;
        members.push({
          id: data.id || d.id,
          name: data.name || "Staff",
          email: (data.email || "").toLowerCase().trim(),
          password: data.password || "",
          role: data.role || "worker",
          department: data.department || "Dispatch & Store Pickup",
          createdAt: data.createdAt || new Date().toISOString(),
          createdBy: data.createdBy || "Manager",
        });
      });
    } catch (err) {
      console.warn("Could not fetch staff members from Firestore:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(LOCAL_STAFF_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (
              item &&
              item.id &&
              !members.some(
                (m) => m.id === item.id || m.email.toLowerCase() === item.email?.toLowerCase()
              )
            ) {
              members.push({
                id: item.id,
                name: item.name || "Staff",
                email: (item.email || "").toLowerCase().trim(),
                password: item.password || "",
                role: item.role || "worker",
                department: item.department || "Dispatch & Store Pickup",
                createdAt: item.createdAt || new Date().toISOString(),
                createdBy: item.createdBy || "Manager",
              });
            }
          }
        }
      }
    } catch {}
  }

  if (members.length === 0) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(DEMO_STAFF));
      } catch {}
    }
    return DEMO_STAFF;
  }

  return members;
}

export async function addStaffMember(params: {
  name: string;
  email: string;
  password: string;
  role?: StaffRole;
  department?: string;
  createdBy?: string;
}): Promise<{ success: boolean; message: string; member?: StaffMember }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim();
  const cleanPassword = params.password.trim();

  if (!cleanName) {
    return { success: false, message: "Please provide a member name." };
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, message: "Please provide a valid email address." };
  }
  if (!cleanPassword || cleanPassword.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long." };
  }

  const newMember: StaffMember = {
    id: `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    email: cleanEmail,
    password: cleanPassword,
    role: params.role || "worker",
    department: params.department || "Dispatch & Store Pickup",
    createdAt: new Date().toISOString(),
    createdBy: params.createdBy || "Manager",
  };

  if (db) {
    try {
      await setDoc(doc(db, STAFF_COLLECTION, newMember.id), newMember);
    } catch (err) {
      console.warn("Could not save staff member to Firestore:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const existing = localStorage.getItem(LOCAL_STAFF_KEY);
      const list: StaffMember[] = existing ? JSON.parse(existing) : [...DEMO_STAFF];
      const updated = [newMember, ...list.filter((m) => m.email.toLowerCase() !== cleanEmail)];
      localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("cafeyugen_staff_updated"));
    } catch {}
  }

  return {
    success: true,
    message: `Staff account created for "${cleanName}" (${cleanEmail}).`,
    member: newMember,
  };
}

export async function deleteStaffMember(
  memberId: string
): Promise<{ success: boolean; message: string }> {
  if (db) {
    try {
      await deleteDoc(doc(db, STAFF_COLLECTION, memberId));
    } catch (err) {
      console.warn("Could not delete staff member from Firestore:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const existing = localStorage.getItem(LOCAL_STAFF_KEY);
      if (existing) {
        const list: StaffMember[] = JSON.parse(existing);
        const updated = list.filter((m) => m.id !== memberId);
        localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("cafeyugen_staff_updated"));
      }
    } catch {}
  }

  return { success: true, message: "Staff member deleted successfully." };
}
