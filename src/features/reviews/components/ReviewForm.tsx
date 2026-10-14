import { useState, type FormEvent } from 'react';
import { Button } from '@shared/components/ui/Button';
import { RatingStars } from '@shared/components/ui/RatingStars';
import { TextArea } from '@shared/components/ui/TextArea';

export interface ReviewFormProps {
  onSubmit: (rating: 1 | 2 | 3 | 4 | 5, comment: string) => Promise<void>;
}

export function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (comment.trim().length < 3) {
      setError('El comentario debe tener al menos 3 caracteres.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment.trim());
      setComment('');
      setRating(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700">Dejar una review</p>
      <RatingStars value={rating} onChange={setRating} size="md" />
      <TextArea
        label="Comentario"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        error={error ?? undefined}
        placeholder="Contanos tu experiencia con el producto..."
      />
      <Button type="submit" isLoading={isSubmitting} className="self-start">
        Publicar review
      </Button>
    </form>
  );
}
