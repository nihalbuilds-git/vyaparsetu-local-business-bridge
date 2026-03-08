import { useEffect, useRef } from "react";

/**
 * Hook that observes children with `.reveal-card` class
 * and adds `.animate-fade-up-visible` when they enter the viewport.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Add a small stagger based on element index within its parent
            const el = entry.target as HTMLElement;
            const siblings = el.parentElement?.querySelectorAll(".reveal-card");
            const index = siblings ? Array.from(siblings).indexOf(el) : 0;
            setTimeout(() => {
              el.classList.add("animate-fade-up-visible");
            }, index * 80);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const els = ref.current?.querySelectorAll(".reveal-card");
    els?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}
