const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const { formatPosts } = require('../utils/formatPost');
const Comment = require('../models/Comment');

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const [followersCount, followingCount, postsCount, isFollowing] = await Promise.all([
      Follow.countDocuments({ following: user._id }),
      Follow.countDocuments({ follower: user._id }),
      Post.countDocuments({ author: user._id }),
      req.user
        ? Follow.exists({ follower: req.user._id, following: user._id })
        : Promise.resolve(null),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          username: user.username,
          name: user.name,
          bio: user.bio,
          profileImage: user.profileImage,
          followersCount,
          followingCount,
          postsCount,
          isFollowing: Boolean(isFollowing),
          isOwnProfile: req.user ? req.user._id.toString() === user._id.toString() : false,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own profile',
      });
    }

    const { name, bio, profileImage } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ author: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username name profileImage'),
      Post.countDocuments({ author: user._id }),
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

const getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const follows = await Follow.find({ following: user._id })
      .sort({ createdAt: -1 })
      .populate('follower', 'username name profileImage');

    return res.status(200).json({
      success: true,
      data: {
        followers: follows.map((follow) => ({
          id: follow.follower._id.toString(),
          username: follow.follower.username,
          name: follow.follower.name,
          profileImage: follow.follower.profileImage,
          followedAt: follow.createdAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const follows = await Follow.find({ follower: user._id })
      .sort({ createdAt: -1 })
      .populate('following', 'username name profileImage');

    return res.status(200).json({
      success: true,
      data: {
        following: follows.map((follow) => ({
          id: follow.following._id.toString(),
          username: follow.following.username,
          name: follow.following.name,
          profileImage: follow.following.profileImage,
          followedAt: follow.createdAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserPosts,
  getFollowers,
  getFollowing,
};
