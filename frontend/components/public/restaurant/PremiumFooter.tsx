export type PremiumFooterLink = {
  label: string;
  href: string;
};

export type PremiumFooterProps = {
  restaurantName: string;
  locationLabel: string;
  links: PremiumFooterLink[];
  note: string;
  accentColor: string;
};

const LEGAL_FOOTER_LINKS = [
  { label: "Impressum", href: "/impressum" },
  { label: "Datenschutz", href: "/datenschutz" },
];

export default function PremiumFooter({
  restaurantName,
  locationLabel,
  links,
  note,
  accentColor,
}: PremiumFooterProps) {
  return (
    <footer className="border-t border-white/10 px-4 py-12 text-center sm:px-6">
      <p className="font-display text-4xl font-semibold">{restaurantName}</p>
      <p className="mt-3 text-sm text-white/44">{locationLabel}</p>
      <nav aria-label="Footer restaurant links" className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2 text-sm font-semibold text-white/62">
        {links.map((link) => (
          <a key={link.label} href={link.href} className="rounded-full border border-white/10 px-4 py-2.5 hover:text-white">
            {link.label}
          </a>
        ))}
      </nav>
      <nav aria-label="Legal links" className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-4 text-xs font-semibold text-white/40">
        {LEGAL_FOOTER_LINKS.map((link) => (
          <a key={link.label} href={link.href} className="underline-offset-4 transition hover:text-white hover:underline">
            {link.label}
          </a>
        ))}
      </nav>
      <p className="mt-8 text-xs text-white/32" style={{ color: accentColor }}>
        {note}
      </p>
    </footer>
  );
}
