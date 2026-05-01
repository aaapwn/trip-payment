export default function Loading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-end justify-between">
            <div>
              <div className="h-9 w-48 bg-muted/50 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-muted/30 rounded animate-pulse" />
            </div>
            <div className="h-11 w-32 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-muted/30 rounded-xl animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
