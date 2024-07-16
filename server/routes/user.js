import { fastify, BASE_URL } from "./init.js";
import { auth, admin } from "../config/firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

// const auth = getAuth(firebaseApp);

import User from "../models/user.js";
import Customer from "../models/customer.js";
import Favorite from "../models/favorite.js";
import { personalitySchema } from "../models/personality.js";

import { verifyToken } from "../utils/firebase_utils.js";

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
  const { email, password, firstName, lastName } = request.body;
  try {
    const hashPass = await bcrypt.hash(password, 10);
    console.log(hashPass);
    const fb_user = await createUserWithEmailAndPassword(auth, email, password);
    await admin.auth().setCustomUserClaims(fb_user.user.uid, { role });

    const user = await User.create({
      email,
      password: hashPass,
      firstName,
      lastName,
      firebaseUid: fb_user.user.uid,
      role,
      age: "",
      gender: "",
      state: "",
      bio: "",
      profileComplete: false,
    });
    const userObj = user.toObject();
    delete userObj.password;
    reply.status(201).send({
      data: userObj,
      event_code: 1,
      message: "User created successfully",
      status_code: 201,
    });
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
      "imageUrl",
      "profileComplete",
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
    user.personality = personality;
    // user.profileComplete = true;
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
      personality: 1,
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
      user.personality || new mongoose.model("temp", personalitySchema)();

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
    const num = request.query.n || 5;
    const user = await User.findOne({ firebaseUid: request.user.uid })
      .select({compatibleCustomers:1})
      .populate("compatibleCustomers.customerId")
      .exec();
    
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "User not found",
        status_code: 404,
      });
      return;
    }
    const matches = user.compatibleCustomers.map((match) => {
      const customer = match.customerId;
      const matchObj = customer.toObject();
      delete matchObj._id;
      return matchObj;
    })
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
      favorite = await Favorite.create({
        user: user._id,
        favorites: ids
      })
      user.favorite = favorite._id
      await user.save()
    }else{
      favorite = await Favorite.findOneAndUpdate(
        {_id:user.favorite},
        {$addToSet:{favorites:ids}},
        {new:true}
      )
    }
    console.log(user)
    

    reply.send({
      data: favorite,
      event_code: 1,
      message: "Favorite added successfully",
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

fastify.post(BASE_URL + "/user/login", async (request, reply) => {
  const { email, password } = request.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      reply.status(404).send({
        data: null,
        event_code: 0,
        message: "Email not found",
        status_code: 404,
      });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      reply.status(401).send({
        data: null,
        event_code: 0,
        message: "Password incorrect",
        status_code: 401,
      });
      return;
    }
    const fb_user = await signInWithEmailAndPassword(auth, email, password);
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

function calculateCompatibility(userPersonality, customerPersonality) {
  const fields = ["hobbies", "sports", "likes", "personality", "bookGenres", "musicGenres", "movieGenres"];
  let totalMatches = 0;
  let totalFields = fields.length;

  fields.forEach(field => {
      if (userPersonality[field].length && customerPersonality[field].length) {
          const intersection = userPersonality[field].filter(value => customerPersonality[field].includes(value));
          if (intersection.length) {
              totalMatches++;
          }
      }
  });
  return (totalMatches / totalFields) * 100;
}
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
  const customers = await Customer.find().exec()
  const compatibilityScores = customers.map(customer => {
      return {
          customerId: customer._id,
          score: calculateCompatibility(user.personality, customer.personality)
      }
  })

  // Sort customers by compatibility score in descending order and get the top 5
  compatibilityScores.sort((a, b) => b.score - a.score)
  user.compatibleCustomers = compatibilityScores.slice(0, 5)
  await user.save()
})