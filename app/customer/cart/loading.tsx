export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4 h-8 w-24 animate-pulse rounded bg-slate-200" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
    </main>
  );
}
