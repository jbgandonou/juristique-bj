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

  // Pipeline jobs
  const getPipelineJobs = (page = 1, limit = 20) =>
    apiFetch<PaginatedResult<any>>(`/pipeline/jobs?page=${page}&limit=${limit}`);

  // Create a pipeline job
  const createPipelineJob = (sourceName: string, sourceUrl?: string) =>
    apiFetch<any>('/pipeline/jobs', { method: 'POST', body: { sourceName, sourceUrl } });

  // Pipeline sources
  const getPipelineSources = () =>
    apiFetch<any[]>('/pipeline/sources');

  // Pipeline alerts
  const getPipelineAlerts = (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<any>(`/pipeline/alerts${qs}`);
  };

  const getPipelineAlertCount = () =>
    apiFetch<any>('/pipeline/alerts/count');

  const acknowledgePipelineAlert = (id: string) =>
    apiFetch<any>(`/pipeline/alerts/${id}/acknowledge`, { method: 'PATCH' });

  // Legal texts with status filter (for editorial queue)
  const getLegalTextsByStatus = (status: string, page = 1, limit = 20) =>
    apiFetch<PaginatedResult<LegalText>>(`/legal-texts?status=${status}&page=${page}&limit=${limit}`);

  // Update legal text status (approve/reject)
  const updateLegalTextStatus = (id: string, status: string) =>
    apiFetch<LegalText>(`/legal-texts/${id}`, {
      method: 'PATCH',
      body: { status },
    });

  // Comparative law
  const compareLegalTexts = (themeSlug: string, countryCodes: string[]) =>
    apiFetch<Record<string, LegalText[]>>(
      `/legal-texts/compare?themeSlug=${encodeURIComponent(themeSlug)}&countryCodes=${encodeURIComponent(countryCodes.join(','))}`,
    );

  // Folders
  const getFolders = () =>
    apiFetch<any[]>('/folders');

  const getFolder = (id: string) =>
    apiFetch<any>(`/folders/${id}`);

  const createFolder = (data: { name: string; description?: string; color?: string }) =>
    apiFetch<any>('/folders', { method: 'POST', body: data });

  const updateFolder = (id: string, data: any) =>
    apiFetch<any>(`/folders/${id}`, { method: 'PATCH', body: data });

  const deleteFolder = (id: string) =>
    apiFetch<void>(`/folders/${id}`, { method: 'DELETE' });

  const addTextToFolder = (folderId: string, textId: string) =>
    apiFetch<any>(`/folders/${folderId}/texts`, { method: 'POST', body: { textId } });

  const removeTextFromFolder = (folderId: string, textId: string) =>
    apiFetch<any>(`/folders/${folderId}/texts/${textId}`, { method: 'DELETE' });

  const shareFolder = (folderId: string, email: string, permission: string) =>
    apiFetch<any>(`/folders/${folderId}/shares`, { method: 'POST', body: { email, permission } });

  // Annotations
  const getAnnotations = () =>
    apiFetch<any[]>('/annotations');

  const getAnnotationsByText = (textId: string) =>
    apiFetch<any[]>(`/annotations/by-text/${textId}`);

  const createAnnotation = (data: { textId: string; content: string; articleRef?: string; color?: string; folderId?: string }) =>
    apiFetch<any>('/annotations', { method: 'POST', body: data });

  const updateAnnotation = (id: string, content: string) =>
    apiFetch<any>(`/annotations/${id}`, { method: 'PATCH', body: { content } });

  const deleteAnnotation = (id: string) =>
    apiFetch<void>(`/annotations/${id}`, { method: 'DELETE' });

  // Reminders
  const getReminders = () =>
    apiFetch<any[]>('/reminders');

  const getUpcomingReminders = () =>
    apiFetch<any[]>('/reminders/upcoming');

  const createReminder = (data: { title: string; remindAt: string; textId?: string; folderId?: string; annotationId?: string; label?: string; sticker?: string; description?: string }) =>
    apiFetch<any>('/reminders', { method: 'POST', body: data });

  const completeReminder = (id: string) =>
    apiFetch<any>(`/reminders/${id}/complete`, { method: 'PATCH' });

  const deleteReminder = (id: string) =>
    apiFetch<void>(`/reminders/${id}`, { method: 'DELETE' });

  // Sticky Notes
  const getStickyNotes = () =>
    apiFetch<any[]>('/sticky-notes');

  const getStickyNotesByText = (textId: string) =>
    apiFetch<any[]>(`/sticky-notes/by-text/${textId}`);

  const getStickyNotesByFolder = (folderId: string) =>
    apiFetch<any[]>(`/sticky-notes/by-folder/${folderId}`);

  const createStickyNote = (data: { content: string; color?: string; textId?: string; folderId?: string }) =>
    apiFetch<any>('/sticky-notes', { method: 'POST', body: data });

  const updateStickyNote = (id: string, data: any) =>
    apiFetch<any>(`/sticky-notes/${id}`, { method: 'PATCH', body: data });

  const deleteStickyNote = (id: string) =>
    apiFetch<void>(`/sticky-notes/${id}`, { method: 'DELETE' });

  // Editor Notes
  const getEditorNotes = () =>
    apiFetch<any[]>('/editor-notes');

  const getEditorNotesByFolder = (folderId: string) =>
    apiFetch<any[]>(`/editor-notes/by-folder/${folderId}`);

  const getEditorNote = (id: string) =>
    apiFetch<any>(`/editor-notes/${id}`);

  const createEditorNote = (data: { title: string; folderId?: string; icon?: string }) =>
    apiFetch<any>('/editor-notes', { method: 'POST', body: data });

  const updateEditorNote = (id: string, data: any) =>
    apiFetch<any>(`/editor-notes/${id}`, { method: 'PATCH', body: data });

  const deleteEditorNote = (id: string) =>
    apiFetch<void>(`/editor-notes/${id}`, { method: 'DELETE' });

  // Delete a legal text
  const deleteLegalText = (id: string) =>
    apiFetch<void>(`/legal-texts/${id}`, { method: 'DELETE' });

  // Purge all legal texts (admin)
  const purgeAllLegalTexts = () =>
    apiFetch<{ deleted: number }>('/legal-texts/admin/purge-all', { method: 'DELETE' });

  // Update a legal text
  const updateLegalText = (id: string, data: any) =>
    apiFetch<LegalText>(`/legal-texts/${id}`, { method: 'PATCH', body: data });

  // Create a legal text (admin manual creation)
  const createLegalText = (data: any) =>
    apiFetch<LegalText>('/legal-texts', { method: 'POST', body: data });

  // Users (admin)
  const getUsers = (page = 1, limit = 50) =>
    apiFetch<any>(`/users?page=${page}&limit=${limit}`);

  const getUserStats = () =>
    apiFetch<any>('/users/stats');

  const updateUserRole = (id: string, role: string) =>
    apiFetch<any>(`/users/${id}/role`, { method: 'PATCH', body: { role } });

  const deleteUser = (id: string) =>
    apiFetch<void>(`/users/${id}`, { method: 'DELETE' });

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
    getPipelineJobs,
    createPipelineJob,
    getPipelineSources,
    getPipelineAlerts,
    getPipelineAlertCount,
    acknowledgePipelineAlert,
    getLegalTextsByStatus,
    updateLegalTextStatus,
    compareLegalTexts,
    getFolders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    addTextToFolder,
    removeTextFromFolder,
    shareFolder,
    getAnnotations,
    getAnnotationsByText,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getReminders,
    getUpcomingReminders,
    createReminder,
    completeReminder,
    deleteReminder,
    getStickyNotes,
    getStickyNotesByText,
    getStickyNotesByFolder,
    createStickyNote,
    updateStickyNote,
    deleteStickyNote,
    getEditorNotes,
    getEditorNotesByFolder,
    getEditorNote,
    createEditorNote,
    updateEditorNote,
    deleteEditorNote,
    deleteLegalText,
    purgeAllLegalTexts,
    updateLegalText,
    createLegalText,
    getUsers,
    getUserStats,
    updateUserRole,
    deleteUser,
  };
};

export type { Country, Theme, LegalText, PaginatedResult };
