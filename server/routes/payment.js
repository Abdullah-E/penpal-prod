import {BASE_URL, fastify} from './init.js'
import fetch from 'node-fetch';

import User from '../models/user.js'
import Purchase from '../models/purchase.js'
import Product from '../models/product.js'
import Customer, {updatePendingPayments, nonPaidFields} from '../models/customer.js'
import CustomerUpdate from '../models/customerUpdate.js'

import { verifyToken } from '../utils/firebase_utils.js'
// import {applyCustomerUpdate} from '../utils/db_utils.js'
import { extendDateByMonth } from '../utils/misc_utils.js'

import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_API_KEY)
stripe.paymentMethodDomains.create({
    domain_name: 'app.awayoutpenpals.com'
}).then((domain) => {
    console.log(`domain ${domain.domain_name} registered`)
})

const paypalClientId = process.env.PAYPAL_CLIENT_ID
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET
const port = process.env.PORT || 8000

fastify.addHook('onRequest', async (request, reply) => {
    // const isExcludedRoute = request.routeOptions.url.includes('webhook')
    if(
        request.routeOptions.url
        && request.routeOptions.url.includes(BASE_URL + '/payment')
    ){
        await verifyToken(request, reply)
    }
})

const paypalAccessToken = async()=>{
    const authHeader = Buffer.from(
        `${paypalClientId}:${paypalClientSecret}`
    ).toString("base64");

    const request = await fetch(
        "https://api-m.sandbox.paypal.com/v1/oauth2/token",
        {
            method:"POST",
            headers:{
                Authorization:`Basic ${authHeader}`
            },
            body:new URLSearchParams({
                grant_type: "client_credentials",
                response_type: "id_token",
                intent: "sdk_init",
            })
        }
    );
    const respJson = await request.json();
    return respJson.access_token
}

fastify.post(BASE_URL+'/payment/paypal-test', async (request, reply)=>{
    try{
        const {cart} = request.body
        console.log(`cart info: ${cart}`)
        return reply.send({
            data:cart,
            message:"Cart received",
            status_code:200,
            event_code:1
        })
    }
    catch(err){
        console.err(err);
        return reply.send({
            data:null,
            message:err.message,
            status_code:500,
            event_code:0
        })
    }
})

const productsListFromDB = async (cart) => {
    /*
    CART FORMAT FROM FRONTEND:
    {
        basicInfo:{
            fieldName:bool
        },
        personalityInfo:{
            fieldName:bool
        },
        creation:bool,
        renewal:bool,

        featuredPlacement:int,
        premiumPlacement:int,
        wordLimit:int,
        totalPaidPhotos:int
    }
    */
    const boughtProductsSet = new Set()
    let updateNum = 0
    for(const [key, value] of Object.entries(cart)){
        switch (typeof value) {
            case typeof true:
                if(value){
                    boughtProductsSet.add(key)
                }
                break;
            case typeof 1:
                
                if(value>0){
                    boughtProductsSet.add(key)
                }
                break;
            case 'object':
                const filteredFields = Object.keys(value)
                .filter(product=>!nonPaidFields.includes(product));                
                console.log('Filtered fields', filteredFields)
                updateNum += filteredFields.length;
                break; 
            default:
                break;
        }
    }
    if(updateNum>0){
        boughtProductsSet.add('update')
    }
    const productsFromDB = await(Product.find({name:[...boughtProductsSet]})).exec()
    return {productsFromDB, updateNum}
}

