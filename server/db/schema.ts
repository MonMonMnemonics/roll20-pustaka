import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const game = sqliteTable("game", {
    id: integer("id").primaryKey(),
    gameId: text("game_id").notNull().unique(),
    time: integer("time").notNull().default(0)
})