import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      console.log('Frontend: Successfully connected to backend for login.');
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 className="login-title">Log In</h2>
        <div className="login-field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="you@email.com" value={form.email} onChange={handleChange} required />
        </div>
        <div className="login-field password-field">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        {error && <div className="login-error">{error}</div>}
        <button className="login-btn" type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</button>
        <div className="login-footer">
          Don't have an account? <a href="#" onClick={e => {e.preventDefault(); navigate('/signup')}}>Sign up</a>
        </div>
        <div className="login-actions-row">
          <button type="button" className="back-home-btn" onClick={() => navigate('/')}>Back to Home</button>
          <button type="button" className="back-home-btn" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
        </div>
      </form>
    </div>
  );
};

export default Login; 