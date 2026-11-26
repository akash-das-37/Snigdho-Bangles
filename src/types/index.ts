export type BangleCategory =
  | "All Designs"
  | "Bridal & Chooda Sets"
  | "Shakha-Pola & Bengali Heritage"
  | "Kundan, Polki & Meenakari"
  | "Gold-Plated & Temple Kada"
  | "Glass, Lac & Velvet Sets"
  | "Daily Wear & Oxidized";

export type BangleSize = "2.2" | "2.4" | "2.6" | "2.8" | "Free Size";

export interface BangleDesign {
  id: string;
  name: string;
  category: BangleCategory;
  price: number;
  description: string;
  material: string;
  packCount: string;
  sizes: BangleSize[];
  inStock: boolean;
  isFavorite?: boolean;
  badge?: string;
  image: string;
  dispatchTime?: string;
}

/** @deprecated Use BangleDesign instead */
export type MenuCategory = BangleCategory;
/** @deprecated Use BangleDesign instead */
export type MenuItem = BangleDesign;

export interface CartItem {
  item: BangleDesign;
  quantity: number;
  selectedSize: BangleSize;
}

export type DeliveryMethod = "shipping" | "pickup";
/** @deprecated Use DeliveryMethod instead */
export type DiningOption = DeliveryMethod;

export type PaymentMode = "upi_advance_cod" | "upi_full";

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export interface OrderRecord {
  id: string; // Order Reference Token, e.g. SB-20261126-4921
  customerId?: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  shippingAddress?: string;
  pincode?: string;
  pickupTime: string;
  items: CartItem[];
  subtotal?: number;
  shippingFee?: number;
  totalAmount: number;
  paymentMode?: PaymentMode;
  advancePaidAmount?: number;
  advanceTxnId?: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

export type AppointmentServiceType =
  | "Bridal Chooda & Shakha Consultation"
  | "Custom Size & Wrist Measurement"
  | "Bulk Wedding & Trousseau Order"
  | "Festival & Gifting Selection";

export interface AppointmentFormData {
  fullName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  seatingPreference: AppointmentServiceType;
  preferredCollection?: string;
  specialRequests?: string;
  botHoneypot?: string;
}

export interface AppointmentRecord {
  id: string;
  fullName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  seatingPreference: string;
  preferredCollection?: string;
  specialRequests?: string;
  status: "confirmed" | "seated" | "completed" | "cancelled";
  createdAt: string;
}

/** @deprecated Use AppointmentFormData instead */
export type ReservationFormData = AppointmentFormData;
/** @deprecated Use AppointmentRecord instead */
export type ReservationRecord = AppointmentRecord;

export type StaffRole = "manager" | "worker";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: StaffRole;
  department?: string;
  createdAt: string;
  createdBy?: string;
}
