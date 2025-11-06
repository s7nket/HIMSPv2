
const mongoose = require('mongoose');

// Equipment Pool Schema - For managing groups of identical equipment
const equipmentPoolSchema = new mongoose.Schema({
  // Pool Information
  poolName: {
    type: String,
    required: [true, 'Pool name is required'],
    trim: true,
    maxlength: [100, 'Pool name cannot exceed 100 characters']
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
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
    ]
  },
  
  subCategory: {
    type: String,
    trim: true
  },
  
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  
  manufacturer: {
    type: String,
    trim: true
  },
  
  // Authorization - Which designations can access this equipment
  authorizedDesignations: [{
    type: String,
    enum: [
      'Director General of Police (DGP)',
      'Superintendent of Police (SP)',
      'Deputy Commissioner of Police (DCP)',
      'Deputy Superintendent of Police (DSP)',
      'Police Inspector (PI)',
      'Sub-Inspector (SI)',
      'Police Sub-Inspector (PSI)',
      'Head Constable (HC)',
      'Police Constable (PC)'
    ]
  }],
  
  // Pool Statistics
  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [0, 'Total quantity cannot be negative']
  },
  
  availableCount: {
    type: Number,
    default: 0,
    min: [0, 'Available count cannot be negative']
  },
  
  issuedCount: {
    type: Number,
    default: 0,
    min: [0, 'Issued count cannot be negative']
  },
  
  maintenanceCount: {
    type: Number,
    default: 0,
    min: [0, 'Maintenance count cannot be negative']
  },
  
  damagedCount: {
    type: Number,
    default: 0,
    min: [0, 'Damaged count cannot be negative']
  },
  
  // Individual Items in Pool
  items: [{
    uniqueId: {
      type: String,
      required: true,
      trim: true
    },
    
    status: {
      type: String,
      enum: ['Available', 'Issued', 'Maintenance', 'Damaged', 'Lost', 'Retired'],
      default: 'Available'
    },
    
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor'],
      default: 'Good'
    },
    
    location: {
      type: String,
      trim: true
    },
    
    // Current Assignment
    currentlyIssuedTo: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      officerId: String,
      officerName: String,
      designation: String,
      issuedDate: Date,
      expectedReturnDate: Date,
      purpose: String
    },
    
    // Complete History for THIS Item
    usageHistory: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      officerId: {
        type: String,
        required: true
      },
      officerName: {
        type: String,
        required: true
      },
      designation: {
        type: String,
        required: true
      },
      issuedDate: {
        type: Date,
        required: true
      },
      returnedDate: Date,
      daysUsed: Number,
      purpose: String,
      conditionAtIssue: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor']
      },
      conditionAtReturn: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor']
      },
      remarks: String,
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      returnedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    
    // Maintenance History for THIS Item
    maintenanceHistory: [{
      date: {
        type: Date,
        required: true
      },
      type: {
        type: String,
        enum: ['Routine', 'Repair', 'Inspection', 'Upgrade', 'Cleaning']
      },
      description: String,
      cost: Number,
      performedBy: String,
      nextMaintenanceDate: Date
    }],
    
    // Item-specific dates
    lastInspectionDate: Date,
    nextInspectionDate: Date
  }],
  
  // Pool Metadata
  purchaseDate: Date,
  totalCost: Number,
  supplier: String,
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  
  warrantyInfo: {
    warrantyPeriod: String,
    warrantyExpiry: Date,
    warrantyProvider: String
  },
  
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
equipmentPoolSchema.index({ poolName: 1 });
equipmentPoolSchema.index({ category: 1 });
equipmentPoolSchema.index({ authorizedDesignations: 1 });
equipmentPoolSchema.index({ 'items.uniqueId': 1 });
equipmentPoolSchema.index({ 'items.status': 1 });
equipmentPoolSchema.index({ 'items.currentlyIssuedTo.userId': 1 });
equipmentPoolSchema.index({ 'items.currentlyIssuedTo.officerId': 1 });

// Method to generate unique IDs for items
equipmentPoolSchema.methods.generateUniqueIds = function(prefix, startFrom, count) {
  const ids = [];
  for (let i = 0; i < count; i++) {
    const num = (startFrom + i).toString().padStart(3, '0');
    ids.push(`${prefix}${num}`);
  }
  return ids;
};

// Method to update counts
equipmentPoolSchema.methods.updateCounts = function() {
  const items = this.items || [];
  this.availableCount = items.filter(item => item.status === 'Available').length;
  this.issuedCount = items.filter(item => item.status === 'Issued').length;
  this.maintenanceCount = items.filter(item => item.status === 'Maintenance').length;
  this.damagedCount = items.filter(item => item.status === 'Damaged').length;
};

// Method to get next available item
equipmentPoolSchema.methods.getNextAvailableItem = function() {
  return this.items.find(item => item.status === 'Available');
};

// Method to find item by unique ID
equipmentPoolSchema.methods.findItemByUniqueId = function(uniqueId) {
  return this.items.find(item => item.uniqueId === uniqueId);
};

// Method to issue item from pool
equipmentPoolSchema.methods.issueItem = async function(userId, officerId, officerName, designation, purpose, issuedBy) {
  const availableItem = this.getNextAvailableItem();
  
  if (!availableItem) {
    throw new Error('No available items in pool');
  }
  
  // Check authorization
  if (!this.authorizedDesignations.includes(designation)) {
    throw new Error(`This equipment is not authorized for ${designation}`);
  }
  
  // Update item status
  availableItem.status = 'Issued';
  availableItem.currentlyIssuedTo = {
    userId,
    officerId,
    officerName,
    designation,
    issuedDate: new Date(),
    purpose: purpose || 'Regular Duty'
  };
  
  // Add to history
  availableItem.usageHistory.push({
    userId,
    officerId,
    officerName,
    designation,
    issuedDate: new Date(),
    purpose: purpose || 'Regular Duty',
    conditionAtIssue: availableItem.condition,
    issuedBy
  });
  
  // Update counts
  this.updateCounts();
  
  await this.save();
  return availableItem;
};

// Method to return item to pool
equipmentPoolSchema.methods.returnItem = async function(uniqueId, condition, remarks, returnedTo) {
  const item = this.findItemByUniqueId(uniqueId);
  
  if (!item) {
    throw new Error('Item not found in pool');
  }
  
  if (item.status !== 'Issued') {
    throw new Error('Item is not currently issued');
  }
  
  // Update latest history entry
  const latestHistory = item.usageHistory[item.usageHistory.length - 1];
  latestHistory.returnedDate = new Date();
  latestHistory.conditionAtReturn = condition || item.condition;
  latestHistory.remarks = remarks || '';
  latestHistory.returnedTo = returnedTo;
  
  // Calculate days used
  const issuedDate = new Date(latestHistory.issuedDate);
  const returnedDate = new Date(latestHistory.returnedDate);
  latestHistory.daysUsed = Math.ceil((returnedDate - issuedDate) / (1000 * 60 * 60 * 24));
  
  // Clear current assignment
  item.currentlyIssuedTo = undefined;
  item.status = 'Available';
  item.condition = condition || item.condition;
  
  // Update counts
  this.updateCounts();
  
  await this.save();
  return item;
};

// Virtual for pool utilization rate
equipmentPoolSchema.virtual('utilizationRate').get(function() {
  if (this.totalQuantity === 0) return 0;
  return ((this.issuedCount / this.totalQuantity) * 100).toFixed(2);
});

// Ensure virtual fields are serialized
equipmentPoolSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

equipmentPoolSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EquipmentPool', equipmentPoolSchema);