import mongoose from "mongoose"

const TYPE_ENUMS = ['one-time', 'subscription']

const purchaseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    product:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    sessionId:{
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    paidAt:{
        type: Date,
        required: false
    },
    status:{
        type: String,
        default: 'open',
        required: true
    }
})

const Purchase = mongoose.model('Purchase', purchaseSchema)
export default Purchase