'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { cn } from '@/lib/utils';

export interface CarouselImage {
  id?: string;
  url: string;
  alt?: string | null;
}

const ZOOM_SCALE = 1.75;

interface ZoomableSlideProps {
  image: CarouselImage;
  productName: string;
  priority: boolean;
  isActive: boolean;
  canHoverZoom: boolean;
}

function ZoomableSlide({
  image,
  productName,
  priority,
  isActive,
  canHoverZoom,
  onError,
}: ZoomableSlideProps & { onError?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });

  useEffect(() => {
    if (!isActive) {
      setZoom({ active: false, x: 50, y: 50 });
    }
  }, [isActive]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!canHoverZoom || !isActive || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    setZoom({ active: true, x, y });
  }

  function handleMouseLeave() {
    setZoom({ active: false, x: 50, y: 50 });
  }

  const isZoomed = canHoverZoom && isActive && zoom.active;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative min-w-0 flex-[0_0_100%] aspect-square overflow-hidden',
        canHoverZoom && isActive && 'cursor-zoom-in',
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={image.url}
        alt={image.alt ?? productName}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover select-none will-change-transform"
        onError={onError}
        style={{
          transform: isZoomed ? `scale(${ZOOM_SCALE})` : 'scale(1)',
          transformOrigin: `${zoom.x}% ${zoom.y}%`,
          transition: isZoomed ? 'transform 0.1s ease-out' : 'transform 0.25s ease-out',
        }}
        draggable={false}
      />
    </div>
  );
}

interface ProductImageCarouselProps {
  images: CarouselImage[];
  productName: string;
  priority?: boolean;
  showThumbnails?: boolean;
  /** Scroll carousel to this image URL without reordering slides */
  scrollToImageUrl?: string | null;
  className?: string;
}

export function ProductImageCarousel({
  images,
  productName,
  priority = false,
  showThumbnails,
  scrollToImageUrl,
  className,
}: ProductImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canHoverZoom, setCanHoverZoom] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());

  const visibleImages = useMemo(
    () => images.filter((image) => !failedUrls.has(image.url)),
    [images, failedUrls],
  );

  const markImageFailed = useCallback((url: string) => {
    setFailedUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);

  const hasMultiple = visibleImages.length > 1;
  const showThumbStrip = showThumbnails ?? hasMultiple;

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHoverZoom(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi || !scrollToImageUrl) return;
    const index = visibleImages.findIndex((image) => image.url === scrollToImageUrl);
    if (index >= 0) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi, scrollToImageUrl, visibleImages]);

  if (visibleImages.length === 0) {
    return (
      <div
        className={cn(
          'flex aspect-square items-center justify-center rounded-xl bg-muted text-muted-foreground',
          className,
        )}
      >
        No image available
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="relative">
        <div
          ref={emblaRef}
          className="overflow-hidden rounded-2xl border border-border/70 bg-muted"
        >
          <div className="flex touch-pan-y">
            {visibleImages.map((image, index) => (
              <ZoomableSlide
                key={image.id ?? image.url}
                image={image}
                productName={productName}
                priority={priority && index === 0}
                isActive={index === selectedIndex}
                canHoverZoom={canHoverZoom}
                onError={() => markImageFailed(image.url)}
              />
            ))}
          </div>
        </div>

        {hasMultiple && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-background/90 shadow-md backdrop-blur-sm sm:inline-flex"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-background/90 shadow-md backdrop-blur-sm sm:inline-flex"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
              {visibleImages.map((image, index) => (
                <button
                  key={image.id ?? image.url}
                  type="button"
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    index === selectedIndex
                      ? 'w-4 bg-primary'
                      : 'w-1.5 bg-background/60',
                  )}
                  onClick={() => scrollTo(index)}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showThumbStrip && hasMultiple && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {visibleImages.map((image, index) => (
            <button
              key={image.id ?? image.url}
              type="button"
              onClick={() => scrollTo(index)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md border bg-muted transition-colors',
                index === selectedIndex
                  ? 'border-foreground/30'
                  : 'border-border/60 hover:border-border',
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : undefined}
            >
              <Image
                src={image.url}
                alt={image.alt ?? productName}
                fill
                sizes="80px"
                className="object-cover"
                onError={() => markImageFailed(image.url)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
