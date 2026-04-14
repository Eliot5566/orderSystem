'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { readOrderHistory } from '@/lib/customer/order-history';

type OrderDetail = {
  id: string;
  orderNo: string;
  status: string;
  createdAt: string;
  mode: string;
  customerNote?: string | null;
  total: number | string;
  table?: { code?: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    note?: string | null;
    unitPrice: number | string;
    optionPrice: number | string;
    product: { name: string };
  }>;
};

type ApiResult<T> = { success: true; data: T } | { success: false; error: { message?: string } };

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-TW', { hour12: false });
}

export default function CustomerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = String(params.id || '');

  const [row, setRow] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allowed = useMemo(() => readOrderHistory().some((item) => item.id === orderId), [orderId]);

  useEffect(() => {
    if (!orderId || !allowed) {
      setLoading(false);
      return;
    }

    let disposed = false;

    async function load(isBackground = false) {
      if (!isBackground) {
        setLoading(true);
        setError(null);
      }
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        const data = (await res.json()) as ApiResult<OrderDetail>;

        if (!res.ok || !data.success) {
          throw new Error(!data.success ? data.error?.message || '載入失敗' : '載入失敗');
        }

        if (!disposed) {
          setRow(data.data);
        }
      } catch (e) {
        if (!isBackground && !disposed) {
          setError((e as Error).message || '載入失敗');
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    load();

    const timer = window.setInterval(() => {
      load(true);
    }, 5000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [orderId, allowed]);

  if (!allowed) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="mb-4 text-xl font-bold">訂單詳情</h1>
        <div className="card text-center">
          <p className="text-sm text-slate-500">找不到此訂單，或此訂單不屬於目前使用者。</p>
          <Link href="/customer/orders" className="mt-3 inline-block rounded bg-brand-700 px-4 py-2 text-white">返回我的訂單</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-xl font-bold">訂單詳情</h1>

      {loading ? <div className="card text-sm text-slate-500">載入中...</div> : null}
      {error ? <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {!loading && !error && row ? (
        <article className="card">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-semibold">#{row.orderNo}</p>
              <p className="text-xs text-slate-500">{formatTime(row.createdAt)} ・ {row.table?.code ? `桌號 ${row.table.code}` : row.mode}</p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{row.status}</span>
          </div>

          {row.customerNote ? <p className="mb-2 rounded bg-slate-50 p-2 text-sm text-slate-700">備註：{row.customerNote}</p> : null}

          <ul className="space-y-2 text-sm">
            {row.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p>{item.product.name}</p>
                  <p className="text-xs text-slate-500">單價 NT$ {Number(item.unitPrice)} / 加料 NT$ {Number(item.optionPrice)}</p>
                  {item.note ? <p className="text-xs text-slate-500">備註：{item.note}</p> : null}
                </div>
                <p>x {item.quantity}</p>
              </li>
            ))}
          </ul>

          <p className="mt-3 border-t pt-3 text-right font-semibold">總計 NT$ {Number(row.total)}</p>
          <p className="mt-1 text-right text-xs text-slate-500">狀態每 5 秒自動重新整理</p>

          <div className="mt-3 text-right">
            <Link href="/customer/orders" className="text-sm text-brand-700 hover:underline">返回我的訂單</Link>
          </div>
        </article>
      ) : null}
    </main>
  );
}
