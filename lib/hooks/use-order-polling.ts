'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OrderWorkflowStatus } from '@/lib/constants/order-status';

type KitchenOrderItem = {
  id: string;
  quantity: number;
  product: { name: string };
};

export type KitchenOrder = {
  id: string;
  orderNo: string;
  status: OrderWorkflowStatus;
  mode: string;
  total: number | string;
  createdAt: string;
  table?: { code?: string } | null;
  items: KitchenOrderItem[];
};

type ApiResult<T> = { success: true; data: T } | { success: false; error: { message: string } };

function buildSignature(orders: KitchenOrder[]) {
  return orders.map((o) => `${o.id}:${o.status}:${o.createdAt}`).join('|');
}

export function useOrderPolling(intervalMs = 5000) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const signatureRef = useRef('');

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = (await res.json()) as ApiResult<KitchenOrder[]> | KitchenOrder[];

      let nextOrders: KitchenOrder[];
      if (Array.isArray(data)) {
        nextOrders = data;
      } else if (data && 'success' in data && data.success) {
        nextOrders = data.data;
      } else {
        throw new Error('訂單載入失敗');
      }

      const nextSignature = buildSignature(nextOrders);
      if (nextSignature !== signatureRef.current) {
        signatureRef.current = nextSignature;
        setOrders(nextOrders);
      }
      setError(null);
    } catch (e) {
      setError((e as Error).message || '訂單載入失敗');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  const applyLocalStatus = useCallback((orderId: string, status: OrderWorkflowStatus) => {
    setOrders((prev) => {
      const next = prev.map((order) => (order.id === orderId ? { ...order, status } : order));
      signatureRef.current = buildSignature(next);
      return next;
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(() => {
      refresh();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, refresh]);

  return useMemo(
    () => ({ orders, loading, error, refresh, applyLocalStatus }),
    [orders, loading, error, refresh, applyLocalStatus]
  );
}
