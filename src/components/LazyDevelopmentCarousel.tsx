import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';

const DevelopmentCarousel = lazy(() => import('./DevelopmentCarousel').then(module => ({ default: module.DevelopmentCarousel })));

function DevelopmentCarouselSkeleton() {
  return (
    <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 p-4 rounded-2xl backdrop-blur-sm border border-primary/10">
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="group relative overflow-hidden rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 shadow-md">
            <div className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-7 w-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LazyDevelopmentCarousel() {
  return (
    <Suspense fallback={<DevelopmentCarouselSkeleton />}>
      <DevelopmentCarousel />
    </Suspense>
  );
}