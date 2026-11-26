import { BangleDesign, CartItem } from "@/types";
import { INITIAL_BANGLE_DESIGNS } from "@/data/bangles";

export interface RecommendationItem {
  dish: BangleDesign;
  reason: string;
}

export function getRecommendedItems(
  cartItems: CartItem[],
  allDesigns: BangleDesign[] = INITIAL_BANGLE_DESIGNS
): RecommendationItem[] {
  const cartIds = new Set(cartItems.map((ci) => ci.item.id));
  const cartCategories = new Set(cartItems.map((ci) => ci.item.category));

  const available = allDesigns.filter((d) => !cartIds.has(d.id) && d.inStock);
  const recommendations: RecommendationItem[] = [];

  // Rule 1: If cart has Shakha-Pola, recommend Gold-Plated Filigree or Loha Badhano!
  if (cartCategories.has("Shakha-Pola & Bengali Heritage")) {
    const chur = available.find((d) => d.id === "gp-3");
    if (chur) {
      recommendations.push({
        dish: chur,
        reason: "Traditional gold-plated framing for Shakha & Pola sets",
      });
    }
    const loha = available.find((d) => d.id === "sp-4");
    if (loha && recommendations.length < 3) {
      recommendations.push({
        dish: loha,
        reason: "Completes your auspicious Bengali bridal wrist trio",
      });
    }
  }

  // Rule 2: If cart has Bridal Chooda, recommend Statement Kada or Velvet Churi stack
  if (cartCategories.has("Bridal & Chooda Sets")) {
    const kundan = available.find((d) => d.id === "kp-1");
    if (kundan && !recommendations.some((r) => r.dish.id === kundan.id)) {
      recommendations.push({
        dish: kundan,
        reason: "Royal Polki end-kadas to frame your Bridal Chooda",
      });
    }
    const velvet = available.find((d) => d.id === "gv-2");
    if (velvet && !recommendations.some((r) => r.dish.id === velvet.id)) {
      recommendations.push({
        dish: velvet,
        reason: "Plush ruby velvet accents for Haldi & Sangeet",
      });
    }
  }

  // Rule 3: If no Daily Wear / Oxidized in cart, suggest sleek stacking pair
  if (!cartCategories.has("Daily Wear & Oxidized")) {
    const roseGold = available.find((d) => d.id === "do-1");
    if (roseGold && !recommendations.some((r) => r.dish.id === roseGold.id)) {
      recommendations.push({
        dish: roseGold,
        reason: "Tarnish-resistant AD stack for effortless everyday sparkle",
      });
    }
  }

  // Rule 4: If no Glass / Velvet in cart, suggest Firozabad stack
  if (!cartCategories.has("Glass, Lac & Velvet Sets")) {
    const glass = available.find((d) => d.id === "gv-1");
    if (glass && !recommendations.some((r) => r.dish.id === glass.id)) {
      recommendations.push({
        dish: glass,
        reason: "Bestselling 24-piece Firozabad glass & zari festive stack",
      });
    }
  }

  // Fallback: Fill remaining slots with customer favorites
  if (recommendations.length < 3) {
    const favorites = available.filter(
      (d) => d.isFavorite && !recommendations.some((r) => r.dish.id === d.id)
    );
    for (const fav of favorites) {
      if (recommendations.length >= 3) break;
      recommendations.push({
        dish: fav,
        reason: "Snigdho Bangles customer favorite & highly rated",
      });
    }
  }

  return recommendations.slice(0, 3);
}
