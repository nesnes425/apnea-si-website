"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";

interface Photo {
  src: string;
  alt: string;
  /** Aspect ratio as width/height (e.g., 1.5 for landscape, 0.67 for portrait). Defaults to 1.5. */
  aspect?: number;
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -420 : 420;
    el.scrollBy({ left: amount, behavior: "smooth" });
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

  // Fixed height, width adapts to each photo's aspect ratio
  const galleryHeight = 280; // px — md height
  const galleryHeightMobile = 220;

  return (
    <div className="relative group">
      {/* Arrow buttons — desktop only */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 border border-border-custom items-center justify-center text-navy hover:bg-white transition-colors"
          aria-label="Prejšnje slike"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 12L6 8L10 4" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 border border-border-custom items-center justify-center text-navy hover:bg-white transition-colors"
          aria-label="Naslednje slike"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4L10 8L6 12" />
          </svg>
        </button>
      )}

      <div
        ref={scrollRef}
        role="region"
        aria-label="Galerija fotografij"
        className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x snap-mandatory cursor-grab select-none max-w-[100vw]"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="shrink-0 w-[max(0px,calc((100vw-72rem)/2))]" />
        {photos.map((photo) => {
          const aspect = photo.aspect ?? 1.5;
          const widthMobile = Math.round(galleryHeightMobile * aspect);
          const widthDesktop = Math.round(galleryHeight * aspect);

          return (
            <div
              key={photo.src}
              className="shrink-0 relative snap-start pointer-events-none"
              style={{
                width: widthDesktop,
                height: galleryHeight,
              }}
            >
              <style>{`
                @media (max-width: 767px) {
                  [data-gallery-item="${photo.src}"] {
                    width: ${widthMobile}px !important;
                    height: ${galleryHeightMobile}px !important;
                  }
                }
              `}</style>
              <div
                data-gallery-item={photo.src}
                className="relative w-full h-full"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  draggable={false}
                />
              </div>
            </div>
          );
        })}
        <div className="shrink-0 w-4" />
      </div>
    </div>
  );
}
