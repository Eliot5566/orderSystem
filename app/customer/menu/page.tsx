import { MenuClient } from '@/components/customer/menu-client';

async function getMenu(storeSlug: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/store/public-menu?storeSlug=${storeSlug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('menu fetch failed');
  return res.json();
}

export default async function MenuPage({ searchParams }: { searchParams: { storeSlug?: string } }) {
  const menu = await getMenu(searchParams.storeSlug ?? 'demo-store');
  return <MenuClient menu={menu} />;
}
