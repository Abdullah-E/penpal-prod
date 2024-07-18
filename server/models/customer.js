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
const GENDER_TYPES = [
    "Other",
    "Male",
    "Female"
]

const ORIENTATION_TYPES = [
    "Other",
    "Bi-Sexual",
    "Gay",
    "Lesbian",
    "Straight",
    "Transgender",
    "LGBTQ+"
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
    gender:{
        type:String,
        required:false,
        enum:GENDER_TYPES,
        default:GENDER_TYPES[0]
    },
    orientation:{
        type:String,
        required:false,
        enum:ORIENTATION_TYPES,
        default:ORIENTATION_TYPES[0]
    },
    race:{
        type:String,
        required:false,
        default:""
    },
    education:{
        type:String,
        required:false,
        default:""
    },
    age:{
        type:String,
        required:false,
        default:""
    },
    dateOfBirth:{
        type:Date,
        required:false,
        default: new Date(0)
    },
    height:{
        type:String,
        required:false,
        default:""
    },
    weight:{
        type: String,
        required: false,
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
        required:false,
        default: () => ({})
    },
    rating:{
        type:Number,
        required:false,
        min:1,
        max:5
    },
    numRatings:{
        type:Number,
        required:false,
        default:0
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    }
})

const Customer = mongoose.model('Customer', customerSchema)
export default Customer