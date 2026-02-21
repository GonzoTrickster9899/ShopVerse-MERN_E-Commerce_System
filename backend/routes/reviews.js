const express = require('express');
const router = express.Router();
const {
  getProductReviews, createReview, updateReview, deleteReview,
  markHelpful, reportReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/product/:productId', getProductReviews);
router.post('/', protect, upload.array('images', 5), createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/helpful', protect, markHelpful);
router.post('/:id/report', protect, reportReview);

module.exports = router;
