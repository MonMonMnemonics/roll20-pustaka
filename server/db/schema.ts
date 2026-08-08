import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const game = sqliteTable("game", {
    id: integer("id").primaryKey(),
    gameId: text("game_id").notNull().unique(),
    time: integer("time").notNull().default(0),
});

export const effect = sqliteTable("effect", {
    id: integer("id").primaryKey(),
    gameId: text("game_id").notNull(),
    start: integer("start").notNull().default(0),
    expire: integer("expire").notNull().default(0),
    desc: text("desc"),
});

export const item = sqliteTable("item", {
    id: integer("id").primaryKey(),
    gameId: text("game_id").notNull(),
    start: integer("start").notNull().default(0),
    expire: integer("expire").notNull().default(0),
    qty: integer("qty").notNull().default(0),
    desc: text("desc"),
});
