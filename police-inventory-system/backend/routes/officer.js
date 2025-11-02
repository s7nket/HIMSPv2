const express = require('express');
const { body, validationResult } = require('express-validator');
const Equipment = require('../models/Equipment');
const Request = require('../models/Request');
const { auth } = require('../middleware/auth');
const { officerOnly, adminOrOfficer } = require('../middleware/roleCheck');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/officer/dashboard
// @desc    Get officer dashboard data
// @access  Private (Officer only)
router.get('/dashboard', officerOnly, async (req, res) => {
  try {
    const [
      myRequests,
      myIssuedEquipment,
      availableEquipment,
      recentActivity
    ] = await Promise.all([
      Request.countDocuments({ requestedBy: req.user._id }),
      Equipment.countDocuments({ 'issuedTo.userId': req.user._id }),
      Equipment.countDocuments({ status: 'Available' }),
      Request.find({ requestedBy: req.user._id })
        .populate('equipmentId', 'name model serialNumber category')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const pendingRequests = await Request.countDocuments({ 
      requestedBy: req.user._id, 
      status: 'Pending' 
    });

    res.json({
      success: true,
      data: {
        stats: {
          myRequests,
          myIssuedEquipment,
          availableEquipment,
          pendingRequests
        },
        recentActivity
      }
    });

  } catch (error) {
    console.error('Officer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   GET /api/officer/requests
// @desc    Get user's requests
// @access  Private (Officer only)
router.get('/requests', officerOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    const query = {
      requestedBy: req.user._id,
      ...(status && { status })
    };

    const [requests, total] = await Promise.all([
      Request.find(query)
        .populate('equipmentId', 'name model serialNumber category')
        .populate('processedBy', 'firstName lastName')
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
    console.error('Get user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching requests',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   POST /api/officer/requests
// @desc    Create new equipment request
// @access  Private (Officer only)
router.post('/requests', officerOnly, [
  body('equipmentId').isMongoId().withMessage('Valid equipment ID is required'),
  body('requestType').isIn(['Issue', 'Return', 'Maintenance']).withMessage('Valid request type is required'),
  body('reason').isLength({ min: 1, max: 500 }).withMessage('Reason is required and cannot exceed 500 characters'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('expectedReturnDate').optional().isISO8601().withMessage('Valid date format required')
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

    const { equipmentId, requestType, reason, priority, expectedReturnDate } = req.body;

    // Check if equipment exists
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Validate request based on type
    if (requestType === 'Issue') {
      if (equipment.status !== 'Available') {
        return res.status(400).json({
          success: false,
          message: 'Equipment is not available for issue'
        });
      }

      // Check if user already has a pending issue request for this equipment
      const existingRequest = await Request.findOne({
        requestedBy: req.user._id,
        equipmentId,
        requestType: 'Issue',
        status: 'Pending'
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending request for this equipment'
        });
      }
    } else if (requestType === 'Return') {
      if (equipment.status !== 'Issued' || 
          !equipment.issuedTo.userId || 
          equipment.issuedTo.userId.toString() !== req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Equipment is not issued to you'
        });
      }
    }

    const request = new Request({
      requestedBy: req.user._id,
      equipmentId,
      requestType,
      reason,
      priority: priority || 'Medium',
      ...(expectedReturnDate && { expectedReturnDate: new Date(expectedReturnDate) })
    });

    await request.save();

    const populatedRequest = await Request.findById(request._id)
      .populate('equipmentId', 'name model serialNumber category')
      .populate('requestedBy', 'firstName lastName badgeNumber');

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      data: { request: populatedRequest }
    });

  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating request',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   PUT /api/officer/requests/:id/cancel
// @desc    Cancel a pending request
// @access  Private (Officer only)
router.put('/requests/:id/cancel', officerOnly, async (req, res) => {
  try {
    const request = await Request.findOne({
      _id: req.params.id,
      requestedBy: req.user._id
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled'
      });
    }

    request.status = 'Cancelled';
    await request.save();

    res.json({
      success: true,
      message: 'Request cancelled successfully',
      data: { request }
    });

  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling request',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   GET /api/officer/equipment/issued
// @desc    Get equipment issued to the officer
// @access  Private (Officer only)
router.get('/equipment/issued', officerOnly, async (req, res) => {
  try {
    const equipment = await Equipment.find({ 
      'issuedTo.userId': req.user._id,
      status: 'Issued'
    }).sort({ 'issuedTo.issuedDate': -1 });

    res.json({
      success: true,
      data: { equipment }
    });

  } catch (error) {
    console.error('Get issued equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching issued equipment',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   GET /api/officer/inventory
// @desc    View available equipment inventory
// @access  Private (Officer and Admin)
router.get('/inventory', adminOrOfficer, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category || '';
    const search = req.query.search || '';
    const status = req.query.status || '';

    const query = {
      ...(category && { category }),
      ...(status && { status }),
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } }
        ]
      })
    };

    const [equipment, total, categories] = await Promise.all([
      Equipment.find(query)
        .populate('issuedTo.userId', 'firstName lastName badgeNumber')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Equipment.countDocuments(query),
      Equipment.distinct('category')
    ]);

    res.json({
      success: true,
      data: {
        equipment,
        categories,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching inventory',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   GET /api/officer/equipment/:id
// @desc    Get specific equipment details
// @access  Private (Officer and Admin)
router.get('/equipment/:id', adminOrOfficer, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('issuedTo.userId', 'firstName lastName badgeNumber')
      .populate('addedBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    res.json({
      success: true,
      data: { equipment }
    });

  } catch (error) {
    console.error('Get equipment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching equipment details',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

module.exports = router;
