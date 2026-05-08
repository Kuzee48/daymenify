'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseIntersectionOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseIntersectionResult {
  ref: (node: HTMLElement | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersection(
  options: UseIntersectionOptions = {}
): UseIntersectionResult {
  const { threshold = 0, rootMargin = '0px', triggerOnce = true } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const hasTriggered = useRef(false);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) {
        elementRef.current = null;
        return;
      }

      elementRef.current = node;

      if (triggerOnce && hasTriggered.current) return;

      observerRef.current = new IntersectionObserver(
        ([observerEntry]) => {
          setIsIntersecting(observerEntry.isIntersecting);
          setEntry(observerEntry);

          if (observerEntry.isIntersecting && triggerOnce) {
            hasTriggered.current = true;
            observerRef.current?.disconnect();
          }
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(node);
    },
    [threshold, rootMargin, triggerOnce]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref, isIntersecting, entry };
}
