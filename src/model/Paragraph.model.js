import mongoose, { mongo }  from "mongoose";

const ParagraphSchema = new mongoose.Schema({
    content:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    difficulty:{
        type:String,
        enum:["easy","medium","hard"],
        default:"easy",
    },
    language:{
        type:String,
    },
    wordcount:{
        type:Number,
    },
    suitableFor:{
        type:[Number],

    },
    timeUsed:{
        type:Number
    },
    averageWpm:{
        type:Number,
    },
    isActive:{
        type:Boolean,
        default:true,
    }
    
})

const Paragraph = mongoose.model("paragraph",ParagraphSchema)

export default Paragraph;