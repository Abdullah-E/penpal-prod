import {BASE_URL, fastify} from './init.js'

import User from '../models/user.js'
import Purchase from '../models/purchase.js'
import Product from '../models/product.js'

import Stripe from 'stripe'

import { verifyToken } from '../utils/firebase_utils.js'
import Customer from '../models/customer.js'

const stripe = new Stripe(process.env.STRIPE_API_KEY)
// console.log(process.env.STRIPE_API_KEY)

fastify.addHook('onRequest', async (request, reply) => {
    // const isExcludedRoute = request.routeOptions.url.includes('webhook')
    if(
        request.routeOptions.url
        && request.routeOptions.url.includes(BASE_URL + '/payment')
    ){
        await verifyToken(request, reply)
    }
})

fastify.post(BASE_URL+'/payment/create-checkout-session', async (request, reply) => {
    try{

        const {productName, quantity, cid} = request.body
        const product = await Product.findOne({name: productName})
        const user = await User.findOne({firebaseUid:request.user.uid}).exec()
        
        const session = await stripe.checkout.sessions.create({
            ui_mode:'embedded',
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: product.priceId,
                    quantity: parseInt(quantity)
                }
            ],
            return_url: `http://localhost:3000/return?session_id={CHECKOUT_SESSION_ID}`,
        })
    
        const newPurchase = new Purchase({
            user: user._id,
            product: product._id,
            customer: cid,
            sessionId: session.id,
            quantity: quantity,
            total: product.price * parseInt(quantity),
            status: 'pending',
        })
    
        await newPurchase.save()
        console.log(session)
        reply.send({
            data:{
                clientSecret: session.client_secret,
                status:session.status
            },
            message: 'Session created',
            status_code: 200,
            event_code:1
        })
    }catch(err){
        console.error(err)
        return reply.status(500).send({
            message: err.message,
            data: null,
            status_code: 500,
            event_code: 0
        })
    }

})

fastify.get(BASE_URL+'/payment/session-status', async (request, reply) => {
    try{
        const {session_id} = request.query
        const session = await stripe.checkout.sessions.retrieve(session_id)
        const purchase = await Purchase.findOne({sessionId: session_id}).exec()
    
        purchase.status = session.status
        await purchase.save()
    
        console.log(session)
        reply.send({
            data:{
                status: session.status
                // customerEmail: session.customer_details.email
            },
            message: 'Session retrieved',
            status_code: 200,
            event_code:1
        })
        if(session.status !== 'completed'){
            return
        }
        if(purchase.product == 'year_profile'){
            await Customer.updateOne({_id: purchase.customer}, {creationPaymentPending: false, status:'active'})

        }
    }
    catch(err){
        console.error(err)
        reply.status(500).send({
            message: err.message,
            data: null,
            status_code: 500,
            event_code: 0
        })
    }
})

fastify.post(BASE_URL+'/product', async (request, reply) => {
    const {name, priceId, productId, price, currency, image, description} = request.body

    const product = new Product({
        name,
        priceId,
        productId,
        price,
        currency,
        image,
        description
    })

    await product.save()

    reply.send(product)
})

fastify.post(BASE_URL+'/webhook', async (request, reply) => {

    console.log('Webhook received')
    console.log(request.body)
    // try{
    //     // event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    //     console.log('Event constructed')
    // }
    // catch(err){
    //     console.error(err)
    //     return reply.status(400).send(`Webhook Error: ${err.message}`)
    // }

    // switch(event.type){
    //     case 'checkout.session.completed':
    //         const session = event.data.object
    //         console.log('Checkout session completed', session)
    //         break
    //     default:
    //         console.log(`Unhandled event type ${event.type}`)
    // }

    reply.status(200).send({received: true})
})