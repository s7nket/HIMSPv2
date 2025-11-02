import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';

/*
  UI/UX Enhancement: This component is now styled by AdminDashboard.css.
  - Filters (.search-filters) and create button (.btn-primary) are themed.
  - The table (.users-table) is more professional.
  - Badges (.badge) for Role and Status are now properly styled.
  - The "Create New Officer" modal is significantly enhanced.
*/

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: roleFilter
      });

      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUser(userId, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      /* UI/UX Enhancement: Styled by .loading-container from CSS */
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="management-header">
        {/* UI/UX Enhancement: Styled by .search-filters and .form-control */}
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-control"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="officer">Officer</option>
          </select>
        </div>
        {/* UI/UX Enhancement: Styled by .btn and .btn-primary */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          Create New Officer
        </button>
      </div>

      {users.length === 0 ? (
        /* UI/UX Enhancement: Styled by .no-data from CSS */
        <div className="no-data">
          <p>No users found.</p>
        </div>
      ) : (
        <>
          {/* UI/UX Enhancement: Styled by .users-table and .table */}
          <div className="users-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Badge</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .badge and .badge-x */}
                      <span className={`badge badge-${user.role === 'admin' ? 'danger' : 'info'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.badgeNumber || 'N/A'}</td>
                    <td>{user.department}</td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .badge and .badge-x */}
                      <span className={`badge badge-${user.isActive ? 'success' : 'secondary'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {/* UI/UX Enhancement: Styled by .btn, .btn-sm, etc. */}
                      <button
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        className={`btn btn-sm ${user.isActive ? 'btn-secondary' : 'btn-success'}`}
                        disabled={user.role === 'admin'}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};

/*
  UI/UX Enhancement: This modal component is now styled by:
  - .modal-overlay, .modal-content, .modal-header, .close-btn
  - .form-row (now a 2-column grid)
  - .form-group, .form-label, .form-control
  - .modal-actions (now a themed footer)
*/
const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    department: '',
    badgeNumber: ''
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
      await adminAPI.createUser(formData);
      toast.success('Officer created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to create officer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Officer</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* UI/UX Enhancement: .form-row creates a grid layout */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              required
              minLength="6"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Badge Number</label>
              <input
                type="text"
                name="badgeNumber"
                value={formData.badgeNumber}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
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
              {loading ? 'Creating...' : 'Create Officer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;