import { fastify, BASE_URL } from "./init.js"
// import {auth, admin} from "../config/firebase.js"
import User from "../models/user.js"
import Message from "../models/message.js"
import { verifyToken, getUserFromToken } from "../utils/firebase_utils.js"

fastify.post(BASE_URL + '/message', async(request, reply)=>{
    await verifyToken(request, reply)
    try{
        const {_id:sender} = await User.findOne({firebaseUid:request.user.uid}).select('_id').exec()
        const {id:receiver}= request.query
        const {messageText, fileLink} = request.body
        const specifiedVals = {
            sender, receiver, messageText, fileLink
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

fastify.get(BASE_URL + '/message', async(request, reply)=>{
    try{
        await verifyToken(request, reply)
        const {_id:sender} = await User.findOne({firebaseUid:request.user.uid}).select('_id').exec()

        const foundMessages = await Message.find({sender}).populate('receiver').exec()
        reply.code(200).send({
            data:foundMessages,
            message:"Messages retrieved successfully",
            event_code:1,
            status_code:200
        })

    }catch(error){
        console.error(error)
        reply.code(400).send({
            data:null,
            message:"Messages not retrieved",
            event_code:0,
            status_code:400
        })
    }
})