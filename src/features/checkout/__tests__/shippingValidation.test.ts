import { describe, expect, it } from 'vitest';
import type { ShippingAddress } from '@shared/types';
import {
  isValidPostalCode,
  normalizeShippingAddress,
  validateShippingAddress,
} from '../utils/shippingValidation';

const validAddress: ShippingAddress = {
  fullName: 'Ana Perez',
  street: 'Mitre 123',
  city: 'Bariloche',
  province: 'Rio Negro',
  postalCode: '8400',
  phone: '2944123456',
};

describe('isValidPostalCode', () => {
  it.each(['8400', '5500', 'M5500ABC', 'r8400xyz', ' B1234ABC '])('acepta %s', (value) => {
    expect(isValidPostalCode(value)).toBe(true);
  });

  it.each(['', '840', '84000', 'M119623312', 'M5500AB', '5500ABC', 'MM5500ABC', 'M 5500 ABC'])(
    'rechaza "%s"',
    (value) => {
      expect(isValidPostalCode(value)).toBe(false);
    },
  );
});

describe('validateShippingAddress', () => {
  it('no devuelve errores para una direccion valida', () => {
    expect(validateShippingAddress(validAddress)).toEqual({});
  });

  it('marca el codigo postal invalido', () => {
    const errors = validateShippingAddress({ ...validAddress, postalCode: 'M119623312' });
    expect(errors.postalCode).toMatch(/codigo postal invalido/i);
  });

  it('marca los campos obligatorios vacios', () => {
    const errors = validateShippingAddress({ ...validAddress, fullName: ' ', city: '' });
    expect(Object.keys(errors).sort()).toEqual(['city', 'fullName']);
  });
});

describe('normalizeShippingAddress', () => {
  it('recorta espacios y pasa el CPA a mayusculas', () => {
    const normalized = normalizeShippingAddress({ ...validAddress, city: ' Bariloche ', postalCode: ' r8400abc ' });
    expect(normalized.city).toBe('Bariloche');
    expect(normalized.postalCode).toBe('R8400ABC');
  });
});
