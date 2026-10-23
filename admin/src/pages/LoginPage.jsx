import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your admin email address.');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setLoading(false);
      return;
    }

    try {
      await login(trimmedEmail, password);
    } catch (err) {
      if (err.message === 'Access denied. Admin only.') {
        setError('Access denied. This portal is strictly for administrator accounts.');
      } else if (!err.response && (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK')) {
        setError('Unable to reach the backend server. Please verify the API is running at http://localhost:5000.');
      } else {
        setError(err.response?.data?.message || err.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIconWrapper}>
            <span className={styles.logoIcon}>🌊</span>
          </div>
          <h1 className={styles.logoTitle}>Ocean Connect</h1>
          <p className={styles.logoSub}>Maritime Administration Portal</p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Admin Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@kadalthunai.gov.in"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Ocean Connect'}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>Ocean Connect · Marine Resource Management Platform</p>
          <p className={styles.footerSub}>Secured with Role-Based Access Control</p>
        </div>
      </div>
    </div>
  );
}
