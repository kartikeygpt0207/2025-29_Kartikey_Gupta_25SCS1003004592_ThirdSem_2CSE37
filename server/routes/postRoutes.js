const express = require('express');
const { body } = require('express-validator');
const {
  createPost,
  getFeed,
  getPostById,
  deletePost,
  likePost,
  unlikePost,
} = require('../controllers/postController');
const {
  getPostComments,
  createComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getFeed)
  .post(
    [
      body('content')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Post content cannot exceed 2000 characters'),
      body('image')
        .optional({ values: 'falsy' })
        .trim()
        .isURL()
        .withMessage('Image must be a valid URL'),
    ],
    validate,
    createPost
  );

router.get('/:postId/comments', getPostComments);
router.post(
  '/:postId/comments',
  [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ max: 1000 })
      .withMessage('Comment cannot exceed 1000 characters'),
  ],
  validate,
  createComment
);

router.get('/:id', getPostById);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.delete('/:id/like', unlikePost);

module.exports = router;
