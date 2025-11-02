import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../utils/api';
import { toast } from 'react-toastify';

/*
  UI/UX Enhancement: This component is now styled by AdminDashboard.css.
  - Filters (.search-filters) and create button (.btn-primary) are themed.
  - The table (.equipment-table) is more professional.
  - Badges (.badge) for Status and Condition are now properly styled.
  - The "Add New Equipment" modal is significantly enhanced.
*/

const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const categories = [
    'Weapons', 'Communication', 'Protective Gear', 'Vehicles',
    'Surveillance', 'Forensic Equipment', 'Medical Supplies', 'Office Equipment', 'Other'
  ];

  useEffect(() => {
    fetchEquipment();
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await equipmentAPI.getEquipment({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter
      });

      if (response.data.success) {
        setEquipment(response.data.data.equipment);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    try {
      await equipmentAPI.deleteEquipment(equipmentId);
      toast.success('Equipment deleted successfully');
      fetchEquipment();
    } catch (error) {
      toast.error('Failed to delete equipment');
    }
  };

  if (loading) {
    return (
      /* UI/UX Enhancement: Styled by .loading-container from CSS */
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading equipment...</p>
      </div>
    );
  }

  return (
    <div className="equipment-management">
      <div className="management-header">
        {/* UI/UX Enhancement: Styled by .search-filters and .form-control */}
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
          >
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="Issued">Issued</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
        {/* UI/UX Enhancement: Styled by .btn and .btn-primary */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          Add New Equipment
        </button>
      </div>

      {equipment.length === 0 ? (
        /* UI/UX Enhancement: Styled by .no-data from CSS */
        <div className="no-data">
          <p>No equipment found.</p>
        </div>
      ) : (
        <>
          {/* UI/UX Enhancement: Styled by .equipment-table and .table */}
          <div className="equipment-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Model</th>
                  <th>Serial Number</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.name}</strong>
                      <br />
                      <small>{item.manufacturer}</small>
                    </td>
                    <td>{item.model}</td>
                    <td>{item.serialNumber}</td>
                    <td>{item.category}</td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .badge and .badge-x */}
                      <span className={`badge badge-${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .badge and .badge-x */}
                      <span className={`badge badge-${getConditionBadgeClass(item.condition)}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td>{item.location}</td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .action-buttons and .btn */}
                      <div className="action-buttons">
                        <button
                          onClick={() => handleDeleteEquipment(item._id)}
                          className="btn btn-danger btn-sm"
                          disabled={item.status === 'Issued'}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
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

      {showCreateModal && (
        <CreateEquipmentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchEquipment}
          categories={categories}
        />
      )}
    </div>
  );
};

/*
  UI/UX Enhancement: This modal component is now styled by:
  - .modal-overlay, .modal-content (with larger max-width), .modal-header
  - .form-row (now a 2-column grid)
  - .form-group, .form-label, .form-control
  - .modal-actions (now a themed footer)
*/
const CreateEquipmentModal = ({ onClose, onSuccess, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    model: '',
    serialNumber: '',
    manufacturer: '',
    purchaseDate: '',
    cost: '',
    location: '',
    condition: 'Good',
    notes: ''
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
      await equipmentAPI.createEquipment(formData);
      toast.success('Equipment added successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to add equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Equipment</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* UI/UX Enhancement: .form-row creates a grid layout */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-control"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Manufacturer</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cost ($)</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="form-control"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Condition</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="form-control"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-control"
              rows="3"
            />
          </div>

          {/* UI/UX Enhancement: .modal-actions creates a styled footer */}
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
              {loading ? 'Adding...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const getStatusBadgeClass = (status) => {
  const classes = {
    'Available': 'success',
    'Issued': 'warning',
    'Under Maintenance': 'info',
    'Retired': 'danger'
  };
  return classes[status] || 'secondary';
};

const getConditionBadgeClass = (condition) => {
  const classes = {
    'Excellent': 'success',
    'Good': 'info',
    'Fair': 'warning',
    'Poor': 'danger'
  };
  return classes[condition] || 'secondary';
};

export default EquipmentManagement;