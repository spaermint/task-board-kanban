import { Elysia } from "elysia";
import db from "../db/schema";

export const boardsRoute = new Elysia()
  // GET all boards
  .get("/api/boards", () => {
    const boards = db.query("SELECT * FROM boards ORDER BY created_at DESC").all();
    return boards;
  })

  // GET a single board with its columns
.get("/api/boards/:id", ({ params }) => {
    const board = db.query("SELECT * FROM boards WHERE id = ?").get(params.id);
    
    if (!board) {
      return new Response("Board not found", { status: 404 });
    }
    
    const columns = db.query(
      "SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC"
    ).all(params.id) as any[];

    // Fetch tasks for each column
    const columnsWithTasks = columns.map((column) => {
      const tasks = db.query(
        "SELECT * FROM tasks WHERE column_id = ? ORDER BY position ASC"
      ).all(column.id);
      return { ...column, tasks };
    });
    
    return { ...board, columns: columnsWithTasks };
  })

  // POST create a new board
  .post("/api/boards", ({ body }) => {
    const { title } = body as { title: string };
    
    if (!title || title.trim() === "") {
      return new Response("Title is required", { status: 400 });
    }
    
    const result = db.run("INSERT INTO boards (title) VALUES (?)", [title]);
    const newBoard = db.query("SELECT * FROM boards WHERE id = ?").get(result.lastInsertRowid);
    
    return newBoard;
  });