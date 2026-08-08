import { clients, db, intToTimeString } from "@/db/database.ts";
import { define } from "../../../utils.ts";
import { game } from "@/db/schema.ts";
import { eq } from "drizzle-orm";

export const handler = define.handlers({
  GET(ctx) {
    const gameId = ctx.params.gameId;
    console.log(gameId);

    const { socket, response } = ctx.upgrade();
    socket.onopen = () => {
        clients.add(socket);
        console.log("Client connected " + gameId + "!");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        messageNexus(data.flag, data.data ?? undefined, gameId, socket);
    };

    socket.onclose = () => {
        clients.delete(socket);
        console.log("Client disconnected " + gameId);
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    return response;
  },
});

async function messageNexus(flag: string, data: any, gameId:string, socket: WebSocket) {
    switch (flag) {
        case "HELLO":
            socket.send(JSON.stringify({
                flag: "TEXT-MSG",
                data: "Hello back " + data + "!"
            }));
            break;

        case "TIME-NOW": {
            const result = await db.select({ time: game.time })
                .from(game)
                .where(eq(game.gameId, gameId))
                .limit(1);

            const timeNow = ((result.length > 0) ? result[0].time : 0);

            socket.send(JSON.stringify({
                flag: "TEXT-MSG",
                data: "TIME: " + intToTimeString(timeNow)
            }));
            break;
        }
    
        default:
            break;
    }
}