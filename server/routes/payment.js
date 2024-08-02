import {BASE_URL, fastify} from './init.js'

import User from '../models/user.js'
import Purchase from '../models/purchase.js'
import Product from '../models/product.js'
import Customer, {updatePendingPayments} from '../models/customer.js'
import CustomerUpdate from '../models/customerUpdate.js'

import { verifyToken } from '../utils/firebase_utils.js'
import {applyCustomerUpdate} from '../utils/db_utils.js'
import { extendDateByMonth } from '../utils/misc_utils.js'

import Stripe from 'stripe'
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

fastify.post(BASE_URL+'/payment/create-checkout-session', async (request, reply) => {
    try{

        const {cid, wordLimit, totalPaidPhotos,  basicInfo, personalityInfo} = request.body
        const boughtProductsSet = new Set()
        for(const key of Object.keys(request.body)){
            if(typeof request.body[key]  === typeof true){
                if(request.body[key]){
                    boughtProductsSet.add(key)
                }
            }
        }
        if(wordLimit && wordLimit>0) boughtProductsSet.add('wordLimit')
        if(totalPaidPhotos && totalPaidPhotos>0) boughtProductsSet.add('photo')
        let updateNum = 0
        if(basicInfo){
            updateNum += Object.keys(basicInfo).length 
        } 
        if(personalityInfo){
            updateNum += Object.keys(personalityInfo).length
        }
        if(updateNum>0){
            boughtProductsSet.add('update')
        }
        
        console.log('Update num', updateNum)
        const products = await Product.find({name: [...boughtProductsSet]}).exec()
        const user = await User.findOne({firebaseUid:request.user.uid}).exec()

        let totalAmount = 0
        const productsList = []
        const line_items = products.map(product => {
            // if(product.name === 'update'){
            //     productsList.push({
            //         product: product._id,
            //         quantity: update.num,
            //         price: product.price
            //     })
            //     totalAmount += product.price * update.num
            //     return {
            //         price: product.priceId,
            //         quantity: parseInt(update.num)
            //     }
            // }
            // else if(product.name === 'wordLimit'){
            //     productsList.push({
            //         product: product._id,
            //         quantity: wordLimit,
            //         price: product.price
            //     })
            //     totalAmount += product.price * wordLimit
            //     return {
            //         price: product.priceId,
            //         quantity: parseInt(wordLimit)
            //     }
            // }
            let quantity = 1
            if(product.name === 'wordLimit'){
                quantity = wordLimit
            }
            else if(product.name === 'update'){
                quantity = updateNum
            }
            else if (product.name === 'photo'){
                quantity = totalPaidPhotos
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
        
        console.log(line_items)
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
            return_url: `https://app.awayoutpenpals.com/payment/result?session_id={CHECKOUT_SESSION_ID}`,
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
            // purchase.status = session.status
            if(prodName === 'creation'){
                customer.pendingPayments.creation = false
                customer.customerStatus.status = 'active'
                customer.customerStatus.expiresAt = extendDateByMonth(customer.customerStatus.expiresAt, 12)
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
                    await update.save()

                }
                customer.pendingPayments.update = false
                customer.pendingPayments.updateNum = 0
                customer.pendingPayments.basicInfo = {}
                customer.pendingPayments.personalityInfo = {}
            }
            else if(prodName === 'premiumPlacement'){
                customer.customerStatus.premiumPlacement = true 
                customer.customerStatus.premiumExpires = extendDateByMonth(customer.customerStatus.premiumExpires, 1)
            }
            else if(prodName === 'featuredPlacement'){
                customer.customerStatus.featuredPlacement = true
                customer.customerStatus.featuredExpires = extendDateByMonth(customer.customerStatus.featuredExpires, 1)
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