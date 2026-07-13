const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware — requires valid JWT Bearer token.
 * Attaches user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token = req.cookies.jwt; // Prioritize cookie

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Account has been banned'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

/**
 * Optional auth — attaches user if valid token present,
 * but does NOT reject the request if no token is found.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies.jwt; // Prioritize cookie

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user && !user.isBanned) {
      req.user = user;
    }

    next();
  } catch (err) {
    // Token invalid — proceed without user
    next();
  }
};

module.exports = { protect, optionalAuth };
