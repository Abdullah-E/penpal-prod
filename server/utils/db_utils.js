import User from "../models/user.js"

import { products_cache } from "../models/product.js"
import Customer, { customerDefaultValues, updatePendingPayments} from "../models/customer.js"

import { parseCustomerInfo } from "./misc_utils.js"

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

export const flagCreatedBy = async (customers) => {
    const updatedCustomers = await Promise.all(
        customers.map( async customer=>{
        
            const user = await User.findOne({"createdCustomers":customer._id})
            if(user){
                console.log(user._id)
                customer.createdBy = user
            }
            console.log(customer.createdBy, customer.basicInfo.firstName)
            return customer
        })
    )
    return updatedCustomers
}

export const paidByCreation = async (customers) => {
    const creationId = products_cache.find(product=>product.name === "creation")._id
    // console.log(customers, creationId)
    const updatedCustomers = await Promise.all(
        customers.map(async customer=>{
            console.log(Object.keys(customer))
            const creationPurchase = customer.completedPurchases.find(
                purchase=>
                    purchase.products.some(product=>product.product.equals(creationId))
            )
            if(creationPurchase){
                const user = await User.findById(creationPurchase.user)
                console.log("yoo", user)
                customer.paidBy = user
            }
            return customer
        })
    )
    return updatedCustomers
}

// export const paidByUpdate = async (customer) => {
//     const updateId = products_cache.find(product=>product.name === "update")._id
    
//     const updatePurchase = customer.completedPurchases.find(
//         purchase=>
//             purchase.products.some(product=>product.product.equals(updateId))
//     )
//     if(updatePurchase){
//         const user = await User.findById(updatePurchase.user)
//         customer.paidBy = user
//     }
//     return customer
// }

export function calculateCompatibility(userPersonality, customerPersonality) {
    const fields = ["hobbies", "sports", "likes", "personality", "bookGenres", "musicGenres", "movieGenres"];
    let totalMatches = 0;
    let totalFields = fields.length;
    // console.log(userPersonality, customerPersonality)
    fields.forEach(field => {
        if (userPersonality[field] 
            && customerPersonality[field]
        ) {
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

export const createCustomer = async (reqBody,  options={},fbUser=undefined, mongoUser=undefined) => {
    /*
    body:
    {
        basicInfo"{
           "firstName":String, can be array
            "lastName":String, can be array
            "inmateNumber":String, can be array
            "mailingAddress":String, can be array
            "city":String, can be array
            "state":String, can be array
            "zipcode":String, can be array
            "bio":"String, can be array
            "gender":String, can be array
            "orientation":String, can be array
            "race":String, can be array
            "education":String, can be array
            "age":String, can be array
            "dateOfBirth": Date, can be array
            "height":String, can be array
            "weight":String, can be array
            "hairColor":String, can be array
            "eyeColor":String, can be array
            "religiousPref":String, can be array
            "bodyType":String, can be array
            "astrologicalSign":String, can be array
            "relationshipStatus":String, can be array
            "veteranStatus":String, can be array
            "institutionalEmailProvider":String, can be array
            "hometown":String, can be array
            "spokenLanguages":Array
            "highSchool":String, can be array
            "highSchoolCity":String, can be array
            "highSchoolState":String, can be array
            "college":String, can be array
            "collegeCity":String, can be array
            "collegeState":String, can be array
        }
        PersonalityInfo:{
            "hobbies":Array,
            "sports":Array,
            "likes":Array,
            "personality":Array,
            "bookGenres":Array,
            "musicGenres":Array,
            "movieGenres":Array
        }
        photos:{
            imageUrl:String,
            artworks:Array
        }
        specialInstructions:String
        wordLimit:Number
        totalPaidPhotos:Number
    }
    */

    //filling basicInfo:
    let customerObj = parseCustomerInfo(reqBody)    
    customerObj = {
        basicInfo:{...customerDefaultValues["basicInfo"]}, 
        personalityInfo:{...customerDefaultValues["personalityInfo"]},
        photos:{...customerDefaultValues["photos"]},
        customerStatus:{...customerDefaultValues["customerStatus"]},
        pendingPayments:{...customerDefaultValues["pendingPayments"]},
        ...customerObj,
    }
    //special instructions:
    
    if(options["specialInstructions"]){
        customerObj["customerStatus"]["specialInstructionsText"] = reqBody["specialInstructions"]
        customerObj["customerStatus"]["specialInstructionsFlag"] = true
    }
    
    if(options["paidCreation"]){
        customerObj["pendingPayments"]["creation"] = false;
        customerObj["customerStatus"]["status"] = 'unapproved';
        if(reqBody["totalPaidPhotos"] && reqBody["totalPaidPhotos"] >0){
            customerObj["customerStatus"]["photoLimit"]=reqBody["totalPaidPhotos"];
        }
        if(reqBody["wordLimit"] && reqBody["wordLimit"] >0){
            customerObj["customerStatus"]["wordLimitExtended"] = true;
            customerObj["customerStatus"]["wordLimit"]=reqBody["wordLimit"]*100;
        }
    }else{
        customerObj["pendingPayments"]["wordLimit"] = reqBody["wordLimit"] && reqBody["wordLimit"] >0?
        reqBody["wordLimit"]:
        customerDefaultValues["pendingPayments"]["wordLimit"];
        
        if(reqBody["totalPaidPhotos"] && reqBody["totalPaidPhotos"] >0){
            customerObj["pendingPayments"]["totalPaidPhotos"] = reqBody["totalPaidPhotos"];
            customerObj["pendingPayments"]["photo"] = true;
        }
        customerObj = updatePendingPayments(customerObj)
    }
    
    if(options["approved"]){
        customerObj["pendingPayments"]["creation"] = false;
        customerObj["customerStatus"]["status"] = 'unapproved';
        if(reqBody["totalPaidPhotos"] && reqBody["totalPaidPhotos"] >0){
            customerObj["customerStatus"]["photoLimit"]=reqBody["totalPaidPhotos"];
        }
        if(reqBody["wordLimit"] && reqBody["wordLimit"] >0){
            customerObj["customerStatus"]["wordLimitExtended"] = true;
            customerObj["customerStatus"]["wordLimit"]=reqBody["wordLimit"]*100;
        }
        customerObj["customerStatus"]["profileApproved"] = true
        customerObj["customerStatus"]["expiresAt"] = extendDateByMonth(new Date(), 12)
        customerObj["customerStatus"]["newlyListed"] = true
        customerObj["customerStatus"]["tag"] = "New Profile"
        customerObj["customerStatus"]["status"] = "active"
    }
    
    const newCustomer = new Customer(customerObj)
    console.log(newCustomer)
    await newCustomer.save()
    if(mongoUser || fbUser){
        const user = mongoUser?mongoUser:await User.findOne({firebaseUid:fbUser.uid})
        if(!user.createdCustomers){
            user.createdCustomers = [newCustomer._id]
        }else{
            user.createdCustomers.push(newCustomer._id)
        }
        await user.save()
    }
    return newCustomer
}

// const updateCustomer = async (reqBody, options={}, fbUser=undefined, mongoUser=undefined) => {
    
// }