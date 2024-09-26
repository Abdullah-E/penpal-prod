import { nonPaidFields } from "../models/customer.js";
import Product from "../models/product.js";
import fetch from "node-fetch";

const paypalClientId = process.env.PAYPAL_CLIENT_ID
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET
const port = process.env.PORT || 8000

const paypalBase = 'https://api-m.sandbox.paypal.com';

export const paypalAccessToken = async()=>{
    const authHeader = Buffer.from(
        `${paypalClientId}:${paypalClientSecret}`
    ).toString("base64");

    const request = await fetch(
        `${paypalBase}/v1/oauth2/token`,
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

export const paypalLineItemsAndPrice = (db_prods, cart) => {
    const productsList = []
    let totalAmount = 0
    const paypalItems = db_prods.map(product => {
        let quantity = 1
        console.log('Product', product.name)
        if(product.name === 'wordLimit'){
            quantity = cart.wordLimit
        }
        else if(product.name === 'update'){
            quantity = cart.updateNum
            console.log('Update Quantity', quantity)
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
            name: product.name,
            quantity: quantity.toString(),
            unit_amount: {
                currency_code: "USD",
                value: product.price.toFixed(2)
            },
            category: "DIGITAL_GOODS"
        }
    })
    return {paypalItems, totalAmount, productsList}
}

export const createPaypalOrder = async (db_prods, cart) => {
    try{
        const accessToken = await paypalAccessToken()
        const url = `${paypalBase}/v2/checkout/orders`
        // const {productsFromDB, updateNum} = await productsListFromDB(cart)
        // cart.updateNum = updateNum
        const {paypalItems, totalAmount, productsList} = paypalLineItemsAndPrice(db_prods, cart);
        console.log('Paypal Items', paypalItems)
        const payload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: totalAmount.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: totalAmount.toFixed(2)
                            }
                        }
                    },
                    items: paypalItems
                }
            ],
        }
    
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        return response.json()
    }
    catch(err){
        console.error(err)
    }
}

export const capturePaypalOrder = async (orderId) => {
    try{
        const accessToken = await paypalAccessToken()
        const url = `${paypalBase}/v2/checkout/orders/${orderId}/capture`
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            }
        });
        return response.json()
    }
    catch(err){
        console.error(err)
    }
}

export const filterCart = (cart) => {
    const filteredCart = {}
    for(const [key, value] of Object.entries(cart)){
        switch (typeof value) {
            case typeof true:
                // console.log(`Key: ${key}, Value: ${value}`)
                if(value){
                    filteredCart[key] = value
                }
                break;
            case typeof 1:
                if(value>0){
                    filteredCart[key] = value
                }
                break;
            case 'object':
                console.log('Object', value)
                const filteredFields = Object.keys(value)
                .filter(product=>(!nonPaidFields.includes(product) && value[product] === true));
                filteredCart[key] = {}
                filteredFields.forEach(field=>{
                    filteredCart[key][field] = value[field]
                })

                // if(filteredFields.length>0){
                //     filteredCart[key] = {}
                //     filteredFields.forEach(field=>{
                //         filteredCart[key][field] = value[field]
                //     })
                // }
                break; 
            default:
        }
    }
    return filteredCart
}

export const productsListFromDB = async (cart) => {
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
                // console.log('Filtered fields', filteredFields)
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

export const stripeLineItemsAndPrice = (db_prods, cart, referralBalance=0) => {
    const productsList = [];
    console.log('referralBalance', referralBalance);
    let totalAmount = 0;
    const line_items = db_prods.map(product => {
        let quantity = 1;
        let priceToDeduct = 0;

        // Set quantity based on product type (custom logic for your cart)
        if (product.name === 'wordLimit') {
            quantity = cart.wordLimit;
        } else if (product.name === 'update') {
            quantity = cart.updateNum;
        } else if (product.name === 'totalPaidPhotos') {
            quantity = cart.totalPaidPhotos;
        } else if (product.name === 'featuredPlacement') {
            quantity = cart.featuredPlacement;
        } else if (product.name === 'premiumPlacement') {
            quantity = cart.premiumPlacement;
        }

        // Calculate the price for this product
        let productPrice = product.price * quantity;
        let pp = product.price;
        // Deduct referral balance
        if (referralBalance > 0) {
            if (referralBalance >= productPrice) {
                priceToDeduct = productPrice; // Deduct full product price
                referralBalance -= productPrice;
                productPrice = 0;
            } else {
                pp = referralBalance/quantity;
                priceToDeduct = referralBalance; // Deduct remaining referral balance
                productPrice -= referralBalance/quantity;
                referralBalance = 0;
            }
        }

        totalAmount += pp * quantity; // Update totalAmount with adjusted price

        productsList.push({
            product: product._id,
            quantity: quantity,
            price: product.price
        });

        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.name,
                },
                unit_amount: Math.round(pp * 100), // Amount in cents
            },
            quantity: quantity,
        };
    });

    return {line_items, totalAmount, productsList};
};
