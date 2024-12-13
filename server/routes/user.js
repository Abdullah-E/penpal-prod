import { fastify, BASE_URL } from "./init.js";
import { auth, admin } from "../config/firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

// const auth = getAuth(firebaseApp);

import User from "../models/user.js";
import Customer from "../models/customer.js";
import Favorite from "../models/favorite.js";
import { personalitySchema } from "../models/personality.js";

import { verifyToken } from "../utils/firebase_utils.js";
import { flagFavorites, flagRatings, flagCreated, flagUpdated, calculateCompatibility } from "../utils/db_utils.js";
import Purchase from "../models/purchase.js";
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_API_KEY)
stripe.paymentMethodDomains.create({
    domain_name: 'app.awayoutpenpals.com'
}).then((domain) => {
    console.log(`domain ${domain.domain_name} registered`)
})

// import {BASE_URL} from '../server.js'
fastify.addHook("onRequest", async (request, reply) => {
  const isExcludedRoute =
    (request.routeOptions.url === BASE_URL + "/user" &&
      request.method === "POST") ||
    (request.routeOptions.url === BASE_URL + "/user/login" &&
      request.method === "POST");
  if (
    !isExcludedRoute &&
    request.routeOptions.url &&
    request.routeOptions.url.startsWith(BASE_URL + "/user")
  ) {
    await verifyToken(request, reply);
  }
});

//USER ROUTES:
fastify.post(BASE_URL + "/user", async (request, reply) => {
  console.log(request.query);
  const role = request.query.role || "user";
  const { email, password, firstName, lastName, city, state, zipCode, mailingAddress } = request.body;
  try {
    const hashPass = await bcrypt.hash(password, 10);
    console.log(hashPass);
    const fb_user = await createUserWithEmailAndPassword(auth, email, password);
    await admin.auth().setCustomUserClaims(fb_user.user.uid, { role });

    const customer = await stripe.customers.create({
      email: email?.toLowerCase(),
      name: firstName + lastName,
      description: "AwayoutPenpal",
    });

    const user = await User.create({
      email,
      password: hashPass,
      firstName,
      lastName,
      firebaseUid: fb_user.user.uid,
      role,
      age: "",
      gender: "",
      state: state && state[0] ? state[0]: "",
      city,
      zipCode,
      mailingAddress,
      bio: "",
      imageUrl: "",
      stripeCustomer: customer.id,
      profileComplete: false,
    });
    const userObj = user.toObject();
    delete userObj.password;
    console.log(fb_user)
    reply.status(201).send({
      data: {
        databaseObject:userObj,
        firebaseObject:fb_user.user
      },
      event_code: 1,
      message: "User created successfully",
      status_code: 201,
    });
    // await sendEmailVerification(fb_user.user);
  } catch (error) {
    console.error(error);

    if (error.name == "FirebaseError") {
      reply.status(500).send({
        data: null,
        event_code: 0,
        message: error.code,
        status_code: 500,
      });
    } else {
      reply.status(500).send({
        data: null,
        event_code: 0,
        message: error._message || error.message || error.name,
        status_code: 500,
      });
    }
  }
});

fastify.put(BASE_URL + "/user", async (request, reply) => {
  //whichever keys are present in the request body will be updated
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    });
    return;
  }
  try {
    const user_to_update = request.body;
    const user = await User.findOne({ firebaseUid: request.user.uid });
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "User not found",
        status_code: 404,
      });
      return;
    }
    Object.keys(user_to_update).forEach((key) => {
      user[key] = user_to_update[key];
    });
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    reply.send({
      data: userObj,
      event_code: 1,
      message: "User updated successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
});

