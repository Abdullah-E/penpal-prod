import {admin, blankUser} from '../config/firebase.js'

export async function verifyToken(request, reply) {

  if(
    request.headers.authorization &&
    request.headers.authorization === "unauthenticated"
  ){
    console.log("unauthenticated")
    request.user = blankUser.user
    return
    // return blankUser.user
  }

  if (
    !request.headers.authorization ||
    !request.headers.authorization.startsWith("Bearer ")
  ) {
    return reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized - No token",
      status_code: 401,
    });
  }

  const idToken = request.headers.authorization.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    request.user = decodedToken;
  } catch (error) {
    console.error(error);
    console.log(request.headers.authorization);
    return reply.code(401).send({
      data: null,
      event_code: 0,
      message: "Unauthorized - Invalid token",
      status_code: 401,
    });
  }
}
export async function getUserFromToken(request){
  if (
      !request.headers.authorization ||
      !request.headers.authorization.startsWith("Bearer ")
    ) {
      return null
  }
  const idToken = request.headers.authorization.split("Bearer ")[1];
  try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken
  } catch (error) {
      console.error(error);
      return null
  }
}