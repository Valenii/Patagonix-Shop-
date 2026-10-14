import type { Review } from '@shared/types';
import { RatingStars } from '@shared/components/ui/RatingStars';
import { EmptyState } from '@shared/components/feedback/EmptyState';
import { formatDate } from '@shared/utils/format';

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <EmptyState title="Todavia no hay reviews" description="Se el primero en calificar este producto." />;
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800">{review.userName}</span>
            <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
          </div>
          <RatingStars value={review.rating} />
          <p className="mt-1 text-sm text-slate-600">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}
