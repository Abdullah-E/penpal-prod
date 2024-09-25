import Customer from "../models/customer.js"
import User from "../models/user.js"
import { calculateCompatibility, findInsertionIndex } from "../utils/db_utils.js"
export const activeCustQuery = {
    $or:[
        {"customerStatus.lastMatched": {$lt: new Date(new Date() - 24 * 60 * 60 * 1000)}},
        {"customerStatus.lastMatched": {$exists: false}},
        {"customerStatus.lastMatched": null}
    ],
    "customerStatus.profileApproved": true            
}

const matchCustomers = async () => {
    try{
        //last matched should be more than 24 hours ago or not specified
        console.log("Updating matches")
        const customers = await Customer.find(activeCustQuery)
        if(customers.length === 0){
            console.log("No customers to match")
            return
        }
        // console.log("matching customers", customers.length)
        let cust_update = false

        const users = await User.find({role: "user", profileComplete: true})
        for(const user of users){
            let user_updated = false
            for(const customer of customers){
                const existingCustomer = user.compatibleCustomers.find(entry => entry.customerId.equals(customer._id))

                if(existingCustomer){
                    continue
                }
                // console.log("Matching", user.firstName, customer.basicInfo.firstName)
                cust_update = true
                const score = calculateCompatibility(user.personalityInfo, customer.personalityInfo)
                const index = findInsertionIndex(user.compatibleCustomers, score)
                console.log(index, score, customer._id)
                user.compatibleCustomers.splice(index, 0, {customerId: customer._id, score})
                user.compatibleCustomers = user.compatibleCustomers.slice(0, 50)
                user_updated = true

                customer.customerStatus.lastMatched = new Date()
                customer.markModified("customerStatus")
                await customer.save()
            }
            if(user_updated){
                // user.lastMatched = new Date()
                // console.log("User updated", user._id, user.compatibleCustomers.length
                await user.save()
            }
        }

        if(!cust_update){
            customers.forEach(async customer=>{
                customer.customerStatus.lastMatched = new Date()
                customer.markModified("customerStatus")
                await customer.save()
            })
        }
    }
    catch(err){
        console.error(err)
    }
}

setInterval(matchCustomers, 30 * 1000)