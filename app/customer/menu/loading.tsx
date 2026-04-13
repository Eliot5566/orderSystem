export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-4 h-20 animate-pulse rounded-xl bg-slate-200" />
      <div className="mb-3 h-8 w-full animate-pulse rounded-xl bg-slate-200" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    </main>
  );
}
