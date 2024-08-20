import Customer from "../models/customer.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";

// import { frontendUrl } from "../index.js";

/*
    notifications when
        for admin
            featured or premium status expires
            profile expires
        for user
            favorite profile updated
*/

const updateExpires = async () => {
    console.log("Checking for expired statuses")
    const customers = await Customer.find()
    const expiredPremiums = []
    const expiredFeatures = []
    const expiredProfiles = []
    for(const customer of customers){

        // premium:
        const status = customer.customerStatus
        if(status.premiumExpires && status.premiumExpires< new Date()){
            console.log("Premium expired", customer.basicInfo.firstName)
            customer.customerStatus.premiumPlacement = false
            customer.customerStatus.premiumExpires = null
            expiredPremiums.push(customer)
            await customer.save()
            
        }

        // featured:
        if(status.featuredExpires && status.featuredExpires< new Date()){
            console.log("Featured expired", customer.basicInfo.firstName)
            customer.customerStatus.featuredPlacement = false
            customer.customerStatus.featuredExpires = null
            expiredFeatures.push(customer)
            await customer.save()
            
        }

        //profile:
        if(status.expiresAt && status.expiresAt< new Date()){
            console.log("Profile expired", customer.basicInfo.firstName)
            customer.customerStatus.status = "expired"
            customer.customerStatus.expiresAt = null
            expiredProfiles.push(customer)
            await customer.save()
            
        }

    }

    //gen notifications:
    const admins = await User.find({role: "admin"})
    const notifications_list = []
    const defaultBody = {
        read: false,
        readAt: null
    }
    for(const customer of expiredPremiums){
        const notificationBody = {
            ...defaultBody,
            type: "premiumExpired",
            message: `Premium status for ${customer.basicInfo.firstName} has expired`,
            customer:customer._id
        }
        notifications_list.push(notificationBody)
    }
    for(const customer of expiredFeatures){
        const notificationBody = {
            ...defaultBody,
            type: "featuredExpired",
            message: `Featured status for ${customer.basicInfo.firstName} has expired`,
            customer:customer._id
        }
        notifications_list.push(notificationBody)
        
    }
    for(const customer of expiredProfiles){
        const notificationBody = {
            ...defaultBody,
            type: "profileExpired",
            message: `Profile for ${customer.basicInfo.firstName} has expired`,
            customer:customer._id
        }
        notifications_list.push(notificationBody)
    }
    
    if(notifications_list.length === 0){
        return
    }
    for(const user of admins){
        console.log("Creating notifications for admin", user)
        const noti_ids = []
        for(const notification of notifications_list){
            // console.log("Creating notification", notification, user._id)
            const newNotification = new Notification({
                ...notification,
                user: user._id,
                link: `${process.env.FRONTEND_URL}/admin/inmate/${notification.customer}`
            })
            const createdNotification = await newNotification.save()
            
            console.log("newNotification", createdNotification._id)
            noti_ids.push(createdNotification._id)
        }
        console.log("noti_ids", noti_ids)
        await User.updateOne({_id: user._id}, {$push: {notifications: {$each:noti_ids} }})

    }
}

const intervalMs = 24*60*60*1000
setInterval(updateExpires, intervalMs)