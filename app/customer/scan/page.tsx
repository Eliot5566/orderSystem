'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';

type Html5QrcodeScannerLike = {
  render: (success: (decodedText: string) => void, error?: (errorMessage: string) => void) => void;
  clear: () => Promise<void>;
};

function resolveTarget(decoded: string, storeSlug: string) {
  const value = decoded.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
    try {
      const url = value.startsWith('/') ? new URL(value, window.location.origin) : new URL(value);
      const sameOrigin = url.origin === window.location.origin;
      if (!sameOrigin) return null;
      if (!url.pathname.startsWith('/customer/menu')) return null;
      if (!url.searchParams.get('storeSlug')) {
        url.searchParams.set('storeSlug', storeSlug);
      }
      return `${url.pathname}?${url.searchParams.toString()}`;
    } catch {
      return null;
    }
  }

  const tableCodeMatch = value.match(/^(?:TABLE:)?([A-Za-z0-9_-]{1,30})$/i);
  if (!tableCodeMatch) return null;
  const tableCode = tableCodeMatch[1].toUpperCase();
  const query = new URLSearchParams({ storeSlug, tableCode });
  return `/customer/menu?${query.toString()}`;
}

export default function CustomerScanPage() {
  const router = useRouter();
  const params = useSearchParams();
  const storeSlug = params.get('storeSlug') || 'demo-store';

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const fallbackMenuUrl = useMemo(() => `/customer/menu?storeSlug=${encodeURIComponent(storeSlug)}`, [storeSlug]);

  useEffect(() => {
    let disposed = false;
    let scanner: Html5QrcodeScannerLike | null = null;

    async function start() {
      try {
        const mod = await import('html5-qrcode');
        if (disposed) return;

        const ScannerCtor = mod.Html5QrcodeScanner as unknown as new (
          elementId: string,
          config: { fps?: number; qrbox?: { width: number; height: number }; rememberLastUsedCamera?: boolean },
          verbose?: boolean
        ) => Html5QrcodeScannerLike;

        scanner = new ScannerCtor(
          'qr-reader',
          { fps: 10, qrbox: { width: 240, height: 240 }, rememberLastUsedCamera: true },
          false
        );

        scanner.render(
          (decodedText) => {
            const target = resolveTarget(decodedText, storeSlug);
            if (!target) return;
            router.replace(target as Route);
          },
          () => {
            // ignore frame-level decode errors
          }
        );

        setReady(true);
        setError(null);
      } catch {
        if (!disposed) {
          setError('無法啟用 QR 掃描，請確認相機權限或改用手動輸入桌號。');
        }
      }
    }

    start();

    return () => {
      disposed = true;
      if (scanner) {
        scanner.clear().catch(() => {
          // ignore cleanup errors
        });
      }
    };
  }, [router, storeSlug]);

  const submitManual = () => {
    const target = resolveTarget(manualCode, storeSlug);
    if (!target) {
      setError('桌號格式不正確，請輸入例如 A1 或 TABLE:A1');
      return;
    }
    router.replace(target as Route);
  };

  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="mb-2 text-xl font-bold">掃描桌號 QRCode</h1>
      <p className="mb-3 text-sm text-slate-600">掃描成功後會直接進入對應桌號的點餐頁面。</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
        <div id="qr-reader" className="min-h-[300px]" />
      </div>

      {!ready && !error ? <p className="mt-3 text-sm text-slate-500">掃描器初始化中...</p> : null}
      {error ? <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-sm font-medium">手動輸入桌號</p>
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="例如 A1 或 TABLE:A1"
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button onClick={submitManual} className="rounded bg-brand-700 px-4 py-2 text-sm text-white">進入</button>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Link href={fallbackMenuUrl as Route} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700">不掃描，直接看菜單</Link>
      </div>
    </main>
  );
}
