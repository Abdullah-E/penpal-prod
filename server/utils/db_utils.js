
import User from '../models/user.js'

export const flagFavorites = async (firebase_id, customers) => {
    const user = await User.findOne({firebaseUid:firebase_id})
    if(!user){
        console.log(`User ${firebase_id} not found in database`)
        return customers;
    }
    const {favorite:favoriteList} = await user.populate("favorite")
    // console.log(favoriteList)
    if(!favoriteList){
        customers = customers.map(customer=>{customer.isFavorite = false; return customer;})
        return customers;
    }
    customers = customers.map(customer=>{
        customer.isFavorite = favoriteList.favorites.includes(customer._id);
        // console.log(customer.isFavorite)
        return customer;
    })
    // console.log(customers)
    return customers;
}

export const flagRatings = async (firebase_id, customers) => {
    const user = await User.findOne({firebaseUid:firebase_id})
    if(!user){
        console.log(`User ${firebase_id} not found in database`)
        return customers;
    }
    customers.map(customer=>{
        const rating = user.ratings.find(rating=>rating.customerId.equals(customer._id))
        if(rating){
            customer.prevRating = rating.rating;
            customer.isRated = true;
        }
        else{
            customer.prevRating = 0;
            customer.isRated = false;
        }
        return customer;
    })
    return customers;   
}