import { useState, type FormEvent } from 'react';
import { PRODUCT_CATEGORIES, type Product, type ProductCategory, type ProductInput } from '@shared/types';
import { Input } from '@shared/components/ui/Input';
import { TextArea } from '@shared/components/ui/TextArea';
import { Select } from '@shared/components/ui/Select';
import { Button } from '@shared/components/ui/Button';
import { ImageUploader } from './ImageUploader';

export interface ProductFormProps {
  initialProduct?: Product;
  isSubmitting: boolean;
  onSubmit: (input: ProductInput) => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  stock?: string;
  imageUrl?: string;
}

const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((category) => ({ value: category, label: category }));

function validate(values: Omit<ProductInput, 'category'>): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.';
  if (values.description.trim().length < 10) errors.description = 'Describe el producto con al menos 10 caracteres.';
  if (!Number.isFinite(values.price) || values.price <= 0) errors.price = 'El precio debe ser mayor a 0.';
  if (!Number.isInteger(values.stock) || values.stock < 0) errors.stock = 'El stock debe ser un entero mayor o igual a 0.';
  if (!values.imageUrl) errors.imageUrl = 'Sube una imagen del producto.';
  return errors;
}

/** Formulario de alta/edicion de producto, usado dentro de un Modal en el panel admin. */
export function ProductForm({ initialProduct, isSubmitting, onSubmit }: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [price, setPrice] = useState(initialProduct?.price ?? 0);
  const [stock, setStock] = useState(initialProduct?.stock ?? 0);
  const [category, setCategory] = useState<ProductCategory>(initialProduct?.category ?? 'accesorios');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl ?? '');
  const [imageKey, setImageKey] = useState(initialProduct?.imageKey ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const values = { name: name.trim(), description: description.trim(), price, stock, imageUrl };
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSubmit({ ...values, category, imageKey: imageKey || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ImageUploader
        imageUrl={imageUrl}
        onUploaded={({ publicUrl, key }) => {
          setImageUrl(publicUrl);
          setImageKey(key);
          setErrors((prev) => ({ ...prev, imageUrl: undefined }));
        }}
      />
      {errors.imageUrl && <p className="text-xs text-red-600">{errors.imageUrl}</p>}

      <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <TextArea
        label="Descripcion"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Precio (ARS)"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          error={errors.price}
        />
        <Input
          label="Stock"
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          error={errors.stock}
        />
      </div>
      <Select
        label="Categoria"
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={(e) => setCategory(e.target.value as ProductCategory)}
      />
      <Button type="submit" size="lg" isLoading={isSubmitting}>
        {initialProduct ? 'Guardar cambios' : 'Crear producto'}
      </Button>
    </form>
  );
}
