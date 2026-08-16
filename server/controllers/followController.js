const User = require('../models/User');
const Follow = require('../models/Follow');

const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const existingFollow = await Follow.findOne({
      follower: req.user._id,
      following: targetUser._id,
    });

    if (existingFollow) {
      return res.status(409).json({
        success: false,
        message: 'You are already following this user',
      });
    }

    await Follow.create({
      follower: req.user._id,
      following: targetUser._id,
    });

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: targetUser._id }),
      Follow.countDocuments({ follower: targetUser._id }),
    ]);

    return res.status(201).json({
      success: true,
      data: {
        isFollowing: true,
        followersCount,
        followingCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const follow = await Follow.findOneAndDelete({
      follower: req.user._id,
      following: targetUser._id,
    });

    if (!follow) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user',
      });
    }

    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: targetUser._id }),
      Follow.countDocuments({ follower: targetUser._id }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        isFollowing: false,
        followersCount,
        followingCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  followUser,
  unfollowUser,
};
