const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const { formatPost, formatPosts } = require('../utils/formatPost');

const createPost = async (req, res, next) => {
  try {
    const { content, image } = req.body;
    const trimmedContent = (content || '').trim();
    const trimmedImage = (image || '').trim();

    if (!trimmedContent && !trimmedImage) {
      return res.status(400).json({
        success: false,
        message: 'Post must include text content or an image URL',
      });
    }

    const post = await Post.create({
      author: req.user._id,
      content: trimmedContent,
      image: trimmedImage,
    });

    await post.populate('author', 'username name profileImage');

    return res.status(201).json({
      success: true,
      data: {
        post: formatPost(post, req.user._id, 0),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const followedUsers = await Follow.find({ follower: req.user._id }).select('following');
    const authorIds = followedUsers.map((follow) => follow.following);
    authorIds.push(req.user._id);

    const [posts, total] = await Promise.all([
      Post.find({ author: { $in: authorIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username name profileImage'),
      Post.countDocuments({ author: { $in: authorIds } }),
    ]);

    const formattedPosts = await formatPosts(posts, req.user._id, Comment);

    return res.status(200).json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'username name profileImage'
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const commentsCount = await Comment.countDocuments({ post: post._id });

    return res.status(200).json({
      success: true,
      data: {
        post: formatPost(post, req.user._id, commentsCount),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
      });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    return res.status(200).json({
      success: true,
      data: {
        message: 'Post deleted successfully',
      },
    });
  } catch (error) {
    return next(error);
  }
};

const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'username name profileImage'
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const alreadyLiked = post.likes.some(
      (likeId) => likeId.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked',
      });
    }

    post.likes.push(req.user._id);
    await post.save();

    const commentsCount = await Comment.countDocuments({ post: post._id });

    return res.status(200).json({
      success: true,
      data: {
        post: formatPost(post, req.user._id, commentsCount),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'author',
      'username name profileImage'
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const likeIndex = post.likes.findIndex(
      (likeId) => likeId.toString() === req.user._id.toString()
    );

    if (likeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Post is not liked',
      });
    }

    post.likes.splice(likeIndex, 1);
    await post.save();

    const commentsCount = await Comment.countDocuments({ post: post._id });

    return res.status(200).json({
      success: true,
      data: {
        post: formatPost(post, req.user._id, commentsCount),
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPost,
  getFeed,
  getPostById,
  deletePost,
  likePost,
  unlikePost,
};
