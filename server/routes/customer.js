import { fastify, BASE_URL } from "./init.js";
import Customer from "../models/customer.js";

import {getUserFromToken,verifyToken } from "../utils/firebase_utils.js";
import { flagFavorites, flagRatings } from "../utils/db_utils.js";
import User from "../models/user.js";
// import User from "../models/user.js";

fastify.addHook('onRequest', async(request, reply)=>{
    const isExcludedRoute = 
    (request.routeOptions.url === BASE_URL + '/customer/test' 
        && request.method === 'POST') ||
    (request.routeOptions.url === BASE_URL + '/customer/random')

    if( 
        !isExcludedRoute &&
        request.routeOptions.url &&
        request.routeOptions.url.startsWith(BASE_URL + '/customer')
    ){
        await verifyToken(request, reply);
    }
})

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
        // let customers
        // if(!ids || ids.length === 0){
        //     customers = await Customer.find(query).sort({[sort_on]:-1}).limit(5).lean().exec();
        // }
        // else{
        // }
        let customers = await Customer.find(query).sort({[sort_on]:-1}).lean().exec();
        
        // const fb_user = await getUserFromToken(request);
        if(request.user && request.user.role === "user"){
            customers = await flagFavorites(request.user.uid, customers)
            customers = await flagRatings(request.user.uid, customers)
            // console.log(customers)
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

fastify.put(BASE_URL + '/customer/rate', async(request, reply)=>{
    try{
        // await verifyToken(request,reply);
        
        const {id} = request.query;
        const {rating} = request.body;
        const customerToUpdate = await Customer.findOne({_id:id}).exec();
        const oldRating = customerToUpdate.rating || 0;
        const oldNumRatings = customerToUpdate.numRatings || 0;
        
        const user = await User.findOne({firebaseUid:request.user.uid})
        const existingRatingIndex = user.ratings.findIndex(r => r.customerId.toString() === id);

        let newRating
        if (existingRatingIndex !== -1) {
            // Update existing rating
            newRating = ((oldRating * oldNumRatings) - user.ratings[existingRatingIndex].rating + rating) / oldNumRatings
            user.ratings[existingRatingIndex].rating = rating;
            
        } else {
            // Add new rating
            user.ratings.push({ customerId: id, rating: rating });
            newRating = ((oldRating * oldNumRatings) + rating) / (oldNumRatings + 1);
            customerToUpdate.numRatings = oldNumRatings + 1;
        }
        // console.log(oldRating, oldNumRatings, rating, newRating)
        customerToUpdate.rating = newRating;
        const updatedCustomer = await customerToUpdate.save()


        await user.save()

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

fastify.get(BASE_URL + '/customer/random', async(request, reply)=>{
    try{
        const n = request.query.n || 5;
        const customers = await Customer.aggregate([
            {$match:{rating:{$gt:3}}},
            {$sample:{size:parseInt(n)}}
        ]).exec();

        return reply.code(200).send({
            data:customers,
            message:"Random customers found successfully",
            event_code:1,
            status_code:200
        })

    }catch(error){
        console.error(error)
        reply.code(400).send({
            message:"Customer not found",
            event_code:0,
            status_code:400,
            data:null
        });
    }
})