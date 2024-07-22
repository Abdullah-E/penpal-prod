import { fastify, BASE_URL } from "./init.js";
import Customer from "../models/customer.js";
import User from "../models/user.js";
import CustomerUpdate from "../models/customerUpdates.js";

import {verifyToken } from "../utils/firebase_utils.js";
import { flagFavorites, flagRatings } from "../utils/db_utils.js";

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

fastify.post(BASE_URL + '/customer', async(request, reply)=>{
    try{
        const defaultValues = {
            firstName: "",
            lastName: "",
            inmateNumber: "",
            mailingAddress: "",
            city: "",
            state: "",
            zipcode: "",
            gender: "Other",
            orientation: "Other",
            race: "",
            education: "Other",
            age: "",
            dateOfBirth: new Date(0),
            height: "",
            weight: "",
            hairColor: "Other",
            eyeColor: "Other",
            profileComplete: false,
            personality: {},
            rating: null,
            ratingReal: null,
            numRatings: 0,
            profilePic: "",
            createdAt: Date.now(),
            profileApproved: false,
        };

        //some fields in request.body can be arrays, need to get the first element from them:
        const fields = Object.keys(request.body)
        const fieldsFromRequest = {}
        fields.forEach(field => {
            if(field === "customerUpdates"){
                fieldsFromRequest[field] = request.body[field]
            }
            fieldsFromRequest[field] = Array.isArray(request.body[field]) ? request.body[field][0] : request.body[field]
            fieldsFromRequest[field] = fieldsFromRequest[field] === undefined || 
            fieldsFromRequest[field] === "" ? 
                (defaultValues[field]?defaultValues[field]:"" ): fieldsFromRequest[field]
        })
        console.log(fieldsFromRequest)
        const newCust = await Customer.create({...defaultValues, ...fieldsFromRequest});
        const user = await User.findOne({firebaseUid:request.user.uid}).exec()
        if(!user.createdCustomers){
            user.createdCustomers = [newCust._id]
        }else{
            user.createdCustomers.push(newCust._id)
        }
        console.log(user)
        await user.save()
        // await User.findOneAndUpdate({firebaseUid:request.user.uid}, user).exec()
        return reply.code(201).send({
            data:newCust,
            message:"Customer created successfully",
            event_code:1,
            status_code:201
        });
    }catch(error){
        console.error(error)
        return reply.code(400).send({
            message:`Customer not created: ${error}`,
            event_code:0,
            status_code:400,
            data:null
        });
    }
})

fastify.get(BASE_URL + '/customer', async(request, reply)=>{
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

fastify.put(BASE_URL + '/customer', async(request, reply)=>{
    try{
        const {id} = request.query
        // const customerToUpdate = await Customer.findOneAndUpdate({_id:id}, request.body, {new:true}).lean().exec()
        // const user = await User.findOne({firebaseUid:request.user.uid})
        const newUpdate = new CustomerUpdate({
            
            updateApproved:false
        })
        // await Customer.updateOne(
        //     {_id:id}, {$push:{customerUpdates:newUpdate._id}, new:true}
        // )
        // const updatedCustomer = await Customer.findOne({_id:id}).lean().exec()
        const updatedCustomer = await Customer.findOneAndUpdate(
            {_id:id}, {$push:{customerUpdates:newUpdate._id}}, {new:true}
        ).lean()
        const userUpdate = await User.findOneAndUpdate(
            {firebaseUid:request.user.uid}, {$push:{customerUpdates:newUpdate._id}}
        )
        newUpdate.customer = id
        newUpdate.user = userUpdate._id
        const {_id, ...rest} = updatedCustomer
        console.log(rest)
        const newBody = {...rest, ...request.body}
        newUpdate.newBody = newBody
        await newUpdate.save()

        reply.code(200).send({
            data:newUpdate,
            message:"Customer update requested successfully",
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
        const oldRating = customerToUpdate.ratingReal? customerToUpdate.ratingReal : 
            (customerToUpdate.rating?customerToUpdate.rating
            :0)
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
        customerToUpdate.ratingReal = newRating;
        //to two decimals:
        customerToUpdate.rating = newRating.toFixed(2);
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