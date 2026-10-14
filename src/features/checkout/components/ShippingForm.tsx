import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { ShippingAddress } from '@shared/types';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import {
  normalizeShippingAddress,
  validateShippingAddress,
  type ShippingFormErrors,
} from '../utils/shippingValidation';

export interface ShippingFormProps {
  defaultValues?: Partial<ShippingAddress>;
  isSubmitting: boolean;
  onSubmit: (address: ShippingAddress) => void;
}

/** Formulario de direccion de envio para el checkout simulado, con validacion inline. */
export function ShippingForm({ defaultValues, isSubmitting, onSubmit }: ShippingFormProps) {
  const [values, setValues] = useState<ShippingAddress>({
    fullName: defaultValues?.fullName ?? '',
    street: defaultValues?.street ?? '',
    city: defaultValues?.city ?? '',
    province: defaultValues?.province ?? '',
    postalCode: defaultValues?.postalCode ?? '',
    phone: defaultValues?.phone ?? '',
  });
  const [errors, setErrors] = useState<ShippingFormErrors>({});

  const handleChange = (field: keyof ShippingAddress) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateShippingAddress(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      onSubmit(normalizeShippingAddress(values));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">Direccion de envio</h2>
      <Input label="Nombre completo" value={values.fullName} onChange={handleChange('fullName')} error={errors.fullName} />
      <Input label="Direccion" value={values.street} onChange={handleChange('street')} error={errors.street} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Ciudad" value={values.city} onChange={handleChange('city')} error={errors.city} />
        <Input label="Provincia" value={values.province} onChange={handleChange('province')} error={errors.province} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Codigo postal"
          placeholder="5500 o M5500ABC"
          value={values.postalCode}
          onChange={handleChange('postalCode')}
          error={errors.postalCode}
        />
        <Input label="Telefono" value={values.phone} onChange={handleChange('phone')} error={errors.phone} />
      </div>
      <Button type="submit" size="lg" isLoading={isSubmitting}>
        Confirmar compra
      </Button>
    </form>
  );
}
