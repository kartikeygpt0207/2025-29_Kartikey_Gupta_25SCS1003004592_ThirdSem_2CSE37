const express = require('express');
const { body } = require('express-validator');
const {
  getUserProfile,
  updateUserProfile,
  getUserPosts,
  getFollowers,
  getFollowing,
} = require('../controllers/userController');
const { followUser, unfollowUser } = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/:id', getUserProfile);
router.put(
  '/:id',
  [
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('profileImage')
      .optional({ values: 'falsy' })
      .trim()
      .isURL()
      .withMessage('Profile image must be a valid URL'),
  ],
  validate,
  updateUserProfile
);
router.get('/:id/posts', getUserPosts);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.post('/:id/follow', followUser);
router.delete('/:id/follow', unfollowUser);

module.exports = router;
