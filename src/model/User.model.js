import mongoose from "mongoose";


const UserSchema= new mongoose.Schema({
        username:{
            type:String,
            required:true,
            trim:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true,
        },
        password:{
            type:String,
            required:true,
        }
},{timestamps:true})

const User= mongoose.model("user",UserSchema)

export default User