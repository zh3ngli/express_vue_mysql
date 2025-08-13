const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const bcrypt = require('bcrypt');
// require('dotenv').config();

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
      d.actions = ''
      return d
    })
    res.render('listings', { table_data: JSON.stringify(rows), user_id: id, test: rows })
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

module.exports = router;
