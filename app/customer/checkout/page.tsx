'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();
  const items = JSON.parse(decodeURIComponent(params.get('payload') ?? '[]')) as any[];
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: process.env.NEXT_PUBLIC_DEMO_STORE_ID,
        mode: 'DINE_IN',
        tableId: process.env.NEXT_PUBLIC_DEMO_TABLE_ID,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, options: [] }))
      })
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
