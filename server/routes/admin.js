import { fastify, BASE_URL } from "./init.js";

// import User from "../models/user.js";
import Customer from "../models/customer.js";
import CustomerUpdate from "../models/customerUpdate.js";
import { getUserFromToken } from "../utils/firebase_utils.js";

fastify.addHook("onRequest", async (request, reply) => {
    if (request.routeOptions.url && request.routeOptions.url.startsWith(BASE_URL+"/admin")){
        const fb_user = await getUserFromToken(request, reply);
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
            request.user = fb_user;
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
            ...(param["approved"]?{profileApproved:approvedBool}:{}),
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
    
        const customers = await Customer.updateMany(query, {profileApproved:true, createdAt:Date.now()}, {new:true}).lean().exec()
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
            returnArr.push({
                ...update.customer,...update.newBody,
                updatedFields:Object.keys(update.newBody),
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
            for(const field in update.newBody){
                customer[field] = update.newBody[field]
            }
            await customer.updateOne({$unset:{customerUpdate:1}})
            delete customer._doc.customerUpdate
            customer.lastUpdated = Date.now()
            await customer.save()
            updatedCustomers.push(customer)
            update.updateApproved = true
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