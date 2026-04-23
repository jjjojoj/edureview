export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <aside className="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex h-20 items-center gap-3 px-7">
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-200" />
          <div>
            <div className="mb-2 h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        <div className="flex-1 space-y-2 px-4 py-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg px-4 py-3"
            >
              <div className="h-5 w-5 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="px-5 pb-6">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="mb-3 h-10 w-10 animate-pulse rounded-lg bg-slate-200" />
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-slate-200/70 bg-white/90">
          <div className="flex min-h-20 flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:px-8">
            <div>
              <div className="mb-2 h-6 w-28 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="h-11 w-44 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-11 w-36 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-11 w-28 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-11 w-11 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 xl:px-8">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 h-8 w-60 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-200" />
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-20 animate-pulse rounded bg-slate-100" />
                    <div className="h-7 w-16 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-14 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="mb-2 h-5 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-100" />
              </div>
              <div className="h-72 animate-pulse rounded-lg bg-slate-50" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
              <div className="mb-5 h-5 w-40 animate-pulse rounded bg-slate-200" />
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-3"
                  >
                    <div className="h-7 w-7 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 w-12 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="h-72 rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-7">
              <div className="mb-5 h-5 w-36 animate-pulse rounded bg-slate-200" />
              <div className="h-48 animate-pulse rounded-lg bg-slate-50" />
            </div>
            <div className="h-72 rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
              <div className="mb-5 h-5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="space-y-3">
                <div className="h-14 animate-pulse rounded-lg bg-slate-50" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-50" />
                <div className="h-14 animate-pulse rounded-lg bg-slate-50" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
