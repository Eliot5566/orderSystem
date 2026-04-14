import Link from 'next/link';
import type { Route } from 'next';

export default function CompletePage({ searchParams }: { searchParams: { orderNo?: string; orderId?: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold text-brand-700">訂單完成</h1>
      <p className="mt-2">您的訂單編號：{searchParams.orderNo}</p>
      {searchParams.orderId ? (
        <Link className="mt-4 rounded border border-slate-300 px-4 py-2 text-slate-700" href={`/customer/orders/${searchParams.orderId}` as Route}>查看此筆詳情</Link>
      ) : null}
      <Link className="mt-2 rounded bg-brand-700 px-4 py-2 text-white" href="/customer/orders">查詢我的訂單</Link>
      <Link className="mt-2 rounded border border-slate-300 px-4 py-2 text-slate-700" href="/customer/menu?storeSlug=demo-store">繼續點餐</Link>
    </main>
  );
}
