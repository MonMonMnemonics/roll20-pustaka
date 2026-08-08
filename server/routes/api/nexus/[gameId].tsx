import { define } from "../../../utils.ts";
const clients = new Set<WebSocket>();

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
      console.log(`Received: ${event.data}`);

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(event.data);
        }
      }
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
