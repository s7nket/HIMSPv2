import React, { useState, useEffect } from 'react';
import { officerAPI } from '../../utils/api';
import { toast } from 'react-toastify';

/*
  UI/UX Enhancement: This component is now styled by OfficerDashboard.css.
  - The header is a clean card (.return-header).
  - Issued equipment is styled via .issued-equipment-grid & .issued-card.
  - Overdue items are highlighted with .overdue class.
  - The return modal form is fully styled.
*/

const ReturnEquipment = ({ onEquipmentReturned }) => {
  const [issuedEquipment, setIssuedEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  useEffect(() => {
    fetchIssuedEquipment();
  }, []);

  const fetchIssuedEquipment = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getIssuedEquipment();

      if (response.data.success) {
        setIssuedEquipment(response.data.data.equipment);
      }
    } catch (error) {
      toast.error('Failed to fetch issued equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnRequest = (equipment) => {
    setSelectedEquipment(equipment);
    setShowReturnModal(true);
  };

  if (loading) {
    return (
      /* UI/UX Enhancement: Styled by .loading-container */
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your issued equipment...</p>
      </div>
    );
  }

  return (
    <div className="return-equipment">
      {/* UI/UX Enhancement: Styled by .return-header */ }
      <div className="return-header">
        <h3>Equipment Issued to You</h3>
        <p>Below are the equipment items currently assigned to you. Click "Return" to submit a return request.</p>
      </div>

      {issuedEquipment.length === 0 ? (
        /* UI/UX Enhancement: Styled by .no-data */
        <div className="no-data">
          <p>You don't have any equipment issued to you.</p>
        </div>
      ) : (
        /* UI/UX Enhancement: Styled by .issued-equipment-grid */
        <div className="issued-equipment-grid">
          {issuedEquipment.map((equipment) => (
            <IssuedEquipmentCard
              key={equipment._id}
              equipment={equipment}
              onReturn={handleReturnRequest}
            />
          ))}
        </div>
      )}

      {showReturnModal && selectedEquipment && (
        <ReturnModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedEquipment(null);
          }}
          onSuccess={() => {
            fetchIssuedEquipment();
            if (onEquipmentReturned) onEquipmentReturned();
          }}
        />
      )}
    </div>
  );
};

/*
  UI/UX Enhancement: This card inherits .equipment-card styles
  and adds .issued-card and .overdue styles for specific highlighting.
  All details (.issue-details) are now cleanly formatted.
*/
const IssuedEquipmentCard = ({ equipment, onReturn }) => {
  const isOverdue = equipment.issuedTo.expectedReturnDate && 
    new Date(equipment.issuedTo.expectedReturnDate) < new Date();

  const daysHeld = Math.floor(
    (new Date() - new Date(equipment.issuedTo.issuedDate)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`equipment-card issued-card ${isOverdue ? 'overdue' : ''}`}>
      <div className="equipment-info">
        <h4>{equipment.name}</h4>
        <p className="equipment-model">{equipment.model}</p>
        <div className="equipment-details">
          <span className="equipment-category">{equipment.category}</span>
          <span className="equipment-serial">SN: {equipment.serialNumber}</span>
        </div>

        {/* UI/UX Enhancement: Styled by .issue-details */}
        <div className="issue-details">
          <div className="issue-info">
            <strong>Issued:</strong> {new Date(equipment.issuedTo.issuedDate).toLocaleDateString()}
          </div>
          <div className="issue-info">
            <strong>Days Held:</strong> {daysHeld} days
          </div>
          {equipment.issuedTo.expectedReturnDate && (
            <div className={`issue-info ${isOverdue ? 'overdue-text' : ''}`}>
              <strong>Expected Return:</strong> {new Date(equipment.issuedTo.expectedReturnDate).toLocaleDateString()}
              {isOverdue && <span className="overdue-label">OVERDUE</span>}
            </div>
          )}
        </div>
      </div>

      <div className="equipment-actions">
        {/* UI/UX Enhancement: Buttons are styled by .btn */}
        <button
          onClick={() => onReturn(equipment)}
          className={`btn btn-sm ${isOverdue ? 'btn-danger' : 'btn-warning'}`}
        >
          {isOverdue ? 'Return Overdue' : 'Return Equipment'}
        </button>
      </div>
    </div>
  );
};

/*
  UI/UX Enhancement: This modal is now fully styled by the CSS:
  - .overdue-notice provides clear warning.
  - .form-group, .form-label, .form-control for inputs.
  - .form-note provides clear context to the user.
  - .modal-actions for the styled footer.
*/
const ReturnModal = ({ equipment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: '',
    priority: 'Medium',
    condition: equipment.condition
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
        requestType: 'Return',
        ...formData
      });
      toast.success('Return request submitted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = equipment.issuedTo.expectedReturnDate && 
    new Date(equipment.issuedTo.expectedReturnDate) < new Date();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Return Equipment</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {isOverdue && (
          /* UI/UX Enhancement: Styled by .overdue-notice */
          <div className="overdue-notice">
            <strong>⚠️ This equipment is overdue for return!</strong>
            <p>Expected return date was: {new Date(equipment.issuedTo.expectedReturnDate).toLocaleDateString()}</p>
          </div>
        )}

        <div className="equipment-summary">
          <h4>{equipment.name}</h4>
          <p>{equipment.model} - {equipment.serialNumber}</p>
          <p>Category: {equipment.category}</p>
          <p>Issued Date: {new Date(equipment.issuedTo.issuedDate).toLocaleDateString()}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Reason for Return</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="Please explain the reason for returning this equipment..."
              required
            />
          </div>

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
              <label className="form-label">Current Condition</label>
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
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>
          </div>

          {/* UI/UX Enhancement: Styled by .form-note */}
          <div className="form-note">
            <p><strong>Note:</strong> This will create a return request that needs to be approved by an admin. 
            You will continue to have custody of the equipment until the return is processed.</p>
          </div>

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
              {loading ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnEquipment;