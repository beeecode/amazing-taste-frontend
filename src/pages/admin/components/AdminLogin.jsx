import { useState } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '../../../components/common/Logo';
import { authService } from '../../../services/authService';

export default function AdminLogin({ onLogin, showNotice, loading = false }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProcessing = loading || isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = form.username.trim();
    if (!username || !form.password.trim()) {
      setError('Enter your username and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const loggedIn = await onLogin(username, form.password);
      if (!loggedIn) {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError(authService.getLoginErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <motion.form
        className="admin-login-card"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Logo className="admin-login-logo" />
        <div>
          <h1>Admin Login</h1>
          <p>Secure admin access for managing restaurant orders and menu.</p>
        </div>
        <label className="admin-form-field">
          <span>Username</span>
          <input
            autoComplete="username"
            disabled={isProcessing}
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            placeholder="Enter username"
          />
        </label>
        <label className="admin-form-field">
          <span>Password</span>
          <input
            autoComplete="current-password"
            disabled={isProcessing}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Enter password"
            type="password"
          />
        </label>
        {error && <p className="admin-error-text" role="alert">{error}</p>}
        <button className="admin-primary-button" type="submit" disabled={isProcessing} aria-busy={isProcessing}>
          {isProcessing ? 'Logging in...' : 'Login'}
        </button>
        <button
          className="admin-link-button"
          type="button"
          disabled={isProcessing}
          onClick={() =>
            showNotice(
              'Password Reset',
              'Password reset flow will be connected with the backend later.'
            )
          }
        >
          Forgot password?
        </button>
      </motion.form>
    </main>
  );
}
