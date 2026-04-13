'use client';

import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('Admin123!');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) {
      const next = params.get('next');
      if (next && next.startsWith('/admin')) {
        window.location.assign(next);
      } else {
        router.push('/admin');
      }
    }
    else alert('登入失敗');
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center p-4">
      <form className="card w-full" onSubmit={submit}>
        <h1 className="mb-4 text-xl font-bold">後台登入</h1>
        <input className="mb-2 w-full rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="mb-3 w-full rounded border p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full rounded bg-brand-700 py-2 text-white">登入</button>
      </form>
    </main>
  );
}
