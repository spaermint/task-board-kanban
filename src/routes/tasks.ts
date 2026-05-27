import { Elysia } from "elysia";
import db from "../db/schema";
import { broadcast } from "../websocket/handler";

export const tasksRoute = new Elysia()
  // POST create a new task in a column
  .post("/api/columns/:columnId/tasks", ({ params, body }) => {
    const { title, description } = body as { title: string; description?: string };
    const columnId = params.columnId;

    if (!title || title.trim() === "") {
      return new Response("Title is required", { status: 400 });
    }

    // Check if column exists
    const column = db.query("SELECT * FROM columns WHERE id = ?").get(columnId);
    if (!column) {
      return new Response("Column not found", { status: 404 });
    }

    // Get last position in this column
    const lastTask = db.query(
      "SELECT MAX(position) as maxPos FROM tasks WHERE column_id = ?"
    ).get(columnId) as { maxPos: number | null };

    const newPosition = (lastTask?.maxPos ?? -1) + 1;

    const result = db.run(
      "INSERT INTO tasks (column_id, title, description, position) VALUES (?, ?, ?, ?)",
      [columnId, title, description || "", newPosition]
    );

    const newTask = db.query("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    broadcast("task:created", newTask);
    return newTask;
  })

  // PUT update a task (edit title, description, or move to another column)
  .put("/api/tasks/:id", ({ params, body }) => {
    const { title, description, column_id, position } = body as {
      title?: string;
      description?: string;
      column_id?: number;
      position?: number;
    };

    const existing = db.query("SELECT * FROM tasks WHERE id = ?").get(params.id);
    if (!existing) {
      return new Response("Task not found", { status: 404 });
    }

    // Build dynamic update — only update fields that were sent
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (column_id !== undefined) {
      updates.push("column_id = ?");
      values.push(column_id);
    }
    if (position !== undefined) {
      updates.push("position = ?");
      values.push(position);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(params.id);
      db.run(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    const updated = db.query("SELECT * FROM tasks WHERE id = ?").get(params.id);
    broadcast("task:updated", updated);
    return updated;
  })

  // DELETE a task
  .delete("/api/tasks/:id", ({ params }) => {
    const existing = db.query("SELECT * FROM tasks WHERE id = ?").get(params.id);
    if (!existing) {
      return new Response("Task not found", { status: 404 });
    }

    db.run("DELETE FROM tasks WHERE id = ?", [params.id]);
    broadcast("task:deleted", { id: Number(params.id) });
    return { success: true, message: "Task deleted" };
  });