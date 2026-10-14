import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import { ErrorMessage } from '@shared/components/feedback/ErrorMessage';

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (displayName.trim().length < 2) nextErrors.displayName = 'Ingresa tu nombre.';
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Email invalido.';
    if (password.length < 6) nextErrors.password = 'Minimo 6 caracteres.';
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Las contrasenas no coinciden.';
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setServerError(null);
    setIsSubmitting(true);
    const result = await register({ displayName, email, password });
    setIsSubmitting(false);

    if (result.ok) {
      navigate('/', { replace: true });
    } else {
      setServerError(result.error ?? 'No se pudo crear la cuenta.');
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="text-sm text-slate-500">Registrate para comprar en Patagonix Shop</p>
      </div>

      {serverError && <ErrorMessage message={serverError} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre completo"
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          error={errors.displayName}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <Input
          label="Contrasena"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          hint="Minimo 6 caracteres"
        />
        <Input
          label="Confirmar contrasena"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
        />
        <Button type="submit" size="lg" isLoading={isSubmitting} fullWidth>
          Crear cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Ya tenes cuenta?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
