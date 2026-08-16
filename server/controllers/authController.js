const User = require('../models/User');
const { generateToken, getCookieOptions, COOKIE_NAME } = require('../utils/generateToken');

const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).select('_id email username');

    if (existingUser) {
      const message =
        existingUser.email === email.toLowerCase()
          ? 'Email is already registered'
          : 'Username is already taken';

      return res.status(409).json({
        success: false,
        message,
      });
    }

    const user = await User.create({
      name: name || '',
      username,
      email,
      password,
    });

    const token = generateToken(user._id);

    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(201).json({
      success: true,
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.cookie(COOKIE_NAME, token, getCookieOptions());

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

const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });

  return res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
};

const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
