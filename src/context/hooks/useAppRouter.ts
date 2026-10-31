import { useState, useEffect, useCallback } from 'react';

const getInitialRoute = (): string => {
  if (typeof window !== 'undefined') {
    const path = (window.location.pathname || '/') + (window.location.search || '');
    return path && path !== '' ? path : '/';
  }
  return '/';
};

export function useAppRouter() {
  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute);

  const navigateTo = useCallback((route: string, opts?: { replace?: boolean }) => {
    if (typeof window !== 'undefined') {
      if (opts?.replace) window.history.replaceState({}, '', route);
      else window.history.pushState({}, '', route);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const full = (window.location.pathname || '/') + (window.location.search || '');
      setCurrentRoute(full || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { currentRoute, navigateTo };
}
