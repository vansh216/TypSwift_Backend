import Redis from 'ioredis';

let client = null;

// Detect if Redis URL is remote or local
// Remote → Redis Cloud → needs TLS
// Local  → Docker      → no TLS
const isRemoteRedis = () => {
  const url = process.env.REDIS_URL || '';
  return (
    !url.includes('localhost') &&
    !url.includes('127.0.0.1')
  );
};

// Build Redis config
const buildRedisConfig = () => {

 

  // ── Local Docker Redis ──
  return {
    host                : 'localhost',
    port                : 6379,
    password            : process.env.REDIS_PASSWORD,
    lazyConnect         : true,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
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
    const remote = isRemoteRedis();

    // Remote → pass full URL with TLS config 
    // Local  → use host/port config
    client = remote
      ? client = new Redis(process.env.REDIS_URL)
      : new Redis(buildRedisConfig());

    // Event listeners
    client.on('connect', () => {
      console.log(`Redis connected — ${remote ? 'Redis Cloud' : 'Docker local'}`);
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
    await client.connect();

    // Verify
    const pong = await client.ping();
    if (pong === 'PONG') {
      console.log('Redis ping successful');
    }

    return client;

  } catch (error) {
    console.error('Redis connection failed:', error.message);
    client = null;
    return null;
  }
};

// Disconnect Redis
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
const getRedisClient = () => client;

// Check if Redis is ready
const isRedisConnected = () => {
  return client !== null && client.status === 'ready';
};

export {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
};