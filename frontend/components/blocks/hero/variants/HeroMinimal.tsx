import { ArrowRight } from "lucide-react";

import type { HeroBlock } from "@/lib/schema/PlatformSchema";

export type HeroVariantProps = HeroBlock["props"];

export default function HeroMinimal({
  headline,
  subheadline,
  image_url,
  cta_text,
  cta_href,
}: HeroVariantProps) {
  return (
    <section data-hero-variant="minimal" className="relative grid min-h-[88svh] overflow-hidden bg-[var(--color-surface-default)] px-4 py-28 text-[var(--color-text-primary)] sm:px-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--color-brand-primary)]">Quiet dining</p>
          <h1 className="mx-auto mt-5 max-w-4xl text-balance font-heading text-[clamp(3.4rem,10vw,7rem)] font-semibold leading-[.92] lg:mx-0">
            {headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-8 text-[var(--color-text-secondary)] lg:mx-0">
            {subheadline}
          </p>
          <a href={cta_href} className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-button border border-[var(--color-text-primary)] px-7 py-3.5 text-sm font-bold">
            {cta_text} <ArrowRight size={17} />
          </a>
        </div>
        <figure className="order-1 mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-card border border-black/10 bg-black/5 lg:order-2">
          <img src={image_url} alt={headline} className="h-full w-full object-cover saturate-[.82]" loading="eager" decoding="async" />
        </figure>
      </div>
    </section>
  );
}
