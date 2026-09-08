export function errorHandler(err, req, res, _next) {
  console.error('API Error:', err.message);
  console.error(err.stack);

  const code = Number(err.code || err.statusCode || 500);

  if (code === 401 || err.message?.includes('invalid_grant')) {
    return res.status(401).json({ error: 'Authentication expired. Please log in again.' });
  }

  if (code === 404) {
    return res.status(404).json({ error: 'Email not found or no longer accessible.' });
  }

  if (code === 403) {
    return res.status(403).json({ error: 'Access denied. Check Gmail API permissions.' });
  }

  if (code === 429) {
    return res.status(429).json({ error: 'Rate limited. Please try again later.' });
  }

  if (code === 500 || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({ error: 'Could not reach Gmail. Check your network connection.' });
  }

  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(code).json({ error: message });
}