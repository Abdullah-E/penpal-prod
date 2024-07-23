import mongoose from "mongoose"

const customerUpdateSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: false
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    newBody:{
        type: Object,
        required: true
    },
    updateApproved:{
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
})

const CustomerUpdate = mongoose.model('CustomerUpdates', customerUpdateSchema)
export default CustomerUpdate