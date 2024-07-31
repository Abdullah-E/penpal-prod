import { fastify, BASE_URL } from "./init.js";
import mongoose from "mongoose";

import Customer, {customerDefaultValues, updatePendingPayments, DeletedCustomer} from "../models/customer.js";
import User from "../models/user.js";
import CustomerUpdate from "../models/customerUpdate.js";
import Favorite from "../models/favorite.js";

import {verifyToken } from "../utils/firebase_utils.js";
import { flagFavorites, flagRatings, flagCreated, flagUpdated } from "../utils/db_utils.js";

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
    
    const fields = body["basicInfo"]?Object.keys(body["basicInfo"]):[]
    const customer = {
        basicInfo:{}
        // personalityInfo:{},
    }
    fields.forEach(field => {
        if(field === "spokenLanguages"){
            // console.log("skipping", field)
            customer["basicInfo"][field] = body["basicInfo"][field]
            return
        }
        customer["basicInfo"][field] = Array.isArray(body["basicInfo"][field]) ? body["basicInfo"][field][0] : body["basicInfo"][field]
        customer["basicInfo"][field] = customer["basicInfo"][field] === undefined || 
        customer["basicInfo"][field] === "" ? 
            (customerDefaultValues["basicInfo"][field]?customerDefaultValues["basicInfo"][field]:"" ): customer["basicInfo"][field]
    })
    customer["personalityInfo"] = body["personalityInfo"]
    customer["photos"] = body["photos"]
    return customer

}

