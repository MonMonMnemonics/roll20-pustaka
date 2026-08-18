import { clients, db, intToTimeString } from "@/db/database.ts";
import { define } from "../../../utils.ts";
import { effect, game } from "@/db/schema.ts";
import { and, eq, gt, lte } from "drizzle-orm";

export const handler = define.handlers({
    async GET(ctx) {
        const gameId = ((new URL(ctx.req.url)).searchParams.get("gameid") ?? '');

        if (gameId == '') {
            return new Response(intToTimeString(0), {
                status: 200,
            });
        }

        const result = await db.select({ time: game.time })
            .from(game)
            .where(eq(game.gameId, gameId))
            .limit(1);

        if (result.length == 0) {
            return new Response(intToTimeString(0), {
                status: 200,
            });
        }

        return new Response(intToTimeString(result[0].time), {
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
                        data: "TIME: " + intToTimeString(payload.value)
                    }));
                }
                break;
            }

            case 'SHIFT': {
                const result = await db.select({ time: game.time })
                    .from(game)
                    .where(eq(game.gameId, payload.gameId))
                    .limit(1);

                const timeOld = ((result.length > 0) ? result[0].time : 0);
                const timeNew = timeOld + payload.value;
                await db.insert(game)
                    .values({ gameId: payload.gameId, time: timeNew })
                    .onConflictDoUpdate({
                        target: game.gameId,
                        set: { 
                            time: timeNew,
                        }
                    });

                const expireList: string[] = [];
                
                const expiredEffects = await db.select({desc: effect.desc})
                    .from(effect)
                    .where(
                        and(
                            eq(effect.gameId, payload.gameId),
                            lte(effect.start, timeOld),
                            gt(effect.expire, timeOld),
                            lte(effect.expire, timeNew)
                        )
                    )
                for (const expiredEffect of expiredEffects) {
                    expireList.push(expiredEffect.desc ?? '');
                }

                for (const socket of clients) {
                    socket.send(JSON.stringify({
                        flag: "TEXT-LIST",
                        data: [
                            "TIME: " + intToTimeString(timeNew),
                            ...expireList.map(e => 'EXPIRED: ' + e)
                        ]
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