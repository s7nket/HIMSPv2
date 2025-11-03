import React, { useState, useEffect } from 'react';
import Navigation from '../common/Navigation';
import RequestEquipment from './RequestEquipment';
import ViewInventory from './ViewInventory';
import ReturnEquipment from './ReturnEquipment';
import { officerAPI } from '../../utils/api';
import { toast } from 'react-toastify';
// UI/UX Enhancement: The CSS file is the primary source of the new design.
import './OfficerDashboard.css';

const OfficerDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const sections = [
    'dashboard',
    'requestEquipment',
    'viewInventory',
    'returnEquipment',
    'myRequests'
  ];

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeSection]);

  const fetchDashboardData = async () => {
    /* UI/UX Enhancement: The 'loading' state is now styled 
      globally via .loading-state in OfficerDashboard.css.
      Toast notifications are also styled via the new theme.
    */
    try {
      setLoading(true);
      const response = await officerAPI.getDashboard();
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
        return <OfficerDashboardStats data={dashboardData} />;
      case 'requestEquipment':
        return <RequestEquipment onRequestSubmitted={fetchDashboardData} />;
      case 'viewInventory':
        return <ViewInventory />;
      case 'returnEquipment':
        return <ReturnEquipment onEquipmentReturned={fetchDashboardData} />;
      case 'myRequests':
        return <MyRequests />;
      default:
        return <OfficerDashboardStats data={dashboardData} />;
    }
  };

  return (
    // UI/UX Enhancement: Root class .officer-dashboard is styled in CSS
    <div className="officer-dashboard">
      <Navigation 
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sections={sections}
      />

      <div className="main-content">
        {/* UI/UX Enhancement: Header is styled by .content-header in CSS */}
        <div className="content-header">
          <h1>{formatSectionTitle(activeSection)}</h1>
        </div>

        {/* UI/UX Enhancement: Body is styled by .content-body in CSS */}
        <div className="content-body">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

const OfficerDashboardStats = ({ data }) => {
  if (!data) return null;

  /* UI/UX Enhancement: The .stats-grid, .stat-card, and .dashboard-card 
    styles in the CSS have been refactored with theme variables for a 
    clean, consistent, and modern appearance with hover animations.
  */
  return (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <StatCard
          icon="📋"
          title="My Requests"
          value={data.stats.myRequests}
          subtitle={`${data.stats.pendingRequests} pending`}
          color="blue"
          urgent={data.stats.pendingRequests > 5}
        />

        <StatCard
          icon="🔧"
          title="Equipment Issued"
          value={data.stats.myIssuedEquipment}
          subtitle="Currently with me"
          color="purple"
        />

        <StatCard
          icon="✅"
          title="Available Equipment"
          value={data.stats.availableEquipment}
          subtitle="Ready to request"
          color="green"
        />
      </div>

      {data.recentActivity && data.recentActivity.length > 0 && (
        <div className="dashboard-card">
          <h3>Recent Activity</h3>
          {/* UI/UX Enhancement: .recent-activity and .activity-item 
              are now styled as clean, interactive list items. */}
          <div className="recent-activity">
            {data.recentActivity.map((request) => (
              <div key={request._id} className="activity-item">
                <div className="activity-info">
                  <div className="activity-title">
                    {request.equipmentId?.name}
                  </div>
                  <div className="activity-meta">
                    {request.requestType} • {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="activity-status">
                  {/* UI/UX Enhancement: All status badges are now styled 
                      from CSS (e.g., .status-pending) */}
                  <span className={`status-badge status-${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [currentPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getRequests({
        page: currentPage,
        limit: 10
      });

      if (response.data.success) {
        setRequests(response.data.data.requests);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch requests');
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequestClick = (requestId) => {
    setSelectedRequestId(requestId);
    setShowCancelModal(true);
  };

  const confirmCancelRequest = async () => {
    try {
      await officerAPI.cancelRequest(selectedRequestId);
      toast.success('Request cancelled successfully');
      fetchRequests();
      setShowCancelModal(false);
      setSelectedRequestId(null);
    } catch (error) {
      toast.error('Failed to cancel request');
      console.error('Cancel request error:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-large"></div>
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <>
      {/* UI/UX Enhancement: This component is now styled by .my-requests 
       and features a subtle fade-in animation. */}
      <div className="my-requests">
        {requests.length === 0 ? (
          /* UI/UX Enhancement: .no-data is now a styled card */
          <div className="no-data">
            <h3>No Requests Found</h3>
            <p>You haven't made any equipment requests yet.</p>
          </div>
        ) : (
          <>
            {/* UI/UX Enhancement: .requests-list and .request-card 
                create a clean, modern card-based layout. */}
            <div className="requests-list">
              {requests.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <div className="request-id">{request.requestId}</div>
                    <span className={`status-badge status-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="request-details">
                    <h4>{request.equipmentId?.name}</h4>
                    <p className="request-meta">
                      {request.equipmentId?.model} • {request.requestType} • {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    <p className="request-reason">{request.reason}</p>
                  </div>

                  {request.status === 'Pending' && (
                    <div className="request-actions">
                      {/* UI/UX Enhancement: Buttons are styled by .btn */}
                      <button
                        onClick={() => handleCancelRequestClick(request._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              /* UI/UX Enhancement: Pagination is styled by .pagination */
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showCancelModal && (
        <CancelConfirmationModal
          onConfirm={confirmCancelRequest}
          onCancel={() => {
            setShowCancelModal(false);
            setSelectedRequestId(null);
          }}
        />
      )}
    </>
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
    dashboard: 'Officer Dashboard',
    requestEquipment: 'Request Equipment',
    viewInventory: 'Equipment Inventory',
    returnEquipment: 'Return Equipment',
    myRequests: 'My Requests'
  };
  return titles[section] || section;
};

const CancelConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cancel Request</h3>
          <button onClick={onCancel} className="close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to cancel this request?</p>
        </div>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            No
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            Yes, Cancel Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;