fastify.get(BASE_URL + "/user", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    });
    return;
  }

  try {
    const selectedFields = [
      "firstName",
      "lastName",
      "email",
      "age",
      "gender",
      "state",
      "bio",
      "role",
      "imageUrl",
      "profileComplete",
      "referralBalance",
      "stripeCustomer"
    ];
    const user = await User.findOne({ firebaseUid: request.user.uid }).select(
      selectedFields
    );
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "User not found",
        status_code: 404,
      });
      return;
    }
    if(!user?.stripeCustomer) {
      const customer = await stripe.customers.create({
        email: user?.email?.toLowerCase(),
        name: user?.firstName + user?.lastName,
        description: "AwayoutPenpal",
      });
      user.stripeCustomer = customer.id;
      await user.save();
    }
    const userObj = user.toObject();
    delete userObj._id;
    selectedFields.forEach((field) => {
      if (field === "profileComplete") {
      } else if (!userObj[field]) {
        userObj[field] = "";
      }
    });
    reply.send({
      data: userObj,
      event_code: 1,
      message: "User fetched successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
});

fastify.put(BASE_URL + "/user/personality", async (request, reply) => {
  const { personality } = request.body;
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    });
    return;
  }
  try {
    const user = await User.findOne({ firebaseUid: request.user.uid });
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "User not found",
        status_code: 404,
      });
      return;
    }
    user.personalityInfo = personality;
    // user.profileComplete = true;
    user.markModified("personalityInfo");
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    reply.send({
      data: userObj,
      event_code: 1,
      message: "Personality updated successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
});

fastify.get(BASE_URL + "/user/personality", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    });
    return;
  }
  try {
    const user = await User.findOne({ firebaseUid: request.user.uid }).select({
      personalityInfo: 1,
    });
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "User not found",
        status_code: 404,
      });
      return;
    }

    // const defaultPersonality =
    let userPersonality =
      user.personalityInfo || new mongoose.model("temp", personalitySchema)();

    userPersonality = userPersonality.toObject();
    delete userPersonality._id;
    reply.send({
      data: userPersonality,
      event_code: 1,
      message: "User personality fetched successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
});

fastify.get(BASE_URL + "/user/status", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    });
    return;
  }
  try {
    const user = await User.findOne({ firebaseUid: request.user.uid }).select({
      profileComplete: 1,
    });
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "User not found",
        status_code: 404,
      });
      return;
    }

    reply.send({
      data: user,
      event_code: 1,
      message: "User fetched successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
});

fastify.get(BASE_URL + "/user/matches", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    });
    return;
  }
  try {
    let {p:page, l:limit} = request.query;
    limit = parseInt(limit) || 10
    const user = await User.findOne({ firebaseUid: request.user.uid }).exec()
    if (user.profileComplete == false) {
      let matches = await Customer.aggregate([
        {$match:{
          "customerStatus.profileApproved":true,
          "pendingPayments.creation":false,
          "customerStatus.status":"active"
        }},
        {$set:{"weight":{
          $cond:[
              {$eq:["$customerStatus.premiumPlacement", true]},
              2,
              {$cond:[
                  {$eq:["$customerStatus.featuredPlacement", true]},
                  1,
                  0
              ]}
          ]
        }}},
        {$sort:{weight:-1, _id:1}},
        {$skip:page*limit},
        {$limit:limit}
      ]).exec()
      matches = await flagFavorites(user, matches)
      matches = await flagRatings(user, matches)
      matches = await flagCreated(user, matches)
      return reply.send({
        data: matches,
        event_code: 1,
        message: "Matches fetched successfully",
        status_code: 200,
      });
    }

    const test_list = await User.findOne({firebaseUid:request.user.uid}).populate("compatibleCustomers.customerId").lean().exec()
    let customerList = Array.from(test_list.compatibleCustomers)
    .map(cust => {return cust.customerId})
    .filter(customer => customer !== null)
    .slice(page*limit, (page*limit)+limit);

    let matches = await flagFavorites(user, customerList)
    matches = await flagRatings(user, matches)
    //sort matches by ratings
    // matches = matches.sort((a,b) => b.rating - a.rating)
    reply.send({
      data: matches,
      event_code: 1,
      message: "Matches fetched successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
});

fastify.get(BASE_URL + "/user/created-customers", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    });
    return;
  }
  try {
    const user = await User.findOne({ firebaseUid: request.user.uid }).exec()
    let customerList = await User.aggregate([
      {$match:{firebaseUid:request.user.uid}},
      {$project:{createdCustomers:1,_id:0}},
      {$lookup:{
        from:"customers",
        localField:"createdCustomers",
        foreignField:"_id",
        as:"createdCustomers"
      }},
      {$unwind:"$createdCustomers"},
      {$replaceRoot:{newRoot:"$createdCustomers"}}
    ]).exec()
    customerList = await flagUpdated(customerList)
    customerList = await flagFavorites(user, customerList)
    customerList = await flagRatings(user, customerList)
    reply.send({
      data: customerList,
      event_code: 1,
      message: "Created customers fetched successfully",
      status_code: 200,
    })
  } catch (error) {
    console.error(error);
    return reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
})

