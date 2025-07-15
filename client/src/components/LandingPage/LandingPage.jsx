import React from "react";
import "./LandingPage.css";

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>Welcome to SafeWebVerify</h1>
        <p>Your trusted partner in web safety and verification.</p>
        <button className="landing-btn" onClick={onGetStarted}>Get Started</button>
      </header>
      <section className="landing-features">
        <div className="feature-card">
          <h2>Fast & Secure</h2>
          <p>Instantly verify websites with top-notch security protocols.</p>
        </div>
        <div className="feature-card">
          <h2>Easy to Use</h2>
          <p>User-friendly interface for seamless experience.</p>
        </div>
        <div className="feature-card">
          <h2>Trusted Results</h2>
          <p>Reliable and accurate verification every time.</p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 