'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CartPage() {
  const params = useSearchParams();
  const items = JSON.parse(decodeURIComponent(params.get('payload') ?? '[]')) as any[];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-bold">購物車</h1>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="card flex items-center justify-between">
            <span>{item.name} x {item.quantity}</span>
            <span>NT$ {item.price * item.quantity}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 card">
        <p className="font-semibold">小計：NT$ {subtotal}</p>
        <Link href={{ pathname: '/customer/checkout', query: { payload: params.get('payload') ?? '' } }} className="mt-2 inline-block rounded bg-brand-700 px-4 py-2 text-white">前往結帳</Link>
      </div>
    </main>
  );
}
