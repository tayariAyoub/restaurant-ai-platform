import { ChefHat, Heart, ShieldCheck, type LucideIcon } from "lucide-react";

import type { RestaurantThemeIdentity } from "@/lib/restaurantTheme";
import type { Restaurant } from "@/lib/types";
import type { StoryMoment } from "./experience";

type TrustAndStoryProps = {
  restaurant: Restaurant;
  themeIdentity: RestaurantThemeIdentity;
  storyMoments: StoryMoment[];
};

export default function TrustAndStory({
  restaurant,
  themeIdentity,
  storyMoments,
}: TrustAndStoryProps) {
  const primary = themeIdentity.primary;
  const personality = themeIdentity.personality;
  const immersive = themeIdentity.homepageStyle === "immersive";

  return (
    <>
      <section id="story" className={`sensory-section mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:py-28 ${immersive ? "text-white" : ""}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.3em]" style={{ color: primary }}>Our story</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">{restaurant.name}, made personal.</h2>
          <p className="mt-6 max-w-md text-base leading-8 opacity-65">{personality.description}</p>
        </div>
        <div className={`premium-card rounded-[2rem] p-6 sm:p-8 ${immersive ? "border-white/10 bg-white/[.05] text-white shadow-2xl" : ""}`}>
          <p className="whitespace-pre-line text-lg leading-8 opacity-75">
            {restaurant.story || restaurant.description || "A restaurant experience shaped by care, craft, and a table prepared for guests."}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StorySignal icon={ChefHat} label="Kitchen" value="Made fresh" immersive={immersive} />
            <StorySignal icon={ShieldCheck} label="Allergies" value="Ask before ordering" immersive={immersive} />
            <StorySignal icon={Heart} label="Hospitality" value="Direct to restaurant" immersive={immersive} />
          </div>
        </div>
      </section>

      <section className={`sensory-section px-4 py-16 sm:px-6 lg:py-24 ${immersive ? "text-white" : ""}`}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div className={`ambient-glow overflow-hidden rounded-[2rem] border border-black/10 p-6 shadow-2xl sm:p-8 lg:p-10 ${themeIdentity.trustPanelClass}`}>
              <p className="text-xs font-bold uppercase tracking-[.3em] text-white/45">Tonight's experience</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">{personality.momentTitle}</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">{personality.momentCopy}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {storyMoments.slice(0, 3).map((moment) => (
                  <div key={moment.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <moment.icon size={18} className="text-white/70" />
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{moment.label}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-white/90">{moment.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-5">
              {storyMoments.slice(3).map((moment) => (
                <article
                  key={moment.label}
                  className={`premium-lift rounded-[1.75rem] border p-6 shadow-sm ${
                    immersive ? "border-white/10 bg-white/[.05]" : "border-black/10 bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-2xl p-3 ${immersive ? "bg-white/10" : "bg-black/[.04]"}`} style={{ color: primary }}><moment.icon size={20} /></span>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-45">{moment.label}</p>
                  </div>
                  <p className="mt-4 text-2xl font-semibold leading-tight">{moment.value}</p>
                  <p className="mt-3 text-sm leading-6 opacity-60">{moment.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`px-4 pb-16 sm:px-6 lg:pb-24 ${immersive ? "text-white" : ""}`}>
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {[
            ["Why guests love us", "Clear food choices, direct ordering, and a dining room story that feels specific."],
            ["For tonight or later", "Reserve a table, plan a pickup order, or ask the AI Maitre d' for guidance."],
            ["Trust before the first bite", "Contact details, hours, allergen prompts, and confirmation expectations stay visible."],
          ].map(([title, copy]) => (
            <article
              key={title}
              className={`premium-lift rounded-[1.75rem] border p-6 shadow-sm ${
                immersive ? "border-white/10 bg-white/[.05]" : "border-black/10 bg-white/75"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[.24em]" style={{ color: primary }}>{title}</p>
              <p className="mt-4 text-lg leading-7 opacity-70">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function StorySignal({ icon: Icon, label, value, immersive }: { icon: LucideIcon; label: string; value: string; immersive: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${immersive ? "border-white/10 bg-white/[.06]" : "border-black/5 bg-white/70"}`}>
      <Icon size={18} className="opacity-55" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] opacity-45">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
