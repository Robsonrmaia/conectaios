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
      <div className="h-full bg-gradient-to-br from-white/90 to-blue-50/90 border border-blue-200/50 rounded-lg shadow-lg">
        <Skeleton className="h-48 w-full rounded-t-lg" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-3">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-3 w-full" />
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