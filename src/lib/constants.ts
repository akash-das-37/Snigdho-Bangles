import { BangleSize } from "@/types";

export const STORE_INFO = {
  brandName: "Snigdho Bangles",
  tagline: "Handcrafted Tradition & Royal Bridal Elegance",
  addressLine1: "Gobindapally, Nearby Jalpaiguri Bus Stand",
  addressLine2: "Dhupguri, Jalpaiguri, West Bengal 735210",
  fullAddress:
    "Gobindapally, Nearby Jalpaiguri Bus Stand, Dhupguri, Jalpaiguri, West Bengal 735210",
  phoneDisplay: "+91 861 736 1064",
  phoneHref: "tel:+918617361064",
  whatsappNumber: "918617361064",
  whatsappUrl: "https://wa.me/918617361064",
  hoursDisplay: "10:00 AM – 9:00 PM",
  hoursFull: "Monday – Sunday: 10:00 AM – 9:00 PM",
  upiId: "subir.kumar.biswas1970@okaxis",
  upiBeneficiary: "Subir Kumar Biswas",
  upiQrImage: "/images/upi-qr.jpg",
  mapQuery: "Gobindapally+Dhupguri+West+Bengal+735210",
};

export const BANGLE_SIZES: { size: BangleSize; diameter: string }[] = [
  { size: "2.3", diameter: "55.5 mm (S)" },
  { size: "2.4", diameter: "57 mm (M)" },
  { size: "2.5", diameter: "58.5 mm (M-L)" },
  { size: "2.6", diameter: "60 mm (L)" },
  { size: "Free Size", diameter: "Adjustable" },
];

export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING_FEE = 60;

export const ADVANCE_PAYMENT_NOTE =
  "Pay minimum 20% advance via UPI to confirm Cash on Delivery (COD) or store pickup reservation.";

export const ADVANCE_PERCENTAGE = 0.2;
