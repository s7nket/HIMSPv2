import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    department: '',
    badgeNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/officer'} replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let result;
    if (isRegistering) {
      result = await register(formData);
    } else {
      result = await login({
        username: formData.username,
        password: formData.password
      });
    }

    setIsLoading(false);
  };

  const switchMode = () => {
    setIsRegistering(!isRegistering);
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      department: '',
      badgeNumber: ''
    });
  };

  return (
    <div className="login-wrapper">
      {/* Navbar */}
      <nav className="login-navbar">
        <div className="navbar-container">
          <div className="logo-container">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="logo-text">Police Inventory</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="login-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            {isRegistering ? 'Create Account' : 'Sign in'}
          </h1>
          <p className="page-subtitle">
            {isRegistering 
              ? 'Set up your department account' 
              : 'Access your department dashboard.'}
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="card-header">
            <h2 className="card-title">
              {isRegistering ? 'New Account' : 'Secure Login'}
            </h2>
            <p className="card-subtitle">
              {isRegistering 
                ? 'Create a new account with your details' 
                : 'Use your official department email.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {isRegistering && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      className="form-control"
                      value={formData.firstName}
                      onChange={handleChange}
                      required={isRegistering}
                      placeholder="First Name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      className="form-control"
                      value={formData.lastName}
                      onChange={handleChange}
                      required={isRegistering}
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required={isRegistering}
                    placeholder="Email Address"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      name="department"
                      className="form-control"
                      value={formData.department}
                      onChange={handleChange}
                      required={isRegistering}
                      placeholder="Department"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Badge Number</label>
                    <input
                      type="text"
                      name="badgeNumber"
                      className="form-control"
                      value={formData.badgeNumber}
                      onChange={handleChange}
                      placeholder="Badge Number (Optional)"
                    />
                  </div>
                </div>
              </>
            )}

            {!isRegistering && (
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <input
                    type="text"
                    name="username"
                    className="form-control with-icon"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="name@agency.gov"
                  />
                </div>
              </div>
            )}

            {isRegistering && (
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Username"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type="password"
                  name="password"
                  className="form-control with-icon"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  minLength={isRegistering ? "6" : undefined}
                />
              </div>
            </div>

            {!isRegistering && (
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className="checkbox-input"
                    defaultChecked={false}
                  />
                  <span>Remember me</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  {isRegistering ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  <span className="btn-arrow">→</span>
                  {isRegistering ? 'Create Account' : 'Sign in'}
                </>
              )}
            </button>
          </form>

          {/* Auth Switch */}
          <div className="auth-switch">
            <span>
              {isRegistering 
                ? 'Already have an account? ' 
                : 'New to Police Inventory? '}
            </span>
            <button
              type="button"
              className="switch-btn"
              onClick={switchMode}
            >
              {isRegistering ? 'Sign In' : 'Create an account'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="login-footer">
        <p className="footer-text">© 2025 Police Inventory. All rights reserved.</p>
        <div className="footer-links">
          <a href="#privacy" className="footer-link">Privacy</a>
          <a href="#terms" className="footer-link">Terms</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;