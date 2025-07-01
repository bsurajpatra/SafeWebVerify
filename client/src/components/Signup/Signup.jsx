import React, { useState } from "react";
import "./Signup.css";
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      console.log('Frontend: Successfully connected to backend for signup.');
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-card" onSubmit={handleSubmit}>
        <h2 className="signup-title">Create Account</h2>
        <div className="signup-field">
          <label htmlFor="name">Name</label>
          <input type="text" id="name" name="name" placeholder="Your Name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="signup-field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="you@email.com" value={form.email} onChange={handleChange} required />
        </div>
        <div className="signup-field password-field">
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
        {error && <div className="signup-error">{error}</div>}
        <button className="signup-btn" type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        <div className="signup-footer">
          Already have an account? <a href="#" onClick={e => {e.preventDefault(); navigate('/login')}}>Log in</a>
        </div>
        <button type="button" className="back-home-btn" onClick={() => navigate('/')}>Back to Home</button>
      </form>
    </div>
  );
};

export default Signup; 