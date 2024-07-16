import { fastify, BASE_URL } from "./init.js"
// import {auth, admin} from "../config/firebase.js"
import User from "../models/user.js"
import Message from "../models/message.js"
import { verifyToken } from "../utils/firebase_utils.js"




fastify.post(BASE_URL + '/message', async(request, reply)=>{
    await verifyToken(request, reply)
    try{
        const {_id:senderId} = await User.findOne({firebaseUid:request.user.uid}).select('_id').exec()
        const {receiverId, messageText, fileLink} = request.body
        const specifiedVals = {
            senderId, receiverId, messageText, fileLink
        }
        const defaultVals = {
            messageText: "",
            fileLink: ""
        }
        const newMessage = new Message({
            ...defaultVals,
            ...specifiedVals
        })
        const message = await newMessage.save()
        reply.code(201).send({
            data:message,
            message:"Message sent successfully",
            event_code:1,
            status_code:201
        })
    }catch(error){
        console.error(error)
        reply.code(400).send({
            data:null,
            message:"Message not sent",
            event_code:0,
            status_code:400
        })
    }

})