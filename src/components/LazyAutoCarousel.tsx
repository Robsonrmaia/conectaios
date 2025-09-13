import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AutoCarousel = lazy(() => import('./AutoCarousel').then(module => ({ default: module.AutoCarousel })));

interface LazyAutoCarouselProps {
  properties: any[];
  onPropertyClick: (property: any) => void;
  autoplayDelay?: number;
}

function AutoCarouselSkeleton() {
  return (
    <div className="relative w-full h-full">
      <div className="h-full bg-gradient-to-br from-white/90 to-blue-50/90 border border-blue-200/50 rounded-lg shadow-lg animate-pulse">
        <div className="h-48 w-full rounded-t-lg bg-muted" />
        <div className="p-4 space-y-3">
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-6 w-1/2 bg-muted rounded" />
          <div className="flex gap-3">
            <div className="h-4 w-8 bg-muted rounded" />
            <div className="h-4 w-8 bg-muted rounded" />
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
          <div className="h-3 w-full bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export function LazyAutoCarousel(props: LazyAutoCarouselProps) {
  return (
    <Suspense fallback={<AutoCarouselSkeleton />}>
      <AutoCarousel {...props} />
    </Suspense>
  );
}