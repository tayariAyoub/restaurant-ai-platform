import { ArrowRight } from "lucide-react";

import HomepageImage from "./HomepageImage";

export type EditorialStoryProps = {
  id?: string;
  kicker: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
  imageTreatment: string;
  caption: string;
  cta: {
    label: string;
    href: string;
  };
  accentColor: string;
};

export default function EditorialStory({
  id = "story",
  kicker,
  title,
  body,
  image,
  imageAlt,
  imageTreatment,
  caption,
  cta,
  accentColor,
}: EditorialStoryProps) {
  return (
    <section id={id} className="relative px-4 py-20 sm:px-6 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.86fr_1.14fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold" style={{ color: accentColor }}>{kicker}</p>
          <h2 className="mt-5 max-w-2xl text-balance text-5xl font-semibold leading-[.92] sm:text-7xl">
            {title}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/62">
            {body}
          </p>
          <a href={cta.href} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/82">
            {cta.label} <ArrowRight size={16} />
          </a>
        </div>
        <figure className="relative min-h-[62svh] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl">
          <HomepageImage src={image} alt={imageAlt} treatment={imageTreatment} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
          <figcaption className="absolute bottom-0 left-0 max-w-md p-6 text-sm leading-7 text-white/72 sm:p-8">
            {caption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
