import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [url, setUrl] = useState("");
  const [urlMsg, setUrlMsg] = useState("");

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
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>
      <main className="dashboard-main-content">
        <form className="dashboard-url-form" onSubmit={e => e.preventDefault()}>
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
        </form>
        <div className="dashboard-url-warning">
          ⚠️ Please do not enter shortened URLs (e.g., bit.ly, tinyurl, etc.). Only full destination URLs are allowed.
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 