export function resolvePlatformProtectedRedirect({
  publicOnly = false,
  isAuthenticated = false,
  canAccessPlatform = false,
  profileLoading = false,
}) {
  if (publicOnly && isAuthenticated && profileLoading) {
    return "loading";
  }

  if (publicOnly && isAuthenticated && !profileLoading && canAccessPlatform) {
    return "/platform";
  }

  if (!publicOnly && !isAuthenticated) {
    return "/platform/login";
  }

  if (!publicOnly && isAuthenticated && profileLoading) {
    return "loading";
  }

  if (!publicOnly && isAuthenticated && !canAccessPlatform) {
    return "/platform/login";
  }

  return null;
}
