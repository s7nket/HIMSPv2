import React, { useState, useEffect } from 'react';
import { officerAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const RequestEquipment = ({ onRequestSubmitted }) => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [requestData, setRequestData] = useState({
    purpose: '',
    urgency: 'Normal',
    expectedDuration: '',
    notes: ''
  });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'Firearm', 'Ammunition', 'Protective Gear', 'Communication Device',
    'Vehicle', 'Tactical Equipment', 'Less-Lethal Weapon', 'Forensic Equipment',
    'Medical Supplies', 'Office Equipment', 'Other'
  ];

  useEffect(() => {
    fetchAuthorizedPools();
  }, [categoryFilter, searchTerm]);

  const fetchAuthorizedPools = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getAuthorizedEquipmentPools({
        category: categoryFilter,
        search: searchTerm
      });
      
      if (response.data.success) {
        // Only show pools with available items
        const availablePools = response.data.data.pools.filter(
          pool => pool.availableCount > 0
        );
        setPools(availablePools);
      }
    } catch (error) {
      console.error('Fetch pools error:', error);
      toast.error('Failed to fetch available equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEquipment = (pool) => {
    setSelectedPool(pool);
    setShowRequestModal(true);
    setRequestData({
      purpose: '',
      urgency: 'Normal',
      expectedDuration: '',
      notes: ''
    });
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!requestData.purpose.trim()) {
      return toast.error('Purpose is required');
    }

    try {
      const response = await officerAPI.requestEquipmentFromPool({
        poolId: selectedPool._id,
        poolName: selectedPool.poolName,
        category: selectedPool.category,
        model: selectedPool.model,
        ...requestData
      });

      if (response.data.success) {
        toast.success('Equipment request submitted successfully!');
        setShowRequestModal(false);
        setSelectedPool(null);
        fetchAuthorizedPools();
        if (onRequestSubmitted) {
          onRequestSubmitted();
        }
      }
    } catch (error) {
      console.error('Submit request error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit equipment request';
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRequestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading available equipment...</p>
      </div>
    );
  }

  return (
    <div className="request-equipment">
      <div className="equipment-header">
        <h2>Request Equipment</h2>
        <p>Request equipment from authorized pools</p>
      </div>

      {/* Filters */}
      <div className="equipment-filters">
        <input
          type="text"
          placeholder="Search equipment pools..."
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

      {/* Equipment Pools Grid */}
      {pools.length === 0 ? (
        <div className="empty-state">
          <p>No equipment available for your designation.</p>
          <p>Contact your administrator if you need access to additional equipment.</p>
        </div>
      ) : (
        <div className="equipment-grid">
          {pools.map(pool => (
            <div key={pool._id} className="equipment-card">
              <div className="equipment-card-header">
                <h3>{pool.poolName}</h3>
                <span className={`badge badge-${
                  pool.availableCount > 10 ? 'success' : 
                  pool.availableCount > 5 ? 'warning' : 'error'
                }`}>
                  {pool.availableCount} Available
                </span>
              </div>
              
              <div className="equipment-card-body">
                <div className="equipment-info">
                  <div className="info-row">
                    <span className="info-label">Category:</span>
                    <span className="info-value">{pool.category}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Model:</span>
                    <span className="info-value">{pool.model}</span>
                  </div>
                  {pool.manufacturer && (
                    <div className="info-row">
                      <span className="info-label">Manufacturer:</span>
                      <span className="info-value">{pool.manufacturer}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Location:</span>
                    <span className="info-value">{pool.location}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Total in Pool:</span>
                    <span className="info-value">{pool.totalQuantity}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Currently Issued:</span>
                    <span className="info-value">{pool.issuedCount}</span>
                  </div>
                </div>
              </div>

              <div className="equipment-card-footer">
                <button
                  className="btn btn-primary btn-full-width"
                  onClick={() => handleRequestEquipment(pool)}
                  disabled={pool.availableCount === 0}
                >
                  {pool.availableCount === 0 ? 'Not Available' : 'Request Equipment'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedPool && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request: {selectedPool.poolName}</h3>
              <button 
                className="close-button"
                onClick={() => setShowRequestModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="modal-body">
              <div className="form-section">
                <h4>Equipment Details</h4>
                <div className="equipment-summary">
                  <div className="summary-row">
                    <strong>Pool:</strong> {selectedPool.poolName}
                  </div>
                  <div className="summary-row">
                    <strong>Category:</strong> {selectedPool.category}
                  </div>
                  <div className="summary-row">
                    <strong>Model:</strong> {selectedPool.model}
                  </div>
                  <div className="summary-row">
                    <strong>Available:</strong> {selectedPool.availableCount} items
                  </div>
                  <p className="note-text">
                    An item will be automatically assigned from this pool upon approval.
                  </p>
                </div>
              </div>

              <div className="form-section">
                <h4>Request Information</h4>
                
                <div className="form-group">
                  <label>Purpose <span className="required">*</span></label>
                  <textarea
                    name="purpose"
                    value={requestData.purpose}
                    onChange={handleInputChange}
                    placeholder="e.g., Patrol duty, Special assignment, Training exercise..."
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Urgency <span className="required">*</span></label>
                    <select
                      name="urgency"
                      value={requestData.urgency}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Expected Duration</label>
                    <input
                      type="text"
                      name="expectedDuration"
                      value={requestData.expectedDuration}
                      onChange={handleInputChange}
                      placeholder="e.g., 7 days, 1 month"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    name="notes"
                    value={requestData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information..."
                    rows="2"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestEquipment;