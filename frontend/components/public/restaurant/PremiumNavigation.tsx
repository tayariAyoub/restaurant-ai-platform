import { ChefHat, Menu as MenuIcon, X } from "lucide-react";

export type RestaurantNavigationPage = "home" | "menu" | "reservations" | "gallery" | "events" | "contact";

export type PremiumNavigationLink = {
  key: Exclude<RestaurantNavigationPage, "reservations">;
  label: string;
  href: string;
};

export type PremiumNavigationCta = {
  label: string;
  href: string;
};

export type PremiumNavigationProps = {
  restaurantName: string;
  locationLabel: string;
  logoUrl?: string;
  homeHref: string;
  links: PremiumNavigationLink[];
  cta: PremiumNavigationCta;
  activePage: RestaurantNavigationPage;
  buttonClass: string;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
};

export function getRestaurantNavigationLinks(slug: string): PremiumNavigationLink[] {
  const basePath = `/restaurants/${slug}`;

  return [
    { key: "home", label: "Home", href: basePath },
    { key: "menu", label: "Menu", href: `${basePath}/menu` },
    { key: "gallery", label: "Gallery", href: `${basePath}/gallery` },
    { key: "events", label: "Events", href: `${basePath}/events` },
    { key: "contact", label: "Contact", href: `${basePath}/contact` },
  ];
}

export default function PremiumNavigation({
  restaurantName,
  locationLabel,
  logoUrl,
  homeHref,
  links,
  cta,
  activePage,
  buttonClass,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: PremiumNavigationProps) {
  const ctaActive = activePage === "reservations";

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:py-7">
        <a href={homeHref} aria-label={`${restaurantName} home`} className="group flex min-w-0 items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-11 w-11 rounded-full border border-white/25 object-cover" loading="eager" decoding="async" />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
              <ChefHat size={19} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold uppercase text-white/85">{restaurantName}</span>
            <span className="hidden text-xs text-white/45 sm:block">{locationLabel}</span>
          </span>
        </a>
        <nav aria-label="Restaurant navigation" className="hidden items-center gap-1 rounded-full border border-white/12 bg-black/24 p-1 text-sm font-semibold text-white/70 shadow-2xl backdrop-blur-xl lg:flex">
          {links.map((link) => {
            const active = activePage === link.key;

            return (
              <a
                key={link.key}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 min-w-[5.75rem] items-center justify-center rounded-full px-4 py-2.5 text-center transition duration-300 hover:bg-white/10 hover:text-white ${active ? "bg-white/10 text-white" : ""}`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={cta.href}
            aria-current={ctaActive ? "page" : undefined}
            className={`${buttonClass} hidden min-h-11 items-center justify-center bg-white px-5 py-2.5 text-sm font-bold text-[#100c08] shadow-2xl transition duration-300 sm:inline-flex ${ctaActive ? "ring-1 ring-white/45" : ""}`}
          >
            {cta.label}
          </a>
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur lg:hidden"
            onClick={onToggleMobile}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav aria-label="Mobile restaurant navigation" className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-50 grid gap-2 rounded-[1.5rem] border border-white/10 bg-[#080604]/95 p-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl sm:grid-cols-3 lg:hidden">
          {links.map((link) => {
            const active = activePage === link.key;

            return (
              <a
                key={link.key}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={onCloseMobile}
                className={`rounded-2xl px-4 py-3 text-center transition duration-300 ${active ? "bg-white/16" : "bg-white/[.08]"}`}
              >
                {link.label}
              </a>
            );
          })}
          <a
            href={cta.href}
            aria-current={ctaActive ? "page" : undefined}
            onClick={onCloseMobile}
            className={`rounded-2xl bg-white px-4 py-3 text-center text-[#100c08] ${ctaActive ? "ring-1 ring-white/45" : ""}`}
          >
            {cta.label}
          </a>
        </nav>
      )}
    </header>
  );
}
