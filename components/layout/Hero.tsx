"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-gutter">
      <div className="max-w-content mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="font-serif text-display-xl md:text-display-xl text-gema-black mb-8 tracking-[0.05em]">
            GEMA
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <p className="text-small md:text-body tracking-[0.2em] uppercase text-gema-gray-500 max-w-xl mx-auto leading-relaxed">
            Generadora de Escrituras y Manifiestos Artísticos
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          className="mt-16"
        >
          <p className="text-body-lg text-gema-gray-600 max-w-lg mx-auto">
            Editorial independiente de pensamiento contemporáneo, humanidades y ciencias sociales.
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12 bg-gema-gray-300"
          />
        </motion.div>
      </div>
    </section>
  );
}
