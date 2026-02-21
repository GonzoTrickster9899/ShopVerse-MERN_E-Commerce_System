const Notification = require('../models/Notification');
const { asyncHandler } = require('../utils/errorHandler');

// @desc    Get my notifications
// @route   GET /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user.id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    totalNotifications: total,
    unreadCount,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
  res.status(200).json({ success: true });
});

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true });
});
