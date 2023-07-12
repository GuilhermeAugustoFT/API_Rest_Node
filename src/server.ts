import { app } from "./app";

app
  .listen({
    port: /* env.PORT */ 3333,
  })
  .then(() => {
    console.log("HTTP Server running on port 3333");
  });
