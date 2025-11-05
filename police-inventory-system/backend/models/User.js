const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Valid Indian state codes
const VALID_STATE_CODES = [
  'IN', 'AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 'JH', 'KA', 'KL',
  'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'PB', 'RJ', 'SK', 'TN', 'TG',
  'TR', 'UP', 'UK', 'WB', 'AN', 'CH', 'DH', 'DD', 'DL', 'JK', 'LA', 'LD', 'PY'
];

// Valid rank codes
const VALID_RANK_CODES = ['PC', 'HC', 'ASI', 'SI', 'PSI', 'INSP', 'PI', 'DSP', 'SP', 'DGP', 'IPS'];

// Valid government email domains
const VALID_EMAIL_DOMAINS = ['police.gov.in', 'gov.in', 'state.gov.in'];

// Custom validator for Officer ID (NO separators)
// Format: STATERANKYEARSERIAL
// Example: INDGP20250001 (IN + DGP + 2025 + 0001)
const validateOfficerId = (value) => {
  if (!value || value.length < 12 || value.length > 18) return false;
  
  // First 2 chars must be valid state code
  const stateCode = value.substring(0, 2).toUpperCase();
  if (!VALID_STATE_CODES.includes(stateCode)) return false;
  
  // Must contain at least one valid rank code
  const hasValidRank = VALID_RANK_CODES.some(rank => value.toUpperCase().includes(rank));
  if (!hasValidRank) return false;
  
  // Find the year (4 consecutive digits) - should be after rank and before serial
  const yearMatch = value.match(/\d{4}/);
  if (!yearMatch) return false;
  
  const year = parseInt(yearMatch[0]);
  const currentYear = new Date().getFullYear();
  if (year < 1947 || year > currentYear + 1) return false;
  
  // Ensure there are digits after the year (serial number)
  const yearIndex = value.indexOf(yearMatch[0]);
  const afterYear = value.substring(yearIndex + 4);
  if (!/^\d+$/.test(afterYear) || afterYear.length < 1) return false;
  
  return true;
};

// Custom validator for government email
const validateGovEmail = (email) => {
  // Must start with capital letter
  if (!/^[A-Z]/.test(email)) return false;
  
  // Check domain
  const domain = email.split('@')[1];
  if (!domain) return false;
  
  return VALID_EMAIL_DOMAINS.some(validDomain => 
    domain === validDomain || domain.endsWith('.' + validDomain)
  );
};

// Custom validator for password
// IMPORTANT: Skip validation if password is already hashed (starts with $2a$ or $2b$)
const validatePassword = (password) => {
  // Skip validation for already-hashed passwords (bcrypt hash format)
  if (/^\$2[aby]\$/.test(password)) {
    return true; // Already hashed, validation passed
  }
  
  // Validate plain passwords
  if (password.length !== 8) return false;
  if (!/^[A-Z]/.test(password)) return false;
  if (!/^[A-Z][a-zA-Z0-9]{7}$/.test(password)) return false;
  return true;
};

const userSchema = new mongoose.Schema({
  officerId: {
    type: String,
    required: [true, 'Officer ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: validateOfficerId,
      message: 'Officer ID format: STATERANKYEARSERIAL (e.g., MHSP20210078). No spaces or separators. Must start with valid 2-letter state code, contain valid rank code, and end with 4-digit year (1947-2026).'
    }
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [3, 'Full name must be at least 3 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    enum: {
      values: [
        'Director General of Police (DGP)',
        'Superintendent of Police (SP)',
        'Deputy Commissioner of Police (DCP)',
        'Deputy Superintendent of Police (DSP)',
        'Police Inspector (PI)',
        'Sub-Inspector (SI)',
        'Police Sub-Inspector (PSI)',
        'Head Constable (HC)',
        'Police Constable (PC)'
      ],
      message: '{VALUE} is not a valid designation'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    validate: [
      {
        validator: function(v) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: 'Please enter a valid email address'
      },
      {
        validator: validateGovEmail,
        message: 'Email must start with capital letter and end with @police.gov.in, @gov.in, or @state.gov.in. Example: Officer@police.gov.in'
      }
    ]
  },
  dateOfJoining: {
    type: Date,
    required: [true, 'Date of joining is required'],
    validate: {
      validator: function(value) {
        return new Date(value) <= new Date();
      },
      message: 'Date of joining cannot be in the future'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: validatePassword,
      message: 'Password must be exactly 8 characters, start with a capital letter, and rest can be letters or numbers. Example: Admin123'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'officer'],
      message: '{VALUE} is not a valid role'
    },
    default: 'officer',
    required: true
  },
  rank: {
    type: String,
    required: [true, 'Rank is required'],
    enum: {
      values: [
        'Senior Command (DGP, SP, DCP)',
        'District Administrator (DSP)',
        'Police Station Officers (PI, SI, PSI)',
        'Police Station Staff (HC, PC)'
      ],
      message: '{VALUE} is not a valid rank category'
    },
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ officerId: 1 });
userSchema.index({ role: 1 });

// Hash password before saving (ONLY if password is modified and NOT already hashed)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Skip hashing if password is already hashed
  if (/^\$2[aby]\$/.test(this.password)) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Get years of service
userSchema.virtual('yearsOfService').get(function() {
  if (!this.dateOfJoining) return null;
  const years = (new Date() - new Date(this.dateOfJoining)) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(years);
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);

// Export validators
module.exports.VALID_STATE_CODES = VALID_STATE_CODES;
module.exports.VALID_RANK_CODES = VALID_RANK_CODES;
module.exports.VALID_EMAIL_DOMAINS = VALID_EMAIL_DOMAINS;