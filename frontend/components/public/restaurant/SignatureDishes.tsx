import { ArrowRight } from "lucide-react";

export type SignatureDish = {
  id: string | number;
  name: string;
  description: string;
  price: string;
  tags: string[];
};

export type SignatureDishesProps = {
  id?: string;
  kicker: string;
  title: string;
  description: string;
  dishes: SignatureDish[];
  cta: {
    label: string;
    href: string;
  };
  availabilityLabel: string;
  orderingNote?: string;
  buttonClass: string;
  accentColor: string;
};

export default function SignatureDishes({
  id = "signature-dishes",
  kicker,
  title,
  description,
  dishes,
  cta,
  availabilityLabel,
  orderingNote,
  buttonClass,
  accentColor,
}: SignatureDishesProps) {
  return (
    <section id={id} className="relative border-y border-white/10 bg-white/[.04] px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="text-sm font-semibold" style={{ color: accentColor }}>{kicker}</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight sm:text-6xl">
            {title}
          </h2>
          <p className="mt-5 text-base leading-8 text-white/58">
            {description}
          </p>
          <a href={cta.href} className={`${buttonClass} mt-8 inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-bold text-[#100c08]`}>
            {cta.label} <ArrowRight size={16} />
          </a>
          <p className="mt-5 text-sm text-white/42">
            {availabilityLabel}
          </p>
        </div>
        <div className="divide-y divide-white/10">
          {dishes.length > 0 ? dishes.map((dish, index) => (
            <article key={dish.id} className="group grid gap-5 py-6 first:pt-0 sm:grid-cols-[auto_1fr_auto] sm:items-start">
              <span className="font-display text-4xl text-white/28">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-3xl font-semibold leading-tight text-white">{dish.name}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/56">{dish.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white/56">
                  {dish.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 px-3 py-1.5">{tag}</span>
                  ))}
                </div>
              </div>
              <span className="text-lg font-bold" style={{ color: accentColor }}>{dish.price}</span>
            </article>
          )) : (
            <div className="rounded-[2rem] border border-white/10 p-8 text-white/58">
              The restaurant has not published signature dishes yet.
            </div>
          )}
          {orderingNote && (
            <p className="pt-6 text-sm leading-7 text-white/46">
              {orderingNote}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
