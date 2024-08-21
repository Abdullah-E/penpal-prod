import mongoose from "mongoose";
import { personalitySchema } from "./personality.js";
import { products_cache } from "./product.js";

const HAIR_TYPES = ["", "Bald", "Black", "Blonde", "Brown", "Gray", "Red", "Salt and Pepper", "Other"]
const EYE_TYPES = [
    "",
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
    "Female",
    "Transgender Male to Female",
    "Transgender Females to Male",
    "Gender Non Conforming/Non binary",

]

const ORIENTATION_TYPES = [
    "",
    "Other",
    "Bi-Sexual",
    "Gay",
    "Lesbian",
    "Straight",
    "Transgender",
    "LGBTQ+"
]

const RACE_TYPES = [
    "",
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
    "",
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
    "Buddhist",
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

const STATUS_TYPES = [
    "new",
    "active",
    "expired",
    "inactive"
]

const customerSchema = new mongoose.Schema({
    basicInfo:{

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
        email:{type:String, required:false, default:""},
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
        bio:{
            type: String,
            required: false,
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
    }, 
    pendingPayments:{
        creation:{type:Boolean, required:true, default:true},
        renewal:{type:Boolean, required:true, default:false},
        update:{type:Boolean, required:true, default:false},
        updateNum:{type:Number, required:true, default:0},
        wordLimit:{type:Number, required:true, default:0},
        photo:{type:Boolean, required:true, default:false},
        totalPaidPhotos:{type:Number, required:true, default:0},
        totalAmount:{type:Number, required:false, default:0},
        basicInfo:{type:Object, required:false, default:{}},
        personalityInfo:{type:Object, required:false, default:{}},
        // photos:{type:Object, required:false, default:{}}
    },
    personalityInfo:{
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
    photos:{
        imageUrl:{
            type:String,
            required:false,
            default:""
        },
        artworks:{
            type:[String],
            required:false,
            default:""
        },
        total:{
            type:Number,
            required:false,
            default:0
        }

    },
    imageId:{
        type:String,
        required:false,
        default:""
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    
    customerUpdate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerUpdates'
    },
    
    customerStatus:{
        status:{type:String,required:false,enum:STATUS_TYPES,default:STATUS_TYPES[0]},
        tag:{type:String,required:false,},
        profileApproved:{type:Boolean,required:true,default:false},
        profileComplete:{type:Boolean,required:true,default:false},
        wordLimitExtended:{type:Boolean, required:false, default:false},
        bioWordLimit:{type:Number, required:false, default:350},
        photoLimit:{type:Number, required:false, default:3},
        premiumPlacement:{type:Boolean,required:false,default:false},
        featuredPlacement:{type:Boolean,required:false,default:false},
        recentlyUpdated:{type:Boolean,required:false,default:false},
        newlyListed:{type:Boolean,required:false,default:false},
        lastUpdated:{type: Date,required: false},
        premiumExpires:{type: Date,required: false},
        featuredExpires:{type: Date,required: false},
        lastMatched:{type: Date,required: false},
        expiresAt:{type: Date,required: false},
    },
})

export const customerDefaultValues = {
    basicInfo:{
        firstName: "",
        lastName: "",
        inmateNumber: "",
        mailingAddress: "",
        email: "",
        city: "",
        state: "",
        zipcode: "",
        bio: "",
        gender: "",
        orientation: "",
        race: "",
        education: "",
        age: "",
        dateOfBirth: new Date(0),
        height: "",
        weight: "",
        hairColor: "",
        eyeColor: "",
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
    },
    pendingPayments:{
        creation: true,
        renewal: false,
        update: false,
        updateNum: 0,
        wordLimit: 0,
        photo: false,
        totalPaidPhotos: 0,
        totalAmount: 0,
        basicInfo: {},
        personalityInfo: {},
        photos: {}
    },
    customerStatus:{
        profileComplete: false,
        profileApproved: false,
        premiumPlacement: false,
        featuredPlacement: false,
        recentlyUpdated: false,
        newlyListed: true,
        wordLimitExtended: false,
        bioWordLimit:350,
        photoLimit: 3,
        premiumExpires: null,
        featuredExpires: null,
        status: "new",
        tag:"",
        lastMatched: null,
        lastUpdated: null,
        expiresAt: null
    },
    personalityInfo: {},
    rating: null,
    ratingReal: null,
    numRatings: 0,
    photos:{
        imageUrl: "",
        artworks: [],
        total: 0
    },
    imageId: "",
    createdAt: Date.now(),
}


export const updatePendingPayments = function(cust) {
    // console.log('updating pending payments', products_cache);

    cust.pendingPayments.totalAmount = 0;

    if (cust.pendingPayments.creation) {
        const product = products_cache.find(p => p.name === 'creation');
        if (product) cust.pendingPayments.totalAmount += product.price;
    }
    if (cust.pendingPayments.renewal) {
        const product = products_cache.find(p => p.name === 'renewal');
        if (product) cust.pendingPayments.totalAmount += product.price;
    }
    if (cust.pendingPayments.update) {
        console.log('updating pending payments for update');
        const product = products_cache.find(p => p.name === 'update');
        console.log('product', product);
        if (product) cust.pendingPayments.totalAmount += product.price * cust.pendingPayments.updateNum;
    }
    if(cust.pendingPayments.wordLimit > 0){
        const product = products_cache.find(p => p.name === 'wordLimit');
        if (product) cust.pendingPayments.totalAmount += product.price * cust.pendingPayments.wordLimit;
    }
    if(cust.pendingPayments.photo){
        const product = products_cache.find(p => p.name === 'photo');
        const photoPrice = cust.pendingPayments.totalPaidPhotos * product.price;
        if (product) cust.pendingPayments.totalAmount += photoPrice;
    }
    //totalAMount to 2 decimal:
    cust.pendingPayments.totalAmount = cust.pendingPayments.totalAmount.toFixed(2);
    return cust;
};

const DeletedCustomer = mongoose.model('DeletedCustomer', customerSchema)
export {DeletedCustomer}

const Customer = mongoose.model('Customer', customerSchema)
export default Customer