import { fastify, firebaseApp, BASE_URL } from "./init.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import bcrypt from 'bcrypt'
const auth = getAuth(firebaseApp);


import User from '../models/user.js'

// import {BASE_URL} from '../server.js'

fastify.post(BASE_URL+'/user', async (request, reply) => {
    const { email, password, fullname } = request.body;
    try {
        const hashPass = await bcrypt.hash(password, 10)
        console.log(hashPass)
        const fb_user = await createUserWithEmailAndPassword(auth, email, password)
        const user = await User.create({
            email,
            password: hashPass,
            fullname,
            firebase_uid: fb_user.user.uid
        })
        const userObj = user.toObject()
        delete userObj.password
        reply.status(201).send({
            data:userObj,
            event_code:1,
            message:"User created successfully",
            status_code:201
        })
    } catch (error) {
        console.error(error)
        
        if(error.name == 'FirebaseError'){
            
            reply.status(500).send({
                data:null,
                event_code:0,
                message:error.code,
                status_code:500
            })
        }else{
            
            reply.status(500).send({
                data:null,
                event_code:0,
                message:error._message || error.message || error.name, 
                status_code:500
            })
        }
    }
})
