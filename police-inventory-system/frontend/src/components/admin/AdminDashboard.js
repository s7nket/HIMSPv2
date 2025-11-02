import React, { useState, useEffect } from 'react';
import Navigation from '../common/Navigation';
import UserManagement from './UserManagement';
import EquipmentManagement from './EquipmentManagement';
import ProcessRequests from './ProcessRequests';
import ReportsPage from './ReportsPage';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';
// UI/UX Enhancement: The CSS file is the primary source of the new design.
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const sections = [
    'dashboard',
    'userManagement',
    'equipmentManagement',
    'processRequests',
    'reports'
  ];

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeSection]);

  const fetchDashboardData = async () => {
    /* UI/UX Enhancement: The 'loading' state is now styled 
      globally via .loading-state in AdminDashboard.css.
      Toast notifications are also styled via the new theme.
    */
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMainContent = () => {
    if (loading && activeSection === 'dashboard') {
      return (
        /* UI/UX Enhancement: This component is now styled by .loading-state */
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading dashboard...</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <DashboardStats data={dashboardData} />;
      case 'userManagement':
        return <UserManagement />;
      case 'equipmentManagement':
        return <EquipmentManagement />;
      case 'processRequests':
        return <ProcessRequests />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <DashboardStats data={dashboardData} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <Navigation 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sections={sections}
      />

      <div className="main-content">
        <div className="content-header">
          {/* UI/UX Enhancement: Header is styled by .content-header in CSS */}
          <h1>{formatSectionTitle(activeSection)}</h1>
        </div>

        <div className="content-body">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

const DashboardStats = ({ data }) => {
  if (!data) return null;

  /* UI/UX Enhancement: The .stats-grid and .dashboard-card styles 
    in the CSS have been refactored with theme variables for a 
    clean, consistent, and modern appearance.
  */
  return (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <StatCard
          // UI/UX Enhancement: Replaced broken icon '則' with emoji.
          icon="👥"
          title="Total Users"
          value={data.stats.totalUsers}
          subtitle={`${data.stats.totalOfficers} officers`}
          color="blue"
        />

        <StatCard
          // UI/UX Enhancement: Replaced broken icon '肌' with emoji.
          icon="🛡️"
          title="Total Equipment"
          value={data.stats.totalEquipment}
          subtitle={`${data.stats.availableEquipment} available`}
          color="green"
        />

        <StatCard
          // UI/UX Enhancement: Replaced broken icon '搭' with emoji.
          icon="⏳"
          title="Pending Requests"
          value={data.stats.pendingRequests}
          subtitle={`${data.stats.requestsThisMonth} this month`}
          color="orange"
          urgent={data.stats.pendingRequests > 10}
        />

        <StatCard
          // UI/UX Enhancement: Replaced broken icon '豆' with emoji.
          icon="📤"
          title="Issued Equipment"
          value={data.stats.issuedEquipment}
          subtitle="Currently in use"
          // UI/UX Enhancement: Changed 'purple' to 'primary' to match new theme.
          color="primary"
        />
      </div>

      <div className="dashboard-sections">
        {data.equipmentCategories && data.equipmentCategories.length > 0 && (
          <div className="dashboard-card">
            <h3>Equipment Categories</h3>
            {/* UI/UX Enhancement: .category-grid now styled from CSS */}
            <div className="category-grid">
              {data.equipmentCategories.map((category) => (
                <div key={category._id} className="category-item">
                  <span className="category-name">{category._id}</span>
                  <span className="category-count">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.recentRequests && data.recentRequests.length > 0 && (
          <div className="dashboard-card">
            <h3>Recent Requests</h3>
            <div className="recent-requests">
              {data.recentRequests.map((request) => (
                <div key={request._id} className="request-item">
                  <div className="request-info">
                    <div className="request-title">
                      {request.equipmentId?.name}
                    </div>
                    <div className="request-meta">
                      {/* UI/UX Enhancement: Replaced broken '窶｢' character with a standard '•' separator. */}
                      {request.requestedBy?.firstName} {request.requestedBy?.lastName} • {request.requestType}
                    </div>
                  </div>
                  <div className="request-status">
                    {/* UI/UX Enhancement: All status badges are now styled from CSS */}
                    <span className={`status-badge status-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                    <span className="request-date">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* UI/UX Enhancement: .stat-card and its variants are refactored in CSS */
const StatCard = ({ icon, title, value, subtitle, color, urgent }) => (
  <div className={`stat-card ${color} ${urgent ? 'urgent' : ''}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-subtitle">{subtitle}</div>
    </div>
  </div>
);

const formatSectionTitle = (section) => {
  const titles = {
    dashboard: 'Dashboard Overview',
    userManagement: 'User Management',
    equipmentManagement: 'Equipment Management',
    processRequests: 'Process Requests',
    reports: 'Reports & Analytics'
  };
  return titles[section] || section;
};

export default AdminDashboard;