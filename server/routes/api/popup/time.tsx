import { clients, db, intToTimeString } from "@/db/database.ts";
import { define } from "../../../utils.ts";
import { game } from "@/db/schema.ts";
import { eq } from "drizzle-orm";

export const handler = define.handlers({
    async GET(ctx) {
        const gameId = ((new URL(ctx.req.url)).searchParams.get("gameid") ?? '');

        if (gameId == '') {
            return new Response('0', {
                status: 200,
            });
        }

        const result = await db.select({ time: game.time })
            .from(game)
            .where(eq(game.gameId, gameId))
            .limit(1);

        if (result.length == 0) {
            return new Response('0', {
                status: 200,
            });
        }

        return new Response(result[0].time.toString(), {
            status: 200,
        });
    },

    async POST(ctx) {
        const payload = await ctx.req.json() as { gameId: string, flag: string, value: number };

        switch (payload.flag) {
            case 'SET': {
                await db.insert(game)
                    .values({ gameId: payload.gameId, time: payload.value })
                    .onConflictDoUpdate({
                        target: game.gameId,
                        set: { 
                            time: payload.value,
                        }
                    });

                for (const socket of clients) {
                    socket.send(JSON.stringify({
                        flag: "TEXT-MSG",
                        data: intToTimeString(payload.value)
                    }));
                }
                break;
            }

            case 'SHIFT': {
                for (const socket of clients) {
                    socket.send(JSON.stringify({
                        flag: "TEXT-MSG",
                        data: intToTimeString(payload.value)
                    }));
                }
                break;
            }        
        }

        return new Response('OK', {
            status: 200,
        });
    }
});