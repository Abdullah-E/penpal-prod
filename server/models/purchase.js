import mongoose from "mongoose"

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
    products:[{
        product:{type:mongoose.Schema.Types.ObjectId, ref:'Product', required: true},
        quantity:{type: Number, required: true},
        price:{type: Number, required: true}
    }],
    sessionId:{
        type: String,
        required: false
    },
    totalPrice: {
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
    },
    transactionType: {
        type: String,
        required: false,
        enum: ['checkout', 'referral'],
        default: 'checkout'
    },
    purchaseTypes: [{
        type: String,
        required: false,
    }],
    usedReferrals: {
        type: Number,
        required: false,
        default: 0
    }
})

const Purchase = mongoose.model('Purchase', purchaseSchema)
export default Purchase