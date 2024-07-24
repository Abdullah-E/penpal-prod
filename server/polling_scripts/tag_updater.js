import Customer from '../models/customer.js';

const updateTags = async () => {
    console.log("Updating tags")
    const customers = await Customer.find()
    for(const customer of customers){
        if(customer.createdAt > new Date(new Date() - (7* 24 * 60 * 60 * 1000))){
            customer.tag = "New Profile"
        }else if(customer.lastUpdated > new Date(new Date() - (7* 24 * 60 * 60 * 1000))){
            customer.tag = "Recent Update"
        }else if(customer.tier === "premium"){
            customer.tag = "Premium Profile"
        }
        else{
            customer.tag = ""
        }
        await customer.save()
    }
}

setInterval(updateTags, 24 * 60 * 1000)