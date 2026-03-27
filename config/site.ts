export const siteConfig = {
  name: "GEMA",
  fullName: "GEMA – Generadora de Escrituras y Manifiestos Artísticos",
  description:
    "Editorial independiente de pensamiento contemporáneo, humanidades y ciencias sociales.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://gema-editorial.com",
  email: {
    contact: "contacto@gema-editorial.com",
    support: "soporte@gema-editorial.com",
    noreply: "hola@gema-editorial.com",
  },
  social: {
    instagram: "https://instagram.com/gema.editorial",
    twitter: "https://twitter.com/gema_editorial",
  },
  shipping: {
    domestic: 1500,
    international: {
      latam: 3500,
      world: 8000,
    },
  },
  download: {
    maxDownloads: 5,
    expirationDays: 7,
  },
};

export type SiteConfig = typeof siteConfig;
