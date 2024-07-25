import { fastify, BASE_URL } from "./init.js";
import Customer, {customerDefaultValues} from "../models/customer.js";
import User from "../models/user.js";
import CustomerUpdate from "../models/customerUpdate.js";

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

const parseCustomerInfo = (body) => {
    const fields = Object.keys(body)
    const customer = {}
    fields.forEach(field => {
        if(field === "spokenLanguages"){
            // console.log("skipping", field)
            customer[field] = body[field]
            return
        }
        customer[field] = Array.isArray(body[field]) ? body[field][0] : body[field]
        customer[field] = customer[field] === undefined || 
        customer[field] === "" ? 
            (customerDefaultValues[field]?customerDefaultValues[field]:"" ): customer[field]
    })
    return customer

}

fastify.post(BASE_URL + '/customer', async(request, reply)=>{
    try{
        

        //some fields in request.body can be arrays, need to get the first element from them:
        // const fields = Object.keys(request.body)
        const fieldsFromRequest = parseCustomerInfo(request.body)
        // console.log(fieldsFromRequest)
        const newCust = await Customer.create({...customerDefaultValues, ...fieldsFromRequest});
        const user = await User.findOne({firebaseUid:request.user.uid}).exec()
        if(!user.createdCustomers){
            user.createdCustomers = [newCust._id]
        }else{
            user.createdCustomers.push(newCust._id)
        }
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

        if(customers.length === 1){
            return reply.code(200).send({
                data:customers[0],
                message:"Customer found successfully",
                event_code:1,
                status_code:200
            })
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
        const userToUpdate = await User.findOne({firebaseUid:request.user.uid}).exec()
        if(!userToUpdate.createdCustomers.includes(id)){
            return reply.code(403).send({
                data:null,
                message:"Unauthorized - Not creator of customer",
                event_code:0,
                status_code:403
            })
        }


        const customerToUpdate = await Customer.findOne({_id:id}).exec();
        let newUpdate
        if(customerToUpdate.customerUpdate && customerToUpdate.customerUpdate !== ""){
            newUpdate=await CustomerUpdate.findOne({_id:customerToUpdate.customerUpdate}).exec()
            // console.log(newUpdate)

        }else{
            newUpdate = new CustomerUpdate({
                updateApproved:false
            })
            customerToUpdate.customerUpdate = newUpdate._id
            await customerToUpdate.save()
        }
        // const userUpdate = await User.findOneAndUpdate(
        //     {firebaseUid:request.user.uid}, {$addToSet:{customerUpdates:newUpdate._id}}, {new:true}
        // )
        if(!userToUpdate.customerUpdates.includes(newUpdate._id)){
            userToUpdate.customerUpdates.push(newUpdate._id)
        }
        await userToUpdate.save()

        newUpdate.customer = id
        newUpdate.user = userToUpdate._id

        // const {_id, ...rest} = customerToUpdate
        newUpdate.newBody = parseCustomerInfo(request.body)
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
            // {$match:{rating:{$gt:3}}},
            {$project:{_id:0, firstName:1, lastName:1, rating:1, profilePic:1, age:1, state:1, imageUrl:1, tag:1}},
            {$sample:{size:parseInt(n)}},
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

fastify.delete(BASE_URL + '/customer/allupdates', async(request, reply)=>{
    const customers = await Customer.updateMany({}, {$unset:{customerUpdates:1}}, {multi:true}).exec()
    //remove the field customer updates from all customers
    return reply.send({
        data:customers,
        message:"All customer updates removed",
        event_code:1,
        status_code:200
    })
})