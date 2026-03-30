import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const baseUrl = 'https://jusafrica.com';
  const apiUrl = config.public.apiBaseUrl || 'http://localhost:4000';

  // Static pages
  const staticPages = [
    '', '/recherche', '/pays', '/themes', '/tarifs', '/a-propos',
    '/connexion', '/inscription',
  ];

  let dynamicPages: string[] = [];

  try {
    // Fetch countries
    const countries: any = await $fetch(`${apiUrl}/countries?limit=100`);
    if (countries?.data) {
      dynamicPages.push(...countries.data.map((c: any) => `/pays/${c.code}`));
    }

    // Fetch themes
    const themes: any = await $fetch(`${apiUrl}/themes?limit=100`);
    if (themes?.data) {
      dynamicPages.push(...themes.data.map((t: any) => `/themes/${t.slug}`));
    }

    // Fetch published texts
    const texts: any = await $fetch(`${apiUrl}/legal-texts?status=published&limit=1000`);
    if (texts?.data) {
      dynamicPages.push(...texts.data.map((t: any) => `/textes/${t.id}`));
    }
  } catch (e) {
    // API not available — only static pages in sitemap
  }

  const allPages = [...staticPages, ...dynamicPages];
  const today = new Date().toISOString().split('T')[0];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.startsWith('/textes/') ? 'monthly' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : page.startsWith('/textes/') ? '0.8' : '0.6'}</priority>
  </url>`).join('\n')}
</urlset>`;

  event.node.res.setHeader('Content-Type', 'application/xml');
  return sitemap;
});
