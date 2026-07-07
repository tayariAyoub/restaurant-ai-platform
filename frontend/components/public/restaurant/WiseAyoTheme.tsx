"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { buildRestaurantJsonLd } from "@/lib/restaurantSeo";
import type { Category, Restaurant } from "@/lib/types";

type ThemeMenuItem = {
  name: string;
  description: string;
  tags: string;
};

type ThemeMenuSection = {
  id: string;
  label: string;
  items: ThemeMenuItem[];
};

type GalleryImage = {
  src: string;
  alt: string;
  className?: string;
};

const WISE_AYO_SLUG = "wise-and-ayo";
const HERO_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80";
const HERO_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1600&q=80";
const STORY_IMAGE = "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "About", href: "#about" },
  { label: "Gallery", href: "#gallery" },
  { label: "Reservations", href: "#reserve" },
  { label: "Events", href: "#events" },
  { label: "Contact", href: "#contact" },
];

const signatureDishes = [
  {
    tag: "Chef's Special",
    name: "Charred Wagyu",
    description: "Tender beef strips in a rich, caramelized glaze with fire-roasted garlic butter and cherry tomatoes.",
    image: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=700&q=80",
    alt: "Charred Wagyu",
  },
  {
    tag: "Vegan Delight",
    name: "Smoked Eggplant Tart",
    description: "Smoked eggplant and heirloom tomato tart, layered on flaky pastry with fresh herbs and a whisper of char.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
    alt: "Smoked Eggplant Tart",
  },
  {
    tag: "Crafted Cocktail",
    name: "Wise Old Fashioned",
    description: "Bourbon, smoked maple, orange bitters and a touch of charred oak essence, served over hand-cut ice.",
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=700&q=80",
    alt: "Wise Old Fashioned",
  },
];

const fallbackMenuSections: ThemeMenuSection[] = [
  {
    id: "starters",
    label: "Starters",
    items: [
      { name: "Charred Sourdough & Smoked Butter", tags: "V", description: "House-baked sourdough, lightly charred, served with smoked sea salt butter." },
      { name: "Grilled Prawns with Chimichurri", tags: "GF", description: "Fire-roasted prawns, citrus herb butter and fresh chimichurri." },
      { name: "Heirloom Tomato & Burrata", tags: "V · GF", description: "Vine-ripened tomatoes, creamy burrata, aged balsamic and fresh basil." },
      { name: "Smoked Wagyu Tartare", tags: "", description: "Hand-chopped Wagyu, egg yolk, pickled shallots, crispy capers and toasted rye." },
      { name: "Truffle Mushroom Arancini", tags: "V", description: "Crispy risotto balls stuffed with wild mushrooms, parmesan and truffle aioli." },
      { name: "Fire-Grilled Calamari", tags: "GF", description: "Charred calamari with lemon-garlic aioli and fresh herbs." },
    ],
  },
  {
    id: "mains",
    label: "Mains",
    items: [
      { name: "Fire-Grilled Ribeye", tags: "GF", description: "12oz ribeye, dry-aged 30 days, bone marrow butter and charred asparagus." },
      { name: "Cedar-Plank Salmon", tags: "GF", description: "Roasted over open flame, honey-lime glaze and a side of wild rice." },
      { name: "Lobster & Creamy Pasta", tags: "", description: "Butter-poached lobster, rich garlic cream, cherry tomatoes and microgreens." },
      { name: "Smoked Herb-Rubbed Chicken", tags: "GF", description: "Fire-roasted chicken, rosemary jus, garlic confit and crispy potatoes." },
      { name: "Crispy Cauliflower Schnitzel", tags: "V · GF", description: "Breaded cauliflower steaks, black lentils, roasted zucchini, carrots and greens." },
      { name: "Heirloom Tomato & Burrata", tags: "V · GF", description: "Vine-ripened tomatoes, creamy burrata, aged balsamic and fresh basil." },
    ],
  },
  {
    id: "desserts",
    label: "Desserts",
    items: [
      { name: "Molten Dark Chocolate Cake", tags: "V", description: "Rich chocolate cake with a gooey center and vanilla bean gelato." },
      { name: "Smoked Maple Crème Brûlée", tags: "GF · V", description: "Silky custard infused with smoked maple and a caramelized sugar crust." },
      { name: "Wood-Fired Apple Tart", tags: "V", description: "Flaky pastry, caramelized apples and cinnamon-spiced Chantilly cream." },
      { name: "Berry Pavlova", tags: "GF · V", description: "Light meringue topped with seasonal berries and lemon-mascarpone cream." },
      { name: "Salted Caramel Pecan Pie", tags: "V", description: "Buttery crust, toasted pecans, bourbon caramel and whipped cream." },
      { name: "House-Made Gelato Trio", tags: "GF · V", description: "A selection of handcrafted gelato flavors, rotating seasonally." },
    ],
  },
  {
    id: "drinks",
    label: "Drinks & Cocktails",
    items: [
      { name: "Wise Old Fashioned", tags: "", description: "Bourbon, smoked maple, orange bitters and charred oak essence." },
      { name: "Hibiscus Fire Margarita", tags: "", description: "Tequila, fresh hibiscus reduction, lime and a smoked salt rim." },
      { name: "Rosemary Smoked Negroni", tags: "", description: "Gin, vermouth, Campari and a rosemary smoke infusion." },
      { name: "Whiskey & Smoke", tags: "", description: "Aged whiskey, black walnut bitters, smoked cinnamon and a touch of honey." },
      { name: "House Wine Pairings", tags: "", description: "A curated selection of reds, whites and rosés to complement your meal." },
      { name: "Signature Mocktails", tags: "0%", description: "Citrus Basil Spritz and Berry Smoke Cooler — refreshing, alcohol-free." },
    ],
  },
];

const philosophy = [
  {
    mark: "i.",
    title: "Locally Sourced",
    description: "We partner with local farmers, butchers and artisans to bring you the freshest, seasonally inspired ingredients.",
  },
  {
    mark: "ii.",
    title: "Fire as an Element",
    description: "Every dish is enhanced by the primal power of flame — smoked, charred or seared to perfection.",
  },
  {
    mark: "iii.",
    title: "Perfect Pairings",
    description: "Our curated wines and craft cocktails are designed to complement and elevate every single bite.",
  },
  {
    mark: "iv.",
    title: "Memorable Dining",
    description: "From the ambiance to the plating, every detail is crafted to create an unforgettable experience.",
  },
];

