import mongoose from "mongoose"
import { personalitySchema } from "./personality.js"

const USER_ROLES = ['user', 'admin']

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
    }
})

const User = mongoose.model('User', userSchema)
export default User