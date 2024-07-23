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

const RACE_TYPES = [
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

const RELIGION_TYPES = [
    "",
    "Other",
    "Agnostic",
    "Atheist",
    "Baptist",
    "Buddhis",
    "Catholic",
    "Christian",
    "Hindu",
    "Jewish",
    "Lutheran",
    "Methodist",
    "Mormon",
    "Muslim",
    "Native American",
    "Nondenominational",
    "Pagan",
    "Presbyterian",
    "Protestant",
    "Spiritual",
    "Wiccan",
]

const BODY_TYPES = [
"",
"Slim/Slender",
"Athletic",
"Average",
"Large",
"Husky",
"Thin",
]

const ASTROLOGICAL_SIGNS = [
    "",
    "Capricorn",
    "Aquarius",
    "Pisces",
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",

]

const RELATIONSHIP_TYPES = [
    "",
    "Other",
    "Single",
    "Married",
    "Divorced",
    "Widowed/Widower",
    "In a relationship",
]

const VETERAN_TYPES = [
    "",
    "Never served", 
    "Army veteran", 
    "Air force veteran",     
    "Navy veteran",  
    "Space force veteran",  
    "Coast guard veteran",  
    "Marine veteran",    
    "National guard veteran",    

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
    religiousPref:{
        type:String,
        required:false,
        enum:RELIGION_TYPES,
        default:RELIGION_TYPES[0]
    },
    bodyType:{
        type:String,
        required:false,
        enum:BODY_TYPES,
        default:BODY_TYPES[0]
    },
    astrologicalSign:{
        type:String,
        required:false,
        enum:ASTROLOGICAL_SIGNS,
        default:ASTROLOGICAL_SIGNS[0]
    },
    relationshipStatus:{
        type:String,
        required:false,
        enum:RELATIONSHIP_TYPES,
        default:RELATIONSHIP_TYPES[0]
    },
    veteranStatus:{
        type:String,
        required:false,
        enum:VETERAN_TYPES,
        default:VETERAN_TYPES[0]
    },
    institutionalEmailProvider:{
        type:String,
        required:false,
        default:""
    
    },
    hometown:{
        type:String,
        required:false,
        default:""
    },
    spokenLanguages:{
        type:[String],
        required:false,
        default:""
    },
    highSchool:{
        type:String,
        required:false,
        default:""
    },
    highSchoolCity:{
        type:String,
        required:false,
        default:""
    },
    highSchoolState:{
        type:String,
        required:false,
        default:""
    },
    college:{
        type:String,
        required:false,
        default:""
    },
    collegeCity:{
        type:String,
        required:false,
        default:""
    },
    collegeState:{
        type:String,
        required:false,
        default:""
    },
    profileComplete:{
        type:Boolean,
        required:true,
        default:false
    },
    profileApproved:{
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
    imageUrl:{
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

export const customerDefaultValues = {
    firstName: "",
    lastName: "",
    inmateNumber: "",
    mailingAddress: "",
    city: "",
    state: "",
    zipcode: "",
    gender: "Other",
    orientation: "Other",
    race: "Other",
    education: "Other",
    age: "",
    dateOfBirth: new Date(0),
    height: "",
    weight: "",
    hairColor: "Other",
    eyeColor: "Other",
    religiousPref: "",
    bodyType: "",
    astrologicalSign: "",
    relationshipStatus: "",
    veteranStatus: "",
    institutionalEmailProvider: "",
    hometown: "",
    spokenLanguages: [],
    highSchool: "",
    highSchoolCity: "",
    highSchoolState: "",
    college: "",
    collegeCity: "",
    profileComplete: false,
    personality: {},
    rating: null,
    ratingReal: null,
    numRatings: 0,
    imageUrl: "",
    createdAt: Date.now(),
    profileApproved: false,
}

const Customer = mongoose.model('Customer', customerSchema)
export default Customer