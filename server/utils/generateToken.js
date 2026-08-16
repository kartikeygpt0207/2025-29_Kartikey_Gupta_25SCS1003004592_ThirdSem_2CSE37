const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'token';
const TOKEN_EXPIRY = '7d';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: MAX_AGE_MS,
});

module.exports = {
  COOKIE_NAME,
  generateToken,
  getCookieOptions,
};
