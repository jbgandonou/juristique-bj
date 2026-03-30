export const useSeo = () => {
  const setLegalTextSeo = (text: {
    title: string;
    reference?: string;
    summary?: string;
    country?: { name: string };
    promulgationDate?: string;
    themes?: Array<{ name: string }>;
  }) => {
    const description = text.summary
      || `${text.title} — ${text.country?.name || 'Afrique francophone'}`;

    useHead({
      title: `${text.title} — Jus Africa`,
      meta: [
        { name: 'description', content: description.substring(0, 160) },
        { property: 'og:title', content: text.title },
        { property: 'og:description', content: description.substring(0, 200) },
        { property: 'og:type', content: 'article' },
        { property: 'og:site_name', content: 'Jus Africa' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: text.title },
        { name: 'twitter:description', content: description.substring(0, 200) },
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Legislation',
            name: text.title,
            identifier: text.reference,
            description: description,
            legislationJurisdiction: text.country?.name,
            datePublished: text.promulgationDate,
            about: text.themes?.map(t => t.name),
            publisher: {
              '@type': 'Organization',
              name: 'Jus Africa',
              url: 'https://jusafrica.com',
            },
          }),
        },
      ],
    });
  };

  const setPageSeo = (title: string, description: string) => {
    useHead({
      title: `${title} — Jus Africa`,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: `${title} — Jus Africa` },
        { property: 'og:description', content: description },
        { property: 'og:site_name', content: 'Jus Africa' },
      ],
    });
  };

  return { setLegalTextSeo, setPageSeo };
};
