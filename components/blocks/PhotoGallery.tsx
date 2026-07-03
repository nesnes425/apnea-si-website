"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  src: string;
  alt: string;
  /** Aspect ratio as width/height (e.g., 1.5 for landscape, 0.67 for portrait). Defaults to 1.5. */
  aspect?: number;
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(photos.length > 1);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);

    const containerCenter = el.scrollLeft + el.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    itemRefs.current.forEach((item, index) => {
      if (!item) return;
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const distance = Math.abs(containerCenter - itemCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const nextIndex =
      direction === "left"
        ? Math.max(activeIndex - 1, 0)
        : Math.min(activeIndex + 1, photos.length - 1);
    itemRefs.current[nextIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  // Mouse drag
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX;
    scrollStart.current = scrollRef.current?.scrollLeft ?? 0;
    if (scrollRef.current) scrollRef.current.style.cursor = "grabbing";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const dx = e.pageX - startX.current;
    scrollRef.current.scrollLeft = scrollStart.current - dx;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  return (
    <div className="relative group" aria-roledescription="carousel">
      <button
        type="button"
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-border-custom bg-white/95 text-navy shadow-sm transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-0 md:left-6"
        aria-label="Prejšnja fotografija"
      >
        <ChevronLeft aria-hidden="true" size={22} strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-border-custom bg-white/95 text-navy shadow-sm transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-0 md:right-6"
        aria-label="Naslednja fotografija"
      >
        <ChevronRight aria-hidden="true" size={22} strokeWidth={2} />
      </button>

      <div
        ref={scrollRef}
        role="region"
        aria-label="Galerija fotografij"
        className="scrollbar-hide flex max-w-[100vw] snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 scroll-px-6 select-none md:gap-5 md:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] md:scroll-px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {photos.map((photo, index) => {
          const aspect = photo.aspect ?? 1.5;

          return (
            <div
              key={photo.src}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              className="relative h-[220px] w-[min(82vw,calc(220px*var(--gallery-aspect)))] shrink-0 snap-center md:h-[280px] md:w-[calc(280px*var(--gallery-aspect))]"
              style={{
                "--gallery-aspect": aspect,
              } as CSSProperties}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 82vw, 420px"
                className="object-cover"
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {photos.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => {
              itemRefs.current[index]?.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              });
            }}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex ? "w-8 bg-gold" : "w-2 bg-navy/20 hover:bg-navy/35"
            }`}
            aria-label={`Prikaži fotografijo ${index + 1} od ${photos.length}`}
            aria-current={index === activeIndex ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