const stripeLineItemsAndPrice = (db_prods, cart) => {
    const productsList = []
    let totalAmount = 0
    const line_items = db_prods.map(product => {
        let quantity = 1
        if(product.name === 'wordLimit'){
            quantity = cart.wordLimit
        }
        else if(product.name === 'update'){
            quantity = cart.updateNum
        }
        else if (product.name === 'totalPaidPhotos'){
            quantity = cart.totalPaidPhotos
        }
        else if(product.name === 'featuredPlacement'){
            quantity = cart.featuredPlacement
        }
        else if(product.name === 'premiumPlacement'){
            quantity = cart.premiumPlacement
        }
        totalAmount += product.price * quantity
        productsList.push({
            product: product._id,
            quantity: quantity,
            price: product.price
        })
        return {
            price: product.priceId,
            quantity: quantity
        }
    })
    return {line_items, totalAmount, productsList}
}
fastify.post(BASE_URL+'/payment/create-checkout-session', async (request, reply) => {
    try{

        // const {cid, wordLimit, totalPaidPhotos,  basicInfo, personalityInfo, featuredPlacement, premiumPlacement} = request.body
        const {cid, ...cart} = request.body
        const base_url = request.body.url || 'https://app.awayoutpenpals.com'

        const {productsFromDB, updateNum} = await productsListFromDB(cart)
        cart.updateNum = updateNum
        console.log(productsFromDB)
        const user = await User.findOne({firebaseUid:request.user.uid}).exec()

        const {line_items, totalAmount, productsList} = stripeLineItemsAndPrice(productsFromDB, cart);
        console.log(line_items, totalAmount, productsList)
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
            return_url: `${base_url}/payment/result?session_id={CHECKOUT_SESSION_ID}`,
        })
        
        const newPurchase = new Purchase({
            user: user._id,
            products: productsList,
            customer: cid,
            sessionId: session.id,
            totalPrice: totalAmount,
            status: 'open',
        })
        await newPurchase.save()
    
        return reply.send({
            data:{
                clientSecret: session.client_secret,
                status:session.status,
                sessionId: request.query["sendId"] && request.query["sendId"] === "true"? session.id: null
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
        const {session_id, test_status} = request.query
        const session = await stripe.checkout.sessions.retrieve(session_id)
        // console.log(session)
        session.status = test_status? test_status: session.status
        if(session.status !== 'complete'){
            console.log('Session not completed', session.status)
            return reply.send({
                data:{
                    status: session.status
                    // customerEmail: session.customer_details.email
                },
                message: 'Session retrieved unsuccessful checkout',
                status_code: 200,
                event_code:1
            })

        }
        console.log('Session completed')
        const purchase = await Purchase.findOne({sessionId: session_id}).populate('products.product').exec()
        // if(test_status !== 'completed'){
        purchase.paidAt = new Date()
        purchase.status = session.status
        let customer = await Customer.findOne({_id: purchase.customer}).exec()
        for(const product of purchase.products){
            const prodName = product.product.name
            console.log('Product', prodName)
            // purchase.status = session.status
            if(prodName === 'creation'){
                customer.pendingPayments.creation = false
                customer.customerStatus.status = 'unapproved'
                // customer.customerStatus.expiresAt = extendDateByMonth(customer.customerStatus.expiresAt, 12)
            }
            else if(prodName === 'renewal'){
                console.log('Renewal product')
                customer.pendingPayments.renewal = false
                customer.customerStatus.expiresAt = extendDateByMonth(customer.customerStatus.expiresAt, 12)
                console.log('Customer status', customer.customerStatus.expiresAt)
                console.log('Customer status', customer.customerStatus)
                customer.customerStatus.status = 'active'
            }
            else if(prodName === 'update'){
                const update = await CustomerUpdate.findOne({_id: customer.customerUpdate})
                if(update){
                    update.paymentPending = false
                    update.paidBy = purchase.user
                    await update.save()

                }
                customer.pendingPayments.update = false
                customer.pendingPayments.updateNum = 0
                customer.pendingPayments.basicInfo = {}
                customer.pendingPayments.personalityInfo = {}
            }
            else if(prodName === 'premiumPlacement'){
                customer.customerStatus.premiumPlacement = true 
                customer.customerStatus.premiumExpires = extendDateByMonth(customer.customerStatus.premiumExpires, product.quantity)
            }
            else if(prodName === 'featuredPlacement'){
                customer.customerStatus.featuredPlacement = true
                customer.customerStatus.featuredExpires = extendDateByMonth(customer.customerStatus.featuredExpires, product.quantity)
            }
            else if(prodName === 'wordLimit'){
                customer.pendingPayments.wordLimit = 0

                customer.customerStatus.wordLimitExtended = true
                customer.customerStatus.bioWordLimit += product.quantity * 100
            }
            else if(prodName === 'photo'){
                customer.pendingPayments.photo = false
                customer.pendingPayments.totalPaidPhotos = 0

                customer.customerStatus.photoLimit += product.quantity
            }

            await purchase.save()
        }
        customer.completedPurchases.push(purchase._id)
        customer = await updatePendingPayments(customer)
        customer.markModified('customerStatus')
        customer.markModified('pendingPayments')
        await customer.save()
        return reply.send({
            data:{
                status: session.status
                // customerEmail: session.customer_details.email
            },
            message: 'Session retrieved successful checkout',
            status_code: 200,
            event_code:1
        })
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