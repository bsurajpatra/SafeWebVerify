import React, { useState, useEffect } from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "", email: "" });
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [msg, setMsg] = useState("");
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const res = await fetch('/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          navigate('/login');
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch profile');
        setUser({ name: data.name, email: data.email });
        setForm({ name: data.name, email: data.email });
      } catch (err) {
        setMsg(err.message);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleEdit = () => setEdit(true);
  const handleCancel = () => { setEdit(false); setForm(user); setMsg(""); };
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = async e => {
    e.preventDefault();
    if (!edit) return;
    setMsg("");
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: form.name, email: form.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      setUser({ name: data.name, email: data.email });
      setEdit(false);
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handlePwChange = e => setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  const handlePwSubmit = e => {
    e.preventDefault();
    setPwMsg("");
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setPwMsg("New passwords do not match.");
      return;
    }
    // TODO: Send password change to backend
    setPwMsg("Password changed successfully!");
    setPwForm({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setMsg("Deleting account...");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const res = await fetch("/api/auth/profile", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete account");
      setMsg("Account deleted successfully. Redirecting...");
      setTimeout(() => {
        localStorage.removeItem("token");
        navigate("/signup");
      }, 1500);
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="profile-full-container">
      <header className="profile-header">
        <button className="profile-back-btn" onClick={() => navigate('/dashboard')} aria-label="Back to Dashboard">←</button>
        <div className="profile-title">Profile</div>
      </header>
      <main className="profile-main-content">
        <div className="profile-card">
          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-field">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} disabled={!edit} className={edit ? "profile-editable" : ""} />
            </div>
            <div className="profile-field">
              <label>Email</label>
              <input name="email" value={form.email} onChange={handleChange} disabled={!edit} className={edit ? "profile-editable" : ""} />
            </div>
            {edit && (
              <div className="profile-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={handleCancel}>Cancel</button>
              </div>
            )}
            {msg && <div className="profile-msg">{msg}</div>}
          </form>
          {!edit && (
            <div className="profile-actions">
              <button type="button" onClick={handleEdit}>Edit</button>
              <button type="button" className="delete-btn" onClick={handleDelete}>Delete Account</button>
            </div>
          )}
          <hr className="profile-divider" />
          <form className="profile-form" onSubmit={handlePwSubmit}>
            <h3>Change Password</h3>
            <div className="profile-field">
              <label>Old Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPw.old ? "text" : "password"}
                  name="oldPassword"
                  value={pwForm.oldPassword}
                  onChange={handlePwChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPw(pw => ({ ...pw, old: !pw.old }))}
                  tabIndex={-1}
                  aria-label={showPw.old ? "Hide password" : "Show password"}
                >
                  {showPw.old ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="profile-field">
              <label>New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPw.new ? "text" : "password"}
                  name="newPassword"
                  value={pwForm.newPassword}
                  onChange={handlePwChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPw(pw => ({ ...pw, new: !pw.new }))}
                  tabIndex={-1}
                  aria-label={showPw.new ? "Hide password" : "Show password"}
                >
                  {showPw.new ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="profile-field">
              <label>Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPw.confirm ? "text" : "password"}
                  name="confirmNewPassword"
                  value={pwForm.confirmNewPassword}
                  onChange={handlePwChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPw(pw => ({ ...pw, confirm: !pw.confirm }))}
                  tabIndex={-1}
                  aria-label={showPw.confirm ? "Hide password" : "Show password"}
                >
                  {showPw.confirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="profile-actions">
              <button type="submit">Change Password</button>
            </div>
            {pwMsg && <div className="profile-msg">{pwMsg}</div>}
          </form>
        </div>
        {showDeleteModal && (
          <div className="profile-modal-backdrop">
            <div className="profile-modal">
              <h3>Delete Account</h3>
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <div className="profile-modal-actions">
                <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="delete-btn" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile; 