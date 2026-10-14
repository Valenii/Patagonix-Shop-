import { createContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { LoginInput, RegisterInput, UserProfile } from '@shared/types';
import {
  loginWithEmail,
  loginWithGoogle,
  logout as logoutService,
  registerWithEmail,
  subscribeToAuthChanges,
} from '../services/authService';
import { authReducer, initialAuthState, type AuthState } from './authReducer';

export interface AuthContextValue extends AuthState {
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string }>;
  login: (input: LoginInput) => Promise<{ ok: boolean; error?: string }>;
  loginGoogle: () => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  useEffect(() => {
    dispatch({ type: 'AUTH_LOADING' });
    const unsubscribe = subscribeToAuthChanges((profile: UserProfile | null) => {
      dispatch({ type: 'AUTH_RESOLVED', payload: profile });
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAdmin: state.profile?.role === 'admin',
      register: async (input) => {
        const result = await registerWithEmail(input);
        if (result.ok) {
          dispatch({ type: 'AUTH_RESOLVED', payload: result.data });
          return { ok: true };
        }
        return { ok: false, error: result.error };
      },
      login: async (input) => {
        const result = await loginWithEmail(input);
        if (result.ok) {
          dispatch({ type: 'AUTH_RESOLVED', payload: result.data });
          return { ok: true };
        }
        return { ok: false, error: result.error };
      },
      loginGoogle: async () => {
        const result = await loginWithGoogle();
        if (result.ok) {
          dispatch({ type: 'AUTH_RESOLVED', payload: result.data });
          return { ok: true };
        }
        return { ok: false, error: result.error };
      },
      logout: async () => {
        await logoutService();
        dispatch({ type: 'AUTH_RESOLVED', payload: null });
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
