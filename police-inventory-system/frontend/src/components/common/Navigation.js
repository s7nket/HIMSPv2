import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
/*
  UI/UX Enhancement: This component is styled by Navigation.css.
  Enhancements include:
  - A modern, solid dark theme (var(--nav-bg)) for a professional look.
  - Clear 'active' state highlighting using theme primary color.
  - An interactive, danger-themed logout button (var(--color-danger)).
  - Smooth hover transitions on all navigation items.
  - Improved typography and spacing in the header.
*/
import './Navigation.css';

const Navigation = ({ activeSection, setActiveSection, sections }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatSectionName = (section) => {
    return section
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    // UI/UX Enhancement: .navigation is the main styled sidebar
    <nav className="navigation">
      <div className="nav-header">
        <h2>Police Inventory</h2>
        <div className="user-info">
          <span className="user-name">{user?.fullName || user?.username}</span>
          <span className="user-role">{user?.role}</span>
        </div>
      </div>

      <div className="nav-menu">
        {sections.map((section) => (
          <button
            key={section}
            // UI/UX Enhancement: .nav-item and .active classes are styled
            className={`nav-item ${activeSection === section ? 'active' : ''}`}
            onClick={() => setActiveSection(section)}
          >
            {formatSectionName(section)}
          </button>
        ))}
      </div>

      <div className="nav-footer">
        {/* UI/UX Enhancement: .logout-btn is styled as a danger action */}
        <button className="nav-item logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;