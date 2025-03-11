const sqlite3 = require('sqlite3').verbose();

// Connect to database (or create if not exists)
const db = new sqlite3.Database('./gym_database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) console.error(err.message);
    else console.log("Connected to SQLite database.");
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        schedule TEXT NOT NULL,
        trainer_id INTEGER,
        FOREIGN KEY (trainer_id) REFERENCES trainers(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS trainers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        hours_worked INTEGER DEFAULT 0
    )`);
});

module.exports = db;
