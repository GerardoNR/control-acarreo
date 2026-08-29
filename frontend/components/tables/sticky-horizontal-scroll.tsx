"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ProxyPosition {
  left: number;
  width: number;
  visible: boolean;
}

export function StickyHorizontalScroll({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const proxyRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [position, setPosition] = useState<ProxyPosition>({
    left: 0,
    width: 0,
    visible: false,
  });

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    function measure() {
      if (!content) return;
      const rect = content.getBoundingClientRect();
      const overflow = content.scrollWidth > content.clientWidth + 1;
      const visible =
        overflow && rect.top < window.innerHeight - 24 && rect.bottom > window.innerHeight + 24;

      setContentWidth(content.scrollWidth);
      setHasOverflow(overflow);
      setPosition({ left: rect.left, width: rect.width, visible });
    }

    function scheduleMeasure() {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        measure();
      });
    }

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(content);
    if (content.firstElementChild) resizeObserver.observe(content.firstElementChild);
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    measure();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  function syncScroll(source: HTMLDivElement, target: HTMLDivElement | null) {
    if (target && Math.abs(target.scrollLeft - source.scrollLeft) > 1) {
      target.scrollLeft = source.scrollLeft;
    }
  }

  return (
    <div className="min-w-0">
      <div
        ref={contentRef}
        className="overflow-x-auto"
        onScroll={(event) => syncScroll(event.currentTarget, proxyRef.current)}
      >
        {children}
      </div>

      {hasOverflow ? (
        <div
          ref={proxyRef}
          role="region"
          aria-label="Desplazamiento horizontal de la tabla"
          tabIndex={0}
          onScroll={(event) => syncScroll(event.currentTarget, contentRef.current)}
          className={`fixed bottom-2 z-30 h-4 overflow-x-auto rounded-md border border-[#CBD5E1] bg-white/95 shadow-md transition-opacity ${position.visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
          style={{ left: position.left, width: position.width }}
        >
          <div style={{ width: contentWidth, height: 1 }} aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}
