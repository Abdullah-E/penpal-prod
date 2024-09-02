import { fastify, BASE_URL } from "./init.js";
import mongoose from "mongoose";

import Customer, {customerDefaultValues, updatePendingPayments, DeletedCustomer} from "../models/customer.js";
import User from "../models/user.js";
import CustomerUpdate from "../models/customerUpdate.js";
import Favorite from "../models/favorite.js";

import {verifyToken } from "../utils/firebase_utils.js";
import {createCustomer, flagFavorites, flagRatings, flagCreated, flagUpdated, queryFromOptions, flagCreatedBy, paidByCreation} from "../utils/db_utils.js";
import { parseCustomerInfo } from "../utils/misc_utils.js";

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

        const options = {
            "specialInstructions":true
        }
        const newCust = await createCustomer(request.body, options, request.user)
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
        const ids = param["id"] && Array.isArray(param["id"])?param["id"]: [param["id"]]
        const sort_on = param["sort_on"] || "createdAt"
        const options = param["options"] && Array.isArray(param["options"])?param["options"]: [param["options"]]
        //specify other params here
        const page = param["p"] || 0
        const limit = param["l"] || 50

        if(param["id"] && ids.length >0){
            ids.map((id, index) => {
                ids[index] =new mongoose.Types.ObjectId(id)
            })
        }
        let query = {
            ...(param["id"] && ids && ids.length > 0 ? {_id:{$in:ids}} : {}),
            "customerStatus.status":'active',
            ...queryFromOptions(options)
        }
        let paidBy = false

        const user = await User.findOne({firebaseUid:request.user.uid}).exec()
        if(param["id"] && ids.length === 1){
            if(request.user && request.user.role === "user"){
                if(user.createdCustomers.includes(ids[0])){
                    console.log("user created customer")
                    query = {_id:ids[0]}
                }else{
                    console.log("user not created customer")
                    query = {_id:ids[0], "customerStatus.status":'active'}
                }
            }else{
                console.log("admin")
                paidBy = true
                query = {_id:ids[0]}
            }
        }
        // let customers = await Customer.find(query).skip(page*limit).limit(limit).populate('customerUpdate').sort({[sort_on]:-1}).lean().exec();
        // let customers = await Customer.find(query).exec();
        let customers = await Customer.aggregate([
            {$match:query},
            {$project:{
                "basicInfo":1, "personalityInfo":1, "photos":1, "imageId":1,
                "rating":1, "numRatings":1, 
                "customerStatus":1, "customerUpdate":1, "pendingPayments":1, "createdAt":1,
                "completedPurchases":1,

                "weight":{
                    $cond:[
                        {$eq:["$customerStatus.premiumPlacement", true]},
                        2,
                        {$cond:[
                            {$eq:["$customerStatus.featuredPlacement", true]},
                            1,
                            0
                        ]}
                    ]
                }
            }},
            {$lookup:{from:"customerupdates", localField:"customerUpdate", foreignField:"_id", as:"customerUpdate"}},
            {$lookup:{from:"purchases", localField:"completedPurchases", foreignField:"_id", as:"completedPurchases"}},
            {$sort:{"weight":-1,[sort_on]:-1}},
            {$skip:page*limit},
            {$limit:parseInt(limit)},
        ]).exec();

        if(request.user && request.user.role === "user"){
            // console.log(user)
            customers = await flagFavorites(user, customers)
            customers = await flagRatings(user, customers)
            customers = await flagCreated(user, customers)
            customers = flagUpdated(customers)
            customers = await flagCreatedBy(customers)
            console.log(customers)
        }
        
        if(paidBy){
            customers = await flagCreatedBy(customers)
            customers = await paidByCreation(customers)
        }
        
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
        const params = request.query
        const id = params["id"]
        const overwrite = params["overwrite"] && params["overwrite"] === "true"?true:false
        // const {id} = request.query
        const userToUpdate = await User.findOne({firebaseUid:request.user.uid}).exec()

        let customerToUpdate = await Customer.findOne({_id:id}).exec();
        let newUpdate

        if(!overwrite && customerToUpdate.customerUpdate){
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
        customerToUpdate.pendingPayments.wordLimit += request.body.wordLimit

        let directUpdate = true
        
        if(Object.keys(newUpdate.newBody.basicInfo).length > 0){
            const updatedFields = Object.keys(newUpdate.newBody.basicInfo)
            //map to object of bools
            customerToUpdate.pendingPayments.basicInfo = updatedFields.reduce((acc, field)=>{
                acc[field] = true
                return acc
            }, {})
            const noPaymentFields = ["mailingAddress", "institutionalEmailProvider"]
            directUpdate = updatedFields.every(field => noPaymentFields.includes(field))
            fieldsCount += updatedFields.length

            console.log(directUpdate)
            // directUpdate = false
        }
        if(Object.keys(newUpdate.newBody.personalityInfo).length > 0){
            const updatedFields = Object.keys(newUpdate.newBody.personalityInfo)
            customerToUpdate.pendingPayments.personalityInfo = updatedFields.reduce((acc, field)=>{
                acc[field] = true
                return acc
            }, {})

            fieldsCount += updatedFields.length
            directUpdate = false
        }
        customerToUpdate.pendingPayments.totalPaidPhotos += request.body.totalPaidPhotos
        if(newUpdate.newBody.photos){
            if(request.body.totalPaidPhotos > 0){
                customerToUpdate.pendingPayments.photo = true
                directUpdate = false
            }
        }
        customerToUpdate.pendingPayments.updateNum  = fieldsCount
        customerToUpdate = updatePendingPayments(customerToUpdate)

        if(request.body.specialInstructions){
            newUpdate.specialInstructionsFlag = true
            newUpdate.specialInstructionsText = request.body.specialInstructions
        }

        console.log("direct update", directUpdate)
        if(directUpdate){
            newUpdate.paymentPending = false
        }

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
            {$match:{"customerStatus.profileApproved":true, "customerStatus.status":"active"}},
            {$project:{"basicInfo.firstName":1, "basicInfo.lastName":1, rating:1, "photos.imageUrl":1, "basicInfo.age":1, "basicInfo.state":1, "customerStatus.tag":1}},
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

fastify.get(BASE_URL + '/customer/updates-rem', async(request, reply)=>{
    try{
        const customers = await Customer.find().exec();
        for(let customer of customers){
            if(customer.customerUpdate){
                console.log("removing update", customer.basicInfo.firstName)
                customer.customerUpdate = undefined
                // delete customer._doc.customerUpdate
            }
            customer.pendingPayments.update = false
            customer.pendingPayments.updateNum = 0
            customer.pendingPayments.basicInfo = {}
            customer.pendingPayments.personalityInfo = {}
            customer.pendingPayments.photo = false
            customer.pendingPayments.totalPaidPhotos = 0
            customer.pendingPayments.wordLimit = 0
            customer = await updatePendingPayments(customer)
            await customer.save()
        }
        return reply.send({
            data:customers,
            message:"Customer updates removed",
            event_code:1,
            status_code:200
        })
    }catch(error){
        console.error(error)
        return reply.send({
            message:"Customer updates not removed",
            event_code:0,
            status_code:400,
            data:null
        })
    }
})

fastify.get(BASE_URL + '/customer/wipe-and-clean', async(request, reply)=>{
    try{
        const users = await User.find().populate("favorite").exec()
        for(let user of users){
            user.createdCustomers = []
            user.favorite = undefined
            user.compatibleCustomers = []
            user.ratings = []
            user.customerUpdates = []
            user.completedPurchases = []
            user.notifications = []
            await user.save()
        }
        return reply.send({
            data:users,
            message:"Users wiped",
            event_code:1,
            status_code:200
        })
    }catch(error){
        console.error(error)
    }
})