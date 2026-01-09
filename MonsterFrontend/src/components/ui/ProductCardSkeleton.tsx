import { Skeleton } from "./skeleton";
import { Card, CardContent } from "./card";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Image skeleton */}
        <Skeleton className="w-full h-48 md:h-56" />
        
        <div className="p-4 space-y-3">
          {/* Title skeleton */}
          <Skeleton className="h-5 w-3/4" />
          
          {/* Description skeleton */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          
          {/* Price and brand skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Sizes skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-6 w-10" />
          </div>
          
          {/* Button skeleton */}
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

