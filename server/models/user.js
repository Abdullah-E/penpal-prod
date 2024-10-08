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
    if(!user.personalityInfo){
      return false
    }else if(Object.keys(user.personalityInfo).length === 0){
      console.log('empty personality')
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
    city:{
        type: String,
        required: false,
    },
    zipCode:{
        type: String,
        required: false,
    },
    mailingAddress:{
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
    imageId:{
        type:String,
        required: false,
        default: ""
    },
    personalityInfo:{
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
    notifications:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Notification'
    },
    completedPurchases:{
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Purchase'
    },
    referralBalance: {
        type: Number,
        required: false,
        default: 0
    },
})

userSchema.pre('save', async function(next) {
    this.profileComplete = userComplete(this);
    console.log('pre save', this.firstName, this.profileComplete)
    if (this.isModified('personalityInfo')) {
        console.log('personalityInfo modified')
        const customers = await Customer.find({"customerStatus.profileApproved": true}).limit(50);
        const compatibilityScores = customers.map(customer => {
            // customer.lastMatched = new Date();
            // await customer.save();
            return {
                customerId: customer._id,
                score: calculateCompatibility(this.personalityInfo, customer.personalityInfo)
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