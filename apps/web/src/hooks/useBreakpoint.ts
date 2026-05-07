import { useMediaQuery } from 'usehooks-ts';

interface BreakpointResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useBreakpoint(): BreakpointResult {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  if (isDesktop) return { isMobile: false, isTablet: false, isDesktop: true };
  if (isTablet) return { isMobile: false, isTablet: true, isDesktop: false };
  return { isMobile: true, isTablet: false, isDesktop: false };
}
