import { z } from "zod";
import { CartItem, DeliveryMethod, AppointmentFormData } from "@/types";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, STORE_INFO } from "@/lib/constants";

// Sanitizer to strip dangerous HTML tags and script injections
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>?/gm, "")
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "'":
          return "&#39;";
        case '"':
          return "&quot;";
        case "&":
          return "&amp;";
        default:
          return char;
      }
    })
    .trim();
}

const indianPhoneRegex = /^[6-9]\d{9}$/;

export const appointmentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must not exceed 60 characters")
    .transform((val) => sanitizeInput(val)),
  phone: z
    .string()
    .trim()
    .regex(indianPhoneRegex, "Enter a valid 10-digit Indian mobile number (e.g., 9876543210)"),
  date: z.string().min(1, "Please select an appointment date"),
  time: z
    .string()
    .min(1, "Please select a store visit time")
    .refine((val) => {
      if (!val) return false;
      const [hours, mins] = val.split(":").map(Number);
      const totalMinutes = hours * 60 + mins;
      // 10:00 AM (600) to 8:30 PM (1230)
      return totalMinutes >= 600 && totalMinutes <= 1230;
    }, "Boutique visit slots are between 10:00 AM and 8:30 PM"),
  guests: z
    .number()
    .min(1, "At least 1 visitor required")
    .max(15, "For large family wedding groups above 15, please WhatsApp us directly"),
  seatingPreference: z.enum([
    "Bridal Chooda & Shakha Consultation",
    "Custom Size & Wrist Measurement",
    "Bulk Wedding & Trousseau Order",
    "Festival & Gifting Selection",
  ]),
  preferredCollection: z.string().max(80).optional(),
  specialRequests: z
    .string()
    .max(200, "Notes cannot exceed 200 characters")
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : "")),
  botHoneypot: z.string().max(0, "Bot detected").optional().or(z.literal("")),
});

export type AppointmentSchemaType = z.infer<typeof appointmentSchema>;

/** @deprecated Use appointmentSchema */
export const reservationSchema = appointmentSchema;

/**
 * Builds a formatted, secure WhatsApp URL for bangle order submission
 */
export function generateWhatsAppOrderUrl({
  items,
  diningOption,
  customerName,
  customerPhone,
  addressOrTable,
  notes,
  advancePaidAmount,
  advanceTxnId,
  orderRef,
}: {
  items: CartItem[];
  diningOption: DeliveryMethod;
  customerName: string;
  customerPhone: string;
  addressOrTable?: string;
  notes?: string;
  advancePaidAmount?: number;
  advanceTxnId?: string;
  orderRef?: string;
}): string {
  const cleanName = sanitizeInput(customerName);
  const cleanAddress = sanitizeInput(addressOrTable || "");
  const cleanNotes = sanitizeInput(notes || "");

  const deliveryLabels: Record<DeliveryMethod, string> = {
    shipping: "📦 Home Delivery / Courier Shipping",
    pickup: "🏬 Boutique Store Pickup (Gobindapally, Dhupguri)",
  };

  const subtotal = items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const shippingFee =
    diningOption === "shipping" && subtotal < FREE_SHIPPING_THRESHOLD
      ? STANDARD_SHIPPING_FEE
      : 0;
  const grandTotal = subtotal + shippingFee;

  let text = `*New Bangle Order - ${STORE_INFO.brandName}*\n`;
  if (orderRef) {
    text += `*Order ID:* ${orderRef}\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Delivery:* ${deliveryLabels[diningOption]}\n`;
  text += `*Customer:* ${cleanName} (+91 ${customerPhone})\n`;

  if (diningOption === "shipping" && cleanAddress) {
    text += `*Shipping Address:* ${cleanAddress}\n`;
  } else if (diningOption === "pickup" && cleanAddress) {
    text += `*Pickup Slot / Note:* ${cleanAddress}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Selected Designs:*\n`;

  items.forEach((ci, idx) => {
    const itemTotal = ci.item.price * ci.quantity;
    text += `${idx + 1}. ${ci.item.name} [Size: ${ci.selectedSize || "2.4"}] x ${ci.quantity} = ₹${itemTotal}\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Subtotal:* ₹${subtotal}\n`;
  text += `*Shipping / Packaging:* ${shippingFee > 0 ? `₹${shippingFee}` : "FREE"}\n`;
  text += `*Grand Total:* ₹${grandTotal}\n`;

  const paid = advancePaidAmount ?? Math.ceil(grandTotal * 0.2);
  const balance = Math.max(0, grandTotal - paid);

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*💳 Payment Summary:*\n`;
  text += `• *Advance / Paid via UPI:* ₹${paid}${advanceTxnId ? ` (Ref: ${advanceTxnId})` : ""}\n`;
  text += `• *Balance Payable (${diningOption === "shipping" ? "COD" : "At Store"}):* ₹${balance}\n`;

  if (cleanNotes) {
    text += `\n*Custom Sizing / Gift Notes:* ${cleanNotes}\n`;
  }

  text += `\n_Please confirm dispatch / readiness timing for my Snigdho Bangles order. Thank you!_`;

  return `https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Builds WhatsApp confirmation link for boutique styling appointments
 */
export function generateWhatsAppReservationUrl(
  data: AppointmentFormData & { id?: string }
): string {
  let text = `*Boutique Visit & Bridal Styling Request - ${STORE_INFO.brandName}*\n`;
  if (data.id) {
    text += `*Booking ID:* ${data.id}\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Customer:* ${data.fullName}\n`;
  text += `*Phone:* +91 ${data.phone}\n`;
  text += `*Date:* ${data.date}\n`;
  text += `*Time:* ${data.time}\n`;
  text += `*Visitors:* ${data.guests} person(s)\n`;
  text += `*Consultation Type:* ${data.seatingPreference}\n`;

  if (data.preferredCollection) {
    text += `*Preferred Collection:* ${data.preferredCollection}\n`;
  }
  if (data.specialRequests) {
    text += `*Size / Custom Notes:* ${data.specialRequests}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Store:* ${STORE_INFO.fullAddress}\n`;
  text += `_Looking forward to visiting Snigdho Bangles!_`;

  return `https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