const galleryImages: GalleryImage[] = [
  { className: "tall", src: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80", alt: "Grilled meat over flame" },
  { className: "wide", src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80", alt: "Warm restaurant interior" },
  { src: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80", alt: "Plated dish" },
  { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80", alt: "Dining room" },
  { src: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80", alt: "Chef plating" },
  { className: "wide", src: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80", alt: "Guests celebrating" },
  { src: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80", alt: "Fresh ingredients" },
];

const spaces = [
  { cap: "Up to 12 Guests", title: "The Ayo Room", description: "A cozy, intimate space — perfect for private dinners and small celebrations." },
  { cap: "Up to 40 Guests", title: "The Wise Hall", description: "A larger, elegant setting for weddings, corporate gatherings and milestone events." },
  { cap: "Open Air", title: "Patio Lounge", description: "An alfresco experience under the city stars, ideal for social gatherings." },
];

const reviews = [
  {
    quote: "The perfect balance of rustic charm and gourmet excellence. The charred Wagyu was unforgettable!",
    who: "Sarah M.",
  },
  {
    quote: "A hidden gem! Incredible ambiance, creative cocktails, and the best truffle fries in town.",
    who: "James R.",
  },
  {
    quote: "I love the open-fire kitchen concept. You can taste the passion in every single dish.",
    who: "Olivia T.",
  },
];

const policies = [
  "Online reservations accepted up to 30 days in advance.",
  "Confirmation sent by email or text upon booking.",
  "Parties of 6 or more may require a deposit.",
  "Please give 24 hours' notice for cancellations or changes.",
  "Walk-ins welcome — booking ahead secures your preferred time.",
];

export function isWiseAyoTheme(restaurant: Restaurant) {
  return restaurant.slug === WISE_AYO_SLUG || restaurant.theme?.key === WISE_AYO_SLUG || restaurant.homepage_style === WISE_AYO_SLUG;
}

export default function WiseAyoTheme({ restaurant }: { restaurant: Restaurant }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("starters");
  const [reservationMessage, setReservationMessage] = useState("");
  const [newsletterPlaceholder, setNewsletterPlaceholder] = useState("Enter your email");
  const [dateMin, setDateMin] = useState("");
  const structuredData = buildRestaurantJsonLd(restaurant);
  const menuSections = useMemo(() => themeMenuFromCategories(restaurant.categories), [restaurant.categories]);
  const displayedMenuSections = menuSections.length > 0 ? menuSections : fallbackMenuSections;
  const contact = restaurantContact(restaurant);
  const heroImage = restaurant.hero_image || HERO_IMAGE;

  useEffect(() => {
    if (!displayedMenuSections.some((section) => section.id === activeMenu)) {
      setActiveMenu(displayedMenuSections[0]?.id || "starters");
    }
  }, [activeMenu, displayedMenuSections]);

  useEffect(() => {
    setDateMin(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const header = root.querySelector<HTMLElement>(".site-header");
    const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const staggerGroups = [".dishes", ".reviews", ".spaces", ".philo-grid", ".gal", ".menu-list", ".foot-grid", ".visit-grid > div:first-child"];
    staggerGroups.forEach((selector) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((group) => {
        Array.from(group.children).forEach((child, index) => {
          const element = child as HTMLElement;
          element.classList.add("reveal-child");
          element.style.setProperty("--d", `${((index % 8) * 0.1).toFixed(2)}s`);
        });
      });
    });

    const revealElements = root.querySelectorAll<HTMLElement>(".reveal, .reveal-child, .divider, .frame");
    if (!("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const wraps = Array.from(root.querySelectorAll<HTMLElement>(".hwrap"));
    if (wraps.length === 0) return;

    const mediaMatches = (query: string) => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false);
    const stacked = () => mediaMatches("(max-width:900px)") || mediaMatches("(prefers-reduced-motion: reduce)");
    const items = wraps.map((wrap) => ({
      wrap,
      track: wrap.querySelector<HTMLElement>(".htrack"),
      target: 0,
      current: 0,
      running: false,
    }));

    function animate(item: (typeof items)[number]) {
      if (!item.track) return;
      item.current += (item.target - item.current) * 0.12;
      if (Math.abs(item.target - item.current) < 0.0004) {
        item.current = item.target;
        item.running = false;
      }
      item.track.style.transform = `translate3d(${(-item.current * 100).toFixed(3)}vw,0,0)`;
      if (item.running) window.requestAnimationFrame(() => animate(item));
    }

    function updatePanels() {
      if (stacked()) {
        items.forEach((item) => {
          if (item.track) item.track.style.transform = "";
        });
        return;
      }

      items.forEach((item) => {
        const total = item.wrap.offsetHeight - window.innerHeight;
        item.target = total > 0 ? Math.min(1, Math.max(0, -item.wrap.getBoundingClientRect().top / total)) : 0;
        if (!item.running) {
          item.running = true;
          window.requestAnimationFrame(() => animate(item));
        }
      });
    }

    const anchorMap: Record<string, [string, number]> = {
      "#about": ["storyflame", 0],
      "#signatures": ["storyflame", 1],
      "#philosophy": ["guides", 0],
      "#gallery": ["guides", 1],
    };
    const linkCleanups: Array<() => void> = [];

    Object.entries(anchorMap).forEach(([href, [id, progress]]) => {
      const wrap = root.querySelector<HTMLElement>(`#${id}`);
      if (!wrap) return;

      root.querySelectorAll<HTMLAnchorElement>(`a[href="${href}"]`).forEach((anchor) => {
        const listener = (event: MouseEvent) => {
          if (stacked()) return;
          event.preventDefault();
          window.scrollTo({
            top: wrap.offsetTop + (wrap.offsetHeight - window.innerHeight) * progress,
            behavior: "smooth",
          });
        };
        anchor.addEventListener("click", listener);
        linkCleanups.push(() => anchor.removeEventListener("click", listener));
      });
    });

    updatePanels();
    window.addEventListener("scroll", updatePanels, { passive: true });
    window.addEventListener("resize", updatePanels);
    return () => {
      window.removeEventListener("scroll", updatePanels);
      window.removeEventListener("resize", updatePanels);
      linkCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const photo = root.querySelector<HTMLElement>(".hero-photo");
    const band = root.querySelector<HTMLElement>(".hero-band");
    const parallaxElements = Array.from(root.querySelectorAll<HTMLElement>("[data-plx]"));
    let ticking = false;

    function frame() {
      const y = window.scrollY;
      const viewportHeight = window.innerHeight;
      if (y < viewportHeight * 1.3) {
        if (photo) photo.style.transform = `translateY(${(y * 0.45).toFixed(1)}px)`;
        if (band) {
          band.classList.add("plx-live");
          band.style.transform = `translateY(${(y * -0.1).toFixed(1)}px)`;
        }
      }

      parallaxElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > viewportHeight + 120) return;
        element.classList.add("plx-live");
        const amount = Number.parseFloat(element.dataset.plx || "0");
        const offset = (rect.top + rect.height / 2 - viewportHeight / 2) * amount;
        element.style.transform = `translateY(${offset.toFixed(1)}px)`;
      });
      ticking = false;
    }

    const onScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(frame);
      ticking = true;
    };

    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    setReservationMessage(`Thank you${name ? `, ${name}` : ""} — we've received your request. A confirmation will follow by email or text.`);
    form.reset();
  }

  function handleNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!String(data.get("newsletter") || "").trim()) return;
    form.reset();
    setNewsletterPlaceholder("Subscribed — welcome to the table!");
  }

  return (
    <main className="wise-ayo-theme" ref={rootRef}>
      <style>{wiseAyoCss}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />

      <header className="site-header" id="header">
        <nav className="nav wrap" aria-label="Wise & Ayo navigation">
          <a className="brand" href="#home" aria-label={`${restaurant.name} home`}>
            <BrandMark name={restaurant.name} />
          </a>
          <div className="nav-links">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </div>
          <button
            className="burger"
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </header>

      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>{link.label}</a>
        ))}
      </div>

      <section className="hero" id="home">
        <div className="hero-photo">
          <img
            src={heroImage}
            alt="A wood-fired feast at Wise & Ayo"
            onError={(event) => handleImageFallback(event.currentTarget, HERO_FALLBACK_IMAGE)}
          />
        </div>
        <div className="hero-band reveal">
          <div className="wrap hero-band-inner">
            <h1>
              Where Fire Meets Flavor –<br />
              A Culinary Journey Awaits.
            </h1>
            <p className="sub">Experience bold, wood-fired flavors in a warm, rustic ambiance. Join us for a dining experience that blends tradition with innovation.</p>
            <div className="hero-actions">
              <a href="#reserve" className="btn hero-btn">Reserve a Table</a>
              <a href="#menu" className="btn hero-btn">View Our Menu</a>
            </div>
          </div>
        </div>
      </section>

      <div className="hwrap" id="storyflame">
        <div className="hsticky">
          <div className="htrack">
            <section id="about" className="hpanel">
              <div className="wrap welcome-grid">
                <div className="welcome-copy reveal">
                  <span className="eyebrow">Our Story</span>
                  <h2 className="display">Welcome to<br />Wise &amp; Ayo</h2>
                  <p>We believe that great food tells a story. Our chefs masterfully blend global influences with modern techniques, crafting dishes that celebrate fresh, seasonal ingredients.</p>
                  <p>From the crackling embers to the final plate, every dish is built with passion, precision, and a deep respect for the primal power of flame. Whether it's an intimate dinner or a lively gathering, we promise a meal worth remembering.</p>
                  <p className="welcome-sign">— Chef Daniel Carter, Founder &amp; Executive Chef</p>
                </div>
                <div className="frame reveal" data-plx="0.07">
                  <div className="ph" />
                  <img
                    src={STORY_IMAGE}
                    alt="The warm, rustic dining room of Wise & Ayo"
                    loading="lazy"
                    onError={(event) => hideImage(event.currentTarget)}
                  />
                </div>
              </div>
              <div className="hnext" aria-hidden="true">Continue<span className="hnext-arrow">⟶</span></div>
            </section>

            <section id="signatures" className="hpanel">
              <div className="wrap">
                <div className="sec-head reveal">
                  <span className="eyebrow center">From the Flame</span>
                  <h2 className="display">Our Signature Dishes</h2>
                  <p>A handful of the plates our guests return for — each one shaped by fire, seasonality, and a little obsession.</p>
                </div>
                <div className="dishes">
                  {signatureDishes.map((dish) => (
                    <article className="dish reveal" key={dish.name}>
                      <div className="dish-img">
                        <div className="ph" />
                        <img src={dish.image} alt={dish.alt} loading="lazy" onError={(event) => hideImage(event.currentTarget)} />
                      </div>
                      <div className="dish-body">
                        <span className="dish-tag">{dish.tag}</span>
                        <h3>{dish.name}</h3>
                        <p>{dish.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <section id="menu" className="menu-sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow center">Crafted by Fire</span>
            <h2 className="display">The Menu</h2>
            <p>Each dish highlights bold flavors, fresh ingredients, and the art of open-fire cooking. Our menu changes seasonally to ensure the finest quality.</p>
          </div>

          <div className="tabs reveal" role="tablist" aria-label="Menu sections">
            {displayedMenuSections.map((section) => (
              <button
                className={`tab ${activeMenu === section.id ? "active" : ""}`}
                key={section.id}
                type="button"
                role="tab"
                aria-selected={activeMenu === section.id}
                onClick={() => setActiveMenu(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>

          {displayedMenuSections.map((section) => (
            <div className={`menu-panel ${activeMenu === section.id ? "active" : ""}`} id={section.id} key={section.id} role="tabpanel">
              <div className="menu-list">
                {section.items.map((item) => (
                  <div className="menu-item" key={`${section.id}-${item.name}`}>
                    <div className="top">
                      <h3>{item.name}</h3>
                      <span className="dots" />
                      <span className="tags">{item.tags}</span>
                    </div>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="menu-note">V = Vegan · GF = Gluten-Free — Dairy-free options available. Please ask your server for modifications.</p>
        </div>
      </section>

      <div className="hwrap" id="guides">
        <div className="hsticky">
          <div className="htrack">
            <section id="philosophy" className="hpanel">
              <div className="wrap">
                <div className="sec-head reveal">
                  <span className="eyebrow center">What Guides Us</span>
                  <h2 className="display">Our Philosophy</h2>
                </div>
                <div className="philo-grid reveal">
                  {philosophy.map((item) => (
                    <div className="philo" key={item.title}>
                      <span className="mark">{item.mark}</span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hnext" aria-hidden="true">Continue<span className="hnext-arrow">⟶</span></div>
            </section>

            <section id="gallery" className="hpanel">
              <div className="wrap">
                <div className="sec-head reveal">
                  <span className="eyebrow center">Feast Your Eyes</span>
                  <h2 className="display">A Taste of What Awaits</h2>
                  <p>From rustic interiors to beautifully plated dishes — let your culinary curiosity be ignited.</p>
                </div>
                <div className="gal reveal">
                  {galleryImages.map((image) => (
                    <figure className={image.className || undefined} key={image.src}>
                      <span className="ph-mark">&amp;</span>
                      <img src={image.src} alt={image.alt} loading="lazy" onError={(event) => hideImage(event.currentTarget)} />
                    </figure>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <section id="events" className="events-sec">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow center">Exclusive Gatherings</span>
            <h2 className="display">Events &amp; Private Dining</h2>
            <p>Every occasion deserves a touch of warmth, flavor and elegance. Choose the space that fits your celebration.</p>
          </div>
          <div className="spaces reveal">
            {spaces.map((space) => (
              <div className="space" key={space.title}>
                <span className="cap">{space.cap}</span>
                <h3>{space.title}</h3>
                <p>{space.description}</p>
              </div>
            ))}
          </div>
          <div className="center-action reveal">
            <a href="#reserve" className="btn btn-fill">Inquire About an Event</a>
          </div>
        </div>
      </section>

      <section id="reviews">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow center">Guest Reviews</span>
            <h2 className="display">Kind Words</h2>
          </div>
          <div className="reviews">
            {reviews.map((review) => (
              <div className="review reveal" key={review.who}>
                <span className="q">"</span>
                <div className="stars">★★★★★</div>
                <p>{review.quote}</p>
                <span className="who">{review.who}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reserve" className="menu-sec">
        <div className="wrap reserve-grid">
          <div className="reserve-info reveal">
            <span className="eyebrow">Reserve Your Seat at the Fire</span>
            <h2 className="display">Book Your Table</h2>
            <p className="lede">Whether it's an intimate dinner or a group gathering, secure your table today and let us take care of the rest.</p>
            <ul className="policy">
              {policies.map((policy) => <li key={policy}>{policy}</li>)}
            </ul>
          </div>

          <div className="reserve-form reveal">
            <form onSubmit={handleReservation}>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="rDate">Date</label>
                  <input type="date" id="rDate" name="date" min={dateMin} required />
                </div>
                <div className="form-field">
                  <label htmlFor="rTime">Time</label>
                  <select id="rTime" name="time" required defaultValue="">
                    <option value="">Select time</option>
                    <option>5:00 PM</option>
                    <option>6:00 PM</option>
                    <option>7:00 PM</option>
                    <option>8:00 PM</option>
                    <option>9:00 PM</option>
                    <option>10:00 PM</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="rName">Full Name</label>
                  <input type="text" id="rName" name="name" placeholder="Your name" required />
                </div>
                <div className="form-field">
                  <label htmlFor="rGuests">Guests</label>
                  <select id="rGuests" name="guests" required defaultValue="">
                    <option value="">How many?</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                    <option>6</option>
                    <option>7+</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Seating Preference</label>
                <div className="seating">
                  <label><input type="radio" name="seat" value="Indoor" defaultChecked /><span>Indoor</span></label>
                  <label><input type="radio" name="seat" value="Outdoor" /><span>Outdoor</span></label>
                  <label><input type="radio" name="seat" value="Bar" /><span>Bar</span></label>
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="rNotes">Special Requests</label>
                <textarea id="rNotes" name="notes" placeholder="Dietary preferences, celebrations, accessibility needs…" />
              </div>
              <button type="submit" className="btn btn-fill full-width">Confirm Reservation</button>
              <p className="form-msg" role="status">{reservationMessage}</p>
            </form>
          </div>
        </div>
      </section>

      <section id="contact">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow center">Visit Us</span>
            <h2 className="display">Find Us by the Fire</h2>
            <p>In the heart of New York City — where fire meets flavor, and every meal is an experience to remember.</p>
          </div>
          <div className="visit-grid">
            <div className="reveal">
              <InfoBlock label="Address">
                {contact.address}<span>{contact.cityLine}</span>
              </InfoBlock>
              <InfoBlock label="Reservations">{contact.phone}</InfoBlock>
              <InfoBlock label="Email">{contact.email}</InfoBlock>
              <div className="info-block">
                <div className="k">Opening Hours</div>
                <div className="hours-list">
                  <div className="hours-row"><span>Monday – Thursday</span><span>5 PM – 10 PM</span></div>
                  <div className="hours-row"><span>Friday – Saturday</span><span>5 PM – Midnight</span></div>
                  <div className="hours-row"><span>Sunday Brunch</span><span>10 AM – 2 PM</span></div>
                </div>
              </div>
            </div>
            <div className="map-block reveal" data-plx="0.05">
              <div className="pin">📍</div>
              <p>The heart of New York City</p>
              <span>Street parking available · Valet on weekends</span>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <a href="#home" className="brand"><BrandMark name={restaurant.name} /></a>
              <p>Where fire meets flavor — a culinary journey awaits.</p>
            </div>
            <div className="foot-col">
              <h4>Explore</h4>
              {navLinks.filter((link) => link.href !== "#reserve" && link.href !== "#contact").map((link) => (
                <a key={link.href} href={link.href}>{link.label}</a>
              ))}
            </div>
            <div className="foot-col">
              <h4>Visit</h4>
              <p>{contact.address}<br />{contact.cityLine}</p>
              <p>{contact.email}</p>
              <p>{contact.phone}</p>
            </div>
            <div className="foot-col news">
              <h4>Newsletter</h4>
              <p>Exclusive offers, seasonal menus and event updates delivered to your inbox.</p>
              <form className="news-form" onSubmit={handleNewsletter}>
                <input type="email" name="newsletter" placeholder={newsletterPlaceholder} aria-label="Email address" />
                <button type="submit">Subscribe</button>
              </form>
            </div>
          </div>
          <div className="foot-bottom">
            <p>© 2025 Wise &amp; Ayo. All Rights Reserved.</p>
            <div className="foot-legal">
              <a href="/datenschutz">Privacy Policy</a>
              <a href="/impressum">Terms &amp; Conditions</a>
            </div>
          </div>
        </div>
      </footer>

      <p className="disclaimer">This website is entirely fictional and created for illustrative purposes only. Any resemblance to a real business is coincidental.</p>
    </main>
  );
}

function BrandMark({ name }: { name: string }) {
  const compactName = name.replace(/\s*&\s*/, "&");
  const [beforeAmp, afterAmp] = compactName.split("&");

  if (!afterAmp) return <>{name}</>;
  return <>{beforeAmp}<span className="amp">&amp;</span>{afterAmp}</>;
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="info-block">
      <div className="k">{label}</div>
      <div className="v">{children}</div>
    </div>
  );
}

function themeMenuFromCategories(categories: Category[]): ThemeMenuSection[] {
  if (categories.length === 0) return [];

  return categories
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((category) => ({
      id: category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `category-${category.id}`,
      label: category.name,
      items: category.items
        .filter((item) => item.is_available)
        .map((item) => ({
          name: item.name,
          description: item.description,
          tags: item.allergens,
        })),
    }))
    .filter((section) => section.items.length > 0);
}

function restaurantContact(restaurant: Restaurant) {
  return {
    address: restaurant.address || "123 Kindling Street",
    cityLine: [restaurant.city || "New York", restaurant.postal_code || "NY 10001"].filter(Boolean).join(", "),
    phone: restaurant.phone || "(555) 012-3456",
    email: restaurant.email || "hello@wiseandayo.com",
  };
}

function handleImageFallback(image: HTMLImageElement, fallback: string) {
  if (image.dataset.fallbackShown !== "true") {
    image.dataset.fallbackShown = "true";
    image.src = fallback;
    return;
  }
  hideImage(image);
}

function hideImage(image: HTMLImageElement) {
  image.style.display = "none";
}

function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const wiseAyoCss = String.raw`
@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap");

.wise-ayo-theme{
  --smoke:#ffffff;
  --smoke-2:#f4f8f3;
  --smoke-3:#e8efe7;
  --ember:#d65a28;
  --ember-deep:#b8451f;
  --gold:#8a6a2e;
  --gold-soft:#7d6029;
  --parchment:#163f2c;
  --ash:#4f635a;
  --ash-dim:#6f7d74;
  --line:rgba(22,63,44,.18);
  --line-soft:rgba(22,63,44,.10);
  --serif:"Cormorant Garamond", Georgia, serif;
  --sans:"Jost", "Helvetica Neue", Arial, sans-serif;
  --ease:cubic-bezier(.22,.61,.36,1);
  background:var(--smoke);
  color:var(--parchment);
  font-family:var(--sans);
  font-weight:300;
  line-height:1.7;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
  position:relative;
  min-height:100vh;
}
.wise-ayo-theme,.wise-ayo-theme *{box-sizing:border-box}
.wise-ayo-theme *{margin:0;padding:0}
.wise-ayo-theme img{display:block;max-width:100%}
.wise-ayo-theme a{color:inherit;text-decoration:none}
.wise-ayo-theme ::selection{background:var(--ember);color:var(--smoke)}
.wise-ayo-theme::after{
  content:"";position:fixed;inset:0;z-index:9999;pointer-events:none;
  opacity:.045;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.wise-ayo-theme .eyebrow{
  font-family:var(--sans);font-weight:500;font-size:.72rem;
  letter-spacing:.42em;text-transform:uppercase;color:var(--gold-soft);
  display:inline-flex;align-items:center;gap:.9rem;
}
.wise-ayo-theme .eyebrow::before{content:"";width:34px;height:1px;background:var(--gold-soft);opacity:.6}
.wise-ayo-theme .eyebrow.center{justify-content:center}
.wise-ayo-theme .eyebrow.center::after{content:"";width:34px;height:1px;background:var(--gold-soft);opacity:.6}
.wise-ayo-theme h1,.wise-ayo-theme h2,.wise-ayo-theme h3{font-family:var(--serif);font-weight:500;line-height:1.05;letter-spacing:.005em}
.wise-ayo-theme h2.display{font-size:clamp(2.4rem,5.5vw,4.2rem)}
.wise-ayo-theme .lede{font-family:var(--serif);font-size:clamp(1.15rem,2vw,1.5rem);font-weight:400;color:var(--ash);line-height:1.55;font-style:italic}
.wise-ayo-theme .btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.6rem;
  font-family:var(--sans);font-weight:500;font-size:.78rem;letter-spacing:.22em;
  text-transform:uppercase;padding:1.05rem 2.1rem;cursor:pointer;
  border:1px solid transparent;transition:.45s var(--ease);position:relative;
}
.wise-ayo-theme .btn-fill{background:var(--ember);color:#fff;border-color:var(--ember)}
.wise-ayo-theme .btn-fill:hover{background:var(--gold);border-color:var(--gold)}
.wise-ayo-theme .btn:focus-visible,.wise-ayo-theme a:focus-visible,.wise-ayo-theme input:focus-visible,.wise-ayo-theme select:focus-visible,.wise-ayo-theme textarea:focus-visible,.wise-ayo-theme button:focus-visible{
  outline:2px solid var(--gold);outline-offset:3px;
}
.wise-ayo-theme .wrap{width:min(1200px,90vw);margin-inline:auto}
.wise-ayo-theme section{position:relative;padding:clamp(5rem,10vw,9rem) 0}
.wise-ayo-theme .site-header{
  position:fixed;top:0;left:0;right:0;z-index:100;
  background:rgba(255,255,255,.92);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--line-soft);
  transition:.5s var(--ease);
}
.wise-ayo-theme .nav{
  display:flex;align-items:center;justify-content:space-between;
  padding:1.5rem 0;transition:.5s var(--ease);
}
.wise-ayo-theme .brand{font-family:var(--serif);font-style:italic;font-size:1.75rem;font-weight:500;letter-spacing:.01em;color:var(--parchment);white-space:nowrap}
.wise-ayo-theme .brand .amp{color:var(--ember);font-style:italic;font-weight:500;padding:0 .12em}
.wise-ayo-theme .nav-links{display:flex;gap:1.7rem;align-items:center}
.wise-ayo-theme .nav-links a{
  font-family:var(--sans);font-size:.76rem;letter-spacing:.18em;text-transform:uppercase;
  color:var(--parchment);opacity:.82;transition:.3s;position:relative;padding:.2rem 0;
}
.wise-ayo-theme .nav-links a::after{content:"";position:absolute;left:0;bottom:-2px;width:0;height:1px;background:var(--ember);transition:.3s var(--ease)}
.wise-ayo-theme .nav-links a:hover{opacity:1;color:var(--gold)}
.wise-ayo-theme .nav-links a:hover::after{width:100%}
.wise-ayo-theme .site-header.scrolled{background:rgba(255,255,255,.9);backdrop-filter:blur(14px);border-bottom:1px solid var(--line-soft);box-shadow:0 6px 24px rgba(22,63,44,.05)}
.wise-ayo-theme .site-header.scrolled .nav{padding:.9rem 0}
.wise-ayo-theme .burger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:8px}
.wise-ayo-theme .burger span{width:26px;height:1.5px;background:var(--parchment);transition:.35s var(--ease)}
.wise-ayo-theme .mobile-menu{
  position:fixed;inset:0;background:rgba(255,255,255,.98);backdrop-filter:blur(8px);
  z-index:99;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.8rem;
  opacity:0;pointer-events:none;transition:.45s var(--ease);
}
.wise-ayo-theme .mobile-menu.open{opacity:1;pointer-events:auto}
.wise-ayo-theme .mobile-menu a{font-family:var(--serif);font-size:2rem;color:var(--parchment)}
.wise-ayo-theme .mobile-menu a:hover{color:var(--ember)}
.wise-ayo-theme .hero{
  min-height:100vh;display:flex;align-items:center;justify-content:center;
  position:relative;overflow:hidden;
}
.wise-ayo-theme .hero-photo{position:absolute;left:0;top:-14%;width:100%;height:128%;z-index:0;will-change:transform;
  background:
    radial-gradient(120% 80% at 50% 38%, rgba(214,90,40,.38), transparent 60%),
    linear-gradient(160deg,#3a2418 0%,#241610 45%,#160f0a 100%);
}
.wise-ayo-theme .hero-photo::after{content:"";position:absolute;inset:0;z-index:1;
  background:linear-gradient(to bottom, rgba(20,14,9,.18), transparent 22%, transparent 78%, rgba(20,14,9,.22));}
.wise-ayo-theme .hero-photo img{
  position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;z-index:0;
}
.wise-ayo-theme .hero-band{
  position:relative;z-index:2;width:100%;background:#fff;text-align:center;
  padding:clamp(1.1rem,2.2vw,1.8rem) 0;
  box-shadow:0 0 90px rgba(20,14,9,.22);
}
.wise-ayo-theme .hero-band::before,.wise-ayo-theme .hero-band::after{content:"";position:absolute;left:-2%;width:104%;height:40px;background:#fff}
.wise-ayo-theme .hero-band::before{top:-18px;border-radius:50%}
.wise-ayo-theme .hero-band::after{bottom:-18px;border-radius:50%}
.wise-ayo-theme .hero-band-inner{position:relative;z-index:1;max-width:840px}
.wise-ayo-theme .hero h1{
  font-family:var(--serif);font-weight:500;
  font-size:clamp(1.85rem,4vw,3rem);line-height:1.14;
  font-variant:small-caps;letter-spacing:.02em;
  color:var(--parchment);margin-bottom:1rem;
}
.wise-ayo-theme .hero p.sub{
  max-width:580px;margin:0 auto 1.7rem;
  font-size:1rem;color:var(--ash);line-height:1.65;font-weight:300;
}
.wise-ayo-theme .hero-actions{display:flex;gap:1.1rem;flex-wrap:wrap;justify-content:center}
.wise-ayo-theme .hero-btn{
  font-family:var(--serif);font-variant:small-caps;font-weight:500;
  font-size:.98rem;letter-spacing:.06em;text-transform:none;
  padding:.62rem 1.7rem;border:1px solid var(--line);
  color:var(--parchment);background:transparent;
}
.wise-ayo-theme .hero-btn:hover{background:var(--ember);border-color:var(--ember);color:#fff}
.wise-ayo-theme .reveal,.wise-ayo-theme .reveal-child{
  opacity:0;transform:translateY(36px);
  transition:opacity 1.35s var(--ease),transform 1.35s var(--ease);
  transition-delay:var(--d,0s);
  will-change:opacity,transform;
}
.wise-ayo-theme .reveal.in,.wise-ayo-theme .reveal-child.in{opacity:1;transform:none}
.wise-ayo-theme .plx-live{transition:opacity 1.35s var(--ease) !important}
.wise-ayo-theme .reveal-child .dish-img img,.wise-ayo-theme .gal .reveal-child img,.wise-ayo-theme .frame img{
  transform:scale(1.12);
  transition:transform 1.6s var(--ease),scale 1.1s var(--ease);
  transition-delay:var(--d,0s),0s;
}
.wise-ayo-theme .reveal-child.in .dish-img img,.wise-ayo-theme .gal .reveal-child.in img,.wise-ayo-theme .reveal.in .frame img,.wise-ayo-theme .frame.in img{transform:scale(1)}
.wise-ayo-theme .hwrap{position:relative;height:280vh}
.wise-ayo-theme .hsticky{position:sticky;top:0;height:100vh;overflow:hidden}
.wise-ayo-theme .htrack{display:flex;height:100%;width:200vw;will-change:transform}
.wise-ayo-theme .hpanel{
  width:100vw;height:100vh;flex-shrink:0;position:relative;
  display:flex;align-items:safe center;justify-content:center;
  padding:5rem 0 1.6rem;overflow:hidden;
}
.wise-ayo-theme .hpanel .wrap{width:min(1200px,90vw)}
.wise-ayo-theme .hpanel .frame{aspect-ratio:auto;height:clamp(300px,56vh,540px)}
.wise-ayo-theme .hpanel .sec-head{margin-bottom:clamp(1rem,3vh,3.5rem)}
.wise-ayo-theme .hpanel .dish-img{aspect-ratio:auto;height:clamp(200px,calc(97vh - 472px),376px)}
.wise-ayo-theme .hpanel .dish-body{padding:clamp(1.2rem,2.4vh,1.8rem) 1.6rem clamp(1.3rem,2.6vh,2rem)}
.wise-ayo-theme .hpanel .philo{padding:clamp(1.3rem,3.6vh,3.2rem) clamp(1.5rem,3vw,3.2rem)}
.wise-ayo-theme .hpanel .philo .mark{font-size:clamp(1.8rem,3.2vh,2.4rem);margin-bottom:clamp(.6rem,1.4vh,1.1rem)}
.wise-ayo-theme .hpanel .gal{grid-auto-rows:clamp(110px,calc((97vh - 315px)/3),200px);gap:12px}
.wise-ayo-theme .hnext{
  position:absolute;right:4vw;bottom:6vh;z-index:3;
  display:flex;align-items:center;gap:.8rem;
  font-family:var(--sans);font-size:.68rem;letter-spacing:.3em;text-transform:uppercase;
  color:var(--ash-dim);pointer-events:none;
}
.wise-ayo-theme .hnext-arrow{font-size:1.5rem;line-height:1;color:var(--ember);animation:wiseAyoNudge 2.2s var(--ease) infinite}
@keyframes wiseAyoNudge{0%,100%{transform:translateX(0);opacity:.55}50%{transform:translateX(10px);opacity:1}}
.wise-ayo-theme .welcome-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(2.5rem,6vw,6rem);align-items:center}
.wise-ayo-theme .welcome-copy h2{margin:1.4rem 0}
.wise-ayo-theme .welcome-copy p{color:var(--ash);margin-bottom:1.4rem;max-width:46ch}
.wise-ayo-theme .welcome-sign{font-family:var(--serif);font-style:italic;font-size:1.5rem;color:var(--gold);margin-top:.6rem}
.wise-ayo-theme .frame{position:relative;aspect-ratio:4/5}
.wise-ayo-theme .frame img{width:100%;height:100%;object-fit:cover;position:relative;z-index:1;filter:saturate(1.05) contrast(1.02)}
.wise-ayo-theme .frame .ph{position:absolute;inset:0;z-index:0;
  background:linear-gradient(150deg,#e9f0e7,#f4f8f3);
  display:flex;align-items:center;justify-content:center}
.wise-ayo-theme .frame .ph::after{content:"&";font-family:var(--serif);font-size:8rem;font-style:italic;color:rgba(22,63,44,.10)}
.wise-ayo-theme .frame::before{content:"";position:absolute;inset:0;border:1px solid var(--line);z-index:2;transform:translate(18px,18px);pointer-events:none}
.wise-ayo-theme .sec-head{text-align:center;max-width:640px;margin:0 auto clamp(3rem,6vw,4.5rem)}
.wise-ayo-theme .sec-head h2{margin:1.2rem 0 1rem}
.wise-ayo-theme .sec-head p{color:var(--ash)}
.wise-ayo-theme .dishes{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(1.4rem,3vw,2.4rem)}
.wise-ayo-theme .dish{background:var(--smoke-2);border:1px solid var(--line-soft);transition:.5s var(--ease);position:relative}
.wise-ayo-theme .dish:hover{transform:translateY(-8px);border-color:var(--line)}
.wise-ayo-theme .dish-img{aspect-ratio:1/1;position:relative;overflow:hidden}
.wise-ayo-theme .dish-img img{width:100%;height:100%;object-fit:cover;transition:scale 1.2s var(--ease);position:relative;z-index:1}
.wise-ayo-theme .dish:hover .dish-img img{scale:1.08}
.wise-ayo-theme .dish-img .ph{position:absolute;inset:0;z-index:0;background:linear-gradient(140deg,#eef3ec,#f4f8f3);display:flex;align-items:center;justify-content:center}
.wise-ayo-theme .dish-img .ph::after{content:"";width:60px;height:60px;border:1px solid var(--line);border-radius:50%}
.wise-ayo-theme .dish-body{padding:1.8rem 1.6rem 2rem}
.wise-ayo-theme .dish-tag{font-family:var(--sans);font-size:.66rem;letter-spacing:.24em;text-transform:uppercase;color:var(--ember);display:block;margin-bottom:.7rem}
.wise-ayo-theme .dish h3{font-size:1.5rem;font-weight:500;margin-bottom:.6rem}
.wise-ayo-theme .dish p{color:var(--ash);font-size:.92rem;line-height:1.55}
.wise-ayo-theme .menu-sec{background:var(--smoke-2)}
.wise-ayo-theme .tabs{display:flex;justify-content:center;gap:.4rem;flex-wrap:wrap;margin-bottom:3.4rem}
.wise-ayo-theme .tab{
  font-family:var(--sans);font-size:.74rem;letter-spacing:.2em;text-transform:uppercase;
  background:none;border:1px solid var(--line-soft);color:var(--ash);
  padding:.75rem 1.5rem;cursor:pointer;transition:.35s var(--ease);
}
.wise-ayo-theme .tab:hover{color:var(--parchment);border-color:var(--line)}
.wise-ayo-theme .tab.active{background:var(--ember);border-color:var(--ember);color:#fff}
.wise-ayo-theme .menu-panel{display:none}
.wise-ayo-theme .menu-panel.active{display:block;animation:wiseAyoFade .5s var(--ease)}
@keyframes wiseAyoFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.wise-ayo-theme .menu-list{display:grid;grid-template-columns:1fr 1fr;gap:.4rem 4rem;max-width:1000px;margin-inline:auto}
.wise-ayo-theme .menu-item{padding:1.3rem 0;border-bottom:1px solid var(--line-soft)}
.wise-ayo-theme .menu-item .top{display:flex;align-items:baseline;gap:.8rem}
.wise-ayo-theme .menu-item h3{font-size:1.4rem;font-weight:500;white-space:nowrap}
.wise-ayo-theme .menu-item .dots{flex:1;border-bottom:1px dotted var(--ash-dim);transform:translateY(-4px);min-width:20px}
.wise-ayo-theme .menu-item .tags{font-family:var(--sans);font-size:.64rem;letter-spacing:.14em;color:var(--ember);white-space:nowrap}
.wise-ayo-theme .menu-item p{color:var(--ash);font-size:.9rem;margin-top:.35rem;max-width:52ch}
.wise-ayo-theme .menu-note{text-align:center;color:var(--ash-dim);font-size:.82rem;letter-spacing:.05em;margin-top:2.8rem}
.wise-ayo-theme .philo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line-soft);border:1px solid var(--line-soft)}
.wise-ayo-theme .philo{background:var(--smoke);padding:clamp(2rem,4vw,3.2rem)}
.wise-ayo-theme .philo .mark{font-family:var(--serif);font-style:italic;font-size:2.4rem;color:var(--ember);line-height:1;margin-bottom:1.1rem;display:block}
.wise-ayo-theme .philo h3{font-size:1.55rem;font-weight:500;margin-bottom:.7rem}
.wise-ayo-theme .philo p{color:var(--ash);font-size:.94rem}
.wise-ayo-theme .gal{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:200px;gap:12px}
.wise-ayo-theme .gal figure{position:relative;overflow:hidden;background:linear-gradient(140deg,#e9f0e7,#f2f6f0)}
.wise-ayo-theme .gal figure img{width:100%;height:100%;object-fit:cover;transition:scale 1s var(--ease);position:relative;z-index:1}
.wise-ayo-theme .gal figure:hover img{scale:1.07}
.wise-ayo-theme .gal figure::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(14,10,7,.5),transparent 50%);z-index:2;opacity:0;transition:.4s}
.wise-ayo-theme .gal figure:hover::after{opacity:1}
.wise-ayo-theme .gal .tall{grid-row:span 2}
.wise-ayo-theme .gal .wide{grid-column:span 2}
.wise-ayo-theme .gal .ph-mark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(22,63,44,.12);font-family:var(--serif);font-style:italic;font-size:2.6rem;z-index:0}
.wise-ayo-theme .events-sec{background:var(--smoke-2)}
.wise-ayo-theme .spaces{display:grid;grid-template-columns:repeat(3,1fr);gap:1.6rem;margin-top:3rem}
.wise-ayo-theme .space{border:1px solid var(--line-soft);padding:2.2rem 1.8rem;transition:.4s var(--ease);background:var(--smoke)}
.wise-ayo-theme .space:hover{border-color:var(--line);transform:translateY(-6px)}
.wise-ayo-theme .space .cap{font-family:var(--sans);font-size:.68rem;letter-spacing:.24em;text-transform:uppercase;color:var(--gold-soft);display:block;margin-bottom:.9rem}
.wise-ayo-theme .space h3{font-size:1.6rem;font-weight:500;margin-bottom:.6rem}
.wise-ayo-theme .space p{color:var(--ash);font-size:.92rem}
.wise-ayo-theme .center-action{text-align:center;margin-top:3rem}
.wise-ayo-theme .reviews{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}
.wise-ayo-theme .review{padding:2.4rem 2rem;border:1px solid var(--line-soft);position:relative;background:var(--smoke-2)}
.wise-ayo-theme .review .q{font-family:var(--serif);font-style:italic;font-size:4rem;color:var(--ember);line-height:.6;opacity:.5;position:absolute;top:1.6rem;left:1.4rem}
.wise-ayo-theme .review p{font-family:var(--serif);font-size:1.25rem;font-style:italic;line-height:1.5;color:var(--parchment);margin:2rem 0 1.6rem;position:relative;z-index:1}
.wise-ayo-theme .review .who{font-family:var(--sans);font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-soft)}
.wise-ayo-theme .stars{color:var(--ember);letter-spacing:.2em;font-size:.8rem;margin-bottom:.4rem}
.wise-ayo-theme .reserve-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(2.5rem,6vw,5rem);align-items:start}
.wise-ayo-theme .form-field{margin-bottom:1.4rem}
.wise-ayo-theme .form-field label{display:block;font-family:var(--sans);font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:.6rem}
.wise-ayo-theme .form-field input,.wise-ayo-theme .form-field select,.wise-ayo-theme .form-field textarea{
  width:100%;background:var(--smoke-2);border:1px solid var(--line-soft);color:var(--parchment);
  font-family:var(--sans);font-size:.95rem;font-weight:300;padding:.95rem 1.1rem;transition:.3s;
}
.wise-ayo-theme .form-field input:focus,.wise-ayo-theme .form-field select:focus,.wise-ayo-theme .form-field textarea:focus{border-color:var(--gold);background:var(--smoke-3)}
.wise-ayo-theme .form-field textarea{resize:vertical;min-height:100px}
.wise-ayo-theme .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem}
.wise-ayo-theme .seating{display:flex;gap:.6rem;flex-wrap:wrap}
.wise-ayo-theme .seating label{flex:1;min-width:90px;cursor:pointer;text-align:center;border:1px solid var(--line-soft);padding:.8rem;
  font-family:var(--sans);font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ash);transition:.3s;background:var(--smoke-2)}
.wise-ayo-theme .seating input{position:absolute;opacity:0;width:0;height:0;margin:0;pointer-events:none}
.wise-ayo-theme .seating input:checked + span{color:var(--ember)}
.wise-ayo-theme .seating label:has(input:checked){border-color:var(--ember);color:var(--ember)}
.wise-ayo-theme .reserve-info h2{margin:1.2rem 0 1.6rem}
.wise-ayo-theme .reserve-info .lede{margin-bottom:2rem}
.wise-ayo-theme .policy{list-style:none;margin-top:1.6rem}
.wise-ayo-theme .policy li{padding:.7rem 0 .7rem 1.6rem;position:relative;color:var(--ash);font-size:.92rem;border-bottom:1px solid var(--line-soft)}
.wise-ayo-theme .policy li::before{content:"";position:absolute;left:0;top:1.15rem;width:6px;height:6px;background:var(--ember);border-radius:50%}
.wise-ayo-theme .form-msg{margin-top:1rem;font-size:.9rem;color:var(--gold);min-height:1.2rem}
.wise-ayo-theme .full-width{width:100%}
.wise-ayo-theme .visit-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(2.5rem,6vw,5rem)}
.wise-ayo-theme .info-block{margin-bottom:2rem}
.wise-ayo-theme .info-block .k{font-family:var(--sans);font-size:.7rem;letter-spacing:.24em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:.5rem}
.wise-ayo-theme .info-block .v{font-family:var(--serif);font-size:1.4rem;color:var(--parchment)}
.wise-ayo-theme .info-block .v span{display:block;font-size:1.4rem}
.wise-ayo-theme .hours-list{margin-top:.8rem}
.wise-ayo-theme .hours-row{display:flex;justify-content:space-between;padding:.6rem 0;border-bottom:1px solid var(--line-soft);color:var(--ash)}
.wise-ayo-theme .hours-row span:first-child{color:var(--parchment)}
.wise-ayo-theme .map-block{background:linear-gradient(150deg,#eef3ec,#f4f8f3);border:1px solid var(--line-soft);min-height:340px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;text-align:center;padding:2rem}
.wise-ayo-theme .map-block .pin{font-size:2.4rem}
.wise-ayo-theme .map-block p{color:var(--ash);font-family:var(--serif);font-style:italic;font-size:1.3rem}
.wise-ayo-theme .map-block span{color:var(--ash-dim);font-size:.82rem;letter-spacing:.05em}
.wise-ayo-theme footer{background:#eef3ec;padding:clamp(4rem,7vw,6rem) 0 2.5rem;border-top:1px solid var(--line-soft)}
.wise-ayo-theme .foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1.4fr;gap:3rem}
.wise-ayo-theme .foot-brand .brand{font-size:1.8rem;display:block;margin-bottom:1rem}
.wise-ayo-theme .foot-brand p{color:var(--ash);font-family:var(--serif);font-style:italic;font-size:1.1rem;max-width:26ch}
.wise-ayo-theme .foot-col h4{font-family:var(--sans);font-size:.72rem;letter-spacing:.24em;text-transform:uppercase;color:var(--gold-soft);margin-bottom:1.4rem}
.wise-ayo-theme .foot-col a,.wise-ayo-theme .foot-col p{display:block;color:var(--ash);font-size:.92rem;margin-bottom:.7rem;transition:.3s}
.wise-ayo-theme .foot-col a:hover{color:var(--ember)}
.wise-ayo-theme .news p{margin-bottom:1.2rem;color:var(--ash);font-size:.9rem}
.wise-ayo-theme .news-form{display:flex;border:1px solid var(--line-soft)}
.wise-ayo-theme .news-form input{flex:1;background:transparent;border:none;color:var(--parchment);padding:.85rem 1rem;font-family:var(--sans);font-size:.88rem;min-width:0}
.wise-ayo-theme .news-form button{background:var(--ember);border:none;color:#fff;padding:0 1.3rem;cursor:pointer;font-family:var(--sans);font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;transition:.3s}
.wise-ayo-theme .news-form button:hover{background:var(--gold)}
.wise-ayo-theme .foot-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:3.5rem;padding-top:2rem;border-top:1px solid var(--line-soft);flex-wrap:wrap;gap:1rem}
.wise-ayo-theme .foot-bottom p,.wise-ayo-theme .foot-bottom a{color:var(--ash-dim);font-size:.8rem;letter-spacing:.05em}
.wise-ayo-theme .foot-bottom a:hover{color:var(--gold)}
.wise-ayo-theme .foot-legal{display:flex;gap:1.6rem}
.wise-ayo-theme .disclaimer{background:#e3ebe1;text-align:center;padding:1rem;font-size:.7rem;color:#6a7a70;letter-spacing:.03em;font-family:var(--sans)}
@media(min-width:901px) and (max-height:768px){
  .wise-ayo-theme .hpanel{padding:4.5rem 0 .8rem}
  .wise-ayo-theme .hpanel h2.display{font-size:clamp(2rem,4.2vw,3rem)}
  .wise-ayo-theme .hpanel .sec-head{margin-bottom:1rem}
  .wise-ayo-theme .hpanel .sec-head p{max-width:560px;margin-inline:auto}
  .wise-ayo-theme .hpanel .dish-img{height:clamp(170px,calc(100vh - 430px),376px)}
  .wise-ayo-theme .hpanel .dish-body{padding:1rem 1.3rem 1.1rem}
  .wise-ayo-theme .hpanel .dish h3{font-size:1.3rem;margin-bottom:.4rem}
  .wise-ayo-theme .hpanel .dish-body p{font-size:.86rem}
  .wise-ayo-theme .hpanel .gal{grid-auto-rows:clamp(100px,calc((100vh - 296px)/3),200px)}
  .wise-ayo-theme .hpanel .philo{padding:1.2rem 1.7rem}
  .wise-ayo-theme .hnext{bottom:2.5vh}
}
@media(max-width:900px),(prefers-reduced-motion:reduce){
  .wise-ayo-theme .hwrap{height:auto}
  .wise-ayo-theme .hsticky{position:static;height:auto;overflow:visible}
  .wise-ayo-theme .htrack{display:block;width:auto;height:auto;transform:none!important}
  .wise-ayo-theme .hpanel{width:auto;height:auto;display:block;padding:clamp(5rem,10vw,9rem) 0;overflow:visible}
  .wise-ayo-theme .hpanel .frame{height:auto;aspect-ratio:4/4;max-width:440px;margin-inline:auto}
  .wise-ayo-theme .hpanel .dish-img{aspect-ratio:1/1}
  .wise-ayo-theme .hpanel .philo{padding:clamp(2rem,4vw,3.2rem)}
  .wise-ayo-theme .hpanel .philo .mark{font-size:2.4rem;margin-bottom:1.1rem}
  .wise-ayo-theme .hpanel .philo h3{font-size:1.55rem;margin-bottom:.7rem}
  .wise-ayo-theme .hpanel .philo p{font-size:.94rem}
  .wise-ayo-theme .hpanel .gal{grid-auto-rows:170px;gap:12px}
  .wise-ayo-theme .hnext{display:none}
}
@media(max-width:900px){
  .wise-ayo-theme .nav-links{display:none}
  .wise-ayo-theme .burger{display:flex}
  .wise-ayo-theme .welcome-grid,.wise-ayo-theme .reserve-grid,.wise-ayo-theme .visit-grid{grid-template-columns:1fr}
  .wise-ayo-theme .frame{max-width:440px;margin-inline:auto;aspect-ratio:4/4}
  .wise-ayo-theme .dishes,.wise-ayo-theme .reviews,.wise-ayo-theme .spaces{grid-template-columns:1fr}
  .wise-ayo-theme .menu-list{grid-template-columns:1fr;gap:0}
  .wise-ayo-theme .philo-grid{grid-template-columns:1fr}
  .wise-ayo-theme .gal{grid-template-columns:repeat(2,1fr);grid-auto-rows:150px}
  .wise-ayo-theme .foot-grid{grid-template-columns:1fr 1fr;gap:2.4rem}
  .wise-ayo-theme .reserve-info{order:-1}
}
@media(max-width:520px){
  .wise-ayo-theme .hero-actions{flex-direction:column;align-items:stretch}
  .wise-ayo-theme .menu-item h3{white-space:normal}
  .wise-ayo-theme .menu-item .top{flex-wrap:wrap}
  .wise-ayo-theme .menu-item .dots{display:none}
  .wise-ayo-theme .foot-grid{grid-template-columns:1fr}
  .wise-ayo-theme .gal{grid-template-columns:1fr;grid-auto-rows:180px}
  .wise-ayo-theme .gal .wide{grid-column:span 1}
  .wise-ayo-theme .form-row{grid-template-columns:1fr}
  .wise-ayo-theme .foot-bottom{flex-direction:column;text-align:center}
}
@media(prefers-reduced-motion:reduce){
  .wise-ayo-theme *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  .wise-ayo-theme .reveal,.wise-ayo-theme .reveal-child{opacity:1;transform:none;filter:none}
  .wise-ayo-theme .reveal-child .dish-img img,.wise-ayo-theme .gal .reveal-child img,.wise-ayo-theme .frame img{transform:none}
}
`;
