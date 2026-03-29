export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated, isPremium } = useAuth();

  if (!isAuthenticated.value) {
    return navigateTo(`/connexion?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (!isPremium.value) {
    return navigateTo('/tarifs?upgrade=true');
  }
});
