
const express = require('express');
const { body, validationResult } = require('express-validator');
const Equipment = require('../models/Equipment');
const EquipmentPool = require('../models/EquipmentPool');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// ============================================
// EQUIPMENT POOL ROUTES
// ============================================

// @route GET /api/equipment/pools
// @desc Get all equipment pools with filters
// @access Private (Admin only)
router.get('/pools', adminOnly, async (req, res) => {
  try {
    const { category, designation, search } = req.query;
    
    const query = {
      ...(category && { category }),
      ...(designation && { authorizedDesignations: designation }),
      ...(search && {
        $or: [
          { poolName: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } }
        ]
      })
    };
    
    const pools = await EquipmentPool.find(query)
      .populate('addedBy', 'fullName officerId')
      .sort({ poolName: 1 });
    
    pools.forEach(pool => pool.updateCounts());
    
    res.json({
      success: true,
      data: { pools }
    });
    
  } catch (error) {
    console.error('Get pools error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching equipment pools',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @route GET /api/equipment/authorized-pools
// @desc Get equipment pools authorized for the logged-in officer
// @access Private
router.get('/authorized-pools', async (req, res) => {
  try {
    const { category, search } = req.query;
    const designation = req.user.designation;
    
    const query = {
      authorizedDesignations: designation,
      ...(category && { category }),
      ...(search && {
        $or: [
          { poolName: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } }
        ]
      })
    };
    
    const pools = await EquipmentPool.find(query)
      .select('poolName category model totalQuantity availableCount issuedCount')
      .sort({ poolName: 1 });
    
    pools.forEach(pool => pool.updateCounts());
    
    res.json({
      success: true,
      data: { pools, designation }
    });
    
  } catch (error) {
    console.error('Get authorized pools error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching authorized equipment pools'
    });
  }
});

// @route GET /api/equipment/pools/by-designation
// @desc Get equipment pools authorized for specific designation
// @access Private
router.get('/pools/by-designation', async (req, res) => {
  try {
    const designation = req.query.designation || req.user.designation;
    
    const pools = await EquipmentPool.find({
      authorizedDesignations: designation
    })
    .select('poolName category model totalQuantity availableCount issuedCount items.uniqueId items.status')
    .sort({ poolName: 1 });
    
    pools.forEach(pool => pool.updateCounts());
    
    res.json({
      success: true,
      data: { pools, designation }
    });
    
  } catch (error) {
    console.error('Get pools by designation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching equipment pools'
    });
  }
});

// @route POST /api/equipment/pools
// @desc Create new equipment pool
// @access Private (Admin only)
router.post('/pools', adminOnly, [
  body('poolName').trim().isLength({ min: 1 }).withMessage('Pool name is required'),
  body('category').isIn([
    'Firearm', 'Ammunition', 'Protective Gear', 'Communication Device',
    'Vehicle', 'Tactical Equipment', 'Less-Lethal Weapon', 'Forensic Equipment',
    'Medical Supplies', 'Office Equipment', 'Other'
  ]).withMessage('Valid category is required'),
  body('model').trim().isLength({ min: 1 }).withMessage('Model is required'),
  body('totalQuantity').isInt({ min: 1 }).withMessage('Total quantity must be at least 1'),
  body('prefix').trim().isLength({ min: 2, max: 5 }).withMessage('Prefix must be 2-5 characters'),
  body('authorizedDesignations').isArray({ min: 1 }).withMessage('At least one authorized designation is required'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required')
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
      poolName, category, subCategory, model, manufacturer,
      totalQuantity, prefix, authorizedDesignations, location,
      purchaseDate, totalCost, supplier, notes
    } = req.body;
    
    const pool = new EquipmentPool({
      poolName,
      category,
      subCategory,
      model,
      manufacturer,
      totalQuantity,
      authorizedDesignations,
      location,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      totalCost,
      supplier,
      notes,
      addedBy: req.user._id
    });
    
    // Generate items with unique IDs
    for (let i = 0; i < totalQuantity; i++) {
      const num = (i + 1).toString().padStart(3, '0');
      const uniqueId = `${prefix}${num}`;
      
      pool.items.push({
        uniqueId,
        status: 'Available',
        condition: 'Excellent',
        location
      });
    }
    
    pool.updateCounts();
    await pool.save();
    
    const populatedPool = await EquipmentPool.findById(pool._id)
      .populate('addedBy', 'fullName officerId');
    
    res.status(201).json({
      success: true,
      message: `Equipment pool created with ${totalQuantity} items`,
      data: { pool: populatedPool }
    });
    
  } catch (error) {
    console.error('Create pool error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating equipment pool'
    });
  }
});

// @route GET /api/equipment/pools/:poolId
// @desc Get specific pool details
// @access Private
router.get('/pools/:poolId', async (req, res) => {
  try {
    const pool = await EquipmentPool.findById(req.params.poolId)
      .populate('addedBy', 'fullName officerId')
      .populate('items.currentlyIssuedTo.userId', 'fullName officerId designation')
      .populate('items.usageHistory.userId', 'fullName officerId designation');
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Equipment pool not found'
      });
    }
    
    pool.updateCounts();
    
    res.json({
      success: true,
      data: { pool }
    });
    
  } catch (error) {
    console.error('Get pool details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pool details'
    });
  }
});

