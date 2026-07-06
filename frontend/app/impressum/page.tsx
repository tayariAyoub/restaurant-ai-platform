import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum | RestaurantAI",
  description: "Vorlage für Anbieterkennzeichnung und Impressum. Vor einer Live-Schaltung muss diese Seite rechtlich geprüft und angepasst werden.",
  robots: { index: false, follow: false },
};

const details = [
  ["Anbieter / Betreiber", "[Name oder Firma des Restaurantbetreibers]"],
  ["Name/Firma", "[Vollständiger rechtlicher Name]"],
  ["Anschrift", "[Straße, Hausnummer, PLZ, Ort, Land]"],
  ["E-Mail", "[kontakt@restaurant.de]"],
  ["Telefon", "[Telefonnummer]"],
  ["Umsatzsteuer-ID, falls vorhanden", "[USt-IdNr. oder Hinweis, falls nicht vorhanden]"],
  ["Verantwortlich für den Inhalt", "[Name der verantwortlichen Person]"],
];

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#21160f]">
      <section className="border-b border-[#2d1b13]/10 bg-[#140d08] px-4 py-16 text-white sm:px-6 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-200">Rechtliche Angaben</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight sm:text-6xl">Impressum</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/72">
            Diese Seite ist eine sichere Arbeitsvorlage für die Anbieterkennzeichnung. Die Angaben müssen vor einer
            öffentlichen Nutzung vom jeweiligen Betreiber geprüft, vervollständigt und angepasst werden.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950 shadow-sm">
          <p className="font-bold">Hinweis vor Veröffentlichung</p>
          <p className="mt-1">
            Dies ist kein finaler Rechtsservice und keine Rechtsberatung. Der Restaurantbetreiber oder Plattformbetreiber
            muss die Daten, Pflichtangaben und Verantwortlichkeiten vor dem Livegang rechtlich prüfen lassen.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#2d1b13]/10 bg-white shadow-[0_24px_70px_rgba(45,27,19,.10)]">
          {details.map(([label, value]) => (
            <div key={label} className="grid gap-2 border-b border-[#2d1b13]/10 p-5 last:border-b-0 sm:grid-cols-[15rem_1fr] sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#7a5947]">{label}</h2>
              <p className="text-base leading-7 text-[#2d1b13]">{value}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-[#2d1b13]/10 bg-white/75 p-6 leading-7 text-[#5f493d] shadow-sm">
          <h2 className="text-2xl font-semibold text-[#21160f]">Platzhalter für weitere Pflichtangaben</h2>
          <p className="mt-3">
            Je nach Betreiber, Gesellschaftsform, Branche und eingesetzten Diensten können weitere Angaben erforderlich
            sein, zum Beispiel Registereintrag, Aufsichtsbehörde, berufsrechtliche Angaben oder Streitbeilegungshinweise.
          </p>
        </section>

        <nav className="mt-10 flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/datenschutz" className="rounded-full border border-[#2d1b13]/15 bg-white px-5 py-3 text-[#21160f] shadow-sm hover:bg-[#21160f] hover:text-white">
            Datenschutz ansehen
          </Link>
          <Link href="/restaurants/bella-napoli" className="rounded-full border border-[#2d1b13]/15 px-5 py-3 text-[#21160f] hover:bg-white">
            Zurück zur Restaurantseite
          </Link>
        </nav>
      </section>
    </main>
  );
}
