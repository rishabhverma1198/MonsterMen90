import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number | null | undefined;
  reviewCount?: number | null;
  maxStars?: number;
  className?: string;
}

export function StarRating({
  rating,
  reviewCount,
  maxStars = 5,
  className = ''
}: StarRatingProps) {
  // Handle invalid or missing rating
  if (rating === null || rating === undefined || isNaN(rating)) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center">
          <span className="text-sm text-gray-500">No rating available</span>
        </div>
      </div>
    );
  }

  // Clamp rating between 0 and maxStars
  const clampedRating = Math.max(0, Math.min(rating, maxStars));

  // Generate star elements
  const stars = Array.from({ length: maxStars }, (_, index) => {
    const starValue = index + 1;
    const isFilled = starValue <= clampedRating;
    const isHalf = !isFilled && starValue - 0.5 <= clampedRating;

    return (
      <Star
        key={index}
        aria-hidden="true"
        className={`w-4 h-4 ${
          isFilled
            ? 'text-yellow-400 fill-current'
            : isHalf
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    );
  });

  // Format review count
  const formattedReviewCount = reviewCount && reviewCount > 0
    ? `(${clampedRating.toFixed(1)}) ${reviewCount.toLocaleString()} review${reviewCount === 1 ? '' : 's'}`
    : `(${clampedRating.toFixed(1)})`;

  return (
    <div className={`flex items-center space-x-4 ${className}`} role="img" aria-label={`Rating: ${clampedRating} out of ${maxStars} stars`}>
      <span className="sr-only">Rating: {clampedRating} out of {maxStars} stars</span>
      <div className="flex items-center" aria-hidden="true">
        {stars}
        <span className="ml-2 text-sm text-gray-600">
          {formattedReviewCount}
        </span>
      </div>
    </div>
  );
}