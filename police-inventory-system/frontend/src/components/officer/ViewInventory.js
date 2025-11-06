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
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, [currentPage, categoryFilter, searchTerm]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getInventory({
        page: currentPage,
        limit: 15,
        category: categoryFilter,
        search: searchTerm
      });

      if (response.data.success) {
        setEquipment(response.data.data.equipment); // 'equipment' is now pools
        setCategories(response.data.data.categories || []);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch equipment pools');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (poolId) => {
    try {
      const response = await officerAPI.getEquipmentDetails(poolId);
      if (response.data.success) {
        setSelectedPool(response.data.data.equipment); // 'equipment' is now pool
        setShowDetailsModal(true);
      }
    } catch (error) {
      toast.error('Failed to fetch equipment pool details');
    }
  };

  if (loading) {
    return (
      /* UI/UX Enhancement: Styled by .loading-container */
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading authorized equipment pools...</p>
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
            placeholder="Search equipment pools..."
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
          {/* Removed status filter as we are viewing pools, not individual items */}
        </div>
        <div className="inventory-stats">
          {equipment.length} pools found
        </div>
      </div>

      {equipment.length === 0 ? (
        /* UI/UX Enhancement: Styled by .no-data */
        <div className="no-data">
          <p>No equipment pools found matching your criteria or authorized for your designation.</p>
        </div>
      ) : (
        <>
          {/* UI/UX Enhancement: Styled by .inventory-table & .table */ }
          <div className="inventory-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Pool Name</th>
                  <th>Category</th>
                  <th>Model</th>
                  <th>Total Quantity</th>
                  <th>Available</th>
                  <th>Issued</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((pool) => (
                  <tr key={pool._id}>
                    <td>
                      <strong>{pool.poolName}</strong>
                      <br />
                      <small>{pool.manufacturer}</small>
                    </td>
                    <td>{pool.category}</td>
                    <td>{pool.model}</td>
                    <td>{pool.totalQuantity}</td>
                    <td>
                      <span className={`badge badge-${
                        pool.availableCount > 10 ? 'success' :
                        pool.availableCount > 5 ? 'warning' : 'danger'
                      }`}>
                        {pool.availableCount}
                      </span>
                    </td>
                    <td>{pool.issuedCount}</td>
                    <td>{pool.location}</td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .btn */ }
                      <button
                        onClick={() => handleViewDetails(pool._id)}
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

      {showDetailsModal && selectedPool && (
        <EquipmentDetailsModal
          pool={selectedPool}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPool(null);
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
const EquipmentDetailsModal = ({ pool, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content equipment-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Equipment Pool Details: {pool.poolName}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="equipment-details">
          <div className="detail-section">
            <h4>Pool Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Pool Name:</strong> {pool.poolName}
              </div>
              <div className="detail-item">
                <strong>Model:</strong> {pool.model}
              </div>
              <div className="detail-item">
                <strong>Category:</strong> {pool.category}
              </div>
              <div className="detail-item">
                <strong>Manufacturer:</strong> {pool.manufacturer}
              </div>
              <div className="detail-item">
                <strong>Location:</strong> {pool.location}
              </div>
              <div className="detail-item">
                <strong>Total Quantity:</strong> {pool.totalQuantity}
              </div>
              <div className="detail-item">
                <strong>Available Count:</strong>
                <span className={`badge badge-${
                  pool.availableCount > 10 ? 'success' :
                  pool.availableCount > 5 ? 'warning' : 'danger'
                }`}>
                  {pool.availableCount}
                </span>
              </div>
              <div className="detail-item">
                <strong>Issued Count:</strong> {pool.issuedCount}
              </div>
              <div className="detail-item">
                <strong>Maintenance Count:</strong> {pool.maintenanceCount}
              </div>
              <div className="detail-item">
                <strong>Damaged Count:</strong> {pool.damagedCount}
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Authorization</h4>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <strong>Authorized Designations:</strong>
                <ul>
                  {pool.authorizedDesignations.map(d => <li key={d}>{d}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Metadata</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <strong>Purchase Date:</strong> {pool.purchaseDate ? new Date(pool.purchaseDate).toLocaleDateString() : 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Total Cost:</strong> {pool.totalCost ? `$${pool.totalCost}` : 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Supplier:</strong> {pool.supplier || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Added By:</strong> {pool.addedBy?.fullName} ({pool.addedBy?.officerId})
              </div>
              <div className="detail-item">
                <strong>Last Modified:</strong> {pool.updatedAt ? new Date(pool.updatedAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          {pool.notes && (
            <div className="detail-section">
              <h4>Notes</h4>
              <p>{pool.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewInventory;