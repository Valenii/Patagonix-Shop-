import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@features/auth/context/AuthContext';
import { CartProvider } from '@features/cart/context/CartContext';

/**
 * Wrapper de providers para testear componentes/hooks que dependen de
 * multiples contexts (Auth + Cart + Router) sin tener que montar toda la app.
 *
 * Los servicios externos (Firebase/AWS) deben mockearse en el propio test
 * ANTES de importar este wrapper (vi.mock se hoistea automaticamente).
 */
export function AllProviders({
  children,
  initialEntries = ['/'],
}: {
  children: ReactNode;
  initialEntries?: string[];
}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: { initialEntries?: string[] } & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { initialEntries, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => <AllProviders initialEntries={initialEntries}>{children}</AllProviders>,
    ...renderOptions,
  });
}
