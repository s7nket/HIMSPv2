import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';

// Valid Indian state codes
const STATE_CODES = [
  { code: 'IND', name: 'All-India' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'AN', name: 'Andaman & Nicobar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'DH', name: 'Dadra & Nagar Haveli' },
  { code: 'DD', name: 'Daman & Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'JK', name: 'Jammu & Kashmir' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'PY', name: 'Puducherry' }
];

// Valid rank codes
const RANK_CODES = [
  { code: 'PC', name: 'Police Constable' },
  { code: 'HC', name: 'Head Constable' },
  { code: 'ASI', name: 'Assistant Sub-Inspector' },
  { code: 'SI', name: 'Sub-Inspector' },
  { code: 'PSI', name: 'Police Sub-Inspector' },
  { code: 'INSP', name: 'Inspector' },
  { code: 'PI', name: 'Police Inspector' },
  { code: 'DSP', name: 'Deputy Superintendent of Police' },
  { code: 'SP', name: 'Superintendent of Police' },
  { code: 'SSP', name: 'Senior Superintendent of Police' },
  { code: 'DCP', name: 'Deputy Commissioner of Police' },
  { code: 'ADDCP', name: 'Additional DCP' },
  { code: 'JCP', name: 'Joint Commissioner of Police' },
  { code: 'IGP', name: 'Inspector General of Police' },
  { code: 'DIGP', name: 'Deputy IGP' },
  { code: 'ADGP', name: 'Additional DGP' },
  { code: 'DGP', name: 'Director General of Police' },
  { code: 'IPS', name: 'Indian Police Service' }
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Form validation errors
  const [errors, setErrors] = useState({});

  const [officerIdParts, setOfficerIdParts] = useState({
    state: '',
    rankCode: '',
    year: new Date().getFullYear().toString(),
    serial: ''
  });

  const [newUser, setNewUser] = useState({
    officerId: '',
    fullName: '',
    designation: '',
    email: '',
    dateOfJoining: '',
    password: '',
    rank: ''
  });

  // Rank categories with their designations
  const rankCategories = {
    'Senior Command (DGP, SP, DCP)': [
      'Director General of Police (DGP)',
      'Superintendent of Police (SP)',
      'Deputy Commissioner of Police (DCP)'
    ],
    'District Administrator (DSP)': [
      'Deputy Superintendent of Police (DSP)'
    ],
    'Police Station Officers (PI, SI, PSI)': [
      'Police Inspector (PI)',
      'Sub-Inspector (SI)',
      'Police Sub-Inspector (PSI)'
    ],
    'Police Station Staff (HC, PC)': [
      'Head Constable (HC)',
      'Police Constable (PC)'
    ]
  };

  // Validation functions
  const validateEmail = (email) => {
    const validDomains = ['police.gov.in', 'gov.in', 'state.gov.in'];
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email) return 'Email is required';
    if (!emailPattern.test(email)) return 'Please enter a valid email address';
    
    const domain = email.split('@')[1];
    const isValidDomain = validDomains.some(validDomain => 
      domain === validDomain || domain.endsWith('.' + validDomain)
    );
    
    if (!isValidDomain) {
      return 'Email must be from police.gov.in, gov.in, or state.gov.in domains';
    }
    
    return '';
  };

  const validateOfficerIdParts = () => {
    const newErrors = {};
    
    if (!officerIdParts.state) {
      newErrors.state = 'State is required';
    }
    if (!officerIdParts.rankCode) {
      newErrors.rankCode = 'Rank code is required';
    }
    if (!officerIdParts.year) {
      newErrors.year = 'Year is required';
    } else {
      const year = parseInt(officerIdParts.year);
      const currentYear = new Date().getFullYear();
      if (year < 1947 || year > currentYear + 1) {
        newErrors.year = `Year must be between 1947 and ${currentYear + 1}`;
      }
    }
    if (!officerIdParts.serial) {
      newErrors.serial = 'Serial number is required';
    } else if (officerIdParts.serial.length < 1 || officerIdParts.serial.length > 6) {
      newErrors.serial = 'Serial must be 1-6 digits';
    }
    
    return newErrors;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate Officer ID parts
    const officerIdErrors = validateOfficerIdParts();
    Object.assign(newErrors, officerIdErrors);
    
    // Validate Full Name
    if (!newUser.fullName) {
      newErrors.fullName = 'Full name is required';
    } else if (newUser.fullName.length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
    } else if (newUser.fullName.length > 100) {
      newErrors.fullName = 'Full name cannot exceed 100 characters';
    }
    
    // Validate Email
    const emailError = validateEmail(newUser.email);
    if (emailError) {
      newErrors.email = emailError;
    }
    
    // Validate Date of Joining
    if (!newUser.dateOfJoining) {
      newErrors.dateOfJoining = 'Date of joining is required';
    } else if (new Date(newUser.dateOfJoining) > new Date()) {
      newErrors.dateOfJoining = 'Date of joining cannot be in the future';
    }
    
    // Validate Rank Category
    if (!newUser.rank) {
      newErrors.rank = 'Rank category is required';
    }
    
    // Validate Designation
    if (!newUser.designation) {
      newErrors.designation = 'Designation is required';
    }
    
    // Validate Password
    if (!newUser.password) {
      newErrors.password = 'Password is required';
    } else if (newUser.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    return newErrors;
  };

  // Generate Officer ID from parts
  const generateOfficerId = () => {
    const { state, rankCode, year, serial } = officerIdParts;
    if (state && rankCode && year && serial) {
      const paddedSerial = serial.padStart(4, '0');
      return `${state}${rankCode}${year}${paddedSerial}`;
    }
    return '';
  };

  // Update Officer ID when parts change
  useEffect(() => {
    const generatedId = generateOfficerId();
    setNewUser(prev => ({ ...prev, officerId: generatedId }));
    
    // Clear officer ID related errors when parts change
    if (generatedId) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.state;
        delete newErrors.rankCode;
        delete newErrors.year;
        delete newErrors.serial;
        return newErrors;
      });
    }
  }, [officerIdParts]);

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

  

