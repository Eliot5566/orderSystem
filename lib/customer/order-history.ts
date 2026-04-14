export type CustomerOrderHistoryItem = {
  id: string;
  orderNo: string;
  createdAt: string;
  total?: number;
};

const ORDER_HISTORY_KEY = 'customer_order_history_v1';
const ORDER_HISTORY_LIMIT = 30;

function normalize(items: unknown): CustomerOrderHistoryItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => item as CustomerOrderHistoryItem)
    .filter((item) => typeof item.id === 'string' && item.id.length > 0 && typeof item.orderNo === 'string' && item.orderNo.length > 0)
    .map((item) => ({
      id: item.id,
      orderNo: item.orderNo,
      createdAt: typeof item.createdAt === 'string' && item.createdAt ? item.createdAt : new Date().toISOString(),
      total: typeof item.total === 'number' ? item.total : undefined
    }));
}

export function readOrderHistory(): CustomerOrderHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ORDER_HISTORY_KEY);
    if (!raw) return [];
    return normalize(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeOrderHistory(items: CustomerOrderHistoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const normalized = normalize(items)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, ORDER_HISTORY_LIMIT);
    window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(normalized));
  } catch {
    // ignore
  }
}

export function addOrderToHistory(item: CustomerOrderHistoryItem) {
  const prev = readOrderHistory();
  const next = [item, ...prev.filter((x) => x.id !== item.id)];
  writeOrderHistory(next);
}
