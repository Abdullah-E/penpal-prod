import mongoose from 'mongoose'
/*
    notifications when
        for admin
            featured or premium status expires
            profile expires
        for user
            favorite profile updated
*/


const NOTIFICATION_TYPES = [
    "customerUpdate",
    "featuredExpired",
    "premiumExpired",
    "profileExpired",
]

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    type:{
        type:String,
        required:true,
        enum: NOTIFICATION_TYPES
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false,
        required: true
    },
    readAt: {
        type: Date,
        required: false,
        default: null
    }
}, {timestamps: true})


//send email
notificationSchema.pre('save', function(next){

})

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification