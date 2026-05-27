import { Database } from "bun:sqlite";

// Step 1: Create or open a SQLite database file
// "task-board.sqlite" is the file name, stored in your project root
const db = new Database("task-board.sqlite", { create: true });

// Step 2: Enable WAL mode
// WAL (Write-Ahead Logging) lets multiple things read the DB at the same time
// without blocking each other — important for real-time apps
db.run("PRAGMA journal_mode = WAL;");

// Step 3: Create tables
// IF NOT EXISTS means it won't error if the table already exists
// This makes it safe to run this file multiple times

// Boards — the top-level container (e.g., "Work Projects")
db.run(`
  CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Columns — the stages in a board (e.g., "To Do", "In Progress", "Done")
db.run(`
  CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
  )
`);

// Tasks — individual cards inside a column
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    position INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
  )
`);

// Step 4: Seed default data
// If the database is empty, create a starter board with 3 columns
const boardCount = db.query("SELECT COUNT(*) as count FROM boards").get() as { count: number };

if (boardCount.count === 0) {
  const insertBoard = db.prepare("INSERT INTO boards (title) VALUES (?)");
  const insertColumn = db.prepare("INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)");
  
  const boardResult = insertBoard.run("My First Board");
  const boardId = boardResult.lastInsertRowid; // Gets the ID of the newly inserted board
  
  insertColumn.run(boardId, "To Do", 0);
  insertColumn.run(boardId, "In Progress", 1);
  insertColumn.run(boardId, "Done", 2);
  
  console.log("✅ Seeded default board with 3 columns");
}

export default db;