fastify.post(BASE_URL + '/customer', async(request, reply)=>{
    try{
        
        //some fields in request.body can be arrays, need to get the first element from them:
        const fieldsFromRequest = parseCustomerInfo(request.body)
        // console.log(fieldsFromRequest)
        // const newCust = await Customer.create({...customerDefaultValues, ...fieldsFromRequest});
        let newCust = new Customer({...customerDefaultValues, ...fieldsFromRequest})
        // newCust.photos.total = newCust.photos.artworks.length + 1
        // const bioWordCount = newCust.basicInfo.bio.split(" ").length
        // if(bioWordCount > newCust.customerStatus.bioWordLimit){
        //     newCust.pendingPayments.wordLimit = Math.ceil(bioWordCount/350)>1?Math.ceil(bioWordCount/350)-1:0
        // }

        // if(request.body.wordLimit > 0){
        newCust.pendingPayments.wordLimit = request.body.wordLimit
        // }

        if(request.body.totalPaidPhotos >0){
            newCust.pendingPayments.totalPaidPhotos = request.body.totalPaidPhotos
            newCust.pendingPayments.photo = true
        }
        
        // if(newCust.photos.total > newCust.customerStatus.photoLimit){
        //     newCust.pendingPayments.photo = true
        //     newCust.pendingPayments.totalPaidPhotos = newCust.photos.total - newCust.customerStatus.photoLimit
        // }
        newCust = await updatePendingPayments(newCust)
        await newCust.save()
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
        const page = param["p"] || 0
        const limit = param["l"] || 50
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {}),
            
            //add them in here
        }
        let customers = await Customer.find(query).skip(page*limit).limit(limit).populate('customerUpdate').sort({[sort_on]:-1}).lean().exec();
        // const fb_user = await getUserFromToken(request);
        if(request.user && request.user.role === "user"){
            const user = await User.findOne({firebaseUid:request.user.uid}).exec()
            customers = await flagFavorites(user, customers)
            customers = await flagRatings(user, customers)
            customers = await flagCreated(user, customers)
            customers = flagUpdated(customers)
            // console.log(customers)
        }
        
        if(customers.length === 1){
            // const customer = customers[0]
            // if(customer.customerUpdate){
                // const pendingPayments = customer.pendingPayments
                // const basicInfoUpdatedFields = Object.keys(customer.customerUpdate.newBody.basicInfo)
                // const personalityInfoUpdatedFields = Object.keys(customer.customerUpdate.newBody.personalityInfo)
                // customer.pendingPayments 
            // }
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
        // if(!userToUpdate.createdCustomers.includes(id)){
        //     return reply.code(403).send({
        //         data:null,
        //         message:"Unauthorized - Not creator of customer",
        //         event_code:0,
        //         status_code:403
        //     })
        // }
        let customerToUpdate = await Customer.findOne({_id:id}).exec();
        let newUpdate
        // if(customerToUpdate.pendingPayments.creation){
        //     return reply.code(400).send({
        //         data:null,
        //         message:"creation pending",
        //         event_code:0,
        //         status_code:400
        //     })
        // }
        if(customerToUpdate.customerUpdate){
            return reply.code(400).send({
                data:null,
                message:"update pending",
                event_code:0,
                status_code:400
            })
            // console.log(newUpdate)
        }else{
            newUpdate = new CustomerUpdate({
                updateApproved:false,
                paymentPending:true,
            })
            customerToUpdate.customerUpdate = newUpdate._id
            customerToUpdate.pendingPayments.update = true
        }

        if(!userToUpdate.customerUpdates.includes(newUpdate._id)){
            userToUpdate.customerUpdates.push(newUpdate._id)
        }
        await userToUpdate.save()
        
        newUpdate.customer = id
        newUpdate.user = userToUpdate._id
        newUpdate.newBody = parseCustomerInfo(request.body)

        let fieldsCount = 0
        if(newUpdate.newBody.basicInfo){
            const updatedFields = Object.keys(newUpdate.newBody.basicInfo)
            //map to object of bools
            customerToUpdate.pendingPayments.basicInfo = updatedFields.reduce((acc, field)=>{
                acc[field] = true
                return acc
            }, {})
            // console.log("updated fields", customerToUpdate.pendingPayments.basicInfo)

            fieldsCount += updatedFields.length
            if(newUpdate.newBody.basicInfo.bio){
                customerToUpdate.pendingPayments.wordLimit += request.body.wordLimit
            }
           
        }
        if(newUpdate.newBody.personalityInfo){
            const updatedFields = Object.keys(newUpdate.newBody.personalityInfo)
            customerToUpdate.pendingPayments.personalityInfo = updatedFields.reduce((acc, field)=>{
                acc[field] = true
                return acc
            }, {})

            fieldsCount += updatedFields.length
        }
        if(newUpdate.newBody.photos){
            // const photosInNewBody = newUpdate.newBody.photos.artworks?.length + (newUpdate.newBody.photos.imageUrl?1:0)
            // // fieldsCount +=  photosInNewBody
            // const newPhotosCount = newUpdate.newBody.photos.artworks?.length + (customerToUpdate.photos.imageUrl?1:0) +customerToUpdate.photos.artworks.length

            // // console.log("new photos count", newPhotosCount)
            // if(newPhotosCount > customerToUpdate.customerStatus.photoLimit){
            //     customerToUpdate.pendingPayments.photo = true
            //     customerToUpdate.pendingPayments.totalPaidPhotos = newPhotosCount - customerToUpdate.customerStatus.photoLimit
            //     customerToUpdate.pendingPayments.updatedPhotos = photosInNewBody
            // }
            customerToUpdate.pendingPayments.photo = true
            customerToUpdate.pendingPayments.totalPaidPhotos += request.body.totalPaidPhotos
        }
        customerToUpdate.pendingPayments.updateNum  = fieldsCount
        customerToUpdate = updatePendingPayments(customerToUpdate)
        await newUpdate.save()
        await customerToUpdate.save()
            
        reply.code(200).send({
            data:newUpdate,
            message:"Customer update requested successfully",
            event_code:1,
            status_code:200
        });
    }catch(error){
        console.error(error)
        reply.code(400).send({
            message:`Customer not updated ${error.message}`,
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
            {$match:{profileApproved:true, status:"active"}},
            {$project:{_id:0, "bascicInfo.firstName":1, "basicInfo.lastName":1, rating:1, "photos.imageUrl":1, "basicInfo.age":1, "basicInfo.state":1, "basicInfo.tag":1}},
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

fastify.put(BASE_URL + '/customer/direct', async(request, reply)=>{
    try{
        const {id} = request.query;
        const newBody = request.body;
        // const customerToUpdate = await Customer.findOneAndUpdate({_id:id}, newBody, {new:true}).lean().exec();
        let customerToUpdate = await Customer.findOne({_id:id}).exec();
        for(const field in newBody){
            customerToUpdate[field] = newBody[field]
        }
        customerToUpdate = await updatePendingPayments(customerToUpdate)
        const updatedCustomer = await customerToUpdate.save()
        reply.code(200).send({
            data:updatedCustomer,
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

/*customer is present in user: 
createdCustomers, 
ratings,
favorite,
compatibleCustomers,

as customer field in
customerUpdate.customer
favorite.favorites
*/

fastify.delete(BASE_URL + '/customer', async(request, reply)=>{
    try{
        const {id} = request.query;
        // const userToUpdate = await User.findOne({firebaseUid:request.user.uid}).exec()
        if(request.user.role !== "admin"){
            return reply.code(403).send({
                data:null,
                message:"Unauthorized - Admin only",
                event_code:0,
                status_code:403
            })
        }
        // const customerToDelete = await Customer.findOneAndDelete({_id:id}).exec();
        const customerToDelete = await Customer.findOne({_id:id}).exec();
        
        if(customerToDelete){
            
            const deletedCustomer = new DeletedCustomer(customerToDelete.toObject())
            deletedCustomer.deletedAt = new Date()
            deletedCustomer._id = new mongoose.Types.ObjectId()
            await deletedCustomer.save()
            // await customerToDelete.remove()
            await Customer.deleteOne({_id:id}).exec() 
        }

        
        await User.updateMany(
            {},
            {$pull:{createdCustomers:id}, $pull:{compatibleCustomers:id}, $pull:{ratings:{customerId:id}}},
        ).exec()
        

        // user.createdCustomers = user.createdCustomers.filter(c => c.toString() !== id)
        // user.favorite.favorites = user.favorite.favorites.filter(f => f.toString() !== id)
        await Favorite.updateMany(
            {},
            {$pull:{favorites:id}}
        ).exec()

        await CustomerUpdate.deleteMany({customer:id}).exec()
        // user.compatibleCustomers = user.compatibleCustomers.filter(c => c.toString() !== id)
        // user.ratings = user.ratings.filter(r => r.customerId.toString() !== id)

        // await User.updateOne(
        //     {firebaseUid:request.user.uid},
        //     user
        // ).exec()

        return reply.code(200).send({
            data:customerToDelete,
            message:"Customer deleted successfully",
            event_code:1,
            status_code:200
        });
    }catch(error){
        console.error(error)
        return reply.code(400).send({
            message:"Customer not deleted",
            event_code:0,
            status_code:400,
            data:null
        });
    }
})