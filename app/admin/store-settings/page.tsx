import { prisma } from '@/lib/prisma';

export default async function StoreSettingsPage() {
  const store = await prisma.store.findFirst();
  return <pre className="card text-xs">{JSON.stringify(store, null, 2)}</pre>;
}
