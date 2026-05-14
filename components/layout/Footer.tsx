import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gema-gray-100 bg-gema-white">
      <div className="max-w-content mx-auto px-gutter py-section-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-heading-lg tracking-[0.15em] text-gema-black">
                GEMA
              </span>
            </Link>
            <p className="text-small text-gema-gray-500 leading-relaxed max-w-xs">
              Generadora de Escrituras y Manifiestos Artísticos. Editorial
              independiente de pensamiento contemporáneo.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-caption uppercase tracking-[0.1em] text-gema-gray-400 mb-6">
              Navegación
            </h4>
            <nav className="flex flex-col gap-3">
              <Link
                href="/#quienes-somos"
                className="text-small text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
              >
                ¿Quiénes somos?
              </Link>
              <Link
                href="/catalogo"
                className="text-small text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
              >
                Catálogo
              </Link>
              <Link
                href="/eventos"
                className="text-small text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
              >
                Eventos
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-caption uppercase tracking-[0.1em] text-gema-gray-400 mb-6">
              Contacto
            </h4>
            <nav className="flex flex-col gap-3">
              <a
                href="mailto:Somoseditorialgema@gmail.com"
                className="text-small text-gema-gray-600 hover:text-gema-black transition-colors duration-300 break-all"
              >
                Somoseditorialgema@gmail.com
              </a>
              <a
                href="https://www.instagram.com/editorial_gema"
                target="_blank"
                rel="noopener noreferrer"
                className="text-small text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
              >
                Instagram
              </a>
              {/* TODO: reemplazar con URL real */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-small text-gema-gray-600 hover:text-gema-black transition-colors duration-300"
              >
                LinkedIn
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-gema-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-caption text-gema-gray-400">
            © {new Date().getFullYear()} GEMA Editorial. Todos los derechos
            reservados.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacidad"
              className="text-caption text-gema-gray-400 hover:text-gema-gray-600 transition-colors duration-300"
            >
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-caption text-gema-gray-400 hover:text-gema-gray-600 transition-colors duration-300"
            >
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
