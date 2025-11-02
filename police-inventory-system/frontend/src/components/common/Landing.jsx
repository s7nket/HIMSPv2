import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  X as CloseIcon,
  Shield,
  Radar,
  Database,
  BarChart3,
  Grid3x3,
  Search,
  Lock as LockIcon,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (name) => {
    setActiveNav(name);
    setIsMenuOpen(false);

    if (name === 'features') {
      const element = document.getElementById('features-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (name === 'contact') {
      const element = document.getElementById('contact-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (name === 'login') {
      navigate('/login');
    } else if (name === 'admin') {
      navigate('/admin');
    } else if (name === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLearnMoreClick = () => {
    const element = document.getElementById('features-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const featuresData = [
    {
      id: 1,
      icon: Shield,
      title: 'Secure Access Control',
      description: 'Role permissions, SSO, audit logs.'
    },
    {
      id: 2,
      icon: Radar,
      title: 'Real-Time Tracking',
      description: 'Status of firearms, radios, vehicles.'
    },
    {
      id: 3,
      icon: Database,
      title: 'Centralized Records',
      description: 'Chain-of-custody and assignments.'
    },
    {
      id: 4,
      icon: BarChart3,
      title: 'Reports',
      description: 'Compliance and readiness KPIs.'
    },
    {
      id: 5,
      icon: Grid3x3,
      title: 'Admin Dashboard',
      description: 'Manage users, stations, policies.'
    },
    {
      id: 6,
      icon: Search,
      title: 'Search & Filter',
      description: 'Locate items by tag or status.'
    }
  ];

  const statsData = [
    { label: 'Checked-out Items', value: '148' },
    { label: 'Service Due', value: '23' },
    { label: 'Compliance', value: '98.2%' }
  ];

  const chartHeights = [65, 85, 72, 90, 78, 88, 70, 92];

  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your inquiry. We will contact you soon.');
  };

  return (
    <div className="landing-page-wrapper">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar-fixed">
        <div className="navbar-inner">
          <div className="navbar-brand-section">
            <LockIcon size={24} className="brand-icon" strokeWidth={2} />
            <span className="brand-name">Police Inventory</span>
          </div>

          <ul className="navbar-links-desktop">
            <li>
              <button
                className={`nav-link-btn ${activeNav === 'home' ? 'active' : ''}`}
                onClick={() => handleNavClick('home')}
              >
                Home
              </button>
            </li>
            <li>
              <button
                className={`nav-link-btn ${activeNav === 'features' ? 'active' : ''}`}
                onClick={() => handleNavClick('features')}
              >
                Features
              </button>
            </li>
            <li>
              <button
                className={`nav-link-btn ${activeNav === 'login' ? 'active' : ''}`}
                onClick={() => handleNavClick('login')}
              >
                Login
              </button>
            </li>
            <li>
              <button
                className={`nav-link-btn ${activeNav === 'admin' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin')}
              >
                Admin
              </button>
            </li>
            <li>
              <button
                className={`nav-link-btn ${activeNav === 'contact' ? 'active' : ''}`}
                onClick={() => handleNavClick('contact')}
              >
                Contact
              </button>
            </li>
          </ul>

          <button className="menu-toggle-btn" onClick={handleMenuToggle}>
            {isMenuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="navbar-mobile-menu">
            <button onClick={() => handleNavClick('home')} className="mobile-menu-link">Home</button>
            <button onClick={() => handleNavClick('features')} className="mobile-menu-link">Features</button>
            <button onClick={() => handleNavClick('login')} className="mobile-menu-link">Login</button>
            <button onClick={() => handleNavClick('admin')} className="mobile-menu-link">Admin</button>
            <button onClick={() => handleNavClick('contact')} className="mobile-menu-link">Contact</button>
          </div>
        )}
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="hero-section" id="home-section">
        <div className="hero-inner">
          <div className="hero-content-left">
            <h1 className="hero-headline">
              Smart Equipment Management for Law Enforcement
            </h1>
            <p className="hero-paragraph">
              Streamline your inventory. Enhance accountability. Secure your assets with precision.
            </p>
            <div className="hero-button-group">
              <button className="btn-primary" onClick={handleLoginClick}>
                Get Started
                <ArrowRight size={18} />
              </button>
              <button className="btn-secondary" onClick={handleLearnMoreClick}>
                Learn More
              </button>
            </div>
          </div>

          <div className="hero-content-right">
            <div className="hero-image-container">
              <svg
                className="hero-svg-image"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 500 350"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f0f7ff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#e0eaff" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <rect width="500" height="350" rx="28" ry="28" fill="url(#heroGradient)" />
                <g opacity="0.4">
                  <circle cx="100" cy="80" r="35" fill="#3b82f6" opacity="0.6"/>
                  <circle cx="350" cy="200" r="45" fill="#60a5fa" opacity="0.4"/>
                  <circle cx="420" cy="100" r="30" fill="#93c5fd" opacity="0.5"/>
                </g>
                <text x="250" y="280" fontSize="26" fontWeight="600" fill="#1f2937" textAnchor="middle">
                  Police Equipment System
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="features-section" id="features-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-title">Designed for Police Departments</h2>
            <p className="section-subtitle">Everything you need to manage equipment effectively</p>
          </div>

          <div className="features-grid">
            {featuresData.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.id} className="feature-card-item">
                  <div className="feature-icon-box">
                    <IconComponent size={32} className="feature-icon" strokeWidth={1.8} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-text">{feature.description}</p>
                  <div className="feature-arrow">
                    <ArrowRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== OVERVIEW SECTION ===== */}
      <section className="overview-section">
        <div className="section-inner">
          <div className="overview-header">
            <h2 className="section-title">Real-Time Insights</h2>
            <p className="overview-subtitle">Monitor your inventory at a glance</p>
          </div>

          <p className="overview-description">
            Track equipment status, manage assignments, and maintain complete audit trails with our comprehensive platform designed for law enforcement agencies.
          </p>

          <div className="stats-container">
            {statsData.map((stat, index) => (
              <div key={index} className="stat-card-item">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-number">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="chart-card-container">
            <p className="chart-label">Equipment Status Distribution</p>
            <div className="chart-bars-wrapper">
              {chartHeights.map((height, index) => (
                <div
                  key={index}
                  className="chart-bar-item"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section className="contact-section" id="contact-section">
        <div className="section-inner">
          <div className="contact-header">
            <h2 className="section-title">Get in Touch</h2>
            <p className="contact-subtitle">We're here to help your department succeed</p>
          </div>

          <div className="contact-form-card">
            <form className="contact-form" onSubmit={handleFormSubmit}>
              <div className="form-field-group">
                <label className="form-label">Agency Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your agency name"
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="contact@agency.gov"
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="How can we help?"
                  required
                />
              </div>

              <div className="form-field-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  rows="5"
                  placeholder="Tell us about your needs..."
                  required
                />
              </div>

              <div className="security-warning-box">
                <span className="warning-icon">⚠</span> Do not share classified information
              </div>

              <button type="submit" className="btn-primary btn-full-width">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer-section">
        <div className="footer-inner">
          <div className="footer-columns">
            <div className="footer-column">
              <div className="footer-brand">
                <LockIcon size={20} />
                <span>Police Inventory</span>
              </div>
              <p className="footer-text">
                Modern equipment management built for law enforcement agencies seeking precision and accountability.
              </p>
            </div>

            <div className="footer-column">
              <h4 className="footer-title">Product</h4>
              <ul className="footer-list">
                <li><a href="#features" className="footer-link">Features</a></li>
                <li><a href="#pricing" className="footer-link">Pricing</a></li>
                <li><a href="#security" className="footer-link">Security</a></li>
                <li><a href="#docs" className="footer-link">Documentation</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-title">Company</h4>
              <ul className="footer-list">
                <li><a href="#about" className="footer-link">About Us</a></li>
                <li><a href="#contact" className="footer-link">Contact</a></li>
                <li><a href="#privacy" className="footer-link">Privacy</a></li>
                <li><a href="#terms" className="footer-link">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">© 2025 Police Inventory System. Designed for excellence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;