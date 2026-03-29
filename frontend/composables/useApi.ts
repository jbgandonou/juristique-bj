import type { Ref } from 'vue';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Country {
  id: string;
  name: string;
  code: string;
  flagUrl: string | null;
  region: string;
  legalSystem: string;
  officialLang: string;
}

interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  textCount: number;
  parentId: string | null;
  children?: Theme[];
}

interface LegalText {
  id: string;
  title: string;
  reference: string;
  textType: string;
  hierarchyRank: number;
  contentText: string;
  summary: string;
  promulgationDate: string;
  publicationDate: string;
  effectiveDate: string;
  status: string;
  isVerified: boolean;
  isInForce: boolean;
  viewCount: number;
  sourceUrl: string;
  sourceName: string;
  country: Country;
  themes: Theme[];
}

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;

  const apiFetch = async <T>(path: string, options: any = {}): Promise<T> => {
    const url = `${baseUrl}${path}`;
    return await $fetch<T>(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // Countries
  const getCountries = (page = 1, limit = 100) =>
    apiFetch<PaginatedResult<Country>>(`/countries?page=${page}&limit=${limit}`);

  const getCountryByCode = (code: string) =>
    apiFetch<Country>(`/countries/by-code/${code}`);

  // Themes
  const getThemes = (page = 1, limit = 100) =>
    apiFetch<PaginatedResult<Theme>>(`/themes?page=${page}&limit=${limit}`);

  const getThemeTree = () =>
    apiFetch<Theme[]>('/themes/tree');

  const getThemeBySlug = (slug: string) =>
    apiFetch<Theme>(`/themes/by-slug/${slug}`);

  // Legal Texts
  const getLegalTexts = (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch<PaginatedResult<LegalText>>(`/legal-texts?${query}`);
  };

  const getLegalText = (id: string) =>
    apiFetch<LegalText>(`/legal-texts/${id}`);

  // Search (Typesense)
  const searchTexts = (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch<any>(`/search?${query}`);
  };

  // Comments
  const getCommentsByText = (textId: string, page = 1, limit = 20) =>
    apiFetch<PaginatedResult<any>>(`/comments/by-text/${textId}?page=${page}&limit=${limit}`);

  return {
    apiFetch,
    getCountries,
    getCountryByCode,
    getThemes,
    getThemeTree,
    getThemeBySlug,
    getLegalTexts,
    getLegalText,
    searchTexts,
    getCommentsByText,
  };
};

export type { Country, Theme, LegalText, PaginatedResult };
