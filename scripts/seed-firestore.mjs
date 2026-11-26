/**
 * Seed script for Snigdho Bangles catalog designs into Firestore
 * Run with: npm run seed
 */
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lightweight .env.local parser (avoids requiring external dotenv package)
function loadEnvLocal(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let val = trimmed.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal(join(__dirname, "../.env.local"));

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase configuration missing in .env.local.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const bangleDesigns = [
  {
    id: "bc-1",
    name: "Maharani Crimson Bridal Chooda Set",
    category: "Bridal & Chooda Sets",
    price: 2199,
    description:
      "Traditional 24-piece deep crimson & ivory bridal chooda framed with mirror-cut kundan kadas and delicate golden pearl hangings.",
    material: "Premium Acrylic, Lac & Kundan",
    packCount: "Set of 24 Bangles",
    sizes: ["2.2", "2.4", "2.6", "2.8"],
    inStock: true,
    isFavorite: true,
    badge: "Bridal Bestseller",
    image: "/images/bangles/bridal-chooda.jpg",
    dispatchTime: "Same-Day Dispatch",
  },
  {
    id: "sp-1",
    name: "Bong Heritage Gold-Filigree Shakha & Pola Pair",
    category: "Shakha-Pola & Bengali Heritage",
    price: 899,
    description:
      "Authentic Bengali bridal ivory white carved Shakha paired with glossy coral-red Pola featuring intricate 22K-look gold-plated patti work.",
    material: "Conch-Finish Acrylic & Coral Pola",
    packCount: "Combo (2 Shakha + 2 Pola)",
    sizes: ["2.2", "2.4", "2.6", "2.8"],
    inStock: true,
    isFavorite: true,
    badge: "Dhupguri #1 Favorite",
    image: "/images/bangles/shakha-pola.jpg",
    dispatchTime: "Same-Day Dispatch",
  },
  {
    id: "kp-1",
    name: "Nizam Emerald Drop Kundan Polki Kada",
    category: "Kundan, Polki & Meenakari",
    price: 1299,
    description:
      "Hand-set uncut polki kundan stones bordered by translucent emerald beads and fine seed-pearl clusters.",
    material: "Kundan, Polki & Brass",
    packCount: "Pair (2 Kadas)",
    sizes: ["2.4", "2.6", "2.8"],
    inStock: true,
    isFavorite: true,
    badge: "Designer Pick",
    image: "/images/bangles/kundan-polki.jpg",
    dispatchTime: "Same-Day Dispatch",
  },
  {
    id: "gp-1",
    name: "Nakshi Peacock Antique Gold-Plated Kangan",
    category: "Gold-Plated & Temple Kada",
    price: 999,
    description:
      "Intricately embossed peacock & lotus nakshi carvings finished in matte antique 22K gold tone.",
    material: "22K Micro Gold-Plated Brass",
    packCount: "Pair (2 Kangans)",
    sizes: ["2.2", "2.4", "2.6", "2.8"],
    inStock: true,
    isFavorite: true,
    badge: "Gold-Look Classic",
    image: "/images/bangles/gold-plated.jpg",
    dispatchTime: "Same-Day Dispatch",
  },
  {
    id: "gv-1",
    name: "Firozabad Emerald & Gold Glitter Glass Stack",
    category: "Glass, Lac & Velvet Sets",
    price: 349,
    description:
      "Hand-crafted bottle-green glass bangles layered with gold zari glitter and dainty pearl borders.",
    material: "Pure Firozabad Glass & Zari",
    packCount: "2 Dozen (24 Bangles)",
    sizes: ["2.2", "2.4", "2.6", "2.8"],
    inStock: true,
    isFavorite: true,
    badge: "Value Stack",
    image: "/images/bangles/glass-velvet.jpg",
    dispatchTime: "Same-Day Dispatch",
  },
  {
    id: "do-1",
    name: "Rose-Gold American Diamond Slim Stack",
    category: "Daily Wear & Oxidized",
    price: 549,
    description:
      "Tarnish-resistant rose-gold plated slender bangles sparkling with precision-cut cubic zirconia AD stones.",
    material: "Rose-Gold Plated Brass & AD",
    packCount: "Set of 4 Bangles",
    sizes: ["2.2", "2.4", "2.6", "2.8"],
    inStock: true,
    isFavorite: true,
    badge: "Office & Party",
    image: "/images/bangles/daily-wear.jpg",
    dispatchTime: "Same-Day Dispatch",
  },
];

async function seedDatabase() {
  console.log("Starting Firestore seeding for Snigdho Bangles...");
  let count = 0;

  for (const item of bangleDesigns) {
    try {
      await setDoc(doc(db, "bangle_designs", item.id), item, { merge: true });
      count++;
      console.log(`Seeded [${count}/${bangleDesigns.length}]: ${item.name}`);
    } catch (error) {
      console.error(`Failed to seed ${item.name}:`, error);
    }
  }

  console.log(`\nSuccessfully seeded ${count} designs into 'bangle_designs' collection!`);
  process.exit(0);
}

seedDatabase();
