const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
    maxlength: [100, 'Equipment name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Weapons',
      'Communication',
      'Protective Gear',
      'Vehicles',
      'Surveillance',
      'Forensic Equipment',
      'Medical Supplies',
      'Office Equipment',
      'Other'
    ]
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative']
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Out of Service'],
    default: 'Good'
  },
  status: {
    type: String,
    enum: ['Available', 'Issued', 'Under Maintenance', 'Retired'],
    default: 'Available'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  issuedTo: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issuedDate: Date,
    expectedReturnDate: Date
  },
  maintenanceHistory: [{
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    cost: {
      type: Number,
      min: 0
    },
    performedBy: {
      type: String,
      required: true
    }
  }],
  specifications: {
    type: Map,
    of: String
  },
  images: [{
    url: String,
    caption: String
  }],
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  warrantyInfo: {
    warrantyPeriod: String,
    warrantyExpiry: Date,
    warrantyProvider: String
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

// Indexes for better query performance
equipmentSchema.index({ serialNumber: 1 });
equipmentSchema.index({ category: 1 });
equipmentSchema.index({ status: 1 });
equipmentSchema.index({ 'issuedTo.userId': 1 });
equipmentSchema.index({ addedBy: 1 });
equipmentSchema.index({ createdAt: -1 });

// Virtual for equipment age
equipmentSchema.virtual('age').get(function() {
  const today = new Date();
  const purchaseDate = new Date(this.purchaseDate);
  const diffTime = Math.abs(today - purchaseDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 365);
});

// Method to issue equipment
equipmentSchema.methods.issueToUser = function(userId, expectedReturnDate) {
  if (this.status !== 'Available') {
    throw new Error('Equipment is not available for issue');
  }

  this.status = 'Issued';
  this.issuedTo = {
    userId: userId,
    issuedDate: new Date(),
    expectedReturnDate: expectedReturnDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
  };

  return this.save();
};

// Method to return equipment
equipmentSchema.methods.returnFromUser = function() {
  if (this.status !== 'Issued') {
    throw new Error('Equipment is not currently issued');
  }

  this.status = 'Available';
  this.issuedTo = undefined;

  return this.save();
};

// Static method to get available equipment by category
equipmentSchema.statics.getAvailableByCategory = function(category) {
  return this.find({ 
    status: 'Available',
    ...(category && { category: category })
  });
};

// Ensure virtual fields are serialized
equipmentSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Equipment', equipmentSchema);
