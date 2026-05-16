const jwt = require('jsonwebtoken');
const { query } = require('../db/connection');
const { unauthorized, forbidden } = require('../utils/response');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!result.rows[0]) {
      return unauthorized(res, 'User not found');
    }

    if (!result.rows[0].is_active) {
      return unauthorized(res, 'Account is deactivated');
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired');
    }
    if (err.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Invalid token');
    }
    logger.error('Auth middleware error:', err);
    return unauthorized(res, 'Authentication failed');
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res);
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Access restricted to: ${roles.join(', ')}`);
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, full_name, email, role FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows[0]) {
      req.user = result.rows[0];
    }
  } catch (err) {
    // Silently fail for optional auth
  }
  next();
};

module.exports = { authenticate, requireRole, optionalAuth };
