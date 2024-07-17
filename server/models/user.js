import mongoose from "mongoose"
import { personalitySchema } from "./personality.js"
import Customer from "./customer.js"

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

function calculateCompatibility(userPersonality, customerPersonality) {
    const fields = ["hobbies", "sports", "likes", "personality", "bookGenres", "musicGenres", "movieGenres"];
    let totalMatches = 0;
    let totalFields = fields.length;

    fields.forEach(field => {
        if (userPersonality[field].length && customerPersonality[field].length) {
            const intersection = userPersonality[field].filter(value => customerPersonality[field].includes(value));
            if (intersection.length) {
                totalMatches++;
            }
        }
    });
    return (totalMatches / totalFields) * 100;
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
    }]
    

})

userSchema.pre('save', async function(next) {
    this.profileComplete = userComplete(this);
    if (this.isModified('personality')) {
        const customers = await Customer.find().limit(20);
        const compatibilityScores = customers.map(customer => {
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