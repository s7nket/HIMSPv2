import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
/*
  UI/UX Enhancement: This component is styled by Login.css.
  Enhancements include:
  - Use of CSS variables for a consistent theme (colors, spacing, shadows).
  - A clean, professional card-based layout on a light background.
  - Modernized form inputs with clear focus rings.
  - An animated, interactive primary button with hover/active states.
  - A themed spinner inside the button during loading.
  - Fully responsive design for mobile and tablet.
*/
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
    // UI/UX Enhancement: .login-container is styled by Login.css
    <div className="login-container">
      {/* UI/UX Enhancement: .login-card provides the modern card UI */}
      <div className="login-card">
        <div className="login-header">
          <h1>Police Inventory System</h1>
          <p>{isRegistering ? 'Create Account' : 'Sign In'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <>
              {/* UI/UX Enhancement: .form-row creates a responsive grid */}
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="firstName"
                    // UI/UX Enhancement: .form-control is styled by Login.css
                    className="form-control"
                    value={formData.firstName}
                    onChange={handleChange}
                    required={isRegistering}
                    placeholder="First Name"
                  />
                </div>
                <div className="form-group">
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

              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required={isRegistering}
                placeholder="Email Address"
              />

              <div className="form-row">
                <div className="form-group">
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

          <input
            type="text"
            name="username"
            className="form-control"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder={isRegistering ? "Username" : "Username or Email"}
          />

          <input
            type="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Password"
            minLength={isRegistering ? "6" : undefined}
          />

          <button
            type="submit"
            // UI/UX Enhancement: .btn-primary is the main interactive button
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                {/* UI/UX Enhancement: .spinner is styled in Login.css */}
                <span className="spinner"></span>
                {isRegistering ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* UI/UX Enhancement: .auth-switch provides a clean footer link */}
        <div className="auth-switch">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            className="switch-btn"
            onClick={switchMode}
          >
            {isRegistering ? 'Sign In' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;