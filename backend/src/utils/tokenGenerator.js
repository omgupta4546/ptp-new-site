const crypto = require('crypto');

// Simple token generator – 16‑byte hex string (32 chars)
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = { generateToken };
