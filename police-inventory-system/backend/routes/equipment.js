const express = require('express');
const { body, validationResult } = require('express-validator');
const Equipment = require('../models/Equipment');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// @route   GET /api/equipment
// @desc    Get all equipment with pagination and filters
// @access  Private (Admin only)
router.get('/', adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category || '';
    const status = req.query.status || '';
    const search = req.query.search || '';

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

    const [equipment, total, categories, statusCounts] = await Promise.all([
      Equipment.find(query)
        .populate('issuedTo.userId', 'firstName lastName badgeNumber')
        .populate('addedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Equipment.countDocuments(query),
      Equipment.distinct('category'),
      Equipment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        equipment,
        categories,
        statusCounts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching equipment',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   POST /api/equipment
// @desc    Add new equipment
// @access  Private (Admin only)
router.post('/', adminOnly, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and cannot exceed 100 characters'),
  body('category').isIn([
    'Weapons', 'Communication', 'Protective Gear', 'Vehicles', 
    'Surveillance', 'Forensic Equipment', 'Medical Supplies', 'Office Equipment', 'Other'
  ]).withMessage('Valid category is required'),
  body('model').trim().isLength({ min: 1 }).withMessage('Model is required'),
  body('serialNumber').trim().isLength({ min: 1 }).withMessage('Serial number is required'),
  body('manufacturer').trim().isLength({ min: 1 }).withMessage('Manufacturer is required'),
  body('purchaseDate').isISO8601().withMessage('Valid purchase date is required'),
  body('cost').isNumeric({ min: 0 }).withMessage('Valid cost is required'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor', 'Out of Service']),
  body('notes').optional().isLength({ max: 500 })
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

    const {
      name, category, model, serialNumber, manufacturer, purchaseDate,
      cost, location, condition, notes, specifications, warrantyInfo
    } = req.body;

    // Check if equipment with same serial number exists
    const existingEquipment = await Equipment.findOne({ serialNumber });
    if (existingEquipment) {
      return res.status(400).json({
        success: false,
        message: 'Equipment with this serial number already exists'
      });
    }

    const equipment = new Equipment({
      name,
      category,
      model,
      serialNumber,
      manufacturer,
      purchaseDate: new Date(purchaseDate),
      cost,
      location,
      condition: condition || 'Good',
      notes,
      specifications: specifications || {},
      warrantyInfo: warrantyInfo || {},
      addedBy: req.user._id
    });

    await equipment.save();

    const populatedEquipment = await Equipment.findById(equipment._id)
      .populate('addedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Equipment added successfully',
      data: { equipment: populatedEquipment }
    });

  } catch (error) {
    console.error('Add equipment error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Equipment with this serial number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error adding equipment',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   GET /api/equipment/:id
// @desc    Get specific equipment details
// @access  Private (Admin only)
router.get('/:id', adminOnly, async (req, res) => {
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

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Private (Admin only)
router.put('/:id', adminOnly, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('category').optional().isIn([
    'Weapons', 'Communication', 'Protective Gear', 'Vehicles', 
    'Surveillance', 'Forensic Equipment', 'Medical Supplies', 'Office Equipment', 'Other'
  ]),
  body('model').optional().trim().isLength({ min: 1 }),
  body('manufacturer').optional().trim().isLength({ min: 1 }),
  body('cost').optional().isNumeric({ min: 0 }),
  body('location').optional().trim().isLength({ min: 1 }),
  body('condition').optional().isIn(['Excellent', 'Good', 'Fair', 'Poor', 'Out of Service']),
  body('status').optional().isIn(['Available', 'Issued', 'Under Maintenance', 'Retired']),
  body('notes').optional().isLength({ max: 500 })
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

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    const {
      name, category, model, manufacturer, cost, location,
      condition, status, notes, specifications, warrantyInfo
    } = req.body;

    const updates = {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(model !== undefined && { model }),
      ...(manufacturer !== undefined && { manufacturer }),
      ...(cost !== undefined && { cost }),
      ...(location !== undefined && { location }),
      ...(condition !== undefined && { condition }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(specifications !== undefined && { specifications }),
      ...(warrantyInfo !== undefined && { warrantyInfo }),
      lastModifiedBy: req.user._id
    };

    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('issuedTo.userId', 'firstName lastName badgeNumber')
    .populate('addedBy', 'firstName lastName')
    .populate('lastModifiedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Equipment updated successfully',
      data: { equipment: updatedEquipment }
    });

  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating equipment',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment
// @access  Private (Admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Check if equipment is currently issued
    if (equipment.status === 'Issued') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete equipment that is currently issued'
      });
    }

    await Equipment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Equipment deleted successfully'
    });

  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting equipment',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   PUT /api/equipment/:id/issue
// @desc    Issue equipment to user
// @access  Private (Admin only)
router.put('/:id/issue', adminOnly, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('expectedReturnDate').optional().isISO8601().withMessage('Valid return date required')
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

    const { userId, expectedReturnDate } = req.body;

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    await equipment.issueToUser(
      userId,
      expectedReturnDate ? new Date(expectedReturnDate) : undefined
    );

    const updatedEquipment = await Equipment.findById(req.params.id)
      .populate('issuedTo.userId', 'firstName lastName badgeNumber');

    res.json({
      success: true,
      message: 'Equipment issued successfully',
      data: { equipment: updatedEquipment }
    });

  } catch (error) {
    console.error('Issue equipment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error issuing equipment',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route   PUT /api/equipment/:id/return
// @desc    Return equipment from user
// @access  Private (Admin only)
router.put('/:id/return', adminOnly, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    await equipment.returnFromUser();

    const updatedEquipment = await Equipment.findById(req.params.id);

    res.json({
      success: true,
      message: 'Equipment returned successfully',
      data: { equipment: updatedEquipment }
    });

  } catch (error) {
    console.error('Return equipment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error returning equipment',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

module.exports = router;
