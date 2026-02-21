const crypto = require('crypto');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { sendEmail, emailTemplates } = require('../utils/email');

// Helper: Send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();
  const cookieOptions = {
    expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  const userResponse = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    isEmailVerified: user.isEmailVerified,
    addresses: user.addresses,
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    token,
    user: userResponse,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError('An account with this email already exists', 400));

  const user = await User.create({ firstName, lastName, email, password, phone });

  // Generate email verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
  try {
    const template = emailTemplates.welcomeEmail(user, verificationUrl);
    await sendEmail({ to: user.email, ...template });
  } catch (err) {
    console.error('Email send error:', err);
    // Don't fail registration if email fails
  }

  sendTokenResponse(user, 201, res, 'Registration successful! Please verify your email.');
});

// @desc    Login user
// @route   POST /api/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) return next(new AppError('Please provide email and password', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('Invalid email or password', 401));
  if (!user.isActive) return next(new AppError('Account has been deactivated. Contact support.', 401));
  if (user.isLocked()) return next(new AppError('Account is temporarily locked. Try again in 30 minutes.', 423));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    return next(new AppError('Invalid email or password', 401));
  }

  // Reset login attempts on success
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Logout
// @route   POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 5000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
});

// @desc    Update profile
// @route   PUT /api/auth/update-profile
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {};
  const allowed = ['firstName', 'lastName', 'phone'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) fieldsToUpdate[field] = req.body[field];
  });

  // Handle avatar upload
  if (req.file) {
    fieldsToUpdate.avatar = {
      url: `/uploads/${req.file.filename}`,
      public_id: req.file.filename,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, user, message: 'Profile updated' });
});

// @desc    Update password
// @route   PUT /api/auth/update-password
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password updated');
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Don't reveal if email exists
    return res.status(200).json({ success: true, message: 'If an account exists, a reset email has been sent' });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  try {
    const template = emailTemplates.resetPasswordEmail(user, resetUrl);
    await sendEmail({ to: user.email, ...template });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Email could not be sent', 500));
  }

  res.status(200).json({ success: true, message: 'If an account exists, a reset email has been sent' });
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Invalid or expired reset token', 400));

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful');
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Invalid or expired verification token', 400));

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully' });
});

// @desc    Manage addresses
// @route   POST /api/auth/addresses
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }
  if (user.addresses.length === 0) req.body.isDefault = true;

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({ success: true, addresses: user.addresses, message: 'Address added' });
});

// @route   PUT /api/auth/addresses/:addressId
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) return next(new AppError('Address not found', 404));

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  Object.assign(address, req.body);
  await user.save();

  res.status(200).json({ success: true, addresses: user.addresses, message: 'Address updated' });
});

// @route   DELETE /api/auth/addresses/:addressId
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) return next(new AppError('Address not found', 404));

  address.deleteOne();
  await user.save();

  res.status(200).json({ success: true, addresses: user.addresses, message: 'Address removed' });
});
