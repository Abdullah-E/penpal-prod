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

export const products_cache = Product.find({}).exec()
const update_products_cache = async () => {
    products_cache = Product.find({}).exec()
}
productSchema.pre('save', async function(next) {
    console.log('updating products cache')
    await update_products_cache()
    next()
})

