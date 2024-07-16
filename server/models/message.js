import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    },
    messageText: {
        type: String,
        required: false,
        default: ""
    },
    fileLink:{
        type: String,
        required: false,
        default:""
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }

})

const Message = mongoose.model('Message', messageSchema)
export default Message