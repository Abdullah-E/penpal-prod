import { fastify, BASE_URL } from "./init.js";

import User from "../models/user.js";
import CustomerUpdate from "../models/customerUpdate.js"
import Notification from "../models/notification.js";
import Customer, {customerDefaultValues, updatePendingPayments} from "../models/customer.js"

import { getUserFromToken } from "../utils/firebase_utils.js"
import { applyCustomerUpdate, createCustomer} from "../utils/db_utils.js"
import { extendDateByMonth, isEmpty, parseCustomerInfo} from "../utils/misc_utils.js";
import Purchase from "../models/purchase.js";

// import { frontendUrl } from "../index.js";

fastify.addHook("onRequest", async (request, reply) => {
    if (request.routeOptions.url && request.routeOptions.url.startsWith(BASE_URL+"/admin")){
        const fb_user = await getUserFromToken(request, reply)
        if (!fb_user) {
            return reply.code(403).send({
                data:null,
                message: "Unauthorized - No token/Invalid token",
                status_code: 403,
                event_code:0
            });
        }else if(fb_user.role !== "admin"){
            return reply.code(403).send({
                data:null,
                message: "Unauthorized - Not an admin",
                status_code: 403,
                event_code:0
            })
        }else{
            request.user = fb_user
        }
    }
})

