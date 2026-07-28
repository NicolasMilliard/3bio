import { useEffect, useRef } from 'react';

type RevealOnScrollOptions = {
  rootMargin?: string;
  threshold?: number;
};

export const useRevealOnScroll = <T extends HTMLElement>(
  visibleAttribute: `data-${string}`,
  {
    rootMargin = '0px 0px -10% 0px',
    threshold = 0.18,
  }: RevealOnScrollOptions = {},
) => {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const revealElement = () => {
      element.setAttribute(visibleAttribute, 'true');
    };

    if (!('IntersectionObserver' in window)) {
      revealElement();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        revealElement();
        observer.disconnect();
      },
      {
        rootMargin,
        threshold,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, threshold, visibleAttribute]);

  return elementRef;
};
