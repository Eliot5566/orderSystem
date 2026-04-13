export type CartItem = {
  storeId?: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: unknown[];
};

const CART_STORAGE_KEY = 'customer_cart_v1';

function normalize(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => item as CartItem)
    .filter((item) => !!item.productId && Number(item.quantity) > 0)
    .map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      price: Number(item.price ?? 0)
    }));
}

export function readCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return normalize(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalize(items)));
  } catch {
    // ignore storage write failures
  }
}

export function clearCartStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // ignore storage clear failures
  }
}

export function parsePayloadToCart(payload: string | null): { ok: true; items: CartItem[] } | { ok: false; items: CartItem[] } {
  if (!payload) return { ok: true, items: [] };
  try {
    const parsed = JSON.parse(decodeURIComponent(payload));
    return { ok: true, items: normalize(parsed) };
  } catch {
    return { ok: false, items: [] };
  }
}
