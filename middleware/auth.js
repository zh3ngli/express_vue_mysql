// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'replace_with_secret';

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'];
  
  if (!auth) {
    return res.status(401).json({ status: 401, message: 'Missing Authorization header' });
  }

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ status: 401, message: 'Invalid Authorization header' });
  }

  const token = parts[1];
  try {
    const payload = jwt.verify(token, secret);
    // payload should include user_id and role_type
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ status: 401, message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;