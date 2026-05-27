import { Elysia } from "elysia";
import db from "../db/schema";
import { broadcast } from "../websocket/handler";

export const columnsRoute = new Elysia()
  // POST create a new column in a board
  .post("/api/boards/:boardId/columns", ({ params, body }) => {
    const { title } = body as { title: string };
    const boardId = params.boardId;

    if (!title || title.trim() === "") {
      return new Response("Title is required", { status: 400 });
    }

    // Find the highest position so far, so the new column goes at the end
    const lastColumn = db.query(
      "SELECT MAX(position) as maxPos FROM columns WHERE board_id = ?"
    ).get(boardId) as { maxPos: number | null };

    const newPosition = (lastColumn?.maxPos ?? -1) + 1;

    const result = db.run(
      "INSERT INTO columns (board_id, title, position) VALUES (?, ?, ?)",
      [boardId, title, newPosition]
    );

    const newColumn = db.query("SELECT * FROM columns WHERE id = ?").get(result.lastInsertRowid);
    broadcast("column:created", newColumn);
    return newColumn;
  })

  // PUT update a column (rename it)
  .put("/api/columns/:id", ({ params, body }) => {
    const { title } = body as { title: string };
    
    if (!title || title.trim() === "") {
      return new Response("Title is required", { status: 400 });
    }

    const existing = db.query("SELECT * FROM columns WHERE id = ?").get(params.id);
    if (!existing) {
      return new Response("Column not found", { status: 404 });
    }

    db.run("UPDATE columns SET title = ? WHERE id = ?", [title, params.id]);
    
    const updated = db.query("SELECT * FROM columns WHERE id = ?").get(params.id);
    broadcast("column:updated", updated); 
    return updated;
  })

  // DELETE a column and all its tasks
  .delete("/api/columns/:id", ({ params }) => {
    const existing = db.query("SELECT * FROM columns WHERE id = ?").get(params.id);
    if (!existing) {
      return new Response("Column not found", { status: 404 });
    }

    db.run("DELETE FROM columns WHERE id = ?", [params.id]);
    broadcast("column:deleted", { id: Number(params.id) });
    return { success: true, message: "Column deleted" };
  });