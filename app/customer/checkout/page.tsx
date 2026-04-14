'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clearCartStorage, parsePayloadToCart, readCartFromStorage } from '@/lib/customer/cart-storage';
import { addOrderToHistory } from '@/lib/customer/order-history';

function isCuid(value?: string) {
  return typeof value === 'string' && /^c[a-z0-9]{24}$/i.test(value);
}

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const payload = params.get('payload');
  const parsed = useMemo(() => parsePayloadToCart(payload), [payload]);

  const items = useMemo(() => (parsed.ok && parsed.items.length ? parsed.items : readCartFromStorage()), [parsed.ok, parsed.items]);
  const subtotal = items.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const submit = async () => {
    setSubmitError(null);
    const envStoreId = process.env.NEXT_PUBLIC_DEMO_STORE_ID;
    const envTableId = process.env.NEXT_PUBLIC_DEMO_TABLE_ID;
    const payloadStoreId = items[0]?.storeId;
    const payloadTableId = items[0]?.tableId;
    const storeId = isCuid(payloadStoreId) ? payloadStoreId : isCuid(envStoreId) ? envStoreId : undefined;

    if (!storeId) {
      setSubmitError('找不到有效門市，請回菜單頁重新加入商品');
      return;
    }

    setLoading(true);

    const selectedTableId = isCuid(payloadTableId) ? payloadTableId : isCuid(envTableId) ? envTableId : undefined;
    const body: {
      storeId: string;
      mode: 'DINE_IN' | 'TAKEAWAY';
      tableId?: string;
      items: Array<{ productId: string; quantity: number; options: [] }>;
    } = {
      storeId,
      mode: selectedTableId ? 'DINE_IN' : 'TAKEAWAY',
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, options: [] }))
    };

    if (selectedTableId) {
      body.tableId = selectedTableId;
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok && data?.success) {
      addOrderToHistory({
        id: data.data.id,
        orderNo: data.data.orderNo,
        createdAt: data.data.createdAt,
        total: Number(data.data.total ?? 0)
      });
      clearCartStorage();
      router.push(`/customer/order-complete?orderNo=${data.data.orderNo}&orderId=${data.data.id}`);
    }
    else setSubmitError(data?.error?.message || '建立訂單失敗');
  };

  if (!parsed.ok && !items.length) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="text-xl font-bold">結帳確認</h1>
        <div className="mt-4 card">
          <p className="text-sm text-red-600">結帳資料格式錯誤，請返回購物車重新操作。</p>
          <Link href="/customer/cart" className="mt-3 inline-block rounded bg-brand-700 px-4 py-2 text-white">返回購物車</Link>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="text-xl font-bold">結帳確認</h1>
        <div className="mt-4 card text-center">
          <p className="text-sm text-slate-500">目前沒有可結帳商品</p>
          <Link href="/customer/menu?storeSlug=demo-store" className="mt-3 inline-block rounded bg-brand-700 px-4 py-2 text-white">回菜單</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-xl font-bold">結帳確認</h1>

      <section className="mt-4 card">
        <h2 className="mb-2 font-semibold">訂單摘要</h2>
        <p className="mb-2 text-xs text-slate-500">用餐模式：{items[0]?.tableCode ? `內用（桌號 ${items[0].tableCode}）` : '外帶'}</p>
        <ul className="space-y-1 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center justify-between">
              <span>{item.name ?? item.productId} x {item.quantity}</span>
              <span>NT$ {Number(item.price ?? 0) * item.quantity}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t pt-3 text-sm">
          <p className="text-slate-500">共 {totalCount} 件</p>
          <p className="font-semibold">小計 NT$ {subtotal}</p>
        </div>
      </section>

      {submitError ? <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{submitError}</p> : null}

      <div className="mt-4 flex items-center gap-2">
        <Link href={{ pathname: '/customer/cart', query: { payload: payload ?? '' } }} className="rounded border border-slate-300 px-4 py-2 text-slate-700">返回購物車</Link>
        <button disabled={loading} onClick={submit} className="rounded bg-brand-700 px-4 py-2 text-white disabled:bg-slate-400">{loading ? '送出中...' : '送出訂單'}</button>
      </div>
    </main>
  );
}
