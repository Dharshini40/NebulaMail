import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const ERROR_MESSAGES = {
  oauth: 'Google sign-in failed. Please try again.',
  denied: 'You declined the sign-in. You can try again anytime.',
  state: 'Your sign-in session expired. Please try again.',
  config: 'Google sign-in is not configured on the server yet.'
};

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  const query = new URLSearchParams(useLocation().search);
  const error = query.get('error');

  useEffect(() => {
    if (query.get('login') === 'success') {
      navigate('/inbox', { replace: true });
    }
  }, [query, navigate]);

  if (loading) return null;

  if (user) return <Navigate to="/inbox" replace />;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">N</div>
          <h1 className="login-title">Nebula KnowLab</h1>
          <p className="login-subtitle">
            AI-powered mail. Control your inbox with natural language.
          </p>
        </div>

        {error && (
          <div className="login-error">
            {ERROR_MESSAGES[error] || 'Google sign-in failed. Please try again.'}
          </div>
        )}

        <a
          href={api.auth.google()}
          onClick={() => setRedirecting(true)}
          className="login-button"
        >
          {redirecting ? (
            <span className="login-spinner" />
          ) : (
            <GoogleIcon />
          )}
          {redirecting ? 'Redirecting to Google...' : 'Continue with Google'}
        </a>

        <p className="login-note">
          Sign in with Google to access your Gmail inbox. The application only
          uses read, send and modify scopes for the features you request.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <span className="login-button-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.66v3h3.86c2.26-2.09 3.56-5.17 3.56-8.9z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29a7.21 7.21 0 0 1 0-4.58V6.62H1.29a12.02 12.02 0 0 0 0 10.76l3.98-3.09z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
    </span>
  );
}