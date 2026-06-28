import { ArrowRight } from "lucide-react";

import type { HeroBlock } from "@/lib/schema/PlatformSchema";

export type HeroVariantProps = HeroBlock["props"];

export default function HeroSplit({
  headline,
  subheadline,
  image_url,
  cta_text,
  cta_href,
}: HeroVariantProps) {
  return (
    <section data-hero-variant="split" className="grid min-h-[90svh] bg-[var(--color-surface-alt)] text-[var(--color-text-primary)] lg:grid-cols-2">
      <div className="relative min-h-[42svh] overflow-hidden lg:min-h-[90svh]">
        <img src={image_url} alt={headline} className="absolute inset-0 h-full w-full object-cover" loading="eager" decoding="async" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.58))]" />
      </div>
      <div className="flex items-center px-4 py-16 sm:px-8 lg:px-14">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-brand-primary)]">Private table</p>
          <h1 className="mt-5 text-balance font-heading text-[clamp(3.4rem,9vw,7.5rem)] font-semibold leading-[.86] text-[var(--color-text-primary)]">
            {headline}
          </h1>
          <div className="my-7 h-px w-24 bg-[var(--color-brand-primary)]" />
          <p className="max-w-xl text-balance text-lg leading-8 text-[var(--color-text-secondary)]">
            {subheadline}
          </p>
          <a href={cta_href} className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-button bg-[var(--color-brand-primary)] px-7 py-3.5 text-sm font-bold text-[var(--color-surface-default)] shadow-2xl">
            {cta_text} <ArrowRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}
