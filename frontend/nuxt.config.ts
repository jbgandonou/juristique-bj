export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,

  modules: [],

  css: ['~/assets/css/style.css'],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
    },
  },

  app: {
    head: {
      title: 'Juristique.bj — Droit africain francophone',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Plateforme de textes juridiques des 26 pays africains francophones. Recherche, commentaires et analyses par des juristes professionnels.',
        },
      ],
      htmlAttrs: { lang: 'fr' },
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
    },
  },

  compatibilityDate: '2025-01-01',
});
