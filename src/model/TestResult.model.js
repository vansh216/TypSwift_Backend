import mongoose from "mongoose";

const TestResultSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,
    },
    wpm:{
        type:Number,
        required:true,
    },
    accuracy:{
        type:Number,
        required:true,
    },
    duration:{
        type:Number,
        required:true,
    },
    errors:{
        type:Number,
        required:true,
    },
    wpmHistory:{
        type:[Number],
        required:true,
    },
    paragraphId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"paragraph",
        required:true,
    }
},{timestamps:true}) 

const TestResult = mongoose.medel("testResult",TestResultSchema);

export default TestResult;
    