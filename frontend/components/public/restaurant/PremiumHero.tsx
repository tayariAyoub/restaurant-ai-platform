import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";

import HomepageImage from "./HomepageImage";

export type PremiumHeroCta = {
  label: string;
  href: string;
};

export type PremiumHeroMetric = {
  value: string | number;
  label: string;
};

export type PremiumHeroTrustLine = {
  icon: LucideIcon;
  title: string;
  copy: string;
};

export type PremiumHeroProps = {
  restaurantName: string;
  eyebrow: string;
  headline: string;
  description?: string;
  image: string;
  imageAlt: string;
  imageTreatment: string;
  primaryCta: PremiumHeroCta;
  secondaryCta: PremiumHeroCta;
  buttonClass: string;
  accentColor: string;
  trustTitle: string;
  metrics: PremiumHeroMetric[];
  trustLines: PremiumHeroTrustLine[];
};

export default function PremiumHero({
  restaurantName,
  eyebrow,
  headline,
  description,
  image,
  imageAlt,
  imageTreatment,
  primaryCta,
  secondaryCta,
  buttonClass,
  accentColor,
  trustTitle,
  metrics,
  trustLines,
}: PremiumHeroProps) {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden">
      <HomepageImage src={image} alt={imageAlt} treatment={imageTreatment} priority />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,4,3,.98),rgba(8,5,3,.84)_43%,rgba(8,5,3,.26)),radial-gradient(circle_at_76%_22%,rgba(255,255,255,.13),transparent_24rem)]" />
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#080604] via-[#080604]/86 to-transparent" />
      <div className="cinematic-grain opacity-[.35]" />
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 pb-9 pt-32 sm:px-6 sm:pb-14 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:pb-20">
        <div className="max-w-4xl">
          <p className="inline-flex rounded-full border border-white/14 bg-white/[.08] px-4 py-2 text-xs font-semibold text-white/68 backdrop-blur">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-balance text-[clamp(4rem,18vw,10rem)] font-semibold leading-[.78] text-white">
            {restaurantName}
          </h1>
          <p className="mt-7 max-w-2xl font-display text-2xl leading-tight text-white/86 sm:text-4xl">
            {headline}
          </p>
          {description && description !== headline && (
            <p className="mt-5 max-w-xl text-base leading-8 text-white/66">
              {description}
            </p>
          )}
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <a href={primaryCta.href} className={`${buttonClass} inline-flex min-h-12 items-center justify-center gap-2 bg-white px-7 py-3.5 text-sm font-bold text-[#100c08] shadow-2xl`}>
              {primaryCta.label} <ArrowRight size={17} />
            </a>
            <a
              href={secondaryCta.href}
              className={`${buttonClass} inline-flex min-h-12 items-center justify-center border border-white/22 bg-white/[.08] px-7 py-3.5 text-sm font-bold text-white backdrop-blur`}
            >
              {secondaryCta.label}
            </a>
          </div>
          <div className="mt-6 grid max-w-3xl grid-cols-3 divide-x divide-white/12 rounded-[1.5rem] border border-white/12 bg-black/24 text-center shadow-2xl backdrop-blur sm:mt-8">
            {metrics.map((metric) => (
              <HeroMetric key={metric.label} value={metric.value} label={metric.label} />
            ))}
          </div>
        </div>
        <aside className="rounded-[2rem] border border-white/12 bg-white/[.07] p-5 shadow-2xl backdrop-blur-xl">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={17} style={{ color: accentColor }} />
            {trustTitle}
          </p>
          <div className="mt-5 grid gap-4">
            {trustLines.map((line) => (
              <TrustLine key={line.title} icon={line.icon} title={line.title} copy={line.copy} />
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function HeroMetric({ value, label }: PremiumHeroMetric) {
  return (
    <span className="px-3 py-4">
      <span className="block font-display text-2xl font-semibold text-white">{value}</span>
      <span className="mt-1 block text-xs text-white/45">{label}</span>
    </span>
  );
}

function TrustLine({ icon: Icon, title, copy }: PremiumHeroTrustLine) {
  return (
    <p className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-white/62">
      <Icon size={18} className="mt-0.5 text-white/72" />
      <span>
        <b className="block text-white">{title}</b>
        {copy}
      </span>
    </p>
  );
}
