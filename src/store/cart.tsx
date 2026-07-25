// Cart state. React context persisted to localStorage.
//
// The cart holds ONE-TIME line items only. Subscriptions start their own
// single-item Checkout Session directly (Stripe Checkout will not mix a
// one-time payment and a recurring subscription in the same session), so a
// "Subscribe & save" action bypasses the cart entirely.
//
// House style: no em dashes.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CATALOG, getSku } from "../content/store";

export type CartLine = { id: string; qty: number };

const STORAGE_KEY = "berrova.cart.v1";
const MAX_QTY = 99;

const VALID_IDS = new Set(CATALOG.map((s) => s.id));

function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_QTY, Math.floor(n)));
}

// Load + sanitise from localStorage: drop unknown ids and bad quantities so a
// stale or tampered cart can never reach the Worker with a junk SKU.
function readStored(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const clean: CartLine[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const id = (entry as CartLine).id;
      const qty = (entry as CartLine).qty;
      if (typeof id !== "string" || !VALID_IDS.has(id) || seen.has(id)) continue;
      seen.add(id);
      clean.push({ id, qty: clampQty(qty) });
    }
    return clean;
  } catch {
    return [];
  }
}

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  // Drawer visibility lives here so the Nav button and page buttons share it.
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readStored);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage blocked (private mode, quota). Cart still works in-session.
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotalCents = lines.reduce((sum, l) => {
      const sku = getSku(l.id);
      return sum + (sku ? sku.oneTimeCents * l.qty : 0);
    }, 0);

    const add = (id: string, qty = 1) => {
      if (!VALID_IDS.has(id)) return;
      setLines((prev) => {
        const found = prev.find((l) => l.id === id);
        if (found) {
          return prev.map((l) =>
            l.id === id ? { ...l, qty: clampQty(l.qty + qty) } : l
          );
        }
        return [...prev, { id, qty: clampQty(qty) }];
      });
    };

    const setQty = (id: string, qty: number) => {
      setLines((prev) => {
        if (qty <= 0) return prev.filter((l) => l.id !== id);
        return prev.map((l) => (l.id === id ? { ...l, qty: clampQty(qty) } : l));
      });
    };

    const remove = (id: string) =>
      setLines((prev) => prev.filter((l) => l.id !== id));

    const clear = () => setLines([]);

    return {
      lines,
      count,
      subtotalCents,
      add,
      setQty,
      remove,
      clear,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    };
  }, [lines, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
