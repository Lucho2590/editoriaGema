import Link from "next/link";

/**
 * Hero de posicionamiento, no de marca.
 *
 * El hero anterior gastaba 80vh en repetir el wordmark "GEMA", que ya está en
 * el navbar dos centímetros más arriba. Lo que distingue a una editorial de
 * una tienda es su criterio, y el criterio se dice con una frase.
 *
 * NOTA: la frase es la primera oración del manifiesto, textual. Es de ustedes
 * y funciona, pero si quieren una declaración escrita específicamente para
 * este lugar, se cambia acá y en ningún otro lado.
 */
export function Hero() {
  return (
    <section className="section-sm pt-16 md:pt-24 pb-16 md:pb-20">
      <div className="max-w-content mx-auto">
        <p className="eyebrow animate-fade-in">Editorial independiente</p>

        <h1 className="animate-fade-up mt-6 max-w-[18ch] font-display text-hero text-ink text-balance">
          Espacios de resonancia para las ideas que transforman nuestra
          comprensión del mundo.
        </h1>

        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          style={{ animationDelay: "0.15s" }}
        >
          <Link
            href="/catalogo"
            className="group inline-flex items-center gap-2 border-b border-ink pb-1 text-meta text-ink transition-colors duration-300 hover:border-accent hover:text-accent"
          >
            Ver el catálogo
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
          <Link
            href="/manifiesto"
            className="text-meta text-ink-soft transition-colors duration-300 hover:text-ink"
          >
            Sobre la editorial
          </Link>
        </div>
      </div>
    </section>
  );
}
