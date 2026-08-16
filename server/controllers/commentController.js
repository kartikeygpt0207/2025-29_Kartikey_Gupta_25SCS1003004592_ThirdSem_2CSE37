const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { formatAuthor } = require('../utils/formatPost');

const formatComment = (comment, currentUserId) => ({
  id: comment._id.toString(),
  content: comment.content,
  author: formatAuthor(comment.author),
  createdAt: comment.createdAt,
  isOwnComment: currentUserId
    ? comment.author._id.toString() === currentUserId.toString()
    : false,
});

const getPostComments = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comments = await Comment.find({ post: post._id })
      .sort({ createdAt: 1 })
      .populate('author', 'username name profileImage');

    return res.status(200).json({
      success: true,
      data: {
        comments: comments.map((comment) => formatComment(comment, req.user._id)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const content = (req.body.content || '').trim();

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      content,
    });

    await comment.populate('author', 'username name profileImage');

    return res.status(201).json({
      success: true,
      data: {
        comment: formatComment(comment, req.user._id),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      data: {
        message: 'Comment deleted successfully',
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getPostComments,
  createComment,
  deleteComment,
};
