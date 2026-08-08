import { clients, db, intToTimeString } from "@/db/database.ts";
import { define } from "../../../utils.ts";
import { effect, game, item } from "@/db/schema.ts";
import { and, asc, desc, eq, gt, lte } from "drizzle-orm";

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

        case "EFFECT-NOW": {
            const result = await db.select({ time: game.time })
                .from(game)
                .where(eq(game.gameId, gameId))
                .limit(1);

            const timeNow = ((result.length > 0) ? result[0].time : 0);

            const effects = await db.select({ desc: effect.desc, expire: effect.expire })
                .from(effect)
                .where(
                    and(
                        eq(effect.gameId, gameId),
                        lte(effect.start, timeNow),
                        gt(effect.expire, timeNow)
                    )
                )

            socket.send(JSON.stringify({
                flag: "TEXT-LIST",
                data: [
                    'ACTIVE EFFECTS',
                    ...effects.map(e => e.desc + " (" + (e.expire - timeNow) + " mins)")
                ]
            }));
            break;
        }

        case "EFFECT-ADD": {
            const result = await db.select({ time: game.time })
                .from(game)
                .where(eq(game.gameId, gameId))
                .limit(1);

            const timeNow = ((result.length > 0) ? result[0].time : 0);

            await db.insert(effect).values({
                gameId: gameId,
                start: timeNow,
                expire: timeNow + data.expire,
                desc: data.desc
            });

            socket.send(JSON.stringify({
                flag: "TEXT-MSG",
                data: 'EFFECT ADDED'
            }));
            break;
        }

        case "EFFECT-REMOVE-CURRENT": {
            const result = await db.select({ time: game.time })
                .from(game)
                .where(eq(game.gameId, gameId))
                .limit(1);

            const timeNow = ((result.length > 0) ? result[0].time : 0);

            const target = await db.select({id: effect.id})
                .from(effect)
                .where(
                    and(
                        eq(effect.gameId, gameId),
                        eq(effect.desc, data),
                        lte(effect.start, timeNow),
                        gt(effect.expire, timeNow)
                    )
                )
                .orderBy(desc(effect.start))
                .limit(1);
            
            if (target.length > 0) {
                await db.delete(effect).where(eq(effect.id, target[0].id));
            }

            socket.send(JSON.stringify({
                flag: "TEXT-MSG",
                data: 'EFFECT REMOVED'
            }));
            break;
        }

        case "LOOT-NOW": {
            const result = await db.select({ time: game.time })
                .from(game)
                .where(eq(game.gameId, gameId))
                .limit(1);

            const timeNow = ((result.length > 0) ? result[0].time : 0);

            const loots = await db.select({ desc: item.desc, qty: item.qty })
                .from(item)
                .where(
                    and(
                        eq(item.gameId, gameId),
                        lte(item.start, timeNow),
                        gt(item.expire, timeNow)
                    )
                )

            const groupedLoots: {[key: string]: number} = {}
            for (const loot of loots) {
                groupedLoots[loot.desc ?? 'UNDEFINED'] = (groupedLoots[loot.desc ?? 'UNDEFINED'] ?? 0) + loot.qty;
            }

            socket.send(JSON.stringify({
                flag: "TEXT-LIST",
                data: [
                    'LOOTS',
                    ...Object.entries(groupedLoots).map(([name, qty]) => name + ' ' + qty.toString())
                ]
            }));
            break;
        }

        case "LOOT-ADD": {
            const result = await db.select({ time: game.time })
                .from(game)
                .where(eq(game.gameId, gameId))
                .limit(1);

            const timeNow = ((result.length > 0) ? result[0].time : 0);

            await db.insert(item).values({
                gameId: gameId,
                start: timeNow,
                qty: data.qty,
                expire: timeNow + data.expire,
                desc: data.desc
            });

            socket.send(JSON.stringify({
                flag: "TEXT-MSG",
                data: 'ITEM ADDED'
            }));
            break;
        }

        case "LOOT-REMOVE": {
            const result = await db.select({ time: game.time })
                .from(game)
                .where(eq(game.gameId, gameId))
                .limit(1);

            const timeNow = ((result.length > 0) ? result[0].time : 0);

            const target = await db.select({id: item.id, qty: item.qty})
                .from(item)
                .where(
                    and(
                        eq(item.gameId, gameId),
                        eq(item.desc, data.desc),
                        lte(item.start, timeNow),
                        gt(item.expire, timeNow)
                    )
                )
                .orderBy(asc(item.expire));

            if (data.qty > target.reduce((acc, curr) => acc + curr.qty, 0)) {
                socket.send(JSON.stringify({
                    flag: "TEXT-MSG",
                    data: 'NOT ENOUGH ITEM TO REMOVE'
                }));
            } else {
                let removeQty: number = data.qty;
                for (const row of target) {
                    if (row.qty > removeQty) {
                        await db.update(item).set({
                            qty: row.qty - removeQty
                        });

                        removeQty = 0;
                    } else {
                        await db.delete(item).where(eq(item.id, row.id));
                        removeQty -= row.qty;
                    }
                }

                socket.send(JSON.stringify({
                    flag: "TEXT-MSG",
                    data: 'ITEM REMOVED'
                }));
            }
            
            break;
        }
    
        default:
            break;
    }
}