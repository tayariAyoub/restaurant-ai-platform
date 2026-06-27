import { ChefHat, Sparkles } from "lucide-react";

export default function RestaurantPageSkeleton() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f3ea] text-stone-900" aria-label="Loading restaurant">
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#15110d] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,7,5,.96),rgba(26,20,14,.74)_45%,rgba(44,34,24,.48))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,.14),transparent_18rem)]" />
        <div className="absolute inset-x-0 top-0 z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:py-7">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/10">
              <ChefHat size={21} />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-36 rounded-full bg-white/25" />
              <div className="hidden h-2 w-28 rounded-full bg-white/15 sm:block" />
            </div>
          </div>
          <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-3 md:flex">
            <div className="h-3 w-12 rounded-full bg-white/20" />
            <div className="h-3 w-12 rounded-full bg-white/20" />
            <div className="h-3 w-14 rounded-full bg-white/20" />
          </div>
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 pb-10 pt-36 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:items-end lg:pb-16">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
              <Sparkles size={13} /> Preparing your table
            </p>
            <div className="mt-7 space-y-4">
              <div className="h-14 w-full max-w-2xl rounded-full bg-white/20 sm:h-20" />
              <div className="h-14 w-4/5 max-w-xl rounded-full bg-white/15 sm:h-20" />
            </div>
            <div className="mt-7 max-w-2xl space-y-3">
              <div className="h-4 rounded-full bg-white/18" />
              <div className="h-4 w-10/12 rounded-full bg-white/14" />
              <div className="h-4 w-7/12 rounded-full bg-white/10" />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="h-12 w-36 rounded-full bg-white/25" />
              <div className="h-12 w-32 rounded-full border border-white/15 bg-white/10" />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
            <div className="aspect-[4/3] rounded-[1.25rem] bg-white/15" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="h-20 rounded-2xl bg-white/12" />
              <div className="h-20 rounded-2xl bg-white/10" />
              <div className="h-20 rounded-2xl bg-white/12" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-4">
          <div className="h-3 w-28 rounded-full bg-stone-300" />
          <div className="h-10 w-64 rounded-full bg-stone-200" />
          <div className="h-4 w-full rounded-full bg-stone-200" />
          <div className="h-4 w-4/5 rounded-full bg-stone-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="h-32 rounded-2xl bg-stone-100" />
              <div className="mt-4 h-5 w-3/4 rounded-full bg-stone-200" />
              <div className="mt-3 h-3 w-full rounded-full bg-stone-100" />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-stone-100" />
              <div className="mt-5 flex items-center justify-between">
                <div className="h-5 w-20 rounded-full bg-stone-200" />
                <div className="h-10 w-28 rounded-full bg-stone-900/10" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