fastify.put(BASE_URL + "/user/profile-picture", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    });
    return;
  }
  try {
    const user = await User.findOne({ firebaseUid: request.user.uid });
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "User not found",
        status_code: 404,
      });
      return;
    }
    user.imgUrl = request.body.imgUrl;
    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    reply.send({
      data: userObj,
      event_code: 1,
      message: "Profile picture updated successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
});

fastify.put(BASE_URL + "/user/favorite", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    })
    return
  }
  try {
    const param = request.query
    const ids = param["id"] && typeof param["id"] === "" ? [param["id"]] : param["id"]
    const {fav:flag} = request.body
    const user = await User
    .findOne({ firebaseUid: request.user.uid })
    .select('favorite')
    
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "User not found",
        status_code: 404,
      });
      return;
    }
    let favorite
    if(!user.favorite){
      if(!flag){
        return
      }
      favorite = await Favorite.create({
        user: user._id,
        favorites: ids
      })
      user.favorite = favorite._id
      await user.save()
    }else{
      let query
      console.log(flag)
      if(flag == true){
        query = {$addToSet:{favorites:ids}}
      }else{
        query = {$pull:{favorites:ids}}
        console.log("pullin")
      }
      favorite = await Favorite.findOneAndUpdate(
        {_id:user.favorite},
        query,
        {new:true}
      )
    }
    // console.log(user)
    

    reply.send({
      data: favorite,
      event_code: 1,
      message: "Favorites updated successfully",
      status_code: 201,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
})

fastify.get(BASE_URL + "/user/favorite", async (request, reply) => {
  if (!request.user) {
    reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized",
      status_code: 401,
    })
    return
  }
  try {
    const user = await User
    .findOne({ firebaseUid: request.user.uid })
    
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "User not found",
        status_code: 404,
      });
      return;
    }
    if(!user.favorite){
      reply.status(200).send({
        data: [],
        event_code: 0,
        message: "empty list",
        status_code: 200,
      });
      return;
    }

    let favorites = (await (await user.populate('favorite')).favorite.populate('favorites')).favorites
    favorites = favorites.map(favorite => {
      favorite = favorite.toObject()
      favorite["isFavorite"] = true
      return favorite
    })
    favorites = await flagRatings(user, favorites)
    favorites = await flagCreated(user, favorites)
    favorites = flagUpdated(favorites)

    reply.send({
      data: favorites,
      event_code: 1,
      message: "Favorite fetched successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
})

fastify.get(BASE_URL + "/user/notifications", async (request, reply) => {
  try{
    const user = await User.findOne({firebaseUid:request.user.uid}).populate("notifications").exec()
    const notifications =  user.notifications
    return reply.send({
      data:notifications,
      event_code:1,
      message:"Notifications fetched successfully",
      status_code:200
    })
  }
  catch(err){
    console.error(err)
    return reply.status(500).send({
      data:null,
      event_code:0,
      message:err.message,
      status_code:500
    })
  }
})

