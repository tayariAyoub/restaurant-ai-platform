import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { Restaurant, RestaurantImage } from "@/lib/types";

type GalleryShowcaseProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  gallery: RestaurantImage[];
};

export default function GalleryShowcase({
  restaurant,
  themeIdentity,
  gallery,
}: GalleryShowcaseProps) {
  if (gallery.length === 0) return null;
  const immersive = themeIdentity.homepageStyle === "immersive";

  return (
    <section id="gallery" className={`sensory-section px-3 py-16 sm:px-6 lg:py-24 ${immersive ? "bg-[#070411]/88 text-white" : ""}`}>
      <div className="mx-auto mb-10 grid max-w-7xl gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
        <div>
          <p className="luxury-kicker text-xs font-bold" style={{ color: themeIdentity.primary }}>Atmosphere</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">A glimpse before you arrive.</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 opacity-60 lg:justify-self-end">
          Food, room, light, and service should feel connected before you ever open the door.
        </p>
      </div>
      <div className={`mx-auto grid max-w-7xl gap-3 ${themeIdentity.galleryClass}`}>
        {gallery.map((image, index) => (
          <figure
            key={image.id}
            className={`group art-frame overflow-hidden rounded-[1.5rem] shadow-sm ${immersive ? "border border-white/10 bg-white/[.04]" : ""} ${index === 0 ? "md:col-span-2" : ""}`}
          >
            <img
              src={image.url}
              alt={image.alt_text || restaurant.name}
              className={`h-80 w-full object-cover transition duration-700 group-hover:scale-[1.025] ${index === 0 ? "sm:h-96" : ""} ${themeIdentity.imageTreatmentClass}`}
              loading="lazy"
              decoding="async"
            />
            <figcaption className="sr-only">{image.alt_text || `${restaurant.name} atmosphere`}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
