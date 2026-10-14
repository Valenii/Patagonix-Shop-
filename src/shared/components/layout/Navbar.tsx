import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useCart } from '@features/cart/hooks/useCart';

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
  }`;

/** Barra de navegacion principal, mobile-first (menu hamburguesa en pantallas chicas). */
export function Navbar() {
  const { status, profile, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <span aria-hidden="true">🏔️</span> Patagonix Shop
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={NAV_LINK_CLASS}>
            Catalogo
          </NavLink>
          {status === 'authenticated' && (
            <NavLink to="/orders" className={NAV_LINK_CLASS}>
              Mis ordenes
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={NAV_LINK_CLASS}>
              Panel admin
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/cart"
            className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            aria-label={`Carrito, ${itemCount} items`}
          >
            🛒 Carrito
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {status === 'authenticated' ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Hola, {profile?.displayName}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Ingresar
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Abrir menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <NavLink to="/" end className={NAV_LINK_CLASS} onClick={() => setIsMenuOpen(false)}>
            Catalogo
          </NavLink>
          <NavLink to="/cart" className={NAV_LINK_CLASS} onClick={() => setIsMenuOpen(false)}>
            Carrito {itemCount > 0 ? `(${itemCount})` : ''}
          </NavLink>
          {status === 'authenticated' && (
            <NavLink to="/orders" className={NAV_LINK_CLASS} onClick={() => setIsMenuOpen(false)}>
              Mis ordenes
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={NAV_LINK_CLASS} onClick={() => setIsMenuOpen(false)}>
              Panel admin
            </NavLink>
          )}
          {status === 'authenticated' ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Salir ({profile?.displayName})
            </button>
          ) : (
            <NavLink to="/login" className={NAV_LINK_CLASS} onClick={() => setIsMenuOpen(false)}>
              Ingresar
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
