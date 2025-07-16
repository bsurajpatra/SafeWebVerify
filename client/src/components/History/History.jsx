import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./History.css";

const History = () => {                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetch("/api/auth/history", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : res.json().then(data => { throw new Error(data.message || "Failed to fetch history"); }))
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="dashboard-full-container">
      <header className="dashboard-header">
        <button className="profile-back-btn" onClick={() => navigate('/dashboard')} aria-label="Back to Dashboard">←</button>
        <div className="dashboard-title" onClick={() => navigate("/")}>SafeWebVerify</div>
      </header>
      <main className="dashboard-main-content">
        <h2>History</h2>
        {loading ? (
          <div className="dashboard-url-result suspicious">Loading history...</div>
        ) : error ? (
          <div className="dashboard-url-error">{error}</div>
        ) : history.length === 0 ? (
          <div className="dashboard-url-result suspicious">No history found.</div>
        ) : (
          <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 2px 16px rgba(37,99,235,0.10)' }}>
              <thead>
                <tr style={{ background: '#e0e7ef' }}>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>URL</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e0e7ef' }}>
                    <td style={{ padding: '0.9rem 1rem', wordBreak: 'break-all', textAlign: 'center' }}>{item.url}</td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>{new Date(item.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      <span className={`dashboard-url-result ${item.result === 'Phishing' ? 'phishing' : /suspicious|unknown/i.test(item.result) ? 'suspicious' : 'legitimate'}`} style={{ display: 'inline-block', minWidth: 90, padding: '0.3rem 0.7rem', fontSize: '1rem', fontWeight: 600, margin: 0, boxShadow: 'none', borderRadius: '0.7rem' }}>{item.result}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default History; 