import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="max-w-content mx-auto px-gutter py-section-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-block mb-4">
              <span className="font-display text-h3 tracking-[0.18em] text-paper">
                GEMA
              </span>
            </Link>
            {/* paper-muted y no paper/60: sobre la tinta, un apagado por
                opacidad cae por debajo de 4.5:1. Este da 8.67:1. */}
            <p className="text-meta text-paper-muted leading-relaxed max-w-[34ch]">
              Generadora de Escrituras y Manifiestos Artísticos. Editorial
              independiente de pensamiento contemporáneo.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3">
            <h4 className="eyebrow text-paper-muted mb-5">Navegación</h4>
            <nav className="flex flex-col gap-3">
              <Link
                href="/#quienes-somos"
                className="text-meta text-paper hover:text-accent transition-colors duration-300"
              >
                ¿Quiénes somos?
              </Link>
              <Link
                href="/catalogo"
                className="text-meta text-paper hover:text-accent transition-colors duration-300"
              >
                Catálogo
              </Link>
              <Link
                href="/eventos"
                className="text-meta text-paper hover:text-accent transition-colors duration-300"
              >
                Eventos
              </Link>
              <Link
                href="/manifiesto"
                className="text-meta text-paper hover:text-accent transition-colors duration-300"
              >
                Manifiesto
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4 className="eyebrow text-paper-muted mb-5">Contacto</h4>
            <nav className="flex flex-col gap-3">
              <a
                href="mailto:somoseditorialgema@gmail.com"
                className="text-meta text-paper hover:text-accent transition-colors duration-300 break-all"
              >
                somoseditorialgema@gmail.com
              </a>
              <a
                href="https://www.instagram.com/editorial_gema"
                target="_blank"
                rel="noopener noreferrer"
                className="text-meta text-paper hover:text-accent transition-colors duration-300"
              >
                Instagram
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-6 border-t border-paper/15 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-meta text-paper-muted">
            © {new Date().getFullYear()} GEMA Editorial
          </p>
          {/* OJO: /privacidad y /terminos no existen todavía — dan 404. Los
              dejo porque son links legales y borrarlos no es una decisión de
              diseño; hay que crear las páginas con el texto real. */}
          <div className="flex gap-6">
            <Link
              href="/privacidad"
              className="text-meta text-paper-muted hover:text-accent transition-colors duration-300"
            >
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-meta text-paper-muted hover:text-accent transition-colors duration-300"
            >
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
