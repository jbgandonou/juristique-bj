export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated, isEditor } = useAuth();

  if (!isAuthenticated.value) {
    return navigateTo(`/connexion?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (!isEditor.value) {
    return navigateTo('/');
  }
});
