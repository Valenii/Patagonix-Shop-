import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { login, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login({ email, password });
    setIsSubmitting(false);

    if (result.ok) {
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error ?? 'No se pudo iniciar sesion.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const result = await loginGoogle();
    setIsGoogleLoading(false);

    if (result.ok) {
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error ?? 'No se pudo iniciar sesion con Google.');
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Ingresar</h1>
        <p className="text-sm text-slate-500">Accede a tu cuenta de Patagonix Shop</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Contrasena"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" size="lg" isLoading={isSubmitting} fullWidth>
          Ingresar
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">o</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <Button variant="secondary" size="lg" fullWidth onClick={handleGoogleLogin} isLoading={isGoogleLoading}>
        Continuar con Google
      </Button>

      <p className="text-center text-sm text-slate-500">
        No tenes cuenta?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
