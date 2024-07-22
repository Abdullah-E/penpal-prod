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

const RACE_TYPES= [
    "Other",
    "American Indian/Alaskan Native",
    "Asian American",
    "Black/African American",
    "Hispanic/Latino American",
    "Native Hawaiian/Pacific Islander",
    "White",
    "Multiracial",
]

const EDUCATION_TYPES = [
    "Other",
    "Less than HS Diploma or GED",
    "HS Diploma or GED",
    "Trade Certification",
    "Associates degree",
    "Bachelors degree",
    "Masters degree",
    "Doctorate",
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
        enum:RACE_TYPES,
        default:RACE_TYPES[0]
    },
    education:{
        type:String,
        required:false,
        enum:EDUCATION_TYPES,
        default:EDUCATION_TYPES[0]
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
    ratingReal:{
        type:Number,
        required:false,
        default:0
    },
    numRatings:{
        type:Number,
        required:false,
        default:0
    },
    profilePic:{
        type:String,
        required:false,
        default:""
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    customerUpdates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerUpdates'
    }],
})

const Customer = mongoose.model('Customer', customerSchema)
export default Customer