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
      <nav className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2 text-sm font-semibold text-white/62">
        {links.map((link) => (
          <a key={link.label} href={link.href} className="rounded-full border border-white/10 px-4 py-2.5 hover:text-white">
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
