import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { ErrorBanner } from '../components/ErrorBanner';
import { Spinner } from '../components/Spinner';

export function Login() {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<unknown>(undefined);
  const [showDemoLogins, setShowDemoLogins] = useState(false);

  // If already authenticated, redirect to role home
  if (!isLoading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/books'} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorDetails(undefined);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email.trim(), password);
      // Redirect based on role
      if (loggedInUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/books', { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || 'Login failed');
        setErrorDetails(err.details);
      } else {
        setErrorMessage((err as Error)?.message || 'Unable to connect to server');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setErrorMessage(null);
    setErrorDetails(undefined);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-700 text-white font-bold text-2xl shadow-sm mb-3">
          🍃
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          BookLeaf Author Portal
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Sign in to view your books, track royalties, and get author support
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-stone-200">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {errorMessage && (
              <ErrorBanner
                title="Sign in failed"
                message={errorMessage}
                details={errorDetails}
              />
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full rounded-lg border border-stone-300 px-3.5 py-2 text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 sm:text-sm disabled:bg-stone-50"
                  placeholder="author@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full rounded-lg border border-stone-300 px-3.5 py-2 text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 sm:text-sm disabled:bg-stone-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Collapsible Demo Logins Hint */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowDemoLogins(!showDemoLogins)}
              className="w-full flex items-center justify-between text-xs text-stone-500 hover:text-stone-800 transition py-1"
            >
              <span className="font-medium flex items-center gap-1.5">
                <span>🔑</span> Demo test credentials
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                {showDemoLogins ? 'hide ▲' : 'show ▼'}
              </span>
            </button>

            {showDemoLogins && (
              <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 space-y-2">
                <p className="font-semibold text-stone-800">
                  Password for all demo accounts: <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-900">Password@123</code>
                </p>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate mr-2">Priya Sharma (Author):</span>
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('priya.sharma@email.com')}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-amber-900 transition"
                    >
                      Fill Priya
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate mr-2">Ananya Deshmukh (Author):</span>
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('ananya.deshmukh@email.com')}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-amber-900 transition"
                    >
                      Fill Ananya
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="truncate mr-2">Admin Portal (Admin):</span>
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('admin@bookleaf.com')}
                      className="px-2 py-0.5 text-[11px] font-mono rounded bg-white border border-stone-200 hover:bg-amber-50 hover:border-amber-300 text-amber-900 transition"
                    >
                      Fill Admin
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
