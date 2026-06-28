import { ArrowRight } from "lucide-react";

import HomepageImage from "./HomepageImage";

export type EventsTeaserProps = {
  id?: string;
  kicker: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imageTreatment: string;
  cta: {
    label: string;
    href: string;
  };
  buttonClass: string;
  accentColor: string;
};

export default function EventsTeaser({
  id = "events",
  kicker,
  title,
  description,
  image,
  imageAlt,
  imageTreatment,
  cta,
  buttonClass,
  accentColor,
}: EventsTeaserProps) {
  return (
    <section id={id} className="relative overflow-hidden px-4 py-20 sm:px-6 lg:py-32">
      <HomepageImage src={image} alt={imageAlt} treatment={imageTreatment} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,6,4,.96),rgba(8,6,4,.76)_48%,rgba(8,6,4,.34)),radial-gradient(circle_at_82%_28%,rgba(255,255,255,.1),transparent_26rem)]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <p className="text-sm font-semibold" style={{ color: accentColor }}>{kicker}</p>
        <h2 className="mt-5 max-w-3xl text-balance text-5xl font-semibold leading-[.92] sm:text-7xl">
          {title}
        </h2>
        <p className="mt-6 max-w-xl text-base leading-8 text-white/64">
          {description}
        </p>
        <a href={cta.href} className={`${buttonClass} mt-8 inline-flex min-h-12 items-center justify-center gap-2 border border-white/20 bg-white/[.08] px-6 py-3 text-sm font-bold text-white backdrop-blur`}>
          {cta.label} <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}