// FIXED: Enhanced error handling that works with BOTH array and object error formats
const handleCreateUser = async (e) => {
  e.preventDefault();
  
  console.log('🔍 Form Submission - Current Values:', newUser);
  console.log('🔍 Officer ID Parts:', officerIdParts);
  
  // Validate form
  const formErrors = validateForm();
  if (Object.keys(formErrors).length > 0) {
    console.error('❌ Frontend Validation Errors:', formErrors);
    setErrors(formErrors);
    
    // Show specific error messages for each field
    const errorList = Object.entries(formErrors)
      .map(([field, message]) => {
        const fieldName = field
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        return `❌ ${fieldName}: ${message}`;
      })
      .join('\n');
    
    toast.error(
      <div style={{whiteSpace: 'pre-line', fontSize: '13px', lineHeight: '1.6'}}>
        <strong style={{fontSize: '14px', display: 'block', marginBottom: '8px', color: '#ff5459'}}>
          ⚠️ Please fix the following errors:
        </strong>
        <div style={{backgroundColor: 'rgba(255, 84, 89, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '8px'}}>
          {errorList}
        </div>
      </div>,
      { autoClose: 8000 }
    );
    return;
  }
  
  try {
    console.log('✅ Frontend validation passed. Sending to backend:', newUser);
    const response = await adminAPI.createUser(newUser);
    
    if (response.data.success) {
      console.log('✅ User created successfully');
      toast.success('✅ Officer created successfully!');
      setShowCreateModal(false);
      setNewUser({
        officerId: '',
        fullName: '',
        designation: '',
        email: '',
        dateOfJoining: '',
        password: '',
        rank: ''
      });
      setOfficerIdParts({
        state: '',
        rankCode: '',
        year: new Date().getFullYear().toString(),
        serial: ''
      });
      setErrors({});
      fetchUsers();
    }
  } catch (error) {
    console.error('❌ Backend Error - Full Details:', error);
    console.error('❌ Backend Error - Response Data:', error.response?.data);
    console.error('❌ Backend Error - Validation Errors:', error.response?.data?.errors);
    
    // Handle backend validation errors (BOTH array and object formats)
    if (error.response?.data?.errors) {
      const backendErrors = error.response.data.errors;
      const parsedErrors = {};
      let errorMessages = [];
      
      console.log('🔍 Parsing backend errors:', backendErrors);
      console.log('🔍 Error type:', Array.isArray(backendErrors) ? 'Array' : 'Object');
      
      // Handle ARRAY format: [{field: "email", message: "..."}, ...]
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((errorItem, index) => {
          console.log(`  Error ${index + 1}:`, errorItem);
          console.log(`  Error ${index + 1} keys:`, Object.keys(errorItem));
          console.log(`  Error ${index + 1} stringified:`, JSON.stringify(errorItem));
          
          // Try different possible error formats
          if (errorItem.field && errorItem.message) {
            // Format: {field: "email", message: "Email is required"}
            parsedErrors[errorItem.field] = errorItem.message;
            const fieldName = errorItem.field
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            errorMessages.push(`❌ ${fieldName}: ${errorItem.message}`);
          } else if (errorItem.path && errorItem.message) {
            // Format: {path: "email", message: "Email is required"}
            parsedErrors[errorItem.path] = errorItem.message;
            const fieldName = errorItem.path
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            errorMessages.push(`❌ ${fieldName}: ${errorItem.message}`);
          } else if (errorItem.name && errorItem.message) {
            // Format: {name: "ValidatorError", message: "Email is required"}
            errorMessages.push(`❌ ${errorItem.message}`);
          } else if (typeof errorItem === 'string') {
            // Format: "Email is required"
            errorMessages.push(`❌ ${errorItem}`);
          } else if (errorItem.message) {
            // Format: {message: "Email is required"}
            errorMessages.push(`❌ ${errorItem.message}`);
          } else {
            // Unknown format - show entire object
            errorMessages.push(`❌ Error: ${JSON.stringify(errorItem)}`);
          }
        });
      } 
      // Handle OBJECT format: {email: {message: "..."}, password: {message: "..."}}
      else {
        Object.keys(backendErrors).forEach(key => {
          const errorObj = backendErrors[key];
          console.log(`  Field "${key}":`, errorObj);
          
          if (errorObj.message) {
            parsedErrors[key] = errorObj.message;
          } else if (typeof errorObj === 'string') {
            parsedErrors[key] = errorObj;
          } else {
            parsedErrors[key] = JSON.stringify(errorObj);
          }
        });
        
        // Build error messages for object format
        errorMessages = Object.entries(parsedErrors)
          .map(([field, message]) => {
            const fieldName = field
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            return `❌ ${fieldName}: ${message}`;
          });
      }
      
      console.log('✅ Parsed errors:', parsedErrors);
      console.log('✅ Error messages:', errorMessages);
      setErrors(parsedErrors);
      
      // Display all backend errors with field highlighting
      const errorListText = errorMessages.join('\n');
      
      toast.error(
        <div style={{whiteSpace: 'pre-line', fontSize: '13px', lineHeight: '1.6', maxWidth: '500px'}}>
          <strong style={{fontSize: '14px', display: 'block', marginBottom: '8px', color: '#ff5459'}}>
            ⚠️ Backend Validation Failed:
          </strong>
          <div style={{backgroundColor: 'rgba(255, 84, 89, 0.1)', padding: '12px', borderRadius: '8px', marginTop: '8px'}}>
            {errorListText}
          </div>
          <div style={{marginTop: '12px', fontSize: '12px', opacity: '0.8'}}>
            📝 Check browser console (F12) for detailed error info
          </div>
        </div>,
        { autoClose: 12000 }
      );
    } else if (error.response?.data?.message) {
      console.error('❌ Backend returned message:', error.response.data.message);
      toast.error(
        <div>
          <strong>❌ Error:</strong><br/>
          {error.response.data.message}
        </div>,
        { autoClose: 6000 }
      );
    } else {
      console.error('❌ Unknown error format');
      toast.error('❌ Failed to create officer. Check console (F12) for details.', { autoClose: 5000 });
    }
  }
};
  const handleRankChange = (e) => {
    const selectedRank = e.target.value;
    setNewUser({
      ...newUser,
      rank: selectedRank,
      designation: ''
    });
    
    // Clear rank error
    if (selectedRank) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.rank;
        delete newErrors.designation;
        return newErrors;
      });
    }
  };

  const getAvailableDesignations = () => {
    if (!newUser.rank) return [];
    return rankCategories[newUser.rank] || [];
  };

  const handleInputChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleOfficerIdPartChange = (field, value) => {
    setOfficerIdParts(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>User Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Officer
        </button>
      </div>

      {/* Filters Section */}
      <div className="search-filters">
        <input
          type="text"
          placeholder="Search by name, email, or officer ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="officer">Officer</option>
        </select>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="empty-state">
          <p>No users found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Officer ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Rank</th>
                <th>Years of Service</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td><code style={{fontSize: '0.85em'}}>{user.officerId}</code></td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge badge-info">{user.designation}</span>
                  </td>
                  <td>{user.rank}</td>
                  <td>{user.yearsOfService || 'N/A'}</td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleToggleStatus(user._id, user.isActive)}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setErrors({});
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Officer</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setErrors({});
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="modal-form">
              {/* Officer ID Builder Section */}
              <div className="form-section">
                <h4 style={{marginBottom: '12px', fontSize: '14px', fontWeight: '600'}}>
                  Officer ID Builder
                </h4>
                <div className="form-row" style={{gap: '8px'}}>
                  <div className="form-group" style={{flex: '1'}}>
                    <label>State *</label>
                    <select
                      value={officerIdParts.state}
                      onChange={(e) => handleOfficerIdPartChange('state', e.target.value)}
                      className={errors.state ? 'error' : ''}
                    >
                      <option value="">Select State</option>
                      {STATE_CODES.map(s => (
                        <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                    {errors.state && <span className="error-message">{errors.state}</span>}
                  </div>

                  <div className="form-group" style={{flex: '1'}}>
                    <label>Rank Code *</label>
                    <select
                      value={officerIdParts.rankCode}
                      onChange={(e) => handleOfficerIdPartChange('rankCode', e.target.value)}
                      className={errors.rankCode ? 'error' : ''}
                    >
                      <option value="">Select Rank</option>
                      {RANK_CODES.map(r => (
                        <option key={r.code} value={r.code}>{r.code} - {r.name}</option>
                      ))}
                    </select>
                    {errors.rankCode && <span className="error-message">{errors.rankCode}</span>}
                  </div>

                  <div className="form-group" style={{flex: '0.7'}}>
                    <label>Year *</label>
                    <input
                      type="number"
                      value={officerIdParts.year}
                      onChange={(e) => handleOfficerIdPartChange('year', e.target.value)}
                      placeholder="2024"
                      min="1947"
                      max={new Date().getFullYear() + 1}
                      className={errors.year ? 'error' : ''}
                    />
                    {errors.year && <span className="error-message">{errors.year}</span>}
                  </div>

                  <div className="form-group" style={{flex: '0.7'}}>
                    <label>Serial *</label>
                    <input
                      type="number"
                      value={officerIdParts.serial}
                      onChange={(e) => handleOfficerIdPartChange('serial', e.target.value)}
                      placeholder="0001"
                      min="1"
                      max="999999"
                      className={errors.serial ? 'error' : ''}
                    />
                    {errors.serial && <span className="error-message">{errors.serial}</span>}
                  </div>
                </div>
                
                {/* Preview Officer ID */}
                <div className="officer-id-preview">
                  <span className="preview-label">Officer ID:</span>
                  <span className="preview-value">{newUser.officerId || 'STATE/RANK/YEAR/SERIAL'}</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter full name"
                    minLength="3"
                    maxLength="100"
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Officer@police.gov.in"  // Show capital letter
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                  <span className="field-hint">Only @police.gov.in, @gov.in, or @state.gov.in</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Joining *</label>
                  <input
                    type="date"
                    value={newUser.dateOfJoining}
                    onChange={(e) => handleInputChange('dateOfJoining', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.dateOfJoining ? 'error' : ''}
                  />
                  {errors.dateOfJoining && <span className="error-message">{errors.dateOfJoining}</span>}
                </div>

                <div className="form-group">
                  <label>Rank Category *</label>
                  <select
                    value={newUser.rank}
                    onChange={handleRankChange}
                    className={errors.rank ? 'error' : ''}
                  >
                    <option value="">Select Rank Category</option>
                    {Object.keys(rankCategories).map(rank => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                  {errors.rank && <span className="error-message">{errors.rank}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Designation *</label>
                  <select
                    value={newUser.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    disabled={!newUser.rank}
                    className={errors.designation ? 'error' : ''}
                  >
                    <option value="">
                      {newUser.rank ? 'Select Designation' : 'Select Rank First'}
                    </option>
                    {getAvailableDesignations().map(designation => (
                      <option key={designation} value={designation}>
                        {designation}
                      </option>
                    ))}
                  </select>
                  {errors.designation && <span className="error-message">{errors.designation}</span>}
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Minimum 8 characters"
                    minLength="8"
                    className={errors.password ? 'error' : ''}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setErrors({});
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;