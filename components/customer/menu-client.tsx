'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type MenuData = any;

function useCart() {
  const [items, setItems] = useState<any[]>([]);
  const add = (product: any, storeId: string) =>
    setItems((prev) => [...prev, { storeId, productId: product.id, name: product.name, price: Number(product.price), quantity: 1, options: [] }]);
  return { items, add };
}

export function MenuClient({ menu }: { menu: MenuData }) {
  const [activeCategory, setActiveCategory] = useState(menu.categories[0]?.id);
  const { items, add } = useCart();
  const category = useMemo(() => menu.categories.find((c: any) => c.id === activeCategory), [menu.categories, activeCategory]);

  return (
    <div className="mx-auto max-w-3xl p-4">
      <header className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold">{menu.name}</h1>
        <p className="text-sm text-slate-500">{menu.address}</p>
      </header>
      <div className="mb-3 flex gap-2 overflow-auto">
        {menu.categories.map((c: any) => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`rounded-full px-3 py-1 text-sm ${activeCategory === c.id ? 'bg-brand-700 text-white' : 'bg-white'}`}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {category?.products.map((p: any) => (
          <article key={p.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.description}</p>
                <p className="mt-1 text-brand-700">NT$ {Number(p.price)}</p>
              </div>
              <button onClick={() => add(p, menu.id)} className="rounded bg-brand-700 px-3 py-1 text-white">加入</button>
            </div>
          </article>
        ))}
      </div>
      <Link href={{ pathname: '/customer/cart', query: { payload: encodeURIComponent(JSON.stringify(items)) } }} className="fixed bottom-4 right-4 rounded-full bg-brand-700 px-4 py-3 text-white shadow-lg">
        購物車 ({items.length})
      </Link>
    </div>
  );
}
