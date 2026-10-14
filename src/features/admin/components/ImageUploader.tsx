import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@shared/components/ui/Button';
import { Spinner } from '@shared/components/feedback/Spinner';
import { uploadProductImage } from '../services/imageUploadService';

export interface ImageUploaderProps {
  imageUrl: string;
  onUploaded: (result: { publicUrl: string; key: string }) => void;
}

const MAX_SIZE_MB = 5;

/**
 * Sube una imagen de producto a S3 via presigned URL (ver docs/README,
 * seccion "Flujo de upload de imagenes a S3").
 */
export function ImageUploader({ imageUrl, onUploaded }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Formato no soportado. Usa JPG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`La imagen supera los ${MAX_SIZE_MB}MB.`);
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);

    const result = await uploadProductImage(file);
    setIsUploading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUploaded(result.data);
  };

  const displayImage = preview ?? imageUrl;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">Imagen del producto</span>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {isUploading ? (
            <Spinner />
          ) : displayImage ? (
            <img src={displayImage} alt="Vista previa" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl text-slate-300">📷</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
            {imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-slate-400">JPG, PNG o WEBP · maximo {MAX_SIZE_MB}MB</p>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
