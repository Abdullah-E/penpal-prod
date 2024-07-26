import mongoose from "mongoose"

const purchaseSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    product:{
        type: Object,
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
    }
})