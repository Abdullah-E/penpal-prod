
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

export function calculateCompatibility(userPersonality, customerPersonality) {
    const fields = ["hobbies", "sports", "likes", "personality", "bookGenres", "musicGenres", "movieGenres"];
    let totalMatches = 0;
    let totalFields = fields.length;

    fields.forEach(field => {
        if (userPersonality[field].length && customerPersonality[field].length) {
            const intersection = userPersonality[field].filter(value => customerPersonality[field].includes(value));
            if (intersection.length) {
                totalMatches++;
            }
        }
    });
    return (totalMatches / totalFields) * 100;
}


export const findInsertionIndex = (array, score)=> {
    let low = 0;
    let high = array.length;
  
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (array[mid].score < score) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
  
    return low;
  }