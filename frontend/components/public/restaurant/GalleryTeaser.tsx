import { ArrowRight } from "lucide-react";

import HomepageImage from "./HomepageImage";

export type GalleryTeaserImage = {
  id: string | number;
  src: string;
  alt: string;
  caption: string;
};

export type GalleryTeaserProps = {
  id?: string;
  kicker: string;
  title: string;
  cta: {
    label: string;
    href: string;
  };
  images: GalleryTeaserImage[];
  imageTreatment: string;
  accentColor: string;
};

export default function GalleryTeaser({
  id = "atmosphere",
  kicker,
  title,
  cta,
  images,
  imageTreatment,
  accentColor,
}: GalleryTeaserProps) {
  return (
    <section id={id} className="px-3 py-20 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: accentColor }}>{kicker}</p>
            <h2 className="mt-4 max-w-3xl text-balance text-5xl font-semibold leading-[.95] sm:text-7xl">
              {title}
            </h2>
          </div>
          <a href={cta.href} className="inline-flex items-center gap-2 text-sm font-bold text-white/72">
            {cta.label} <ArrowRight size={16} />
          </a>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {images.map((image, index) => (
            <figure key={image.id} className={`relative min-h-80 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[.04] ${index === 0 ? "md:col-span-3 md:min-h-[34rem]" : "md:col-span-2"}`}>
              <HomepageImage src={image.src} alt={image.alt} treatment={imageTreatment} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/58 to-transparent" />
              <figcaption className="absolute bottom-0 left-0 p-5 text-sm text-white/64">
                {image.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
