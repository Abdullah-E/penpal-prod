import {admin} from '../config/firebase.js'

export async function verifyToken(request, reply) {
    if (
      !request.headers.authorization ||
      !request.headers.authorization.startsWith("Bearer ")
    ) {
      reply.code(401).send({
        data: null,
        event_code: 0,
        message: "Unauthorized - No token",
        status_code: 401,
      });
      return;
    }
  
    const idToken = request.headers.authorization.split("Bearer ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      request.user = decodedToken;
    } catch (error) {
      console.error(error);
      console.log(request.headers.authorization);
      reply.code(401).send({
        data: null,
        event_code: 0,
        message: "Unauthorized - Invalid token",
        status_code: 401,
      });
    }
  }