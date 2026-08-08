import { db } from "@/db/database.ts";
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
});