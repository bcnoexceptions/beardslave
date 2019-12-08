import sqlite from "better-sqlite3";
import * as publicConfig from "./config/public-config.json";

/** Always pass table in hard-coded from TS, to avoid injection! */
export function addDatabaseOption(table: string, value: string): void {
    const db = new sqlite(publicConfig.dbFile);
    const statement = db.prepare(`INSERT INTO ${table} (value) VALUES (?)`);
    statement.run(value);
}

/** Always pass table in hard-coded from TS, to avoid injection! */
export function getRandomDatabaseOption(table: string): string {
    const db = new sqlite(publicConfig.dbFile);
    const statement = db.prepare(`SELECT value FROM ${table}`);
    const rows = statement.all();
    const num = rows.length;

    if (num === 0) {
        return "";
    }

    const randint = Math.floor(Math.random() * num);
    return rows[randint].value;
}