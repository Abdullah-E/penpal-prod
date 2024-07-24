import mongoose from "mongoose"
import { personalitySchema } from "./personality.js"
import Customer from "./customer.js"

import { calculateCompatibility } from "../utils/db_utils.js"

const USER_ROLES = ['user', 'admin']

function userComplete(user){
    const fields_to_check = [
    "age",
    "gender",
    "state",
    "bio"
    ]  
    if(!user.personality){
      return false
    }else if(Object.keys(user.personality).length === 0){
      return false
    }
    return fields_to_check.every(field => user[field] !== "")
}


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    emailVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    age: {
        type: String,
        required: false,
    },
    gender:{
        type: String,
        required: false,
    },
    state:{
        type: String,
        required: false,
    },
    bio:{
        type: String,
        required: false,
    },
    firebaseUid: {
        type: String,
        required: true
    },
    createdAt:{
        type: Date,
        default: Date.now,
        required: true
    },
    role:{
        type: String,
        enum: USER_ROLES,
        default: USER_ROLES[0],
        required: true
    },
    profileComplete:{
        type: Boolean,
        required: true,
        default: false
    },
    imageUrl:{
        type:String,
        required: false
    },
    personality:{
        type:personalitySchema,
        required: false
    },
    compatibleCustomers: [{
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        score: Number
    }],
    favorite:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Favorite'
    
    },
    ratings :[{
        rating: Number,
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        }
    }],
    createdCustomers :{
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Customer'
    },
    customerUpdates:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'CustomerUpdate'
    },
})

userSchema.pre('save', async function(next) {
    this.profileComplete = userComplete(this);
    if (this.isModified('personality')) {
        const customers = await Customer.find().limit(50);
        const compatibilityScores = customers.map(customer => {
            // customer.lastMatched = new Date();
            // await customer.save();
            return {
                customerId: customer._id,
                score: calculateCompatibility(this.personality, customer.personality)
            };
        });

        // Sort customers by compatibility score in descending order and get the top 5
        compatibilityScores.sort((a, b) => b.score - a.score);
        this.compatibleCustomers = compatibilityScores
    }
    // console.log('pre save', this.firstName, this.profileComplete)
    next();
});

const User = mongoose.model('User', userSchema)
export default User