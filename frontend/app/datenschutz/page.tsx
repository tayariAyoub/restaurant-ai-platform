import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz | RestaurantAI",
  description: "Datenschutz-Vorlage für RestaurantAI-Demo- und Pilotseiten. Vor einer Live-Schaltung muss diese Seite rechtlich angepasst werden.",
  robots: { index: false, follow: false },
};

const sections = [
  {
    title: "Verantwortlicher",
    body: "Verantwortlich für die Verarbeitung personenbezogener Daten ist: [Name/Firma, Anschrift, E-Mail, Telefon]. Diese Angaben müssen vor der Veröffentlichung ersetzt werden.",
  },
  {
    title: "Welche Daten verarbeitet werden",
    body: "Je nach Nutzung können Kontaktdaten, Reservierungsdaten, Bestelldaten, Nachrichten im Chat, technische Zugriffsdaten und vom Betreiber bereitgestellte Restaurantinformationen verarbeitet werden.",
  },
  {
    title: "Kontakt-, Reservierungs- und Bestelldaten",
    body: "Wenn Gäste Formulare nutzen oder eine Bestellung anfragen, können Name, E-Mail-Adresse, Telefonnummer, Wunschdatum, Personenanzahl, Bestellpositionen, Hinweise und Statusinformationen gespeichert werden.",
  },
  {
    title: "Server-Logs",
    body: "Beim Aufruf der Website können technische Daten wie IP-Adresse, Zeitpunkt, aufgerufene Seite, Browserinformationen und Fehlermeldungen verarbeitet werden, um Sicherheit und Betrieb zu gewährleisten.",
  },
  {
    title: "KI-Assistent / Chat-Hinweis",
    body: "Wenn der KI-Assistent aktiviert ist, können Chatnachrichten verarbeitet werden, um restaurantbezogene Antworten zu erzeugen. Gäste sollten keine sensiblen Gesundheitsdaten eingeben. Allergiehinweise müssen immer mit dem Restaurantpersonal bestätigt werden.",
  },
  {
    title: "Speicherdauer",
    body: "Personenbezogene Daten sollten nur so lange gespeichert werden, wie sie für Reservierung, Bestellung, Kommunikation, gesetzliche Pflichten oder berechtigte Betriebszwecke erforderlich sind. Konkrete Fristen müssen vom Betreiber festgelegt werden.",
  },
  {
    title: "Rechte der betroffenen Personen",
    body: "Betroffene Personen können je nach Rechtslage Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit und Beschwerde bei einer Aufsichtsbehörde verlangen.",
  },
  {
    title: "Kontakt",
    body: "Anfragen zum Datenschutz richten Sie bitte an: [Datenschutzkontakt des Betreibers].",
  },
];

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#21160f]">
      <section className="border-b border-[#2d1b13]/10 bg-[#140d08] px-4 py-16 text-white sm:px-6 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-200">Datenschutz</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight sm:text-6xl">Datenschutzhinweise</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/72">
            Diese Seite ist eine vorsichtige Vorlage für Demo- und Pilotseiten. Sie beschreibt typische Datenflüsse,
            ersetzt aber keine rechtliche Prüfung vor einer Live-Schaltung.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950 shadow-sm">
          <p className="font-bold">Hinweis vor Live-Schaltung</p>
          <p className="mt-1">
            Diese Datenschutzhinweise müssen an den konkreten Betreiber, Hosting-Anbieter, eingesetzte Dienstleister,
            Speicherdauern, Rechtsgrundlagen und Auftragsverarbeitungsverträge angepasst werden.
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-[1.5rem] border border-[#2d1b13]/10 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              <p className="mt-3 text-base leading-7 text-[#5f493d]">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-[1.75rem] border border-[#2d1b13]/10 bg-white/75 p-6 leading-7 text-[#5f493d] shadow-sm">
          <h2 className="text-2xl font-semibold text-[#21160f]">Keine finale Rechtsgarantie</h2>
          <p className="mt-3">
            Diese Vorlage dient der Orientierung für die erste Produkt-Härtung. Vor dem Einsatz für ein echtes
            Restaurant müssen die Angaben rechtlich geprüft und an den verantwortlichen Betreiber angepasst werden.
          </p>
        </section>

        <nav className="mt-10 flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/impressum" className="rounded-full border border-[#2d1b13]/15 bg-white px-5 py-3 text-[#21160f] shadow-sm hover:bg-[#21160f] hover:text-white">
            Impressum ansehen
          </Link>
          <Link href="/restaurants/bella-napoli" className="rounded-full border border-[#2d1b13]/15 px-5 py-3 text-[#21160f] hover:bg-white">
            Zurück zur Restaurantseite
          </Link>
        </nav>
      </section>
    </main>
  );
}
