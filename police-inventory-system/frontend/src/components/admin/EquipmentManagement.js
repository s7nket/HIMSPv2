import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const EquipmentManagement = () => {
  // State management
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [showPoolDetailsModal, setShowPoolDetailsModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form state for creating pool
  const [formData, setFormData] = useState({
    poolName: '',
    category: '',
    subCategory: '',
    model: '',
    manufacturer: '',
    totalQuantity: '',
    prefix: '',
    authorizedDesignations: [],
    location: '',
    purchaseDate: '',
    totalCost: '',
    supplier: '',
    notes: ''
  });

  const categories = [
    'Firearm',
    'Ammunition',
    'Protective Gear',
    'Communication Device',
    'Vehicle',
    'Tactical Equipment',
    'Less-Lethal Weapon',
    'Forensic Equipment',
    'Medical Supplies',
    'Office Equipment',
    'Other'
  ];

  const designations = [
    'Director General of Police (DGP)',
    'Superintendent of Police (SP)',
    'Deputy Commissioner of Police (DCP)',
    'Deputy Superintendent of Police (DSP)',
    'Police Inspector (PI)',
    'Sub-Inspector (SI)',
    'Police Sub-Inspector (PSI)',
    'Head Constable (HC)',
    'Police Constable (PC)'
  ];

  useEffect(() => {
    fetchPools();
  }, [searchTerm, categoryFilter]);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const response = await equipmentAPI.getEquipmentPools({
        search: searchTerm,
        category: categoryFilter
      });

      if (response.data.success) {
        setPools(response.data.data.pools);
      }
    } catch (error) {
      console.error('Fetch pools error:', error);
      toast.error('Failed to fetch equipment pools');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDesignationToggle = (designation) => {
    setFormData(prev => ({
      ...prev,
      authorizedDesignations: prev.authorizedDesignations.includes(designation)
        ? prev.authorizedDesignations.filter(d => d !== designation)
        : [...prev.authorizedDesignations, designation]
    }));
  };

  const handleCreatePool = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.poolName.trim()) {
      return toast.error('Pool name is required');
    }
    if (!formData.category) {
      return toast.error('Category is required');
    }
    if (!formData.model.trim()) {
      return toast.error('Model is required');
    }
    if (!formData.totalQuantity || formData.totalQuantity < 1) {
      return toast.error('Total quantity must be at least 1');
    }
    if (!formData.prefix.trim() || formData.prefix.length < 2 || formData.prefix.length > 5) {
      return toast.error('Prefix must be 2-5 characters');
    }
    if (formData.authorizedDesignations.length === 0) {
      return toast.error('At least one designation must be selected');
    }
    if (!formData.location.trim()) {
      return toast.error('Location is required');
    }

    try {
      const response = await equipmentAPI.createEquipmentPool(formData);

      if (response.data.success) {
        toast.success(`Equipment pool created with \${formData.totalQuantity} items!`);
        setShowCreatePoolModal(false);
        resetForm();
        fetchPools();
      }
    } catch (error) {
      console.error('Create pool error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create equipment pool';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      poolName: '',
      category: '',
      subCategory: '',
      model: '',
      manufacturer: '',
      totalQuantity: '',
      prefix: '',
      authorizedDesignations: [],
      location: '',
      purchaseDate: '',
      totalCost: '',
      supplier: '',
      notes: ''
    });
  };

  const handleViewPoolDetails = async (pool) => {
    try {
      const response = await equipmentAPI.getEquipmentPoolDetails(pool._id);
      if (response.data.success) {
        setSelectedPool(response.data.data.pool);
        setShowPoolDetailsModal(true);
      }
    } catch (error) {
      toast.error('Failed to fetch pool details');
    }
  };

  const handleDeletePool = async (poolId) => {
    if (!window.confirm('Are you sure you want to delete this entire equipment pool? This action cannot be undone.')) {
      return;
    }

    try {
      await equipmentAPI.deleteEquipmentPool(poolId);
      toast.success('Equipment pool deleted successfully');
      fetchPools();
    } catch (error) {
      toast.error('Failed to delete equipment pool');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading equipment pools...</p>
      </div>
    );
  }

  return (
    <div className="equipment-management">
      <div className="page-header">
        <h2>Equipment Pool Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreatePoolModal(true)}
        >
          + Add Equipment Pool
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <input
          type="text"
          placeholder="Search pools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Pools Table */}
      {pools.length === 0 ? (
        <div className="empty-state">
          <p>No equipment pools found.</p>
          <p>Click "Add Equipment Pool" to create one.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Pool Name</th>
                <th>Category</th>
                <th>Model</th>
                <th>Total</th>
                <th>Available</th>
                <th>Issued</th>
                <th>Utilization</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pools.map(pool => (
                <tr key={pool._id}>
                  <td><strong>{pool.poolName}</strong></td>
                  <td><span className="badge badge-info">{pool.category}</span></td>
                  <td>{pool.model}</td>
                  <td>{pool.totalQuantity}</td>
                  <td><span className="badge badge-success">{pool.availableCount}</span></td>
                  <td><span className="badge badge-warning">{pool.issuedCount}</span></td>
                  <td>{pool.utilizationRate}%</td>
                  <td>{pool.location}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleViewPoolDetails(pool)}
                        title="View Details"
                      >
                        👁️ View
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeletePool(pool._id)}
                        title="Delete Pool"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreatePoolModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePoolModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Equipment Pool</h3>
              <button 
                className="close-button"
                onClick={() => setShowCreatePoolModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreatePool} className="pool-form">
              <div className="form-sections">
                {/* Basic Information */}
                <div className="form-section">
                  <h4>Basic Information</h4>

                  <div className="form-group">
                    <label>Pool Name <span className="required">*</span></label>
                    <input
                      type="text"
                      name="poolName"
                      value={formData.poolName}
                      onChange={handleInputChange}
                      placeholder="e.g., Glock 17 (9mm)"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category <span className="required">*</span></label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Sub-Category</label>
                      <input
                        type="text"
                        name="subCategory"
                        value={formData.subCategory}
                        onChange={handleInputChange}
                        placeholder="e.g., Service Pistol"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Model <span className="required">*</span></label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        placeholder="e.g., Glock 17 Gen 5"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Manufacturer</label>
                      <input
                        type="text"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleInputChange}
                        placeholder="e.g., Glock GmbH"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity & IDs */}
                <div className="form-section">
                  <h4>Quantity & ID Generation</h4>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Total Quantity <span className="required">*</span></label>
                      <input
                        type="number"
                        name="totalQuantity"
                        value={formData.totalQuantity}
                        onChange={handleInputChange}
                        placeholder="e.g., 50"
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>ID Prefix <span className="required">*</span></label>
                      <input
                        type="text"
                        name="prefix"
                        value={formData.prefix}
                        onChange={handleInputChange}
                        placeholder="e.g., GLK"
                        maxLength="5"
                        required
                        style={{ textTransform: 'uppercase' }}
                      />
                      <small>2-5 characters. Will generate: {formData.prefix}001, {formData.prefix}002, etc.</small>
                    </div>
                  </div>
                </div>

                {/* Authorization */}
                <div className="form-section">
                  <h4>Authorized Designations <span className="required">*</span></h4>
                  <p className="help-text">Select which officer designations can access this equipment:</p>

                  <div className="designation-grid">
                    {designations.map(designation => (
                      <label key={designation} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.authorizedDesignations.includes(designation)}
                          onChange={() => handleDesignationToggle(designation)}
                        />
                        <span>{designation}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="form-section">
                  <h4>Additional Details</h4>

                  <div className="form-group">
                    <label>Location <span className="required">*</span></label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Central Armory - Section A"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Purchase Date</label>
                      <input
                        type="date"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Total Cost</label>
                      <input
                        type="number"
                        name="totalCost"
                        value={formData.totalCost}
                        onChange={handleInputChange}
                        placeholder="e.g., 2500000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Supplier</label>
                    <input
                      type="text"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      placeholder="e.g., Government Arms Procurement"
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes about this equipment pool..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreatePoolModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Equipment Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pool Details Modal */}
      {showPoolDetailsModal && selectedPool && (
        <div className="modal-overlay" onClick={() => setShowPoolDetailsModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPool.poolName} - Details</h3>
              <button 
                className="close-button"
                onClick={() => setShowPoolDetailsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="pool-details">
              <div className="details-section">
                <h4>Pool Information</h4>
                <div className="detail-grid">
                  <div><strong>Category:</strong> {selectedPool.category}</div>
                  <div><strong>Model:</strong> {selectedPool.model}</div>
                  <div><strong>Manufacturer:</strong> {selectedPool.manufacturer || 'N/A'}</div>
                  <div><strong>Location:</strong> {selectedPool.location}</div>
                </div>
              </div>

              <div className="details-section">
                <h4>Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-value">{selectedPool.totalQuantity}</span>
                    <span className="stat-label">Total Items</span>
                  </div>
                  <div className="stat-card success">
                    <span className="stat-value">{selectedPool.availableCount}</span>
                    <span className="stat-label">Available</span>
                  </div>
                  <div className="stat-card warning">
                    <span className="stat-value">{selectedPool.issuedCount}</span>
                    <span className="stat-label">Issued</span>
                  </div>
                  <div className="stat-card info">
                    <span className="stat-value">{selectedPool.utilizationRate}%</span>
                    <span className="stat-label">Utilization</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Authorized Designations</h4>
                <div className="badge-list">
                  {selectedPool.authorizedDesignations.map(designation => (
                    <span key={designation} className="badge badge-primary">
                      {designation}
                    </span>
                  ))}
                </div>
              </div>

              <div className="details-section">
                <h4>Items in Pool</h4>
                <div className="items-list">
                  {selectedPool.items.slice(0, 10).map(item => (
                    <div key={item.uniqueId} className="item-row">
                      <span className="item-id">{item.uniqueId}</span>
                      <span className={`badge badge-${
                        item.status === 'Available' ? 'success' :
                        item.status === 'Issued' ? 'warning' : 'secondary'
                      }`}>
                        {item.status}
                      </span>
                      {item.currentlyIssuedTo && (
                        <span className="issued-to">
                          → {item.currentlyIssuedTo.officerName} ({item.currentlyIssuedTo.officerId})
                        </span>
                      )}
                    </div>
                  ))}
                  {selectedPool.items.length > 10 && (
                    <p className="more-items">... and {selectedPool.items.length - 10} more items</p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowPoolDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;