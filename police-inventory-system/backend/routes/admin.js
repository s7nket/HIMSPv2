
const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Request = require('../models/Request');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// Apply auth and admin role check to all routes
router.use(auth, adminOnly);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalOfficers,
      totalEquipment,
      availableEquipment,
      issuedEquipment,
      pendingRequests,
      recentRequests
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'officer', isActive: true }),
      Equipment.countDocuments(),
      Equipment.countDocuments({ status: 'Available' }),
      Equipment.countDocuments({ status: 'Issued' }),
      Request.countDocuments({ status: 'Pending' }),
      Request.find({ status: 'Pending' })
        .populate('requestedBy', 'fullName officerId')
        .populate('equipmentId', 'name model serialNumber')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const equipmentCategories = await Equipment.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const requestsThisMonth = await Request.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalOfficers,
          totalEquipment,
          availableEquipment,
          issuedEquipment,
          pendingRequests,
          requestsThisMonth
        },
        equipmentCategories,
        recentRequests
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    const query = {
      ...(search && {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { badgeNumber: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(role && { role })
    };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});


// @route POST /api/admin/users
// @desc Create new user (officer)
// @access Private (Admin only)
router.post('/users', [
  body('officerId')
    .trim()
    .isLength({ min: 12, max: 18 })
    .withMessage('Officer ID must be 12-18 characters'),
  body('fullName')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Full name must be 3-100 characters'),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email'),
  body('password')
    .isLength({ min: 8, max: 8 })
    .withMessage('Password must be exactly 8 characters'),
  body('dateOfJoining')
    .isISO8601()
    .withMessage('Must be a valid date'),
  body('rank')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Rank is required'),
  body('designation')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Designation is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { officerId, fullName, email, password, dateOfJoining, rank, designation, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { officerId }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or officer ID already exists'
      });
    }

    // Create new user
    const user = new User({
      officerId,
      fullName,
      email,
      password,
      dateOfJoining,
      rank,
      designation,
      role: role || 'officer',
      createdBy: req.user._id
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Officer created successfully',
      data: { user: user.toJSON() }
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        path: key,
        msg: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating user',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/users/:id', [
  body('fullName').optional().trim().isLength({ min: 3, max: 100 }),
  body('rank').optional().trim().isLength({ min: 1 }),
  body('designation').optional().trim().isLength({ min: 1 }),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { fullName, rank, designation, isActive } = req.body;
    const updates = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (rank !== undefined) updates.rank = rank;
    if (designation !== undefined) updates.designation = designation;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   GET /api/admin/requests
// @desc    Get all requests with filters
// @access  Private (Admin only)
router.get('/requests', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    const requestType = req.query.requestType || '';

    const query = {
      ...(status && { status }),
      ...(requestType && { requestType })
    };

    const [requests, total] = await Promise.all([
      Request.find(query)
        .populate('requestedBy', 'fullName officerId email')
        .populate('equipmentId', 'name model serialNumber category')
        .populate('processedBy', 'fullName officerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Request.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching requests',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   PUT /api/admin/requests/:id/approve
// @desc    Approve a request
// @access  Private (Admin only)
router.put('/requests/:id/approve', [
  body('notes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const { notes } = req.body;

    const request = await Request.findById(req.params.id)
      .populate('equipmentId')
      .populate('requestedBy');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not in pending status'
      });
    }

    // For issue requests, check if equipment is available
    if (request.requestType === 'Issue') {
      if (request.equipmentId.status !== 'Available') {
        return res.status(400).json({
          success: false,
          message: 'Equipment is not available for issue'
        });
      }

      // Issue equipment to user
      await request.equipmentId.issueToUser(
        request.requestedBy._id,
        request.expectedReturnDate
      );
    }

    // Approve the request
    await request.approve(req.user._id, notes);

    res.json({
      success: true,
      message: 'Request approved successfully',
      data: { request }
    });

  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving request',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   PUT /api/admin/requests/:id/reject
// @desc    Reject a request
// @access  Private (Admin only)
router.put('/requests/:id/reject', [
  body('reason').isLength({ min: 1, max: 500 }).withMessage('Reason for rejection is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { reason } = req.body;

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not in pending status'
      });
    }

    // Reject the request
    await request.reject(req.user._id, reason);

    res.json({
      success: true,
      message: 'Request rejected successfully',
      data: { request }
    });

  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting request',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   GET /api/admin/reports/summary
// @desc    Get summary reports
// @access  Private (Admin only)
router.get('/reports/summary', async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const endDate = new Date(req.query.endDate || new Date());

    const [
      requestsSummary,
      equipmentSummary,
      userActivity
    ] = await Promise.all([
      Request.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Equipment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      User.aggregate([
        {
          $match: {
            role: 'officer',
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'requests',
            localField: '_id',
            foreignField: 'requestedBy',
            as: 'requests'
          }
        },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            badgeNumber: 1,
            requestCount: { $size: '$requests' }
          }
        },
        {
          $sort: { requestCount: -1 }
        },
        {
          $limit: 10
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        requestsSummary,
        equipmentSummary,
        userActivity,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating summary report',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

module.exports = router;