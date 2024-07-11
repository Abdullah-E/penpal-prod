import { fastify, firebaseApp, BASE_URL } from "./init.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import admin from "firebase-admin";
import bcrypt from "bcrypt";
const serviceAcc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAcc),
});

const auth = getAuth(firebaseApp);



import User from '../models/user.js'

// import {BASE_URL} from '../server.js'

async function verifyToken(request, reply) {
    if (
        !request.headers.authorization ||
        !request.headers.authorization.startsWith("Bearer ")
    ) {
        reply.code(401).send({ error: "Unauthorized" });
        return;
    }
    
    const idToken = request.headers.authorization.split("Bearer ")[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        request.user = decodedToken;
    } catch (error) {
        console.log(request.headers.authorization)
        reply.code(401).send({ error: "Unauthorized" });
    }
}

fastify.addHook("onRequest", async (request, reply) => {
  const isExcludedRoute =
    (request.routeOptions.url === BASE_URL + "/user" && request.method === "POST" )||
    (request.routeOptions.url === BASE_URL + "/user/login" && request.method === "POST");
  if (
    !isExcludedRoute &&
    request.routeOptions.url &&
    request.routeOptions.url.startsWith(BASE_URL + "/user")
  ) {
    await verifyToken(request, reply);
  }
});

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
    if(!request.user){
        reply.code(401).send({
            data: null,
            event_code: 0,
            message: "Unauthorized",
            status_code: 401,
        })
        return
    }
    try {
        const user_to_update = request.body;
        const user = await User.findOne({firebaseUid: request.user.uid});
        if (!user) {
            reply.status(404).send({
                data: null,
                event_code: 0,
                message: "User not found",
                status_code: 404,
            });
            return;
        }
        Object.keys(user_to_update).forEach(key => {
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



})

fastify.get(BASE_URL + "/user", async (request, reply) => {
  if(!request.user){
    reply.code(401).send({
        data: null,
        event_code: 0,
        message: "Unauthorized",
        status_code: 401,
    })
    return
  }

  try{
    const user = await User.findOne({firebaseUid: request.user.uid}).select({
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "age": 1,
        "gender":1,
        "state":1,

    })
    const userObj = user.toObject()
    delete userObj.password;
    reply.send({
        data: userObj,
        event_code: 1,
        message: "User fetched successfully",
        status_code: 200,
    });

  }
  catch(error){
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
  const { personality} = request.body;
  if(!request.user){
    reply.code(401).send({
        data: null,
        event_code: 0,
        message: "Unauthorized",
        status_code: 401,
    })
    return
  }
  try {
    const user = await User.findOne({firebaseUid: request.user.uid});
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
    user.profileComplete = true;
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

fastify.get(BASE_URL + "/user/status", async (request, reply) => {
    if(!request.user){
        reply.code(401).send({
            data: null,
            event_code: 0,
            message: "Unauthorized",
            status_code: 401,
        })
        return
    }
    try {
        const user = await User.findOne({firebaseUid: request.user.uid}).select({"profileComplete": 1})
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
    let uids = []
    admin
      .auth()
      .listUsers(100, nextPageToken)
      .then((listUsersResult) => {
        uids = uids.concat(listUsersResult.users.map((userRecord) => userRecord.uid))
        console.log(uids)
        if (listUsersResult.pageToken) {
          deleteAllUsers(listUsersResult.pageToken);
        }
      })
      .catch((error) => {
        console.log('Error listing users:', error);
      }).finally(() => {
        admin.auth().deleteUsers(uids)
      })
  };

fastify.delete(BASE_URL + "/user", async (request, reply) => {
    deleteAllUsers()
    reply.send({
        data: null,
        event_code: 1,
        message: "All users deleted",
        status_code: 200,
    });
});