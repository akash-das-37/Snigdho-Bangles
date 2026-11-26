"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { BangleDesign, BangleSize, CartItem, DeliveryMethod } from "@/types";
import { getLatestItemPriceSync, fetchMenuItems } from "@/lib/firebase";

interface CartContextType {
  items: CartItem[];
  addToCart: (item: BangleDesign, size?: BangleSize) => void;
  removeFromCart: (itemId: string, size?: BangleSize) => void;
  updateQuantity: (itemId: string, delta: number, size?: BangleSize) => void;
  updateItemSize: (itemId: string, oldSize: BangleSize, newSize: BangleSize) => void;
  clearCart: () => void;
  refreshCartPrices: () => void;
  syncWithServer: () => Promise<{ updated: boolean; items: CartItem[] }>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  diningOption: DeliveryMethod;
  setDiningOption: (opt: DeliveryMethod) => void;
  totalCount: number;
  subtotal: number;
  getItemQuantity: (itemId: string, size?: BangleSize) => number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "snigdho_bangles_cart_v1";

function syncItemPrices(cartList: CartItem[]): CartItem[] {
  let changed = false;
  const verified = cartList.map((ci) => {
    const livePrice = getLatestItemPriceSync(ci.item.id, ci.item.price);
    const resolvedSize: BangleSize = ci.selectedSize || ci.item.sizes?.[0] || "2.4";
    if (ci.item.price !== livePrice || ci.selectedSize !== resolvedSize) {
      changed = true;
      return {
        ...ci,
        selectedSize: resolvedSize,
        item: {
          ...ci.item,
          price: livePrice,
        },
      };
    }
    return ci;
  });
  return changed ? verified : cartList;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [diningOption, setDiningOption] = useState<DeliveryMethod>("shipping");
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // 1. Hydrate from localStorage asynchronously to avoid synchronous setState in effect warning
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const verified = syncItemPrices(parsed);
            setItems(verified);
            itemsRef.current = verified;
          }
        }
      } catch {
        // ignore
      } finally {
        setIsHydrated(true);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // 2. Fetch live Firestore designs on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLivePrices() {
      try {
        const { items: liveDesigns } = await fetchMenuItems();
        if (isMounted && liveDesigns && liveDesigns.length > 0) {
          setItems((prev) => {
            let changed = false;
            const updated = prev.map((ci) => {
              const liveDesign = liveDesigns.find((d) => d.id === ci.item.id);
              if (liveDesign && liveDesign.price !== ci.item.price) {
                changed = true;
                return {
                  ...ci,
                  item: {
                    ...ci.item,
                    price: liveDesign.price,
                  },
                };
              }
              return ci;
            });
            return changed ? updated : prev;
          });
        }
      } catch (err) {
        console.warn("Could not sync live catalog in CartProvider:", err);
      }
    }

    loadLivePrices();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Listen for catalog updates from admin portal
  useEffect(() => {
    const handleMenuUpdated = () => {
      setItems((prev) => syncItemPrices(prev));
    };

    window.addEventListener("cafeyugen_menu_updated", handleMenuUpdated);
    window.addEventListener("storage", handleMenuUpdated);

    return () => {
      window.removeEventListener("cafeyugen_menu_updated", handleMenuUpdated);
      window.removeEventListener("storage", handleMenuUpdated);
    };
  }, []);

  // 4. Persist cart to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isHydrated]);

  const refreshCartPrices = useCallback(() => {
    setItems((prev) => syncItemPrices(prev));
  }, []);

  // Deterministic server price verification computed cleanly outside setState
  const syncWithServer = useCallback(async (): Promise<{
    updated: boolean;
    items: CartItem[];
  }> => {
    const current = itemsRef.current;
    try {
      const { items: liveDesigns } = await fetchMenuItems();
      if (liveDesigns && liveDesigns.length > 0) {
        let changed = false;
        const nextList = current.map((ci) => {
          const liveDesign = liveDesigns.find((d) => d.id === ci.item.id);
          if (liveDesign && liveDesign.price !== ci.item.price) {
            changed = true;
            return {
              ...ci,
              item: {
                ...ci.item,
                price: liveDesign.price,
              },
            };
          }
          return ci;
        });

        if (changed) {
          itemsRef.current = nextList;
          setItems(nextList);
          return { updated: true, items: nextList };
        }
        return { updated: false, items: current };
      }
    } catch (err) {
      console.warn("Server price verification fallback:", err);
    }
    return { updated: false, items: current };
  }, []);

  const addToCart = (item: BangleDesign, size?: BangleSize) => {
    const verifiedPrice = getLatestItemPriceSync(item.id, item.price);
    const verifiedItem: BangleDesign = { ...item, price: verifiedPrice };
    const chosenSize: BangleSize = size || item.sizes?.[0] || "2.4";

    setItems((prev) => {
      const existing = prev.find(
        (ci) => ci.item.id === verifiedItem.id && ci.selectedSize === chosenSize
      );
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === verifiedItem.id && ci.selectedSize === chosenSize
            ? { ...ci, item: verifiedItem, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prev, { item: verifiedItem, quantity: 1, selectedSize: chosenSize }];
    });
  };

  const removeFromCart = (itemId: string, size?: BangleSize) => {
    setItems((prev) =>
      prev.filter((ci) =>
        size ? !(ci.item.id === itemId && ci.selectedSize === size) : ci.item.id !== itemId
      )
    );
  };

  const updateQuantity = (itemId: string, delta: number, size?: BangleSize) => {
    setItems((prev) =>
      prev
        .map((ci) => {
          const matches = size
            ? ci.item.id === itemId && ci.selectedSize === size
            : ci.item.id === itemId;
          if (matches) {
            const newQty = ci.quantity + delta;
            const livePrice = getLatestItemPriceSync(ci.item.id, ci.item.price);
            return newQty > 0
              ? {
                  ...ci,
                  quantity: newQty,
                  item: { ...ci.item, price: livePrice },
                }
              : null;
          }
          return ci;
        })
        .filter((ci): ci is CartItem => ci !== null)
    );
  };

  const updateItemSize = (itemId: string, oldSize: BangleSize, newSize: BangleSize) => {
    if (oldSize === newSize) return;
    setItems((prev) => {
      const target = prev.find((ci) => ci.item.id === itemId && ci.selectedSize === oldSize);
      if (!target) return prev;
      const duplicate = prev.find((ci) => ci.item.id === itemId && ci.selectedSize === newSize);
      if (duplicate) {
        return prev
          .filter((ci) => !(ci.item.id === itemId && ci.selectedSize === oldSize))
          .map((ci) =>
            ci.item.id === itemId && ci.selectedSize === newSize
              ? { ...ci, quantity: ci.quantity + target.quantity }
              : ci
          );
      }
      return prev.map((ci) =>
        ci.item.id === itemId && ci.selectedSize === oldSize
          ? { ...ci, selectedSize: newSize }
          : ci
      );
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (itemId: string, size?: BangleSize): number => {
    if (size) {
      const found = items.find((ci) => ci.item.id === itemId && ci.selectedSize === size);
      return found ? found.quantity : 0;
    }
    return items
      .filter((ci) => ci.item.id === itemId)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  };

  const totalCount = items.reduce((sum, ci) => sum + ci.quantity, 0);

  const subtotal = items.reduce((sum, ci) => {
    const verifiedPrice = getLatestItemPriceSync(ci.item.id, ci.item.price);
    return sum + verifiedPrice * ci.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemSize,
        clearCart,
        refreshCartPrices,
        syncWithServer,
        isCartOpen,
        setIsCartOpen,
        diningOption,
        setDiningOption,
        totalCount,
        subtotal,
        getItemQuantity,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
