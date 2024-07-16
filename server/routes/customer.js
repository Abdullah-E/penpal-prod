import { fastify, BASE_URL } from "./init.js";
import Customer from "../models/customer.js";

fastify.post(BASE_URL + '/customer/test', async(request, reply)=>{
    try{
        const defaultValues = {
            firstName: "",
            lastName: "",
            inmateNumber: "",
            mailingAddress: "",
            city: "",
            state: "",
            zipcode: "",
            gender: "",
            race: "",
            education: "",
            age: "",
            dateOfBirth: new Date(0),
            height: "",
            weight: "",
            hairColor: "",
            eyeColor: "",
            profileComplete: false,
            personality: {},
            rating: null,
            numRatings: 0,
            createdAt: Date.now()
        };
        // const customer = new Customer({...defaultValues, ...request.body});
        // console.log(customer)
        // const customer = new Customer(request.body);
        const newUser = await Customer.create({...defaultValues, ...request.body});
        return reply.code(201).send({
            data:newUser,
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
    }
})
fastify.get(BASE_URL + '/customer/test', async(request, reply)=>{
    try{
        //id could be string or array of strings
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const sort_on = param["sort_on"] || "createdAt"
        //specify other params here
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {}),

            //add them in here
        }
        //if no ids specified return first 5 customers:
        let customers
        if(!ids || ids.length === 0){
            customers = await Customer.find(query).sort({[sort_on]:-1}).limit(5).exec();
        }
        else{
            customers = await Customer.find(query).sort({[sort_on]:-1}).exec();
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

fastify.post(BASE_URL + '/customer/review/test', async(request, reply)=>{
    try{
        const {id} = request.query;
        const {rating} = request.body;
        const customerToUpdate = await Customer.findOne({_id:id}).exec();
        const oldRating = customerToUpdate.rating || 0;
        const oldNumRatings = customerToUpdate.numRatings || 0;

        const newRating = ((oldRating * oldNumRatings) + rating) / (oldNumRatings + 1);
        console.log(oldRating, oldNumRatings, rating, newRating)
        const newNumRatings = oldNumRatings + 1;
        customerToUpdate.rating = newRating;
        customerToUpdate.numRatings = newNumRatings;
        const updatedCustomer = await customerToUpdate.save()
        reply.code(200).send({
            data:updatedCustomer,
            message:"Review added successfully",
            event_code:1,
            status_code:200
        })
    }catch(error){
        console.error(error)
        reply.code(400).send({
            message:"Review not added",
            event_code:0,
            status_code:400,
            data:null
        });
    }
})