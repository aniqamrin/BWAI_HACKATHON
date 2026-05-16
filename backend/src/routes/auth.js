const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { query } = require('../db/connection');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { success, created, error, badRequest } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['startup', 'mentor', 'investor', 'user']).withMessage('Invalid role'),
  body('country').optional().trim(),
  validate
], async (req, res) => {
  try {
    const { full_name, email, password, role = 'user', country } = req.body;

    // Check existing user
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows[0]) {
      return badRequest(res, 'Email already registered');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, country)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role, country, created_at`,
      [full_name, email, password_hash, role, country]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`New user registered: ${email} (${role})`);

    return created(res, { user, token }, 'Registration successful');
  } catch (err) {
    logger.error('Registration error:', err);
    return error(res, 'Registration failed');
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return error(res, 'Invalid credentials', 401);
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password_hash, ...userWithoutPassword } = user;

    logger.info(`User logged in: ${email}`);

    return success(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (err) {
    logger.error('Login error:', err);
    return error(res, 'Login failed');
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, role, country, avatar_url, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch user');
  }
});

module.exports = router;
