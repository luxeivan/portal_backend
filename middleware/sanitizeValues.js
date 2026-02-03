///sanitizeValues.js
function sanitizeValues(req, res, next) {
  if (req.body?.values && typeof req.body.values === 'object') {
    req.body.values = sanitizeObject(req.body.values);
  }
  next();
}

function sanitizeObject(obj, depth = 0) {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj;

  // Защита от prototype pollution
  if (obj.__proto__ !== undefined || obj.constructor !== undefined) {
    obj = Object.fromEntries(
      Object.entries(obj).filter(([k]) => !['__proto__', 'constructor', 'prototype'].includes(k))
    );
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const safeKey = String(key).substring(0, 64).replace(/[^\w\-_]/g, '');
    if (!safeKey) continue;

    let safeValue;
    if (typeof value === 'string') {
      safeValue = value
        .replace(/<[^>]*>/g, '')          // HTML
        .replace(/\{\{[^}]*\}\}/g, '')    // template injection
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .substring(0, 10_000);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      safeValue = value;
    } else if (typeof value === 'object') {
      safeValue = sanitizeObject(value, depth + 1);
    } else {
      continue; // undefined, symbol, bigint — игнорируем
    }

    result[safeKey] = safeValue;
  }

  return result;
}

module.exports = { sanitizeValues };