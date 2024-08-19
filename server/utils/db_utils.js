export const flagFavorites = async (user, customers) => {

    const {favorite:favoriteList} = await user.populate("favorite")
    // console.log(favoriteList)
    // console.log(favoriteList, user)
    if(!favoriteList){
        customers.map(customer=>{
            customer.isFavorite = false;
            return customer;
        })
        // console.log(customers[0])
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

export const flagRatings = async (user, customers) => {

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

export const flagCreated = async (user, customers) => {
    customers.map(customer=>{
        customer.createdByCurrent = user.createdCustomers.includes(customer._id)
        return customer
    })
    return customers
}

export const flagUpdated = (customers) => {
    customers.map(customer=>{
        customer.updateApproved = !customer.customerUpdate;
        return customer
    })
    return customers
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

export const applyCustomerUpdate = async (customer, update) => {
    for(const field in update.newBody){

        //handles personlaity and basicInfo
        if(field === "photos"){
            
            customer[field]["imageUrl"] = update.newBody[field]["imageUrl"]?update.newBody[field]["imageUrl"]:customer[field]["imageUrl"]

            customer[field]["artworks"].push(...update.newBody[field]["artworks"])
            customer[field]["total"] = customer[field]["artworks"].length + (customer[field]["imageUrl"]?1:0)
            continue;
        }
        else if(typeof update.newBody[field] === "object"){
            console.log("field", field)
            for(const subfield in update.newBody[field]){
                customer[field][subfield] = update.newBody[field][subfield]
            }
            continue;
        }
        
    }
    // await customer.updateOne({$unset:{customerUpdate:1}})
    customer.customerUpdate = undefined
    delete customer._doc.customerUpdate
    customer.customerStatus.lastUpdated = Date.now()
    
    customer["customerStatus"]["recentlyUpdated"] = true
    return customer
}

const optionsMap = {
    "lgbtq+":{
        "basicInfo.orientation":{$not:{$in:["Straight", ""]}}
    },
    "premiumPlacement":{
        "customerStatus.premiumPlacement":true
    },
    "featuredPlacement":{
        "customerStatus.featuredPlacement":true
    },
    "newlyListed":{
        "customerStatus.newlyListed":true
    },
    "veteran":{
        "basicInfo.veteranStatus":{$not:{$in:["", "Never Served"]}}
    },
    "male":{
        "basicInfo.gender":{$in:["Male", "Transgender Females to Male"]}
    },
    "female":{
        "basicInfo.gender":{$in:["Female", "Transgender Male to Female"]}
    },
    "recentlyUpdated":{
        "customerStatus.recentlyUpdated":true
    },
    "viewAll":{}
}

export const queryFromOptions = (options) => {
    let query = {}
    // console.log(optionsMap["lgbtq+"])
    if(options.includes("viewAll")){
        return query
    }
    options.forEach(option=>{
        query = {...query, ...optionsMap[option]}
        console.log(optionsMap[option])
    })
    return query
}