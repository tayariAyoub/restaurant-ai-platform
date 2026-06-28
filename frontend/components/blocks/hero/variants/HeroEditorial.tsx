import { ArrowRight } from "lucide-react";

import type { HeroBlock } from "@/lib/schema/PlatformSchema";

export type HeroVariantProps = HeroBlock["props"];

export default function HeroEditorial({
  headline,
  subheadline,
  image_url,
  cta_text,
  cta_href,
}: HeroVariantProps) {
  return (
    <section data-hero-variant="editorial" className="relative flex min-h-[92svh] items-end overflow-hidden bg-[var(--color-surface-alt)] text-[var(--color-text-primary)]">
      <img src={image_url} alt={headline} className="absolute inset-0 h-full w-full object-cover opacity-[.72]" loading="eager" decoding="async" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,6,4,.96),rgba(8,6,4,.74)_45%,rgba(8,6,4,.28)),radial-gradient(circle_at_78%_22%,rgba(255,255,255,.13),transparent_24rem)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-32 text-white sm:px-6 lg:pb-20">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/56">Restaurant experience</p>
        <h1 className="mt-5 max-w-5xl text-balance font-heading text-[clamp(4rem,16vw,10rem)] font-semibold leading-[.82]">
          {headline}
        </h1>
        <p className="mt-7 max-w-2xl text-balance font-heading text-2xl leading-tight text-white/82 sm:text-4xl">
          {subheadline}
        </p>
        <p className="mt-6 max-w-xl text-sm font-semibold uppercase tracking-[0.24em] text-white/54">
          AI Maitre d&apos; available for menu guidance
        </p>
        <a href={cta_href} className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-button bg-white px-7 py-3.5 text-sm font-bold text-[#100c08] shadow-2xl">
          {cta_text} <ArrowRight size={17} />
        </a>
      </div>
    </section>
  );
}
