import { App, cors, staticFiles } from "fresh";
import { type State } from "./utils.ts";

export const app = new App<State>();

app.use(staticFiles());
app.use(cors({
    origin: ((Deno.env.get("NODE_ENV") === "production") ? "*3mworkshop.org" : "*")
}))

// Pass a shared value from a middleware
app.use(async (ctx) => {
  ctx.state.shared = "hello";
  return await ctx.next();
});

app.fsRoutes();

console.log("RUNNING ON " + ((Deno.env.get("NODE_ENV") === "production") ? "PRODUCTION" : "DEVELOPMENT"));
