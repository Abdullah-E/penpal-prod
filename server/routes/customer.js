import { fastify, BASE_URL } from "./init.js";
import Customer from "../models/customer.js";

fastify.post(BASE_URL + '/customer/test', async(request, reply)=>{
    try{
        const customer = new Customer(request.body);
        await customer.save();
        return reply.code(201).send({
            data:customer,
            message:"Customer created successfully",
            event_code:1,
            status_code:201
        });
    }catch(error){
        console.error(error)
        return reply.code(400).send({
            message:"Customer not created",
            event_code:0,
            status_code:400,
            data:null
        });
        return error;
    }
})
fastify.get(BASE_URL + '/customer/test', async(request, reply)=>{
    try{
        //id could be string or array of strings
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        //specify other params here
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
            //add them in here
        }
        //if no ids specified return first 5 customers:
        let customers
        if(!ids || ids.length === 0){
            customers = await Customer.find(query).limit(5).exec();
        }
        else{
            customers = await Customer.find(query).exec();
        }
        
        // const customers = await Customer.find(query).exec();
        return reply.code(200).send({
            data:customers,
            message:`Customer${ids&&ids.length>1?'s':''} found successfully`,
            event_code:1,
            status_code:200
        })
    }catch(error){
        console.error(error)
        return reply.code(400).send({
            message:"Customer not found",
            event_code:0,
            status_code:400,
            data:null
        });
    }
})

fastify.put(BASE_URL + '/customer/test', async(request, reply)=>{
    try{
        const {id} = request.query
        const customerToUpdate = await Customer.findOneAndUpdate({_id:id}, request.body, {new:true}).lean().exec()
        reply.code(200).send({
            data:customerToUpdate,
            message:"Customer updated successfully",
            event_code:1,
            status_code:200
        });
    }catch(error){
        console.error(error)
        reply.code(400).send({
            message:"Customer not updated",
            event_code:0,
            status_code:400,
            data:null
        });
    }
        
})

fastify.put(BASE_URL + '/customer/personality/test', async(request, reply)=>{
    try{
        const {id} = request.query;
        const {personality} = request.body;
        const customerToUpdate = await Customer
        .findOneAndUpdate(
            {_id:id},
            {personality:personality},
            {new:true}
        ).lean()
        .exec();
        reply.code(200).send({
            data:customerToUpdate,
            message:"Personality updated successfully",
            event_code:1,
            status_code:200
        });
    }catch(error){
        console.error(error)
        reply.code(400).send({
            message:"Personality not updated",
            event_code:0,
            status_code:400,
            data:null
        });
    }
})