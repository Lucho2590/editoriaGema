import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifiesto",
  description:
    "Nuestra filosofía editorial y compromiso con el pensamiento contemporáneo.",
};

export default function ManifiestoPage() {
  return (
    <div className="page-transition">
      {/* Header */}
      <section className="section-sm pt-16 md:pt-20 pb-10">
        <div className="max-w-readable mx-auto">
          <p className="eyebrow">Filosofía editorial</p>
          <h1 className="font-display text-hero text-ink mt-5">Manifiesto</h1>
        </div>
      </section>

      {/* Content */}
      <section className="section-sm pt-0">
        <div className="max-w-readable mx-auto prose-editorial">
          {/* Entradilla: mismo texto, tratamiento de pullquote */}
          <p className="font-display text-h3 italic text-ink leading-snug mb-14 pb-10 border-b border-rule">
            GEMA es un proyecto editorial que nace de la necesidad de crear
            espacios de resonancia para las ideas que transforman nuestra
            comprensión del mundo.
          </p>

          <h2>Sobre el nombre</h2>
          <p>
            GEMA — Generadora de Escrituras y Manifiestos Artísticos — evoca
            tanto la piedra preciosa como el eco, la resonancia. Como las gemas,
            buscamos lo valioso en lo profundo; como el eco, aspiramos a que las
            ideas resuenen y se multipliquen.
          </p>

          <h2>Nuestra visión</h2>
          <p>
            Creemos en una editorial que sea espacio de encuentro entre el rigor
            académico y la accesibilidad, entre la tradición del pensamiento
            crítico y las nuevas formas de producir y circular conocimiento.
          </p>

          <p>
            Publicamos ensayos, manifiestos y reflexiones que atraviesan las
            humanidades, las ciencias sociales y el arte contemporáneo. Nos
            interesan las escrituras que cuestionan, que abren preguntas, que no
            temen a la incertidumbre.
          </p>

          <h2>Compromiso</h2>
          <p>Nos comprometemos con:</p>
          <ul>
            <li>La calidad editorial sin pretensiones elitistas</li>
            <li>La accesibilidad a través de formatos digitales</li>
            <li>El cuidado estético como forma de respeto al contenido</li>
            <li>La construcción de una comunidad de lectores críticos</li>
          </ul>

          <h2>El libro como objeto</h2>
          <p>
            En una era de sobreabundancia informativa, apostamos por el libro
            como espacio de concentración y profundidad. Cada publicación es
            pensada como un objeto cultural completo: desde la selección de
            textos hasta el diseño, desde la producción material hasta su
            circulación digital.
          </p>

          <blockquote>
            "No buscamos lectores pasivos, sino interlocutores. Cada libro es
            una invitación al diálogo, una piedra arrojada al agua cuyas ondas
            esperamos que se expandan."
          </blockquote>

          <h2>Hacia adelante</h2>
          <p>
            GEMA es un proyecto en construcción permanente. Invitamos a autores,
            lectores y colaboradores a sumarse a este espacio de pensamiento
            colectivo. Las ideas más valiosas son las que se comparten.
          </p>

          <p className="text-center text-accent mt-16" aria-hidden>
            ·
          </p>
        </div>
      </section>
    </div>
  );
}
