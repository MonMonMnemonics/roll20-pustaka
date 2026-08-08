import { App, cors, staticFiles } from "fresh";
import { type State } from "./utils.ts";
import { clients } from "@/db/database.ts";

export const app = new App<State>();

app.use(staticFiles());
app.use(cors({
  	origin: "*",
}));

app.fsRoutes();

console.log(
  "RUNNING ON " +
    ((Deno.env.get("NODE_ENV") === "production")
		? "PRODUCTION"
		: "DEVELOPMENT"),
);

setInterval(() => {
	console.log(clients.size);
}, 3000);
