'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type AuthState = 'checking' | 'in' | 'out' | 'unreachable';

interface AdminAuthContextValue {
  /** Call when an /api/admin request returns 401; shows the login form again. */
  markLoggedOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({ markLoggedOut: () => {} });

export function useAdminAuth(): AdminAuthContextValue {
  return useContext(AdminAuthContext);
}

interface AdminLoginGateProps {
  /** A cheap GET under /api/admin that returns 401 when logged out. */
  probeUrl: string;
  /** Shown above the login form. */
  title?: string;
  children: ReactNode;
}

/**
 * The admin session cookie is scoped to /api/admin, so pages can't read it.
 * This probes a gated endpoint and shows an inline login form on 401. If the
 * session expires after the page has loaded, the form appears as an overlay
 * so the children keep their state (e.g. unsaved edits).
 */
export default function AdminLoginGate({ probeUrl, title = 'Admin Login', children }: AdminLoginGateProps) {
  const [auth, setAuth] = useState<AuthState>('checking');
  const [everIn, setEverIn] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(probeUrl)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setAuth('out');
        } else {
          setAuth('in');
          setEverIn(true);
        }
      })
      .catch(() => {
        if (!cancelled) setAuth('unreachable');
      });
    return () => {
      cancelled = true;
    };
  }, [probeUrl, attempt]);

  const markLoggedOut = useCallback(() => setAuth('out'), []);

  const handleLoggedIn = useCallback(() => {
    setAuth('in');
    setEverIn(true);
  }, []);

  if (auth === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500">Checking session...</div>
      </div>
    );
  }

  if (auth === 'unreachable') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <p className="text-gray-700 mb-4">Couldn&apos;t reach the server. Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setAuth('checking');
              setAttempt((n) => n + 1);
            }}
            className="px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (auth === 'out' && !everIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <LoginCard title={title} onLoggedIn={handleLoggedIn} />
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ markLoggedOut }}>
      {children}
      {auth === 'out' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
        >
          <LoginCard
            title="Session expired"
            subtitle="Log in again to keep working. Your changes on this page are still here."
            onLoggedIn={handleLoggedIn}
          />
        </div>
      )}
    </AdminAuthContext.Provider>
  );
}

function LoginCard({
  title,
  subtitle,
  onLoggedIn,
}: {
  title: string;
  subtitle?: string;
  onLoggedIn: () => void;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword('');
        onLoggedIn();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch {
      setError('Unable to verify password. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
      <h1 id="admin-login-title" className={`text-2xl font-bold text-gray-900 text-center ${subtitle ? 'mb-2' : 'mb-6'}`}>
        {title}
      </h1>
      {subtitle && <p className="text-sm text-gray-600 text-center mb-6">{subtitle}</p>}
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="admin-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
            placeholder="Enter admin password"
            autoComplete="current-password"
            autoFocus
          />
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded border-gray-300 text-sage-600 focus:ring-sage-500"
            />
            Show password
          </label>
        </div>
        <button
          type="submit"
          disabled={loggingIn || !password}
          className="w-full bg-sage-600 text-white py-2 px-4 rounded-md hover:bg-sage-700 font-medium disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2"
        >
          {loggingIn ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
