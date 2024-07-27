import {BASE_URL, fastify} from './init.js'

import User from '../models/user.js'
import Purchase from '../models/purchase.js'
import Product from '../models/product.js'
import Customer from '../models/customer.js'
import CustomerUpdate from '../models/customerUpdate.js'

import Stripe from 'stripe'

import { verifyToken } from '../utils/firebase_utils.js'
import {applyCustomerUpdate} from '../utils/db_utils.js'

const stripe = new Stripe(process.env.STRIPE_API_KEY)

fastify.addHook('onRequest', async (request, reply) => {
    // const isExcludedRoute = request.routeOptions.url.includes('webhook')
    if(
        request.routeOptions.url
        && request.routeOptions.url.includes(BASE_URL + '/payment')
    ){
        await verifyToken(request, reply)
    }
})

// const product_names = ['creation', 'renewal', 'update']
fastify.post(BASE_URL+'/payment/create-checkout-session', async (request, reply) => {
    try{
        //creatoin renewal update are boolean values
        const {creation,renewal,update, cid} = request.body
        const boughtProducts = []
        if(creation) boughtProducts.push('creation')
        if(renewal) boughtProducts.push('renewal')
        if(update) boughtProducts.push('update')


        const products = await Product.find({name: boughtProducts}).exec()
        const user = await User.findOne({firebaseUid:request.user.uid}).exec()

        const line_items = products.map(product => {
            return {
                price: product.priceId,
                quantity: 1
            }
        })
        if(line_items.length === 0){
            return reply.status(400).send({
                message: 'No products found',
                data: null,
                status_code: 400,
                event_code: 0
            })
        }

        const session = await stripe.checkout.sessions.create({
            ui_mode:'embedded',
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: line_items,
            return_url: `http://localhost:3000/return?session_id={CHECKOUT_SESSION_ID}`,
        })
        for(let product of products){

            const newPurchase = new Purchase({
                user: user._id,
                product: product._id,
                customer: cid,
                sessionId: session.id,
                quantity: 1,
                total: product.price,
                status: 'open',
            })
    
            await newPurchase.save()
        }
        // console.log(session)
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

        const purchase = await Purchase.findOne({sessionId: session_id}).exec()
        purchase.status = session.status
        
        if(session.status !== 'completed'){
            return
        }
        purchase.paidAt = new Date()
        if(purchase.product === 'newProfile'){
            await Customer.updateOne({_id: purchase.customer}, {
                creationPaymentPending: false,
                status:'active',
                expiresAt: new Date(Date.now() + 30*24*60*60*1000)
            }).exec()
        }
        else if(purchase.product === 'updateProfile'){
            const custToUpdate = await Customer.findOne({_id: purchase.customer})
            const update = await CustomerUpdate.findOne({_id: custToUpdate.customerUpdate})
            update.paymentPending = false
            
            if(update.updateApproved){
                await applyCustomerUpdate(custToUpdate, update)
            }
            await update.save()
        }
        await purchase.save()
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