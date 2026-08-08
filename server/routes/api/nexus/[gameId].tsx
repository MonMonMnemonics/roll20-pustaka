import { clients } from "@/db/database.ts";
import { define } from "../../../utils.ts";

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
        messageNexus(data.flag, data.data ?? undefined, socket);
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

async function messageNexus(flag: string, data: any, socket: WebSocket) {
    switch (flag) {
        case "HELLO":
            socket.send(JSON.stringify({
                flag: "TEXT-MSG",
                data: "Hello back " + data + "!"
            }));
            break;
    
        default:
            break;
    }
}