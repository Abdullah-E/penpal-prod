import { fastify, BASE_URL } from "./init.js";
import Customer from "../models/customer.js";

fastify.post(BASE_URL + '/customer/test', async(request, reply)=>{
    try{
        const customer = new Customer(request.body);
        await customer.save();
        reply.code(201).send({
            data:customer,
            message:"Customer created successfully",
            event_code:1,
            status_code:201
        });
    }catch(error){
        console.error(error)
        reply.code(400).send({
            message:"Customer not created",
            event_code:0,
            status_code:400,
            data:null
        });
        return error;
    }
})