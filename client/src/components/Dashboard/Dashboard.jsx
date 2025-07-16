import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [url, setUrl] = useState("");
  const [urlMsg, setUrlMsg] = useState("");
  const [urlResult, setUrlResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    setUrlResult(null);
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/auth/check-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error checking URL');
      setUrlResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-full-container">
      <header className="dashboard-header">
        <div className="dashboard-title">SafeWebVerify</div>
        <div className="dashboard-avatar-section" ref={dropdownRef}>
          <div
            className="dashboard-avatar"
            onClick={() => setDropdownOpen((open) => !open)}
            tabIndex={0}
          >
            <span role="img" aria-label="User" style={{ fontSize: '2rem', lineHeight: 1 }}>
              👤
            </span>
          </div>
          {dropdownOpen && (
            <div className="dashboard-dropdown">
              <button onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>Profile</button>
              <button onClick={() => { setDropdownOpen(false); navigate('/history'); }}>History</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>
      <main className="dashboard-main-content">
        <form className="dashboard-url-form" onSubmit={handleUrlSubmit}>
          <label htmlFor="url-input" className="dashboard-url-label">Enter the URL to check:</label>
          <input
            id="url-input"
            className="dashboard-url-input"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
            autoComplete="off"
          />
          {urlResult && (
            <div className={`dashboard-url-result ${
              urlResult.label === 'Phishing' ? 'phishing' :
              /suspicious|unknown/i.test(urlResult.label) ? 'suspicious' :
              'legitimate'
            }`}>
              <strong>Result:</strong> {urlResult.label} <br />
              <strong>Confidence:</strong> {(urlResult.confidence * 100).toFixed(2)}%
            </div>
          )}
          <button className="dashboard-url-check-btn" type="submit" disabled={loading}>{loading ? 'Checking...' : 'Check'}</button>
        </form>
        <div className="dashboard-url-warning">
          ⚠️ Please do not enter shortened URLs (e.g., bit.ly, tinyurl, etc.). Only full destination URLs are allowed.
        </div>
        {error && <div className="dashboard-url-error">{error}</div>}
      </main>
    </div>
  );
};

export default Dashboard; 