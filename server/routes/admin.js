import { fastify, BASE_URL } from "./init.js";

import User from "../models/user.js";
import CustomerUpdate from "../models/customerUpdate.js"
import Notification from "../models/notification.js";
import Customer, {updatePendingPayments} from "../models/customer.js"

import { getUserFromToken } from "../utils/firebase_utils.js"
import { applyCustomerUpdate } from "../utils/db_utils.js"
import { extendDateByMonth } from "../utils/misc_utils.js";

// import { frontendUrl } from "../index.js";

fastify.addHook("onRequest", async (request, reply) => {
    if (request.routeOptions.url && request.routeOptions.url.startsWith(BASE_URL+"/admin")){
        const fb_user = await getUserFromToken(request, reply)
        if (!fb_user) {
            return reply.code(403).send({
                data:null,
                message: "Unauthorized - No token/Invalid token",
                status_code: 403,
                event_code:0
            })
        }else if(fb_user.role !== "admin"){
            return reply.code(403).send({
                data:null,
                message: "Unauthorized - Not an admin",
                status_code: 403,
                event_code:0
            })
        }else{
            request.user = fb_user
        }
    }
})

fastify.get(BASE_URL+"/admin/customer", async (request, reply) => {
    try{
        const param = request.query
        const id = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const approvedBool = param["approved"] === "true"?true:false
        const paymentBool = param["paymentPending"] === "false"?false:true

        const page = parseInt(param["p"] || 0)
        const limit = parseInt(param["l"] || 50)

        const query = {
            ...(id && id.length > 0 ? {_id:{$in:id}} : {}),
            ...(param["approved"]?{"customerStatus.profileApproved":approvedBool}:{}),
            ...(param["paymentPending"]?{"pendingPayments.creation":paymentBool}:{})
        }
        console.log(query)
        
        let customers = await Customer.find(query).skip(page*limit).limit(limit).exec();
        
        reply.send({
            data: customers,
            message: `Customer${customers.length === 1? "":"s"} found successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.put(BASE_URL+"/admin/customer", async (request, reply) => {
    try{
        const update = {}
        update.newBody = request.body

        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }
        
        // const customers = await Customer.updateMany(query, {
        //     ...param
        // }, {new:true}).lean().exec()
        
        const customersToUpdate = await Customer.find(query).exec()
        for (let customer of customersToUpdate){
            const newCustomer = await applyCustomerUpdate(customer, update)
            await newCustomer.save()
        }
        reply.send({
            data: customersToUpdate,
            message: `Customers updated successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.put(BASE_URL+"/admin/approve-customer", async (request, reply) => {
    try{
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }
        
        const customers = await Customer.updateMany(query, {
            "customerStatus.profileApproved":true, 
            createdAt:Date.now(), 
            "customerStatus.expiresAt":extendDateByMonth(Date.now(), 12),
            "customerStatus.newlyListed":true,
            "customerStatus.tag":"New Profile",
            "customerStatus.status":"active"
        }, {new:true}).lean().exec()
        reply.send({
            data: customers,
            message: `Customers approved successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.get(BASE_URL+"/admin/update", async (request, reply) => {
    try{

        const param = request.query
        const id = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const approvedBool = param["approved"] === "true"?true:false
        const paymentBool = param["paymentPending"] === "true"?true:false
        // console.log(approvedBool, paymentBool)

        const query = {
            ...(id && id.length > 0 ? {customer:{$in:id}} : {}),
            ...(param["approved"]?{updateApproved:approvedBool}:{}),
            paymentPending:paymentBool
            // updateApproved:param["approved"]?approvedBool:undefined
        }
        console.log(query)
        const updates = await CustomerUpdate.find(query).populate("customer").populate("user").lean().exec()
        const returnArr = []
        for(const update of updates){
            if(!update.customer) continue
            // console.log("update", update)
            // const updatedFields = {
            //     "basicInfo":[],
            //     "personalityInfo":[],
            //     "photos":[]
            // }
            const updatedFields = []
            for(const field in update.newBody){
                if(typeof update.newBody[field] === "object"){
                    updatedFields.push(...Object.keys(update.newBody[field]))
                }   
            }
            const newBasicInfo = {
                ...update.customer.basicInfo,
                ...(update.newBody.basicInfo && Object.keys(update.newBody.basicInfo).length > 0 ? update.newBody.basicInfo : {})
            }
            const newPersonalityInfo = {
                ...update.customer.personalityInfo,
                ...(update.newBody.personalityInfo && Object.keys(update.newBody.personalityInfo).length > 0 ? update.newBody.personalityInfo : {})
            }
            const newPhotos = {
                ...update.customer.photos,
                ...(update.newBody.photos && Object.keys(update.newBody.photos).length > 0 ? update.newBody.photos : {})
            }

            returnArr.push({
                ...update.customer,
                personalityInfo:newPersonalityInfo,
                basicInfo:newBasicInfo,
                photos:newPhotos,
                updatedFields,
            })
        }

        reply.send({
            data: returnArr,
            message: `${approvedBool?'':'Un'}approved ${paymentBool?'Un':''}paid updates found successfully`,
            event_code: 1,
            status_code: 200
        })

    }catch(err){
        console.error(err)
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.put(BASE_URL+"/admin/approve-update", async (request, reply) => {
    try{
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }
    
        const customersToUpdate = await Customer.find(query).populate("customerUpdate").exec()
        const updatedCustomers = []
        for(let customer of customersToUpdate){
            if(!customer.customerUpdate){
                console.error("No update found for customer", customer._id)
                continue
            }
            const update = await CustomerUpdate.findById(customer.customerUpdate._id)
            
            customer = await applyCustomerUpdate(customer, update)
            await customer.save()

            update.updateApproved = true
            updatedCustomers.push(customer)
            await update.save()
        }
        reply.send({
            data: updatedCustomers.length === 1 ? updatedCustomers[0] : updatedCustomers,
            message: `Update${updatedCustomers.length>1?"s":""} approved successfully`,
            event_code: 1,
            status_code: 200
        })

        // generate notifications
        
        for(const customer of customersToUpdate){
            // const customerId = customer._id
            const customerFavoriteUsers = await User.aggregate([
                {
                    $lookup:{
                        from:"favorites",
                        localField:"favorite",
                        foreignField:"_id",
                        as:"favoriteInfo"
                    }
                },
                {$unwind:"$favoriteInfo"},
                {
                    $match:{
                        "favoriteInfo.favorites":customer._id
                    }
                }
            ])
            if(customerFavoriteUsers.length === 0){
                // console.log("No favorite users found for customer", customer._id)
                continue
            }
            for(const user of customerFavoriteUsers){
                const newNotification = new Notification({
                    read: false,
                    readAt: null,
                    type: "customerUpdate",
                    message: `${customer.basicInfo.firstName} from your favorite list has been updated!`,
                    link: `${process.env.FRONTEND_URL}/customer/${customer._id}`,
                    customer: customer._id,
                    user: user._id
                })
                const createdNotification = await newNotification.save()
                await User.updateOne({_id: user._id}, {$push: {notifications: createdNotification._id}})
            }
        }
    }
    catch(err){
        console.error(err)
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.put(BASE_URL+"/admin/reject-update", async (request, reply) => {
    try{
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }
    
        const customersToUpdate = await Customer.find(query).populate("customerUpdate").exec()
        const updatedCustomers = []
        for(let customer of customersToUpdate){
            // if(!customer.customerUpdate){
            //     console.error("No update found for customer", customer._id)
            //     continue
            // }

            // const update = await CustomerUpdate.findById(customer.customerUpdate._id)
            // update.updateApproved = false
            // delete customer._doc.customerUpdate
            const update = await CustomerUpdate.findByIdAndDelete(customer.customerUpdate._id)
            customer.customerUpdate = undefined
            delete customer._doc.customerUpdate
            customer.pendingPayments.update = false
            customer.pendingPayments.updateNum = 0
            customer.pendingPayments.photo = false
            customer.pendingPayments.totalPaidPhotos = 0
            customer.pendingPayments.wordLimit = 0
            customer.pendingPayments.basicInfo = {}
            customer.pendingPayments.personalityInfo = {}
            customer = updatePendingPayments(customer)
            updatedCustomers.push(customer)
            customer.markModified("pendingPayments")
            await customer.save()
        }
        reply.send({
            data: updatedCustomers.length === 1 ? updatedCustomers[0] : updatedCustomers,
            message: `Update${updatedCustomers.length>1?"s":""} rejected successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        console.error(err)
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.put(BASE_URL+"/admin/customer-status", async (request, reply) => {
    try{
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }

        const {status} = request.body
        const customers = await Customer.updateMany(query, {
            "customerStatus.status":status
        }, {new:true}).lean().exec()

        
        // const customers = await Customer.updateMany(query, {
        //     "customerStatus.status":"inactive"
        // }, {new:true}).lean().exec()
        reply.send({
            data: customers,
            message: `Customers deactivated successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})