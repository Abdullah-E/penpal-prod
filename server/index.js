import "dotenv/config";
import { mongo } from "./config/db.js";
import { fastify, BASE_URL } from "./routes/init.js";

fastify.get(BASE_URL, async () => {
  return { message: "Welcome to Penpal API" };
});

import "./routes/user.js";
import "./routes/admin.js";
import "./routes/customer.js";
import "./routes/message.js";

async function startServer() {
  try {
    await mongo;
    fastify.listen(
      { host: "0.0.0.0", port: process.env.PORT || 8000 },
      function (err, address) {
        if (err) {
          fastify.log.error(err);
          process.exit(1);
        } else {
          console.log(`Server is now listening on ${address}`);
        }
      }
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

//startServer();
await mongo;
fastify.listen(
      { host: "0.0.0.0", port: process.env.PORT || 8000 },
      function (err, address) {
        if (err) {
          fastify.log.error(err);
          process.exit(1);
        } else {
          console.log(`Server is now listening on ${address}`);
        }
      }
    );

import "./polling_scripts/match_updater.js"