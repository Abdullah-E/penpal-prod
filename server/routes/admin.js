import { fastify, BASE_URL } from "./init.js";

// import User from "../models/user.js";
import Customer from "../models/customer.js"
import CustomerUpdate from "../models/customerUpdate.js"
import { getUserFromToken } from "../utils/firebase_utils.js"

import { applyCustomerUpdate } from "../utils/db_utils.js"

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

        const query = {
            ...(id && id.length > 0 ? {_id:{$in:id}} : {}),
            ...(param["approved"]?{"customerStatus.profileApproved":approvedBool}:{}),
        }
        
        const customers = await Customer.find(query).exec();
        reply.send({
            data: customers,
            message: `${approvedBool?'':'un'}approved customers found successfully`,
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
            "customerStatus.expiresAt":Date.now() + 1000*60*60*24*365, 
            "customerStatus.newlyListed":true
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

        const query = {
            ...(id && id.length > 0 ? {customer:{$in:id}} : {}),
            ...(param["approved"]?{updateApproved:approvedBool}:{}),
            // updateApproved:param["approved"]?approvedBool:undefined
        }

        const updates = await CustomerUpdate.find(query).populate("customer").populate("user").lean().exec()
        const returnArr = []
        for(const update of updates){
            if(!update.customer) continue
            console.log("update", update)
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
            message: `Unapproved updates found successfully`,
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
    
        const customersToUpdate = await Customer.find(query).exec()
        const updatedCustomers = []
        for(const customer of customersToUpdate){
            const update = await CustomerUpdate.findById(customer.customerUpdate)
            if(!update){
                console.error("Update not found for customer", customer._id)
                continue
            }
            if(!update.paymentPending){
                // for(const field in update.newBody){
                //     customer[field] = update.newBody[field]
                // }
                // await customer.updateOne({$unset:{customerUpdate:1}})
                // delete customer._doc.customerUpdate
                // customer.lastUpdated = Date.now()
                // await customer.save()
                await applyCustomerUpdate(customer, update)
            }
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