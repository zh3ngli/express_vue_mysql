const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const auth = require('../middleware/auth');
const EARTH_RADIUS_KM = 6371;

function parseExpiryToMs(exp) {
  if (typeof exp === 'number') return exp * 1000;
  if (exp.endsWith('h')) return parseInt(exp) * 3600 * 1000;
  if (exp.endsWith('m')) return parseInt(exp) * 60 * 1000;
  if (exp.endsWith('s')) return parseInt(exp) * 1000;
  // fallback 1 hour
  return 3600 * 1000;
}
function formatTimestamp(t) {
  if (!t) return null;
  // t may be a Date object or MySQL formatted string — normalize to "YYYY-MM-DD HH:mm:ss"
  const d = new Date(t);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Admin
router.get('/', function (req, res) {
  res.redirect('/admin')
});

router.get('/admin', function (req, res) {
  res.render('index')
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: 400, message: 'email and password are required' });
    }
    const [rows] = await db.query(
      'SELECT id, password, role_type FROM users WHERE email = ? AND role_type = ? LIMIT 1', [email, 'a']
    );
    if (!rows || rows.length === 0) {
      return res.status(401).json({ status: 401, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ status: 401, message: 'Invalid credentials' });
    }
    return res.json({
      status: 200,
      message: 'Logged in',
      user_id: user.id
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
});

router.get('/admin/listings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM listings');
    const id = req.query.id;
    // generate actions header
    rows.map(d => {
      d.actions = '';
      d.created_at = formatTimestamp(d.created_at);
      d.updated_at = formatTimestamp(d.updated_at);
      return d
    })
    res.render('listings', { table_data: JSON.stringify(rows) })
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
})

router.post('/newListing', async (req, res) => {
  try {
    const { user_id, name, latitude, longitude } = req.body;
    await db.query(
      `INSERT INTO listings (user_id,name, latitude, longitude) VALUES (?, ?, ?, ?)`,
      [user_id, name, latitude, longitude]
    );
    return res.json({ status: 200, message: 'Success' })
  } catch (err) {
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
})

router.post('/updateListing', async (req, res) => {
  try {
    const { id, name, latitude, longitude } = req.body;
    await db.query(
      `UPDATE listings SET name = ?, latitude = ?, longitude = ? WHERE id = ?`,
      [name, latitude, longitude, id]
    );
    return res.json({ status: 200, message: 'Success' })
  } catch (err) {
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
})

router.post('/deleteListing', async (req, res) => {
  try {
    const { id } = req.body;
    await db.query(
      `DELETE FROM listings WHERE id = ?`,
      [id]
    );
    return res.json({ status: 200, message: 'Success' })
  } catch (err) {
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
})

// API
router.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: 400, message: 'email and password are required' });
    }
    const [rows] = await db.query('SELECT id, password, role_type FROM users WHERE email = ? AND role_type = ? LIMIT 1', [email, 'u']);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ status: 401, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ status: 401, message: 'Invalid credentials' });
    }

    const payload = {
      user_id: user.id,
      role_type: user.role_type
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const expiresAt = new Date(Date.now() + parseExpiryToMs(JWT_EXPIRES_IN)).toLocaleString('sv-SE').replace('T', ' ');

    return res.json({
      status: 200,
      message: 'Logged in',
      result: {
        user_id: user.id,
        access_token: token,
        token_type: 'Bearer',
        role_type: user.role_type,
        expires_at: expiresAt
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
});

router.get('/listing/get', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const user = req.user;

    // Validate lat/lon
    if (!latitude || !longitude) {
      return res.status(400).json({ status: 400, message: 'latitude and longitude query params are required' });
    }
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ status: 400, message: 'Invalid latitude or longitude' });
    }

    // Query: distance = 6371 * acos( cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)) )
    const sql = `
      SELECT id, name, created_at, updated_at,
        ROUND( ${EARTH_RADIUS_KM} * ACOS(
            COS(RADIANS(?)) * COS(RADIANS(latitude)) *
            COS(RADIANS(longitude) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(latitude))
        ), 1) AS distance
      FROM listings
      WHERE user_id = ?
      HAVING distance IS NOT NULL
      ORDER BY distance ASC
      LIMIT 100
    `;

    const params = [lat, lon, lat, user.user_id];
    const [rows] = await db.query(sql, params);

    return res.json({
      status: 200,
      message: 'Success',
      result: {
        current_page: 1,
        data: rows.map(r => ({
          id: r.id,
          name: r.name,
          distance: r.distance !== null ? r.distance.toString() : null,
          created_at: formatTimestamp(r.created_at),
          updated_at: formatTimestamp(r.updated_at)
        }))
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 500, message: 'Server error' });
  }
});

module.exports = router;
