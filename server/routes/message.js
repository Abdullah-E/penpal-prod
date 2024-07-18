import { fastify, BASE_URL } from "./init.js"
// import {auth, admin} from "../config/firebase.js"
import User from "../models/user.js"
import Message from "../models/message.js"
import { verifyToken, getUserFromToken } from "../utils/firebase_utils.js"

fastify.post(BASE_URL + '/user/chat', async(request, reply)=>{
    // await verifyToken(request, reply)
    try{
        const {_id:sender} = await User.findOne({firebaseUid:request.user.uid}).select('_id').exec()
        const {id:receiver}= request.query
        const {messageText, fileLink} = request.body
        const specifiedVals = {
            sender, receiver, messageText, fileLink
        }
        const defaultVals = {
            messageText: "",
            fileLink: "",
            unread: true
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

fastify.get(BASE_URL + '/user/chat', async(request, reply)=>{
    try{
        // await verifyToken(request, reply)
        const {_id:sender} = await User.findOne({firebaseUid:request.user.uid}).select('_id').exec()
        const {p:page=0, l:limit=100} = request.query
        if(page<0 || limit<0){
            return reply.code(400).send({
                data:null,
                message:"Invalid page or limit",
                event_code:0,
                status_code:400
            })
        }
        const foundMessages = await Message.find({sender}).populate('receiver').exec()
        let chats = []
        foundMessages.forEach((message)=>{
            //if receiver in chats:
            // let chat = {sender: message.sender, receiver: message.receiver}
            const chatInd = chats.findIndex(chat=>chat.receiver._id.equals(message.receiver._id))
            const messageObj= {
                _id:message._id,
                messageText:message.messageText || "",
                fileLink:message.fileLink || "",
                unread:message.unread,
                haveSend:true
            }
            if(chatInd == -1){
                chats.push({
                    sender: message.sender,
                    // receiver: message.receiver.select('name'),
                    receiver: (({_id, firstName, lastName,profilePic=""})=>({_id, firstName, lastName,profilePic}))(message.receiver),
                    messages: [messageObj]
                })
            }else{
                chats[chatInd].messages.push(messageObj)
            
            }
        })

        chats = chats.slice(page*limit, page*limit+limit)
        reply.code(200).send({
            data:{
                chats:chats,
                totalUnreadMsgs:chats.reduce((acc, chat)=>acc+chat.messages.filter(msg=>msg.unread).length, 0)
            },
            message:"Messages retrieved successfully",
            event_code:1,
            status_code:200,
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

fastify.put(BASE_URL + '/user/chat', async(request, reply)=>{
    try{
        // console.log(request.query)
        const{id:messageId} = request.query
        const messageNewFields = request.body
        const userId = (await User.findOne({firebaseUid:request.user.uid}).select('_id').exec())._id
        
        const messageToUpdate = await Message.findOne({_id:messageId})
        if(!messageToUpdate){
            reply.code(404).send({
                data:null,
                message:"Message not found",
                event_code:0,
                status_code:404
            })
        }
        // console.log(messageToUpdate.sender.equals(userId) )
        if(messageToUpdate.sender.equals(userId)){
            const updatedMsg = await Message.findOneAndUpdate({_id:messageId},messageNewFields,{new:true}).lean().exec()
            reply.code(200).send({
                data:updatedMsg,
                message:"Message updated successfully",
                event_code:1,
                status_code:200
            })
        }else{
            reply.code(403).send({
                data:null,
                message:"user id mismatch",
                event_code:0,
                status_code:403
            })
        }
    }
    catch(error){
        console.error(error)
        reply.code(400).send({
            data:null,
            message:"Message not updated",
            event_code:0,
            status_code:400
        })
    }
})