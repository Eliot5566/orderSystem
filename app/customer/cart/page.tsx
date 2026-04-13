'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { parsePayloadToCart, readCartFromStorage, type CartItem, writeCartToStorage } from '@/lib/customer/cart-storage';

export default function CartPage() {
  const params = useSearchParams();
  const parsed = useMemo(() => parsePayloadToCart(params.get('payload')), [params]);
  const [items, setItems] = useState<CartItem[]>(() => {
    if (parsed.ok && parsed.items.length) return parsed.items;
    return readCartFromStorage();
  });

  useEffect(() => {
    if (parsed.ok && parsed.items.length) {
      setItems(parsed.items);
    }
  }, [parsed.ok, parsed.items]);

  useEffect(() => {
    writeCartToStorage(items);
  }, [items]);

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const nextPayload = encodeURIComponent(JSON.stringify(items));

  const increase = (productId: string) => {
    setItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)));
  };

  const decrease = (productId: string) => {
    setItems((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  if (!parsed.ok && !items.length) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="mb-4 text-xl font-bold">購物車</h1>
        <div className="card">
          <p className="text-sm text-red-600">購物車資料格式錯誤，請回菜單重新加入商品。</p>
          <Link href="/customer/menu?storeSlug=demo-store" className="mt-3 inline-block rounded bg-brand-700 px-4 py-2 text-white">回菜單</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-32">
      <h1 className="mb-4 text-xl font-bold">購物車</h1>
      {!items.length ? (
        <div className="card text-center">
          <p className="text-sm text-slate-500">目前購物車是空的</p>
          <Link href="/customer/menu?storeSlug=demo-store" className="mt-3 inline-block rounded bg-brand-700 px-4 py-2 text-white">去逛菜單</Link>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="card flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-slate-500">NT$ {Number(item.price)} / 份</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => decrease(item.productId)} className="h-8 w-8 rounded border border-slate-300">−</button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => increase(item.productId)} className="h-8 w-8 rounded border border-slate-300">+</button>
                </div>
                <p className="w-20 text-right text-sm font-semibold">NT$ {Number(item.price) * item.quantity}</p>
              </div>
            ))}
          </div>

          <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3">
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">共 {totalCount} 件商品</p>
                <p className="font-semibold">小計 NT$ {subtotal}</p>
              </div>
              <Link href={{ pathname: '/customer/checkout', query: { payload: nextPayload } }} className="rounded bg-brand-700 px-4 py-2 text-white">
                前往結帳
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
