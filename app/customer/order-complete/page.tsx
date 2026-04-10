import Link from 'next/link';

export default function CompletePage({ searchParams }: { searchParams: { orderNo?: string } }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold text-brand-700">訂單完成</h1>
      <p className="mt-2">您的訂單編號：{searchParams.orderNo}</p>
      <Link className="mt-4 rounded bg-brand-700 px-4 py-2 text-white" href="/orders">查詢訂單</Link>
    </main>
  );
}
