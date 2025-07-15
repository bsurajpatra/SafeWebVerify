import React, { useState } from "react";
import "./ForgotPassword.css";
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  return (
    <div className="forgot-container">
      <form className="forgot-card" onSubmit={e => e.preventDefault()}>
        <h2 className="forgot-title">Forgot Password</h2>
        <div className="forgot-field">
          <label htmlFor="forgot-email">Email</label>
          <input
            type="email"
            id="forgot-email"
            name="email"
            placeholder="you@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <button className="forgot-btn" type="submit">Send Reset Link</button>
        <button type="button" className="back-home-btn" onClick={() => navigate('/login')}>Back to Login</button>
      </form>
    </div>
  );
};

export default ForgotPassword; 