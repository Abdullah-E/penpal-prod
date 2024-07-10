import { fastify, firebaseApp, BASE_URL } from "./init.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from "firebase/auth";
import admin from 'firebase-admin'
import bcrypt from 'bcrypt'

admin.initializeApp({
    credential: admin.credential.applicationDefault()
})

const auth = getAuth(firebaseApp);

import User from '../models/user.js'

// import {BASE_URL} from '../server.js'

fastify.post(BASE_URL+'/user', async (request, reply) => {
    // console.log(request.query)
    const role = request.query.role || 'user'
    const { email, password, fullname } = request.body;
    try {
        const hashPass = await bcrypt.hash(password, 10)
        // console.log(hashPass)
        const fb_user = await createUserWithEmailAndPassword(auth, email, password)
        await admin.auth().setCustomUserClaims(fb_user.user.uid, {role})

        const user = await User.create({
            email,
            password: hashPass,
            fullname,
            firebase_uid: fb_user.user.uid,
            role
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

fastify.get(BASE_URL+'/user/test', async (request, reply) => {
    const f_id = request.query.f_id
    const fb_user = await admin.auth().getUser(f_id)
    console.log(fb_user)
    reply.send(fb_user)
})