import { Link } from 'react-router-dom';
import { Button } from '@shared/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-6xl">🧭</span>
      <h1 className="text-2xl font-bold text-slate-900">Pagina no encontrada</h1>
      <p className="text-sm text-slate-500">La ruta que buscas no existe o fue movida.</p>
      <Link to="/">
        <Button>Volver al catalogo</Button>
      </Link>
    </div>
  );
}
