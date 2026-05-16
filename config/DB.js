
import mongoose from "mongoose";
import { DB_Name } from "../constant.js";


const connectDB = async ()=>{

    try {
        const connect= await mongoose.connect(`${process.env.MONGO_URI}/${DB_Name}`)
        console.log(`Mongo DB Connect Successfully!! with the URL -${connect.connection.host} ${connect.connection.name}`)
    } catch (error) {
        console.log("error in the mongoDB connection",error);
        process.exit(1);
    }
    
    
}

export default connectDB;
