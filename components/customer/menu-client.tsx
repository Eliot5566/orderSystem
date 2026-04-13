'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { readCartFromStorage, type CartItem, writeCartToStorage } from '@/lib/customer/cart-storage';

type MenuData = any;

function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const add = (product: any, storeId: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.productId === product.id);
      if (idx === -1) {
        return [...prev, { storeId, productId: product.id, name: product.name, price: Number(product.price), quantity: 1, options: [] }];
      }
      return prev.map((item, i) => (i === idx ? { ...item, quantity: item.quantity + 1 } : item));
    });
  };

  const decrease = (productId: string) => {
    setItems((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const quantityByProductId = useMemo(
    () => new Map(items.map((item) => [item.productId, item.quantity] as const)),
    [items]
  );

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0), [items]);

  useEffect(() => {
    const stored = readCartFromStorage();
    if (stored.length) setItems(stored);
  }, []);

  useEffect(() => {
    writeCartToStorage(items);
  }, [items]);

  return { items, add, decrease, quantityByProductId, subtotal };
}

export function MenuClient({ menu }: { menu: MenuData }) {
  const categories = menu?.categories ?? [];
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);
  const { items, add, decrease, quantityByProductId, subtotal } = useCart();
  const category = useMemo(() => categories.find((c: any) => c.id === activeCategory), [categories, activeCategory]);
  const products = category?.products ?? [];

  if (!categories.length) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <header className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h1 className="text-xl font-bold">{menu?.name ?? '門市菜單'}</h1>
          <p className="text-sm text-slate-500">目前尚無可用分類</p>
        </header>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 pb-28">
      <header className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-xl font-bold">{menu.name}</h1>
        <p className="text-sm text-slate-500">{menu.address}</p>
      </header>
      <div className="mb-3 flex gap-2 overflow-auto pb-1">
        {categories.map((c: any) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${
              activeCategory === c.id ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {!products.length ? (
          <div className="card text-sm text-slate-500">此分類目前沒有可販售商品</div>
        ) : (
          products.map((p: any) => (
          <article key={p.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.description}</p>
                <p className="mt-1 text-brand-700">NT$ {Number(p.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => decrease(p.id)}
                  className="h-8 w-8 rounded border border-slate-300 text-slate-700"
                  aria-label={`減少 ${p.name}`}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">{quantityByProductId.get(p.id) ?? 0}</span>
                <button
                  onClick={() => add(p, menu.id)}
                  className="h-8 w-8 rounded bg-brand-700 text-white"
                  aria-label={`增加 ${p.name}`}
                >
                  +
                </button>
              </div>
            </div>
          </article>
        ))) }
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">已選 {items.reduce((s, i) => s + i.quantity, 0)} 件</p>
            <p className="font-semibold">NT$ {subtotal}</p>
          </div>
          <Link
            href={{ pathname: '/customer/cart', query: { payload: encodeURIComponent(JSON.stringify(items)) } }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${items.length ? 'bg-brand-700' : 'pointer-events-none bg-slate-400'}`}
          >
            前往購物車
          </Link>
        </div>
      </div>
    </div>
  );
}
