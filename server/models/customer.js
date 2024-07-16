import mongoose from "mongoose";
import { personalitySchema } from "./personality.js";

const HAIR_TYPES = ["Bald", "Black", "Blonde", "Brown", "Gray", "Red", "Salt and Pepper", "Other"]
const EYE_TYPES = [
    "Black" ,
    "Blue" ,
    "Brown" ,
    "Green",
    "Hazel",
    "Other" ,
    ]

const customerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        default: ""
    },
    lastName:{
        type: String,
        required: true,
        default:""
    },
    inmateNumber:{
        type:String,
        required:true,
        default:""
    },
    mailingAddress:{
        type: String,
        required: true,
        default:""
    },
    city:{
        type: String,
        required: true,
        default:""
    },
    state:{
        type: String,
        required: true,
        default:""
    },
    zipcode:{
        type: String,
        required: true,
        default:""
    },
    dateOfBirth:{
        type:Date,
        required:true
    },
    height:{
        type:String,
        required:true,
        default:""
    },
    weight:{
        type: String,
        required: true,
        default:""
    },
    hairColor:{
        type:String,
        enum:HAIR_TYPES,
        required:true
    },
    eyeColor:{
        type:String,
        enum:EYE_TYPES,
        required:true
    },
    profileComplete:{
        type:Boolean,
        required:true,
        default:false
    },
    personality:{
        type:personalitySchema,
        required:false
    },
    rating:{
        type:Number,
        required:false,
        min:1,
        max:5
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    }
})

const Customer = mongoose.model('Customer', customerSchema)
export default Customer