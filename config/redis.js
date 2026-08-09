import Redis from 'ioredis';

let client = null;

// Build Redis config based on environment
// Dev  → Docker local Redis
// Prod → Redis Cloud remote URL
const buildRedisConfig = () => {

  // Production — Redis Cloud 
  if (process.env.NODE_ENV === 'production') {
    return {
      // ioredis parses URL automatically
      // redis://default:pass@redis-cloud.com:port
      lazyConnect       : true,
      tls               : {},
      password          : process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        // Retry with exponential backoff
        // Max wait 30 seconds between retries
        const delay = Math.min(times * 1000, 30000);
        console.log(`Redis retry attempt ${times} — waiting ${delay}ms`);
        return delay;
      },
      reconnectOnError(err) {
        // Reconnect on connection errors
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        if (targetErrors.some(e => err.message.includes(e))) {
          return true;
        }
        return false;
      },
    };
  }

  // Development -Docker Redis 
  return {
    host              : 'localhost',
    port              : 6379,
    password          : process.env.REDIS_PASSWORD,
    lazyConnect       : true,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // Stop retrying after 10 attempts in dev
      if (times > 10) {
        console.error('Redis max retries reached — giving up');
        return null;
      }
      const delay = Math.min(times * 500, 5000);
      console.log(`Redis retry attempt ${times} — waiting ${delay}ms`);
      return delay;
    },
  };
};

// Connect to Redis
const connectRedis = async () => {
  try {
    // Create client
    // Production uses URL — ioredis parses it
    // Development uses host + port config
    if (process.env.NODE_ENV === 'production') {
      client = new Redis(
        process.env.REDIS_URL,
        buildRedisConfig()
      );
    } else {
      client = new Redis(buildRedisConfig());
    }

    // Event listeners
    client.on('connect', () => {
      console.log(`Redis connected — ${process.env.NODE_ENV} mode`);
    });

    client.on('ready', () => {
      console.log('Redis ready to use');
    });

    client.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    client.on('close', () => {
      console.log('Redis connection closed');
    });

    client.on('reconnecting', (time) => {
      console.log(`Redis reconnecting in ${time}ms`);
    });

    client.on('end', () => {
      console.log('Redis connection ended');
      client = null;
    });

    // Trigger connection
    // lazyConnect means we manually trigger
    await client.connect();

    // Verify connection
    const pong = await client.ping();
    if (pong === 'PONG') {
      console.log('Redis ping successful');
    }

    return client;

  } catch (error) {
    console.error('Redis connection failed:', error.message);

    // Do not crash the app if Redis fails
    // Rate limiting skipped gracefully
    // App still works without Redis
    client = null;
    return null;
  }
};

// Disconnect Redis
// Called on graceful shutdown
const disconnectRedis = async () => {
  try {
    if (client) {
      await client.quit();
      client = null;
      console.log('Redis disconnected gracefully');
    }
  } catch (error) {
    console.error('Redis disconnect error:', error.message);
  }
};

// Get Redis client
// Always check for null before using

const getRedisClient = () => client;

// Check if Redis is connected and ready
const isRedisConnected = () => {
  return client !== null && client.status === 'ready';
};

export {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
};