// @route POST /api/equipment/pools/:poolId/issue
// @desc Issue equipment from pool
// @access Private (Admin only)
router.post('/pools/:poolId/issue', adminOnly, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('purpose').optional().trim()
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
    
    const { userId, purpose } = req.body;
    
    const pool = await EquipmentPool.findById(req.params.poolId);
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Equipment pool not found'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const assignedItem = await pool.issueItem(
      user._id,
      user.officerId,
      user.fullName,
      user.designation,
      purpose,
      req.user._id
    );
    
    res.json({
      success: true,
      message: 'Equipment issued successfully',
      data: {
        assignedItem: assignedItem.uniqueId,
        issuedTo: `${user.fullName} (${user.officerId})`,
        issuedDate: assignedItem.currentlyIssuedTo.issuedDate,
        poolAvailableCount: pool.availableCount
      }
    });
    
  } catch (error) {
    console.error('Issue equipment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error issuing equipment'
    });
  }
});

// @route POST /api/equipment/pools/:poolId/return
// @desc Return equipment to pool
// @access Private (Admin only)
router.post('/pools/:poolId/return', adminOnly, [
  body('uniqueId').trim().isLength({ min: 1 }).withMessage('Unique ID is required'),
  body('condition').isIn(['Excellent', 'Good', 'Fair', 'Poor']).withMessage('Valid condition is required'),
  body('remarks').optional().trim()
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
    
    const { uniqueId, condition, remarks } = req.body;
    
    const pool = await EquipmentPool.findById(req.params.poolId);
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Equipment pool not found'
      });
    }
    
    const returnedItem = await pool.returnItem(
      uniqueId,
      condition,
      remarks,
      req.user._id
    );
    
    res.json({
      success: true,
      message: 'Equipment returned successfully',
      data: {
        uniqueId: returnedItem.uniqueId,
        daysUsed: returnedItem.usageHistory[returnedItem.usageHistory.length - 1].daysUsed,
        condition: returnedItem.condition,
        poolAvailableCount: pool.availableCount
      }
    });
    
  } catch (error) {
    console.error('Return equipment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Server error returning equipment'
    });
  }
});

// @route GET /api/equipment/pools/:poolId/items/:uniqueId/history
// @desc Get complete history of specific item
// @access Private
router.get('/pools/:poolId/items/:uniqueId/history', async (req, res) => {
  try {
    const pool = await EquipmentPool.findById(req.params.poolId)
      .populate('items.usageHistory.userId', 'fullName officerId designation')
      .populate('items.usageHistory.issuedBy', 'fullName officerId')
      .populate('items.usageHistory.returnedTo', 'fullName officerId');
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Equipment pool not found'
      });
    }
    
    const item = pool.findItemByUniqueId(req.params.uniqueId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in pool'
      });
    }
    
    res.json({
      success: true,
      data: {
        poolName: pool.poolName,
        uniqueId: item.uniqueId,
        currentStatus: item.status,
        currentCondition: item.condition,
        usageHistory: item.usageHistory,
        maintenanceHistory: item.maintenanceHistory
      }
    });
    
  } catch (error) {
    console.error('Get item history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching item history'
    });
  }
});

// @route GET /api/equipment/my-equipment-history
// @desc Get equipment history for logged-in officer
// @access Private
router.get('/my-equipment-history', async (req, res) => {
  try {
    const pools = await EquipmentPool.find({
      'items.usageHistory.officerId': req.user.officerId
    })
    .select('poolName category model items');
    
    const myHistory = pools.map(pool => {
      const myItems = pool.items
        .filter(item => 
          item.usageHistory.some(h => h.officerId === req.user.officerId)
        )
        .map(item => ({
          uniqueId: item.uniqueId,
          currentStatus: item.status,
          myUsage: item.usageHistory.filter(h => h.officerId === req.user.officerId)
        }));
      
      return {
        poolName: pool.poolName,
        category: pool.category,
        model: pool.model,
        itemsUsed: myItems
      };
    }).filter(pool => pool.itemsUsed.length > 0);
    
    res.json({
      success: true,
      data: { history: myHistory }
    });
    
  } catch (error) {
    console.error('Get my equipment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching equipment history'
    });
  }
});

// @route GET /api/equipment/currently-issued
// @desc Get all currently issued equipment
// @access Private (Admin only)
router.get('/currently-issued', adminOnly, async (req, res) => {
  try {
    const pools = await EquipmentPool.find()
      .populate('items.currentlyIssuedTo.userId', 'fullName officerId designation')
      .select('poolName category model items');
    
    const issuedItems = [];
    
    pools.forEach(pool => {
      pool.items.forEach(item => {
        if (item.status === 'Issued' && item.currentlyIssuedTo) {
          issuedItems.push({
            poolName: pool.poolName,
            uniqueId: item.uniqueId,
            category: pool.category,
            model: pool.model,
            issuedTo: item.currentlyIssuedTo
          });
        }
      });
    });
    
    res.json({
      success: true,
      data: { 
        issuedItems,
        total: issuedItems.length
      }
    });
    
  } catch (error) {
    console.error('Get currently issued equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching issued equipment'
    });
  }
});

// @route DELETE /api/equipment/pools/:poolId
// @desc Delete equipment pool
// @access Private (Admin only)
router.delete('/pools/:poolId', adminOnly, async (req, res) => {
  try {
    const pool = await EquipmentPool.findByIdAndDelete(req.params.poolId);
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Equipment pool not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Equipment pool deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete pool error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting equipment pool'
    });
  }
});

// @route GET /api/equipment
// @desc Get all equipment with pagination and filters
// @access Private (Admin only)
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
        .populate('issuedTo.userId', 'fullName officerId')
        .populate('addedBy', 'fullName officerId')
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
      message: 'Server error fetching equipment'
    });
  }
});

module.exports = router;