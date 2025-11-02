import React, { useState, useEffect } from 'react';
import { officerAPI } from '../../utils/api';
import { toast } from 'react-toastify';

/*
  UI/UX Enhancement: This component is now styled by OfficerDashboard.css.
  - The filters (.inventory-header) are clean and modern.
  - The data table is now professionally styled (.inventory-table, .table).
  - All status/condition badges (.badge) are themed.
  - The "View Details" modal is now a clean, structured panel.
*/

const ViewInventory = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, [currentPage, categoryFilter, statusFilter, searchTerm]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getInventory({
        page: currentPage,
        limit: 15,
        category: categoryFilter,
        status: statusFilter,
        search: searchTerm
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

  const handleViewDetails = async (equipmentId) => {
    try {
      const response = await officerAPI.getEquipmentDetails(equipmentId);
      if (response.data.success) {
        setSelectedEquipment(response.data.data.equipment);
        setShowDetailsModal(true);
      }
    } catch (error) {
      toast.error('Failed to fetch equipment details');
    }
  };

  if (loading) {
    return (
      /* UI/UX Enhancement: Styled by .loading-container */
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="view-inventory">
      {/* UI/UX Enhancement: Styled by .inventory-header */ }
      <div className="inventory-header">
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
        <div className="inventory-stats">
          {equipment.length} items found
        </div>
      </div>

      {equipment.length === 0 ? (
        /* UI/UX Enhancement: Styled by .no-data */
        <div className="no-data">
          <p>No equipment found matching your criteria.</p>
        </div>
      ) : (
        <>
          {/* UI/UX Enhancement: Styled by .inventory-table & .table */ }
          <div className="inventory-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Serial Number</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Location</th>
                  <th>Issued To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div>
                        <strong>{item.name}</strong>
                        <br />
                        <small>{item.model}</small>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.serialNumber}</td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .badge */ }
                      <span className={`badge badge-${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .badge */ }
                      <span className={`badge badge-${getConditionBadgeClass(item.condition)}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td>{item.location}</td>
                    <td>
                      {item.issuedTo?.userId ? (
                        <div>
                          <strong>{item.issuedTo.userId.firstName} {item.issuedTo.userId.lastName}</strong>
                          <br />
                          <small>Badge: {item.issuedTo.userId.badgeNumber}</small>
                        </div>
                      ) : (
                        'Not Issued'
                      )}
                    </td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .btn */ }
                      <button
                        onClick={() => handleViewDetails(item._id)}
                        className="btn btn-info btn-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {showDetailsModal && selectedEquipment && (
        <EquipmentDetailsModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEquipment(null);
          }}
        />
      )}
    </div>
  );
};

/*
  UI/UX Enhancement: This modal is now styled by:
  - .equipment-details-modal (for custom width)
  - .detail-section (for the gray info boxes)
  - .detail-grid (for the 2-column layout)
*/
const EquipmentDetailsModal = ({ equipment, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content equipment-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Equipment Details</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="equipment-details">
          <div className="detail-section">
            <h4>Basic Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Name:</strong> {equipment.name}
              </div>
              <div className="detail-item">
                <strong>Model:</strong> {equipment.model}
              </div>
              <div className="detail-item">
                <strong>Serial Number:</strong> {equipment.serialNumber}
              </div>
              <div className="detail-item">
                <strong>Category:</strong> {equipment.category}
              </div>
              <div className="detail-item">
                <strong>Manufacturer:</strong> {equipment.manufacturer}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> 
                <span className={`badge badge-${getStatusBadgeClass(equipment.status)}`}>
                  {equipment.status}
                </span>
              </div>
              <div className="detail-item">
                <strong>Condition:</strong>
                <span className={`badge badge-${getConditionBadgeClass(equipment.condition)}`}>
                  {equipment.condition}
                </span>
              </div>
              <div className="detail-item">
                <strong>Location:</strong> {equipment.location}
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Purchase Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Purchase Date:</strong> {new Date(equipment.purchaseDate).toLocaleDateString()}
              </div>
              <div className="detail-item">
                <strong>Cost:</strong> ${equipment.cost}
              </div>
              <div className="detail-item">
                <strong>Age:</strong> {equipment.age} years
              </div>
            </div>
          </div>

          {equipment.issuedTo?.userId && (
            <div className="detail-section">
              <h4>Current Assignment</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <strong>Issued To:</strong> {equipment.issuedTo.userId.firstName} {equipment.issuedTo.userId.lastName}
                </div>
                <div className="detail-item">
                  <strong>Badge Number:</strong> {equipment.issuedTo.userId.badgeNumber}
                </div>
                <div className="detail-item">
                  <strong>Issue Date:</strong> {new Date(equipment.issuedTo.issuedDate).toLocaleDateString()}
                </div>
                {equipment.issuedTo.expectedReturnDate && (
                  <div className="detail-item">
                    <strong>Expected Return:</strong> {new Date(equipment.issuedTo.expectedReturnDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {equipment.notes && (
            <div className="detail-section">
              <h4>Notes</h4>
              <p>{equipment.notes}</p>
            </div>
          )}
        </div>
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

export default ViewInventory;