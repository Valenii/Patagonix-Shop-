import type { ShippingAddress } from '@shared/types';

export type ShippingFormErrors = Partial<Record<keyof ShippingAddress, string>>;

// Codigo postal argentino: formato viejo (4 digitos, ej. 5500) o
// CPA (letra de provincia + 4 digitos + 3 letras de manzana, ej. M5500ABC).
const POSTAL_CODE_REGEX = /^([A-Z]\d{4}[A-Z]{3}|\d{4})$/i;
const PHONE_REGEX = /^\+?\d{6,15}$/;

export function isValidPostalCode(value: string): boolean {
  return POSTAL_CODE_REGEX.test(value.trim());
}

/** Normaliza la direccion antes de guardarla (sin espacios extra y CPA en mayusculas). */
export function normalizeShippingAddress(values: ShippingAddress): ShippingAddress {
  return {
    fullName: values.fullName.trim(),
    street: values.street.trim(),
    city: values.city.trim(),
    province: values.province.trim(),
    postalCode: values.postalCode.trim().toUpperCase(),
    phone: values.phone.trim(),
  };
}

export function validateShippingAddress(values: ShippingAddress): ShippingFormErrors {
  const errors: ShippingFormErrors = {};
  if (!values.fullName.trim()) errors.fullName = 'Ingresa tu nombre completo.';
  if (!values.street.trim()) errors.street = 'Ingresa tu direccion.';
  if (!values.city.trim()) errors.city = 'Ingresa tu ciudad.';
  if (!values.province.trim()) errors.province = 'Ingresa tu provincia.';
  if (!isValidPostalCode(values.postalCode)) errors.postalCode = 'Codigo postal invalido. Ej: 5500 o M5500ABC.';
  if (!PHONE_REGEX.test(values.phone.trim())) errors.phone = 'Telefono invalido.';
  return errors;
}
