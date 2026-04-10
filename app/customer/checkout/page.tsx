'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function isCuid(value?: string) {
  return typeof value === 'string' && /^c[a-z0-9]{24}$/i.test(value);
}

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const items = JSON.parse(decodeURIComponent(params.get('payload') ?? '[]')) as Array<{ storeId?: string; productId: string; quantity: number }>;
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const envStoreId = process.env.NEXT_PUBLIC_DEMO_STORE_ID;
    const envTableId = process.env.NEXT_PUBLIC_DEMO_TABLE_ID;
    const payloadStoreId = items[0]?.storeId;
    const storeId = isCuid(payloadStoreId) ? payloadStoreId : isCuid(envStoreId) ? envStoreId : undefined;

    if (!storeId) {
      alert('找不到有效門市，請回菜單頁重新加入商品');
      return;
    }

    setLoading(true);
    const body: {
      storeId: string;
      mode: 'DINE_IN';
      tableId?: string;
      items: Array<{ productId: string; quantity: number; options: [] }>;
    } = {
      storeId,
      mode: 'DINE_IN',
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, options: [] }))
    };

    if (isCuid(envTableId)) {
      body.tableId = envTableId;
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) router.push(`/customer/order-complete?orderNo=${data.orderNo}`);
    else alert(data.message || '建立訂單失敗');
  };

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-xl font-bold">結帳確認</h1>
      <button disabled={loading} onClick={submit} className="mt-4 rounded bg-brand-700 px-4 py-2 text-white disabled:bg-slate-400">{loading ? '送出中...' : '送出訂單'}</button>
    </main>
  );
}
