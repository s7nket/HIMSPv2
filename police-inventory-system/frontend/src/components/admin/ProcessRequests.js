import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';

/*
  UI/UX Enhancement: This component is now styled by AdminDashboard.css.
  - The filters (.search-filters) are cleaner.
  - The table (.requests-table) is more professional.
  - The loading state (.loading-container) is themed.
  - Pagination (.pagination) is restyled.
  - Badges (.badge) are now styled with modern, readable colors.
*/

const ProcessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [currentPage, statusFilter, typeFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRequests({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        requestType: typeFilter
      });

      if (response.data.success) {
        setRequests(response.data.data.requests);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    const notes = prompt('Add notes for approval (optional):');

    try {
      await adminAPI.approveRequest(requestId, { notes: notes || '' });
      toast.success('Request approved successfully');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Please provide a reason for rejection:');

    if (!reason) {
      toast.error('Reason for rejection is required');
      return;
    }

    try {
      await adminAPI.rejectRequest(requestId, { reason });
      toast.success('Request rejected successfully');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  if (loading) {
    return (
      /* UI/UX Enhancement: Styled by .loading-container from CSS */
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="process-requests">
      <div className="management-header">
        {/* UI/UX Enhancement: Styled by .search-filters and .form-control */}
        <div className="search-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-control"
          >
            <option value="">All Types</option>
            <option value="Issue">Issue</option>
            <option value="Return">Return</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
        <div className="stats-summary">
          <span>Showing {requests.length} requests</span>
        </div>
      </div>

      {requests.length === 0 ? (
        /* UI/UX Enhancement: Styled by .no-data from CSS */
        <div className="no-data">
          <p>No requests found.</p>
        </div>
      ) : (
        <>
          {/* UI/UX Enhancement: Styled by .requests-table and .table */}
          <div className="requests-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Officer</th>
                  <th>Equipment</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <RequestRow
                    key={request._id}
                    request={request}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* UI/UX Enhancement: Styled by .pagination from CSS */}
          {totalPages > 1 && (
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
  );
};

/*
  UI/UX Enhancement: This sub-component benefits from:
  - .btn-link style for the expandable request ID.
  - .badge styles for priority and status.
  - .action-buttons styles for button layout.
  - .request-details style for the expanded row content.
*/
const RequestRow = ({ request, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr>
        <td>
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-link"
          >
            {request.requestId}
          </button>
        </td>
        <td>
          <div>
            <strong>{request.requestedBy?.firstName} {request.requestedBy?.lastName}</strong>
            <br />
            <small>Badge: {request.requestedBy?.badgeNumber}</small>
          </div>
        </td>
        <td>
          <div>
            <strong>{request.equipmentId?.name}</strong>
            <br />
            <small>{request.equipmentId?.model} - {request.equipmentId?.serialNumber}</small>
          </div>
        </td>
        <td>{request.requestType}</td>
        <td>
          {/* UI/UX Enhancement: Styled by .badge and .badge-x from CSS */}
          <span className={`badge badge-${getPriorityBadgeClass(request.priority)}`}>
            {request.priority}
          </span>
        </td>
        <td>{new Date(request.requestedDate).toLocaleDateString()}</td>
        <td>
          {/* UI/UX Enhancement: Styled by .badge and .badge-x from CSS */}
          <span className={`badge badge-${getStatusBadgeClass(request.status)}`}>
            {request.status}
          </span>
        </td>
        <td>
          {request.status === 'Pending' && (
            /* UI/UX Enhancement: Styled by .action-buttons and .btn from CSS */
            <div className="action-buttons">
              <button
                onClick={() => onApprove(request._id)}
                className="btn btn-success btn-sm"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(request._id)}
                className="btn btn-danger btn-sm"
              >
                Reject
              </button>
            </div>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          {/* UI/UX Enhancement: Styled by .request-details from CSS */}
          <td colSpan="8">
            <div className="request-details">
              <div className="detail-section">
                <h4>Request Details</h4>
                <p><strong>Reason:</strong> {request.reason}</p>
                {request.expectedReturnDate && (
                  <p><strong>Expected Return:</strong> {new Date(request.expectedReturnDate).toLocaleDateString()}</p>
                )}
                {request.adminNotes && (
                  <p><strong>Admin Notes:</strong> {request.adminNotes}</p>
                )}
                {request.processedBy && (
                  <p><strong>Processed By:</strong> {request.processedBy.firstName} {request.processedBy.lastName}</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const getStatusBadgeClass = (status) => {
  const classes = {
    'Pending': 'warning',
    'Approved': 'success',
    'Rejected': 'danger',
    'Completed': 'info',
    'Cancelled': 'secondary'
  };
  return classes[status] || 'secondary';
};

const getPriorityBadgeClass = (priority) => {
  const classes = {
    'Low': 'info',
    'Medium': 'warning',
    'High': 'danger',
    'Urgent': 'danger'
  };
  return classes[priority] || 'secondary';
};

export default ProcessRequests;