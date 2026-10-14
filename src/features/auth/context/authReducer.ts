import type { UserProfile } from '@shared/types';

export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  profile: UserProfile | null;
  error: string | null;
}

export type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_RESOLVED'; payload: UserProfile | null }
  | { type: 'AUTH_ERROR'; payload: string };

export const initialAuthState: AuthState = {
  status: 'loading',
  profile: null,
  error: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, status: 'loading', error: null };
    case 'AUTH_RESOLVED':
      return {
        status: action.payload ? 'authenticated' : 'unauthenticated',
        profile: action.payload,
        error: null,
      };
    case 'AUTH_ERROR':
      return { status: 'unauthenticated', profile: null, error: action.payload };
    default:
      return state;
  }
}
