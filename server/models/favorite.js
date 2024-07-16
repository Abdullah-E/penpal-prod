import mongoose from "mongoose"

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
})

const Favorite = mongoose.model('Favorite', favoriteSchema)
export default Favorite