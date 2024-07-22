import User from "../models/user";
import Customer from "../models/customer";
import CustomerUpdate from "../models/customerUpdates";
import { BASE_URL, fastify } from "./init";
import { getUserFromToken } from "../utils/firebase_utils";


fastify.addHook("onRequest", async (request, reply) => {
    if (request.routeOptions.url.startsWith(BASE_URL+"/admin")){
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

fastify.get("/admin/customer", async (request, reply) => {
    const approved = request.query.approved;
    const customers = await Customer.find({profileApproved: approved}).exec();
    reply.send({
        data: customers,
        message: `${approved?'':'un'}approved customers found successfully`,
        event_code: 1,
        status_code: 200
    });

})
