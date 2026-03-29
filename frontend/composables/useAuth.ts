import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  profession?: string;
  country?: any;
  barNumber?: string;
  avatarUrl?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const user = ref<AuthUser | null>(null);
const accessToken = ref<string | null>(null);

export const useAuth = () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;
  const router = useRouter();

  const isAuthenticated = computed(() => !!accessToken.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isEditor = computed(() => ['admin', 'editor'].includes(user.value?.role || ''));
  const isPremium = computed(() => ['admin', 'editor', 'premium'].includes(user.value?.role || ''));

  const init = () => {
    if (import.meta.client) {
      const storedToken = localStorage.getItem('juris_access_token');
      const storedUser = localStorage.getItem('juris_user');
      if (storedToken && storedUser) {
        accessToken.value = storedToken;
        try {
          user.value = JSON.parse(storedUser);
        } catch {
          logout();
        }
      }
    }
  };

  const setAuth = (tokens: AuthTokens) => {
    accessToken.value = tokens.accessToken;
    user.value = tokens.user;
    if (import.meta.client) {
      localStorage.setItem('juris_access_token', tokens.accessToken);
      localStorage.setItem('juris_refresh_token', tokens.refreshToken);
      localStorage.setItem('juris_user', JSON.stringify(tokens.user));
    }
  };

  const login = async (email: string, password: string) => {
    const data = await $fetch<AuthTokens>(`${baseUrl}/auth/login`, {
      method: 'POST',
      body: { email, password },
    });
    setAuth(data);
    return data;
  };

  const register = async (payload: {
    email: string;
    password: string;
    fullName: string;
    profession?: string;
    countryId?: string;
  }) => {
    const data = await $fetch<AuthTokens>(`${baseUrl}/auth/register`, {
      method: 'POST',
      body: payload,
    });
    setAuth(data);
    return data;
  };

  const fetchProfile = async () => {
    if (!accessToken.value) return null;
    try {
      const profile = await $fetch<AuthUser>(`${baseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      });
      user.value = profile;
      if (import.meta.client) {
        localStorage.setItem('juris_user', JSON.stringify(profile));
      }
      return profile;
    } catch {
      logout();
      return null;
    }
  };

  const logout = () => {
    accessToken.value = null;
    user.value = null;
    if (import.meta.client) {
      localStorage.removeItem('juris_access_token');
      localStorage.removeItem('juris_refresh_token');
      localStorage.removeItem('juris_user');
    }
    router.push('/');
  };

  const authFetch = async <T>(path: string, options: any = {}): Promise<T> => {
    return $fetch<T>(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}),
        ...options.headers,
      },
    });
  };

  // Initialize on first use
  init();

  return {
    user,
    accessToken,
    isAuthenticated,
    isAdmin,
    isEditor,
    isPremium,
    login,
    register,
    logout,
    fetchProfile,
    authFetch,
  };
};
