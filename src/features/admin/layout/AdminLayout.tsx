import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Productos' },
  { to: '/admin/orders', label: 'Ordenes' },
];

const LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
  }`;

/**
 * Layout del panel de administracion: deliberadamente distinto al de cliente
 * (sidebar oscuro + topbar) para que sea obvio en que "modo" esta el usuario.
 */
export function AdminLayout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 md:flex-row">
      <aside className="flex flex-col gap-1 bg-slate-900 p-4 md:w-60 md:shrink-0">
        <Link to="/admin" className="mb-4 px-2 text-lg font-bold text-white">
          🏔️ Patagonix <span className="text-brand-400">Admin</span>
        </Link>
        <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={LINK_CLASS}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-2 border-t border-slate-800 pt-4 md:flex">
          <Link to="/" className="text-sm text-slate-400 hover:text-white">
            ← Volver a la tienda
          </Link>
          <p className="text-xs text-slate-500">{profile?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="text-left text-sm text-slate-400 hover:text-white"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      <div className="flex-1 p-4 md:p-8">
        <Outlet />
      </div>
    </div>
  );
}
