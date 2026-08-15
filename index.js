import 'dotenv/config'

import http from 'http';
import connectDB from './config/DB.js';
import { connectRedis } from './config/redis.js';
import app from "./src/app.js"
import initializeSocket from './socket/index.js';

 const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    const server = http.createServer(app);
    initializeSocket(server);

    server.listen(process.env.PORT, () => {
      console.log('Server started at Port :', process.env.PORT);
    });

  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
