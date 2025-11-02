import React, { useState, useEffect } from 'react';
import { officerAPI } from '../../utils/api';
import { toast } from 'react-toastify';

/*
  UI/UX Enhancement: This component is now styled by OfficerDashboard.css.
  - The filters (.equipment-header) are cleaner.
  - The equipment items are styled as modern cards (.equipment-card).
  - The grid layout is responsive (.equipment-grid).
  - The modal form is completely restyled for a professional look.
*/

const RequestEquipment = ({ onRequestSubmitted }) => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchEquipment();
  }, [currentPage, categoryFilter, searchTerm]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getInventory({
        page: currentPage,
        limit: 12,
        category: categoryFilter,
        search: searchTerm,
        status: 'Available'
      });

      if (response.data.success) {
        setEquipment(response.data.data.equipment);
        setCategories(response.data.data.categories || []);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEquipment = (equipmentItem) => {
    setSelectedEquipment(equipmentItem);
    setShowRequestModal(true);
  };

  if (loading) {
    return (
      /* UI/UX Enhancement: Styled by .loading-container */
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading available equipment...</p>
      </div>
    );
  }

  return (
    <div className="request-equipment">
      {/* UI/UX Enhancement: Styled by .equipment-header & .search-filters */}
      <div className="equipment-header">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-control"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="equipment-count">
          {equipment.length} equipment available
        </div>
      </div>

      {equipment.length === 0 ? (
        /* UI/UX Enhancement: Styled by .no-data */
        <div className="no-data">
          <p>No equipment available for request.</p>
        </div>
      ) : (
        <>
          {/* UI/UX Enhancement: Styled by .equipment-grid */}
          <div className="equipment-grid">
            {equipment.map((item) => (
              <EquipmentCard
                key={item._id}
                equipment={item}
                onRequest={handleRequestEquipment}
              />
            ))}
          </div>

          {totalPages > 1 && (
            /* UI/UX Enhancement: Styled by .pagination */
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

      {showRequestModal && selectedEquipment && (
        <RequestModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedEquipment(null);
          }}
          onSuccess={() => {
            fetchEquipment();
            if (onRequestSubmitted) onRequestSubmitted();
          }}
        />
      )}
    </div>
  );
};

/*
  UI/UX Enhancement: This component is now styled by .equipment-card 
  in the CSS file, including hover animations, structured content,
  and themed buttons/badges.
*/
const EquipmentCard = ({ equipment, onRequest }) => {
  return (
    <div className="equipment-card">
      <div className="equipment-info">
        <h4>{equipment.name}</h4>
        <p className="equipment-model">{equipment.model}</p>
        <div className="equipment-details">
          <span className="equipment-category">{equipment.category}</span>
          <span className="equipment-serial">SN: {equipment.serialNumber}</span>
        </div>
        <div className="equipment-meta">
          {/* UI/UX Enhancement: Styled by .condition-badge */}
          <span className={`condition-badge condition-${equipment.condition.toLowerCase()}`}>
            {equipment.condition}
          </span>
          <span className="location">{equipment.location}</span>
        </div>
      </div>
      <div className="equipment-actions">
        {/* UI/UX Enhancement: Styled by .btn */}
        <button
          onClick={() => onRequest(equipment)}
          className="btn btn-primary btn-sm"
        >
          Request Equipment
        </button>
      </div>
    </div>
  );
};

/*
  UI/UX Enhancement: This modal is now fully styled by the CSS:
  - .modal-overlay, .modal-content, .modal-header
  - .equipment-summary for the top section
  - .form-group, .form-label, .form-control for inputs
  - .form-row for the 2-column layout
  - .modal-actions for the styled footer
*/
const RequestModal = ({ equipment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: '',
    priority: 'Medium',
    expectedReturnDate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await officerAPI.createRequest({
        equipmentId: equipment._id,
        requestType: 'Issue',
        ...formData
      });
      toast.success('Equipment request submitted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Request Equipment</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {/* UI/UX Enhancement: Styled by .equipment-summary */}
        <div className="equipment-summary">
          <h4>{equipment.name}</h4>
          <p>{equipment.model} - {equipment.serialNumber}</p>
          <p>Category: {equipment.category}</p>
          <p>Location: {equipment.location}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Reason for Request</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="Please explain why you need this equipment..."
              required
            />
          </div>

          {/* UI/UX Enhancement: Styled by .form-row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Expected Return Date</label>
              <input
                type="date"
                name="expectedReturnDate"
                value={formData.expectedReturnDate}
                onChange={handleChange}
                className="form-control"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* UI/UX Enhancement: Styled by .modal-actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestEquipment;