const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  requestType: {
    type: String,
    enum: ['Issue', 'Return', 'Maintenance'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  requestedDate: {
    type: Date,
    default: Date.now
  },
  expectedReturnDate: {
    type: Date,
    required: function() {
      return this.requestType === 'Issue';
    }
  },
  reason: {
    type: String,
    required: [true, 'Reason for request is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedDate: {
    type: Date
  },
  approvedDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedDate: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
requestSchema.index({ requestId: 1 });
requestSchema.index({ requestedBy: 1 });
requestSchema.index({ equipmentId: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ requestType: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ processedBy: 1 });

// Generate unique request ID BEFORE validation
requestSchema.pre('validate', async function(next) {
  if (!this.requestId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    try {
      // Find the last request of the day
      const lastRequest = await this.constructor.findOne({
        requestId: new RegExp(`^REQ-${year}${month}${day}`)
      }).sort({ requestId: -1 });

      let sequence = 1;
      if (lastRequest && lastRequest.requestId) {
        const lastSequence = parseInt(lastRequest.requestId.split('-')[2]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }

      this.requestId = `REQ-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;
      console.log('Generated requestId:', this.requestId);
    } catch (error) {
      console.error('Error generating requestId:', error);
      // Fallback to timestamp-based ID
      this.requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  next();
});

// Add status to history when status changes
requestSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.processedBy || this.requestedBy,
      changedDate: new Date(),
      notes: this.adminNotes
    });
  }
  next();
});

// Method to approve request
requestSchema.methods.approve = function(adminId, notes) {
  this.status = 'Approved';
  this.processedBy = adminId;
  this.processedDate = new Date();
  this.approvedDate = new Date();
  this.adminNotes = notes;

  return this.save();
};

// Method to reject request
requestSchema.methods.reject = function(adminId, reason) {
  this.status = 'Rejected';
  this.processedBy = adminId;
  this.processedDate = new Date();
  this.adminNotes = reason;

  return this.save();
};

// Method to complete request
requestSchema.methods.complete = function(adminId, notes) {
  this.status = 'Completed';
  this.processedBy = adminId;
  this.completedDate = new Date();
  if (notes) this.adminNotes = notes;

  return this.save();
};

// Static method to get pending requests
requestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'Pending' })
    .populate('requestedBy', 'firstName lastName username badgeNumber')
    .populate('equipmentId', 'name model serialNumber category')
    .sort({ createdAt: -1 });
};

// Static method to get user requests
requestSchema.statics.getUserRequests = function(userId) {
  return this.find({ requestedBy: userId })
    .populate('equipmentId', 'name model serialNumber category')
    .sort({ createdAt: -1 });
};

// Virtual for days since request
requestSchema.virtual('daysSinceRequest').get(function() {
  const today = new Date();
  const requestDate = new Date(this.requestedDate);
  const diffTime = Math.abs(today - requestDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
requestSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Request', requestSchema);
