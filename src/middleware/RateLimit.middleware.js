import { getRedisClient, isRedisConnected } from '../../config/redis.js';

// Rate Limit Config per route group
const RATE_LIMITS = {
  auth: {
    windowSec : 15 * 60,  // 15 minutes
    maxRequests: 10,       // 10 requests per 15 min
    message   : 'Too many auth attempts. Please try again after 15 minutes.',
  },
  test: {
    windowSec : 60,        // 1 minute
    maxRequests: 30,       // 30 requests per minute
    message   : 'Too many test requests. Please slow down.',
  },
  ai: {
    windowSec : 60,        // 1 minute
    maxRequests: 5,        // 5 requests per minute
    message   : 'Too many AI analysis requests. Please wait a moment.',
  },
  leaderboard: {
    windowSec : 60,        // 1 minute
    maxRequests: 30,       // 30 requests per minute
    message   : 'Too many leaderboard requests. Please slow down.',
  },
  user: {
    windowSec : 60,        // 1 minute
    maxRequests: 30,       // 30 requests per minute
    message   : 'Too many requests. Please slow down.',
  },
  global: {
    windowSec : 60,        // 1 minute
    maxRequests: 60,       // 60 requests per minute
    message   : 'Too many requests. Please slow down.',
  },
};

// Get client IP address
// Works behind Nginx proxy too
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip']                              ||
    req.connection?.remoteAddress                         ||
    req.socket?.remoteAddress                             ||
    req.ip                                                ||
    'unknown'
  );
};

// Core rate limit function
const applyRateLimit = async (req, res, config) => {
  const redis = getRedisClient();

  // If Redis is down skip rate limiting 
  // App works normally without Redis
  if (!isRedisConnected() || !redis) {
    console.warn('Redis not connected — rate limiting skipped');
    return true; // allow request
  }

  const ip      = getClientIP(req);
  const key     = `rate_limit:${config.type}:${ip}`;

  try {
    // Increment request count
    const current = await redis.incr(key);

    // Set expiry on first request
    // Only set TTL once — first request in window
    if (current === 1) {
      await redis.expire(key, config.windowSec);
    }

    // Add rate limit headers
    // Standard headers — clients can read these
    res.setHeader('X-RateLimit-Limit',     config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - current));
    res.setHeader('X-RateLimit-Reset',     Math.ceil(Date.now() / 1000) + config.windowSec);

    // Check if limit exceeded 
    if (current > config.maxRequests) {
      res.setHeader('Retry-After', config.windowSec);
      return false; // block request
    }

    return true; // allow request

  } catch (error) {
    // ── If Redis errors skip rate limiting ──
    console.error('Rate limit error:', error.message);
    return true; // allow request on error
  }
};

// Rate limit factory
// Creates middleware for any route group
const createRateLimit = (type) => {
  const config = {
    ...RATE_LIMITS[type] || RATE_LIMITS.global,
    type,
  };

  return async (req, res, next) => {
    const allowed = await applyRateLimit(req, res, config);

    if (!allowed) {
      return res.status(429).json({
        success  : false,
        message  : config.message,
        retryAfter: `${config.windowSec} seconds`,
      });
    }

    next();
  };
};

// Pre-built middleware for each route group
// Import and use directly in routes
export const authRateLimit        = createRateLimit('auth');
export const testRateLimit        = createRateLimit('test');
export const aiRateLimit          = createRateLimit('ai');
export const leaderboardRateLimit = createRateLimit('leaderboard');
export const userRateLimit        = createRateLimit('user');
export const globalRateLimit      = createRateLimit('global');