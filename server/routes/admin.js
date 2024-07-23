import { fastify, BASE_URL } from "./init.js";

import User from "../models/user.js";
import Customer from "../models/customer.js";
import CustomerUpdate from "../models/customerUpdates.js";
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
    const approvedBool = request.query.approved === "true"?true:false
    
   
    const customers = await Customer.find({profileApproved:approvedBool}).exec();
    reply.send({
        data: customers,
        message: `${approvedBool?'':'un'}approved customers found successfully`,
        event_code: 1,
        status_code: 200
    });
})
