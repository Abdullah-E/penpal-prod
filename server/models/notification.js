import mongoose from 'mongoose'

const NOTIFICATION_TYPES = [
    "customer update"
]

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type:{
        type:String,
        required:true
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
        required: true,
        default: null
    }
}, {timestamps: true})

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification