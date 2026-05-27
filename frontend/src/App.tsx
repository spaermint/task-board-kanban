import { useState, useEffect, useCallback } from "react";
import { getBoard, createColumn, createTask, updateTask, deleteTask, deleteColumn } from "./api";
import { useWebSocket } from "./useWebSocket";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import "./styles.css";

// TypeScript interfaces — describe the shape of our data
interface Task {
  id: number;
  column_id: number;
  title: string;
  description: string;
  position: number;
}

interface Column {
  id: number;
  board_id: number;
  title: string;
  position: number;
  tasks: Task[];
}

interface Board {
  id: number;
  title: string;
  columns: Column[];
}

function App() {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newTaskTitles, setNewTaskTitles] = useState<Record<number, string>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load board 1 (the default board)
  const loadBoard = useCallback(async () => {
    try {
      const data = await getBoard(1);
      // Attach empty tasks array to each column if needed
      const columnsWithTasks = data.columns.map((col: Column) => ({
        ...col,
        tasks: col.tasks || [],
      }));
      setBoard({ ...data, columns: columnsWithTasks });
      setError(null);
    } catch {
      setError("Failed to load board. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // WebSocket handler — updates board when other users make changes
  const handleWsMessage = useCallback((event: string) => {
    // Simple approach: reload the board on any change
    // In production, you'd update state incrementally for better perf
    if (event.startsWith("task:") || event.startsWith("column:")) {
      loadBoard();
    }
  }, [loadBoard]);

  useWebSocket(handleWsMessage);

  // Add a new column
  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !board) return;
    await createColumn(board.id, newColumnTitle.trim());
    setNewColumnTitle("");
    loadBoard();
  };

  // Delete a column
  const handleDeleteColumn = async (columnId: number) => {
    await deleteColumn(columnId);
    loadBoard();
  };

  // Add a new task to a column
  const handleAddTask = async (columnId: number) => {
    const title = newTaskTitles[columnId]?.trim();
    if (!title) return;
    await createTask(columnId, title, "");
    setNewTaskTitles({ ...newTaskTitles, [columnId]: "" });
    loadBoard();
  };

  // Delete a task
  const handleDeleteTask = async (taskId: number) => {
    await deleteTask(taskId);
    loadBoard();
  };

  // Update task (from edit modal)
  const handleUpdateTask = async () => {
    if (!editingTask) return;
    await updateTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
    });
    setEditingTask(null);
    loadBoard();
  };

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a column
    if (!destination) return;

    // Dropped in same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const destColumnId = Number(destination.droppableId);
    const taskId = Number(draggableId);

    await updateTask(taskId, {
      column_id: destColumnId,
      position: destination.index,
    });

    loadBoard();
  };

  // Loading state
  if (loading) return <div className="loading">Loading board...</div>;

  // Error state
  if (error) return <div className="error">{error}</div>;

  // No board found
  if (!board) return <div className="error">No board found</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 {board.title}</h1>
      </header>

      {/* Add column form */}
      <div className="add-form" style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Add a new column..."
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
        />
        <button className="btn btn-primary" onClick={handleAddColumn}>
          + Column
        </button>
      </div>

      {/* Board columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board">
          {board.columns
            .sort((a, b) => a.position - b.position)
            .map((column) => (
              <div key={column.id} className="column">
                {/* Column header */}
                <div className="column-header">
                  <h3>{column.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="task-count">{column.tasks.length}</span>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDeleteColumn(column.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Task list (droppable area) */}
                <Droppable droppableId={String(column.id)}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="task-list"
                      style={{
                        background: snapshot.isDraggingOver ? "rgba(59,130,246,0.1)" : undefined,
                      }}
                    >
                      {column.tasks
                        .sort((a, b) => a.position - b.position)
                        .map((task, index) => (
                          <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`task-card ${snapshot.isDragging ? "dragging" : ""}`}
                                onClick={() => setEditingTask(task)}
                              >
                                <h4>{task.title}</h4>
                                {task.description && <p>{task.description}</p>}
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add task form */}
                <div className="add-form">
                  <input
                    type="text"
                    placeholder="Add a task..."
                    value={newTaskTitles[column.id] || ""}
                    onChange={(e) =>
                      setNewTaskTitles({ ...newTaskTitles, [column.id]: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask(column.id)}
                  />
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: "10px 14px", fontSize: 16 }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddTask(column.id);
                        }}
                    >
                        +
                  </button>
                </div>
              </div>
            ))}
        </div>
      </DragDropContext>

      {/* Edit task modal */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Task</h2>
            <input
              type="text"
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              placeholder="Task title"
            />
            <textarea
              value={editingTask.description}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              placeholder="Description (optional)"
            />
            <div className="modal-actions">
              <button
                className="btn btn-danger"
                onClick={() => {
                  handleDeleteTask(editingTask.id);
                  setEditingTask(null);
                }}
              >
                Delete
              </button>
              <button className="btn btn-ghost" onClick={() => setEditingTask(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateTask}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;