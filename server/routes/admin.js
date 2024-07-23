import { fastify, BASE_URL } from "./init.js";

import User from "../models/user.js";
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
        const approvedBool = request.query.approved === "true"?true:false
        
        const customers = await Customer.find({profileApproved:approvedBool}).exec();
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
    
        const customers = await Customer.updateMany(query, {profileApproved:true}, {new:true}).lean().exec()
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

        const updates = await CustomerUpdate.find(query).populate("customer").populate("user").exec()
        reply.send({
            data: updates.length === 1 ? updates[0] : updates,
            message: `Unapproved updates found successfully`,
            event_code: 1,
            status_code: 200
        })

    }catch(err){
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

