const roleCheck = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
        });
      }

      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during role verification.'
      });
    }
  };
};

// Specific role middlewares
const adminOnly = roleCheck('admin');
const officerOnly = roleCheck('officer');
const adminOrOfficer = roleCheck('admin', 'officer');

// Check if user can access own resource or is admin
const ownerOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const resourceUserId = req.params.userId || req.body.userId || req.query.userId;

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can access their own resource
    if (req.user._id.toString() === resourceUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });

  } catch (error) {
    console.error('Owner or admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resource access verification.'
    });
  }
};

// Check if user can modify equipment (admin or equipment owner)
const equipmentAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admin has full access
    if (req.user.role === 'admin') {
      return next();
    }

    // For officers, additional checks might be needed based on equipment status
    // This middleware can be extended based on business logic
    next();

  } catch (error) {
    console.error('Equipment access middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during equipment access verification.'
    });
  }
};

module.exports = {
  roleCheck,
  adminOnly,
  officerOnly,
  adminOrOfficer,
  ownerOrAdmin,
  equipmentAccess
};
