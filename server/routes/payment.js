import {BASE_URL, fastify} from './init.js'

import { CheckoutSession } from '../models/checkoutSessions.js'

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_API_KEY)
// console.log(process.env.STRIPE_API_KEY)
fastify.post(BASE_URL+'/create-checkout-session', async (request, reply) => {
    const {priceId} = request.body
    

    const session = await stripe.checkout.sessions.create({
        ui_mode:'embedded',
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1
            }
        ],
        return_url: `http://localhost:3000/return?session_id={CHECKOUT_SESSION_ID}`,
    })
    console.log(session)
    reply.send({clientSecret: session.client_secret})

})

fastify.get(BASE_URL+'/session-status', async (request, reply) => {
    const {sessionId} = request.query
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    reply.send({
        data:{
            status: session.status,
            customerEmail: session.customer_details.email
        }
    })
})

fastify.post(BASE_URL+'/webhook', async (request, reply) => {

    const sig = request.headers['stripe-signature']

    let event
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

    // reply.status(200).send({received: true})
})