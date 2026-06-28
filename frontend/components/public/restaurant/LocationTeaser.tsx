import { ArrowRight, type LucideIcon } from "lucide-react";

export type LocationDetail = {
  icon: LucideIcon;
  title: string;
  copy: string;
};

export type LocationTeaserProps = {
  id?: string;
  kicker: string;
  title: string;
  description: string;
  cta: {
    label: string;
    href: string;
  };
  details: LocationDetail[];
  mapCta?: {
    label: string;
    href: string;
  };
  buttonClass: string;
  accentColor: string;
};

export default function LocationTeaser({
  id = "location",
  kicker,
  title,
  description,
  cta,
  details,
  mapCta,
  buttonClass,
  accentColor,
}: LocationTeaserProps) {
  return (
    <section id={id} className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] border border-white/10 bg-white/[.05] p-6 shadow-2xl backdrop-blur sm:p-8 lg:grid-cols-[.95fr_1.05fr] lg:p-10">
        <div>
          <p className="text-sm font-semibold" style={{ color: accentColor }}>{kicker}</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight sm:text-6xl">
            {title}
          </h2>
          <p className="mt-5 text-base leading-8 text-white/58">
            {description}
          </p>
          <a href={cta.href} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/82">
            {cta.label} <ArrowRight size={16} />
          </a>
        </div>
        <div className="grid gap-4">
          {details.map((detail) => (
            <DetailLine key={detail.title} icon={detail.icon} title={detail.title} copy={detail.copy} color={accentColor} />
          ))}
          {mapCta && (
            <a href={mapCta.href} target="_blank" className={`${buttonClass} inline-flex min-h-12 items-center justify-center bg-white px-5 py-3 text-sm font-bold text-[#100c08]`}>
              {mapCta.label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function DetailLine({ icon: Icon, title, copy, color }: LocationDetail & { color: string }) {
  return (
    <p className="grid grid-cols-[auto_1fr] gap-4 rounded-[1.4rem] border border-white/10 bg-black/[.18] p-4">
      <Icon size={20} style={{ color }} />
      <span>
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-white/55">{copy}</span>
      </span>
    </p>
  );
}
