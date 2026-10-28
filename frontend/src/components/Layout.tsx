import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = isAdmin
    ? [{ label: 'Queue', path: '/admin' }]
    : [
        { label: 'My Books', path: '/books' },
        { label: 'Submit Query', path: '/tickets/new' },
        { label: 'My Tickets', path: '/tickets' },
      ];

  const homePath = isAdmin ? '/admin' : '/books';
  const containerWidth = isAdmin ? 'max-w-7xl' : 'max-w-6xl';

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900 font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-8">
              <NavLink to={homePath} className="flex items-center gap-2.5 group">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold text-lg shadow-xs transition ${
                    isAdmin
                      ? 'bg-stone-900 group-hover:bg-stone-800'
                      : 'bg-amber-700 group-hover:bg-amber-800'
                  }`}
                >
                  {isAdmin ? '🛡️' : '🍃'}
                </span>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-stone-900 tracking-tight leading-none group-hover:text-amber-800 transition">
                    BookLeaf
                  </span>
                  <span className="text-xs text-stone-500 font-medium tracking-wide">
                    {isAdmin ? 'Admin Portal' : 'Author Portal'}
                  </span>
                </div>
              </NavLink>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/books' || item.path === '/admin'}
                    className={({ isActive }) =>
                      `px-3.5 py-2 rounded-md text-sm font-medium transition ${
                        isActive
                          ? 'bg-amber-50 text-amber-900 font-semibold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* User Section & Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-right">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-sm font-semibold text-stone-800 leading-tight">
                      {user?.name || (isAdmin ? 'Admin' : 'Author')}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500">{user?.email}</span>
                </div>
                <div
                  className={`h-8 w-8 rounded-full font-semibold flex items-center justify-center text-xs border ${
                    isAdmin
                      ? 'bg-stone-100 text-stone-800 border-stone-300'
                      : 'bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : isAdmin ? 'A' : 'U'}
                </div>
              </div>

              <div className="h-5 w-px bg-stone-200" />

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer border border-transparent hover:border-red-200"
              >
                Sign out
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/books' || item.path === '/admin'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 font-semibold'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-800">{user?.name}</p>
                <p className="text-xs text-stone-500">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 ${containerWidth} w-full mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className={`${containerWidth} mx-auto px-4`}>
          BookLeaf Publishing &middot; {isAdmin ? 'Support Operations Center' : 'Author Support & Communication Portal'}
        </div>
      </footer>
    </div>
  );
}
