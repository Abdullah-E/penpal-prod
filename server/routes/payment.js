import {BASE_URL, fastify} from './init.js'

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_API_KEY)

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
        return_url: `${request.headers.origin}/return?session_id={CHECKOUT_SESSION_ID}`,
    })

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