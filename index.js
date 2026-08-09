import 'dotenv/config'


import connectDB from './config/DB.js';
import { connectRedis } from './config/redis.js';
import app from "./src/app.js"

 await connectRedis();

connectDB().then(()=>{

    
    app.listen(process.env.PORT,()=>{console.log("Server started at Port :",process.env.PORT)});
})
.catch( (error)=>{
    console.log(error);
    
})
