import mongoose from "mongoose"

const USER_ROLES = [
    'user',
    'admin'
]

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    email_verified: {
        type: Boolean,
        required: true,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        required: true
    },
    firebase_uid: {
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
    }
})

const User = mongoose.model('User', userSchema)
export default User