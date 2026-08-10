import 'dotenv/config'


import connectDB from './config/DB.js';
import { connectRedis } from './config/redis.js';
import app from "./src/app.js"

 const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.listen(process.env.PORT, () => {
      console.log('Server started at Port :', process.env.PORT);
    });

  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
