import { useEffect, useState } from 'react';

/**
 * Devuelve `value` recien despues de que pasen `delayMs` ms sin que cambie.
 * Usado para la busqueda de productos por nombre (evita golpear Firestore en cada tecla).
 */
export function useDebounce<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
