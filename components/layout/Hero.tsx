"use client";

export function Hero() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-gutter">
      <div className="max-w-content mx-auto text-center">
        <div className="animate-fade-up">
          <h1 className="font-serif text-display-xl md:text-display-xl text-gema-black mb-8 tracking-[0.05em]">
            GEMA
          </h1>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="text-small md:text-body tracking-[0.2em] uppercase text-gema-gray-500 max-w-xl mx-auto leading-relaxed">
            Generadora de Escrituras y Manifiestos Artísticos
          </p>
        </div>

        <div className="animate-fade-up mt-16" style={{ animationDelay: "0.6s" }}>
          <p className="text-body-lg text-gema-gray-600 max-w-lg mx-auto">
            Editorial independiente de pensamiento contemporáneo, humanidades y ciencias sociales.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-fade-in" style={{ animationDelay: "1s" }}>
          <div className="w-px h-12 bg-gema-gray-300 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
