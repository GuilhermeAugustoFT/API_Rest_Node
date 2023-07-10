import fastify from "fastify";
import cookie from "@fastify/cookie";
import { transactionRoutes } from "./routes/transactions";

const app = fastify();

app.register(cookie);
app.register(transactionRoutes);

app
  .listen({
    port: /* env.PORT */ 3333,
  })
  .then(() => {
    console.log("HTTP Server running on port 3333");
  });
