import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({ url: "file:" + Deno.env.get("DB_FILE") });
export const db = drizzle(client);

export const clients = new Set<WebSocket>();

export function intToTimeString(time: number) {
    if (time > 24*60) {
        while (time >= 24*60) {
            time -= 24*60;
        }
    } else if (time < 0) {
        while (time < 0) {
            time = 24*60 - time;
        }
    }

    const hour = Math.floor(time/60);
    const min = time - hour*60;

    return (hour.toString().padStart(2, '0') + ':' + min.toString().padStart(2, '0'));
}