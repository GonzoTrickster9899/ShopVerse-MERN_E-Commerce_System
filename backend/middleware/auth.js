const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/errorHandler');

// Protect routes - require authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check header
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('Not authorized. Please log in.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return next(new AppError('User no longer exists', 401));
    if (!user.isActive) return next(new AppError('Account has been deactivated', 401));

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Not authorized. Invalid token.', 401));
  }
});

// Optional auth - sets req.user if token exists, but doesn't require it
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (e) {
      // Token invalid, continue without user
    }
  }
  next();
});

// Restrict to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Role '${req.user.role}' is not authorized for this action`, 403));
    }
    next();
  };
};

module.exports = { protect, optionalAuth, authorize };
