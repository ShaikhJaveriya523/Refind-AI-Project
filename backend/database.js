const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "refind.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

// Create reports table
db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        itemName TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        color TEXT,
        fromCity TEXT,
        toCity TEXT,
        eventDate TEXT,
        eventTime TEXT,
        location TEXT,
        busNumber TEXT,
        description TEXT,
        photo TEXT,
        latitude REAL,
        longitude REAL,
        email TEXT,
        currentUser TEXT,
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log("ReFind AI Database Connected!");
console.log("Reports table created successfully!");

module.exports = db;