fastify.get(BASE_URL+'/user/pending-payments', async (request, reply) => {
  try{
    const createdCustomers = await User.aggregate([
      {$match:{firebaseUid:request.user.uid}},
      {$project:{createdCustomers:1,_id:0}},
      {$lookup:{
        from:"customers",
        localField:"createdCustomers",
        foreignField:"_id",
        as:"createdCustomers"
      }},
      {$unwind:"$createdCustomers"},
      {$replaceRoot:{newRoot:"$createdCustomers"}},
    ]).exec()
    //make 
    console.log(createdCustomers)
    let payments = []    

    for(const cust of createdCustomers){
      // const cust = createdCustomers[i]
      const pending = cust.pendingPayments.creation || cust.pendingPayments.renewal || cust.pendingPayments.update
      if(!pending) {continue}
      
      payments.push(cust)
    }
    return reply.send({
      data:payments,
      event_code:1,
      message:"Payments fetched successfully",
      status_code:200
    })
  }
  catch(err){
    console.error(err)
    return reply.status(500).send({
      data:null,
      event_code:0,
      message:err.message,
      status_code:500
    })
  }
})

fastify.get(BASE_URL + "/user/history-payments", async (request, reply) => {
  try {

    const {cid} = request.query
    const user = await User.findOne({ firebaseUid: request.user.uid }).exec()
    const purchases = await Purchase.find({user: user._id, customer: cid, status:"completed"}).select({
      product:1,
      quantity:1,
      total:1,
      createdAt:1,
    }).exec()

    return reply.send({
      data: purchases,
      event_code: 1,
      message: "Payments fetched successfully",
      status_code: 200,
    })
  }
  catch(err){
    console.error(err)
    return reply.status(500).send({
      data:null,
      event_code:0,
      message:err.message,
      status_code:500
    })
  }
})

fastify.post(BASE_URL + "/user/login", async (request, reply) => {
  const { email, password } = request.body;
  try {
    // const user = await User.findOne({ email });
    // if (!user) {
    //   reply.status(404).send({
    //     data: null,
    //     event_code: 0,
    //     message: "Email not found",
    //     status_code: 404,
    //   });
    //   return;
    // }
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) {
    //   reply.status(401).send({
    //     data: null,
    //     event_code: 0,
    //     message: "Password incorrect",
    //     status_code: 401,
    //   });
    //   return;
    // }
    const fb_user = await signInWithEmailAndPassword(auth, email, password);
    console.log(fb_user.user.emailVerified);
    const token = await fb_user.user.getIdToken();
    reply.send({
      data: { token },
      event_code: 1,
      message: "User logged in successfully",
      status_code: 200,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      data: null,
      event_code: 0,
      message: error._message || error.message || error.name,
      status_code: 500,
    });
  }
});

const deleteAllUsers = (nextPageToken) => {
  let uids = [];
  admin
    .auth()
    .listUsers(100, nextPageToken)
    .then((listUsersResult) => {
      uids = uids.concat(
        listUsersResult.users.map((userRecord) => userRecord.uid)
      );
      console.log(uids);
      if (listUsersResult.pageToken) {
        deleteAllUsers(listUsersResult.pageToken);
      }
    })
    .catch((error) => {
      console.log("Error listing users:", error);
    })
    .finally(() => {
      admin.auth().deleteUsers(uids);
    });
};

fastify.delete(BASE_URL + "/user", async (request, reply) => {
  deleteAllUsers();
  reply.send({
    data: null,
    event_code: 1,
    message: "All users deleted",
    status_code: 200,
  });
});


fastify.get(BASE_URL + "/user/update-compatibility", async (request, reply) => {

  if(!request.user){
    reply.code(401).send({
      data:null,
      event_code:0,
      message:"Unauthorized",
      status_code:401
    })
    return
  }
  const user = await User.findOne({firebaseUid:request.user.uid})
  const customers = await Customer.find().limit(20).exec()
  const compatibilityScores = customers.map(customer => {
      return {
          customerId: customer._id,
          score: calculateCompatibility(user.personalityInfo, customer.personalityInfo)
      }
  })

  // Sort customers by compatibility score in descending order and get the top 5
  compatibilityScores.sort((a, b) => b.score - a.score)
  user.compatibleCustomers = compatibilityScores
  await user.save()
})