import { fastify, BASE_URL } from "./init.js";
import Customer from "../models/customer.js";

fastify.post(BASE_URL + '/customer/random', async(request, reply)=>{
    
})