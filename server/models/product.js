import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    priceId: {
        type: String,
        required: true,
    },
    productId: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    currency: {
        type: String
    },
    image: {
        type: String,
    },
    description: {
        type: String
    },

})

const Product = mongoose.model('Product', productSchema)
export default Product