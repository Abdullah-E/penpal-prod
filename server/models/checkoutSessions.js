import mongoose from "mongoose"

const checkoutSessionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    checkoutSKey: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
})

export const CheckoutSession = mongoose.model('checkoutSession', checkoutSessionSchema)