fastify.get(BASE_URL+"/admin/customer", async (request, reply) => {
    try{
        const param = request.query
        const id = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const approvedBool = param["approved"] === "true"?true:false
        const paymentBool = param["paymentPending"] === "false"?false:true
        const paginate = param["p"] && param["l"]

        const query = {
            ...(id && id.length > 0 ? {_id:{$in:id}} : {}),
            ...(param["approved"]?{"customerStatus.profileApproved":approvedBool}:{}),
            ...(param["paymentPending"]?{"pendingPayments.creation":paymentBool}:{})
        }
        console.log(query)
        let customers = []
        if(paginate){

            const page = parseInt(param["p"] || 0)
            const limit = parseInt(param["l"] || 50)
            customers = await Customer.find(query).skip(page*limit).limit(limit).lean().exec();
        }
        else{
            customers = await Customer.find(query).lean().exec()
        }
        customers.map(customer => {
            if(customer.customerStatus.specialInstructionsFlag){
                console.log("specialInstructionsFlag", customer.basicInfo.firstName)
                customer.specialInstructionsFlag = true
                customer.specialInstructionsText = customer.customerStatus.specialInstructionsText
            }
            else{
                customer.specialInstructionsFlag = false
                customer.specialInstructionsText = ""
            }
            return customer
        })
        
        reply.send({
            data: customers,
            message: `Customer${customers.length === 1? "":"s"} found successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.post(BASE_URL+"/admin/customer", async(request, reply)=>{
    try{

        const params = request.query
        const paidCreation = params["pay"] && params["pay"] === "false" ? false : true
        const approved = params["approve"] && params["approve"] === "false" ? false : true
        const newCustomer = await createCustomer(request.body, {
            paidCreation,
            approved,
            // request.user
        })
        // console.log(newCustomer)
        // if(paidCreation){
        //     newCustomer["pendingPayments"]["creation"] = false
        //     newCustomer["customerStatus"]["status"] = 'unapproved'
        //     if(request.body.wordLimit && request.body.wordLimit >0){
        //         newCustomer.customerStatus.wordLimitExtended = true
        //         newCustomer.customerStatus.bioWordLimit = request.body.wordLimit * 100
        //     }
            
        //     if(request.body.totalPaidPhotos && request.body.totalPaidPhotos >0){
        //         newCustomer.customerStatus.photoLimit = request.body.totalPaidPhotos
        //     }
        // }

        // if(approved ){
        //     //do payments:
        //     newCustomer["pendingPayments"]["creation"] = false
        //     newCustomer["customerStatus"]["status"] = 'unapproved'
        //     if(request.body.wordLimit && request.body.wordLimit >0){
        //         newCustomer.customerStatus.wordLimitExtended = true
        //         newCustomer.customerStatus.bioWordLimit = request.body.wordLimit * 100
        //     }
            
        //     if(request.body.totalPaidPhotos && request.body.totalPaidPhotos >0){
        //         newCustomer.customerStatus.photoLimit = request.body.totalPaidPhotos
        //     }
        //     //approve:
        //     newCustomer["customerStatus"]["profileApproved"] = true
        //     newCustomer["customerStatus"]["expiresAt"] = extendDateByMonth(new Date(), 12)
        //     newCustomer["customerStatus"]["newlyListed"] = true
        //     newCustomer["customerStatus"]["tag"] = "New Profile"
        //     newCustomer["customerStatus"]["status"] = "active"
        // }


        // const savedCustomer = await newCustomer.save()
        reply.send({
            data: newCustomer,
            message: `Customer created successfully`,
            event_code: 1,
            status_code: 200
        })

    }
    catch(err){
        console.error(err)
        return reply.send({
            data:null,
            message:err.message,
            event_code:0,
            status_code:500
        })
    }
})

fastify.put(BASE_URL+"/admin/customer", async (request, reply) => {
    try{
        const update = {
            basicInfo:{},
            personalityInfo:{},
            photos:{},
            ...request.body

        }
        
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }
        
        // const customers = await Customer.updateMany(query, {
        //     ...param
        // }, {new:true}).lean().exec()
        if(update["basicInfo"]){
            for(const field in update["basicInfo"]){
                if(field === "spokenLanguages"){
                    continue
                }
                if(Array.isArray(update["basicInfo"][field])){
                    update["basicInfo"][field] = update["basicInfo"][field][0]
                }
            }
        }
    
        const customersToUpdate = await Customer.find(query).exec()
        for (let customer of customersToUpdate){
            customer["basicInfo"] = { ...customer["basicInfo"], ...update["basicInfo"] }
            customer["personalityInfo"] = { ...customer["personalityInfo"], ...update["personalityInfo"] }
            customer["photos"] = { ...customer["photos"], ...update["photos"] }
            await customer.save()
        }

        // for (let customer of customersToUpdate){
        //     const newCustomer = await applyCustomerUpdate(customer, update)
        //     await newCustomer.save()
        // }
        reply.send({
            data: customersToUpdate,
            message: `Customers updated successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        console.error(err)
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.put(BASE_URL+"/admin/approve-customer", async (request, reply) => {
    try{
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }
        if(isEmpty(query)){
            return reply.code(400).send({
                data:null,
                message:"No ids provided",
                status_code:400,
                event_code:0
            })
        }
        const customers = await Customer.updateMany(query, {
            "customerStatus.profileApproved":true, 
            createdAt:Date.now(), 
            "customerStatus.expiresAt":extendDateByMonth(new Date(), 12),
            "customerStatus.newlyListed":true,
            "customerStatus.tag":"New Profile",
            "customerStatus.status":"active"
        }, {new:true}).lean().exec()
        return reply.send({
            data: customers,
            message: `Customers approved successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        console.error(err)
        return reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.get(BASE_URL+"/admin/update", async (request, reply) => {
    try{

        const param = request.query
        const id = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const approvedBool = param["approved"] === "true"?true:false
        const paymentBool = param["paymentPending"] === "true"?true:false
        // console.log(approvedBool, paymentBool)

        const query = {
            ...(id && id.length > 0 ? {customer:{$in:id}} : {}),
            ...(param["approved"]?{updateApproved:approvedBool}:{}),
            paymentPending:paymentBool
            // updateApproved:param["approved"]?approvedBool:undefined
        }

        let paidBy = param["id"] && id.length === 1
        
        console.log(query)
        const updates = await CustomerUpdate.find(query).populate("customer").populate("user").lean().exec()
        const returnArr = []
        for(const update of updates){
            if(!update.customer) continue
            // console.log("update", update)
            // const updatedFields = {
            //     "basicInfo":[],
            //     "personalityInfo":[],
            //     "photos":[]
            // }
            const updatedFields = []
            for(const field in update.newBody){
                if(typeof update.newBody[field] === "object"){
                    updatedFields.push(...Object.keys(update.newBody[field]))
                }   
            }
            const newBasicInfo = {
                ...update.customer.basicInfo,
                ...(update.newBody.basicInfo && Object.keys(update.newBody.basicInfo).length > 0 ? update.newBody.basicInfo : {})
            }
            const newPersonalityInfo = {
                ...update.customer.personalityInfo,
                ...(update.newBody.personalityInfo && Object.keys(update.newBody.personalityInfo).length > 0 ? update.newBody.personalityInfo : {})
            }
            const newPhotos = {
                ...update.customer.photos,
                ...(update.newBody.photos && Object.keys(update.newBody.photos).length > 0 ? update.newBody.photos : {})
            }

            update.customer.updatedBy = update.user
            if(update.paidBy){
                update.customer.paidBy = await User.findOne({_id:update.paidBy}).lean().exec()

            }
            if(update.specialInstructionsFlag){
                update.customer.specialInstructionsFlag = true
                update.customer.specialInstructionsText = update.specialInstructionsText
            }
            else{
                update.customer.specialInstructionsFlag = false
                update.customer.specialInstructionsText = ""
            }

            returnArr.push({
                ...update.customer,
                personalityInfo:newPersonalityInfo,
                basicInfo:newBasicInfo,
                photos:newPhotos,
                updatedFields,
            })
        }

        reply.send({
            data: returnArr,
            message: `${approvedBool?'':'Un'}approved ${paymentBool?'Un':''}paid updates found successfully`,
            event_code: 1,
            status_code: 200
        })

    }catch(err){
        console.error(err)
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.put(BASE_URL+"/admin/approve-update", async (request, reply) => {
    try{
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }
    
        const customersToUpdate = await Customer.find(query).populate("customerUpdate").exec()
        const updatedCustomers = []
        for(let customer of customersToUpdate){
            if(!customer.customerUpdate){
                console.error("No update found for customer", customer._id)
                continue
            }
            const update = await CustomerUpdate.findById(customer.customerUpdate._id)
            
            customer = await applyCustomerUpdate(customer, update)
            await customer.save()

            update.updateApproved = true
            updatedCustomers.push(customer)
            await update.save()
        }
        reply.send({
            data: updatedCustomers.length === 1 ? updatedCustomers[0] : updatedCustomers,
            message: `Update${updatedCustomers.length>1?"s":""} approved successfully`,
            event_code: 1,
            status_code: 200
        })

        // generate notifications
        
        for(const customer of customersToUpdate){
            // const customerId = customer._id
            const customerFavoriteUsers = await User.aggregate([
                {
                    $lookup:{
                        from:"favorites",
                        localField:"favorite",
                        foreignField:"_id",
                        as:"favoriteInfo"
                    }
                },
                {$unwind:"$favoriteInfo"},
                {
                    $match:{
                        "favoriteInfo.favorites":customer._id
                    }
                }
            ])
            if(customerFavoriteUsers.length === 0){
                // console.log("No favorite users found for customer", customer._id)
                continue
            }
            for(const user of customerFavoriteUsers){
                const newNotification = new Notification({
                    read: false,
                    readAt: null,
                    type: "customerUpdate",
                    message: `${customer.basicInfo.firstName} from your favorite list has been updated!`,
                    link: `${process.env.FRONTEND_URL}/inmate/${customer._id}`,
                    customer: customer._id,
                    user: user._id
                })
                const createdNotification = await newNotification.save()
                await User.updateOne({_id: user._id}, {$push: {notifications: createdNotification._id}})
            }
        }
    }
    catch(err){
        console.error(err)
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.put(BASE_URL+"/admin/reject-update", async (request, reply) => {
    try{
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }
    
        const customersToUpdate = await Customer.find(query).populate("customerUpdate").exec()
        const updatedCustomers = []
        for(let customer of customersToUpdate){
            // if(!customer.customerUpdate){
            //     console.error("No update found for customer", customer._id)
            //     continue
            // }

            // const update = await CustomerUpdate.findById(customer.customerUpdate._id)
            // update.updateApproved = false
            // delete customer._doc.customerUpdate
            const update = await CustomerUpdate.findByIdAndDelete(customer.customerUpdate._id)
            customer.customerUpdate = undefined
            delete customer._doc.customerUpdate
            customer.pendingPayments.update = false
            customer.pendingPayments.updateNum = 0
            customer.pendingPayments.photo = false
            customer.pendingPayments.totalPaidPhotos = 0
            customer.pendingPayments.wordLimit = 0
            customer.pendingPayments.basicInfo = {}
            customer.pendingPayments.personalityInfo = {}
            customer = updatePendingPayments(customer)
            updatedCustomers.push(customer)
            customer.markModified("pendingPayments")
            await customer.save()
        }
        reply.send({
            data: updatedCustomers.length === 1 ? updatedCustomers[0] : updatedCustomers,
            message: `Update${updatedCustomers.length>1?"s":""} rejected successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        console.error(err)
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.put(BASE_URL+"/admin/customer-status", async (request, reply) => {
    try{
        const param = request.query
        const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
        const query = {
            ...(ids && ids.length > 0 ? {_id:{$in:ids}} : {})
        }

        const {status} = request.body
        const customers = await Customer.updateMany(query, {
            "customerStatus.status":status
        }, {new:true}).lean().exec()

        
        // const customers = await Customer.updateMany(query, {
        //     "customerStatus.status":"inactive"
        // }, {new:true}).lean().exec()
        reply.send({
            data: customers,
            message: `Customers deactivated successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        reply.code(500).send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

fastify.get(BASE_URL + "/admin/payment-histories", async (request, reply) => {
    try {
      // Get page and limit from query parameters, with default values for both
      const { page = 1, limit = 10, customer } = request.query;
  
      // Convert page and limit to integers, in case they are passed as strings
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
  
      // Calculate the number of documents to skip based on the current page and limit
      const skip = (pageNumber - 1) * limitNumber;
  
      // Build the query object dynamically
      const query = { status: "complete" };
      if (customer) {
        query.customer = customer; // Add the customer filter if provided
      }

      // Query for completed purchases with pagination
      const customers = await Purchase.find(query)
        .lean()
        .skip(skip)
        .limit(limitNumber)
        .populate({
            path: 'user',
            select: 'email' 
         })
        .exec();
  
      // Get the total number of purchases to calculate total pages
      const totalCustomers = await Purchase.countDocuments(query);
  
      // Calculate total pages based on total documents and limit
      const totalPages = Math.ceil(totalCustomers / limitNumber);
  
      reply.send({
        data: customers,
        currentPage: pageNumber,
        totalPages: totalPages,
        totalItems: totalCustomers,
        message: `Customers retrieved successfully`,
        event_code: 1,
        status_code: 200
      });
    } catch (err) {
      reply.code(500).send({
        data: null,
        message: err.message,
        status_code: 500,
        event_code: 0
      });
    }
});

fastify.get(BASE_URL + "/admin/user-listing", async (request, reply) => {
    try {
      // Get page and limit from query parameters, with default values for both
      const { page = 1, limit = 10, user } = request.query;
  
      // Convert page and limit to integers, in case they are passed as strings
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
  
      // Calculate the number of documents to skip based on the current page and limit
      const skip = (pageNumber - 1) * limitNumber;

      const users = await User.find({role:'user'})
        .lean()
        .skip(skip)
        .limit(limitNumber)
        .exec();
  
      // Get the total number of purchases to calculate total pages
      const totalUsers = await User.countDocuments({role:'user'});
  
      // Calculate total pages based on total documents and limit
      const totalPages = Math.ceil(totalUsers / limitNumber);
  
      reply.send({
        data: users,
        currentPage: pageNumber,
        totalPages: totalPages,
        totalItems: totalUsers,
        message: `Users retrieved successfully`,
        event_code: 1,
        status_code: 200
      });
    } catch (err) {
      reply.code(500).send({
        data: null,
        message: err.message,
        status_code: 500,
        event_code: 0
      });
    }
});

fastify.post(BASE_URL + "/admin/add-referral", async (request, reply) => {
    try {

        const { userId, amount } = request.body;

        const user = await User.findOne({_id: userId}).exec();
        if(!user) {
            return reply.send({
                data:null,
                message: "User not exists",
                event_code:0,
                status_code: 400
            })
        }
        if(!amount || amount < 0) {
            return reply.send({
                data:null,
                message: "Invalid amount",
                event_code:0,
                status_code: 400
            })
        }
        user.referralBalance += amount;
        await user.save();

        reply.send({
            data: user,
            message: `Referral balance added successfully`,
            event_code: 1,
            status_code: 200
        })
    }
    catch(err){
        console.error(err)
        return reply.send({
            data:null,
            message:err.message,
            event_code:0,
            status_code:500
        });
    }
});