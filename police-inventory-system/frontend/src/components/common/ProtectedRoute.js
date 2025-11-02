import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/*
  UI/UX Enhancement: The visual elements rendered by this component
  (loading spinner, access denied card) are now styled in Login.css
  using the new CSS variables for a consistent look and feel.
  - .loading-container & .loading-spinner provide a themed page load.
  - .access-denied-container & .access-denied-card provide a themed error.
*/
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      // UI/UX Enhancement: Styled by .loading-container in Login.css
      <div className="loading-container">
        <div className="loading-spinner">
          {/* UI/UX Enhancement: Styled by .spinner in Login.css */}
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // User doesn't have required role
    return (
      // UI/UX Enhancement: Styled by .access-denied-container in Login.css
      <div className="access-denied-container">
        <div className="access-denied-card">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Your role: <strong>{user.role}</strong></p>
          <p>Required role: <strong>{allowedRoles.join(' or ')}</strong></p>
          <button 
            onClick={() => window.location.href = user.role === 'admin' ? '/admin' : '/officer'}
            // UI/UX Enhancement: Styled by .btn-primary in Login.css
            className="btn btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;