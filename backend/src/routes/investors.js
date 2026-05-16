const express = require('express');
const { query } = require('../db/connection');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { success, created, error, notFound } = require('../utils/response');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.full_name, u.email FROM investors i
       JOIN users u ON i.user_id = u.id
       WHERE i.is_active = true ORDER BY i.portfolio_size DESC`
    );
    return success(res, { investors: result.rows });
  } catch (err) {
    return error(res, 'Failed to fetch investors');
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, u.full_name, u.email FROM investors i
       JOIN users u ON i.user_id = u.id WHERE i.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return notFound(res, 'Investor not found');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch investor');
  }
});

router.post('/create', authenticate, async (req, res) => {
  try {
    const {
      firm_name, investment_thesis, focus_industries, investment_stages,
      ticket_size_min, ticket_size_max, portfolio_size, country, website, linkedin_url
    } = req.body;

    const result = await query(
      `INSERT INTO investors 
       (user_id, firm_name, investment_thesis, focus_industries, investment_stages,
        ticket_size_min, ticket_size_max, portfolio_size, country, website, linkedin_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.user.id, firm_name, investment_thesis, focus_industries, investment_stages,
       ticket_size_min, ticket_size_max, portfolio_size || 0, country, website, linkedin_url]
    );

    await query('UPDATE users SET role = $1 WHERE id = $2', ['investor', req.user.id]);
    return created(res, result.rows[0], 'Investor profile created');
  } catch (err) {
    return error(res, 'Failed to create investor profile');
  }
});

module.exports = router;
