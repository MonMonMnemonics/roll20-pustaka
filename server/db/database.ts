import { createClient } from '@libsql/client';
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({ url: "file:" + Deno.env.get("DB_FILE") });
export const db = drizzle(client);