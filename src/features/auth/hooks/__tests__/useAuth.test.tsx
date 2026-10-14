import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { buildUserProfile } from '@test/utils/fixtures';
import { AuthProvider } from '../../context/AuthContext';
import { useAuth } from '../useAuth';
import * as authService from '../../services/authService';

// Mockeamos todo el modulo de Firebase Auth: el hook no deberia depender de
// la red ni de un proyecto de Firebase real para poder testearse.
vi.mock('../../services/authService', () => ({
  subscribeToAuthChanges: vi.fn(),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
  logout: vi.fn(),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lanza un error si se usa fuera de un AuthProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useAuth();
      } catch (error) {
        return error as Error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
  });

  it('arranca en loading y resuelve a unauthenticated si no hay sesion', async () => {
    vi.mocked(authService.subscribeToAuthChanges).mockImplementation((callback) => {
      callback(null);
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.profile).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it('resuelve a authenticated con el perfil cuando hay sesion activa', async () => {
    const profile = buildUserProfile({ role: 'admin' });
    vi.mocked(authService.subscribeToAuthChanges).mockImplementation((callback) => {
      callback(profile);
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.profile).toEqual(profile);
    expect(result.current.isAdmin).toBe(true);
  });

  it('login exitoso actualiza el estado a authenticated', async () => {
    vi.mocked(authService.subscribeToAuthChanges).mockImplementation((callback) => {
      callback(null);
      return () => {};
    });
    const profile = buildUserProfile();
    vi.mocked(authService.loginWithEmail).mockResolvedValue({ ok: true, data: profile });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      const response = await result.current.login({ email: profile.email, password: '123456' });
      expect(response.ok).toBe(true);
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.profile).toEqual(profile);
  });

  it('login fallido devuelve el mensaje de error sin cambiar a authenticated', async () => {
    vi.mocked(authService.subscribeToAuthChanges).mockImplementation((callback) => {
      callback(null);
      return () => {};
    });
    vi.mocked(authService.loginWithEmail).mockResolvedValue({
      ok: false,
      error: 'Email o contrasena incorrectos.',
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      const response = await result.current.login({ email: 'x@x.com', password: 'bad' });
      expect(response.ok).toBe(false);
      expect(response.error).toBe('Email o contrasena incorrectos.');
    });

    expect(result.current.status).toBe('unauthenticated');
  });

  it('logout limpia el perfil y vuelve a unauthenticated', async () => {
    const profile = buildUserProfile();
    vi.mocked(authService.subscribeToAuthChanges).mockImplementation((callback) => {
      callback(profile);
      return () => {};
    });
    vi.mocked(authService.logout).mockResolvedValue({ ok: true, data: undefined });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.profile).toBeNull();
  });
});
