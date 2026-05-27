// const BASE_URL = "http://localhost:3000/api";
const BASE_URL = "/api";

// A reusable fetch wrapper so we don't repeat try/catch everywhere
async function request(url: string, options?: RequestInit) {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

// Board API
export const getBoards = () => request("/boards");
export const getBoard = (id: number) => request(`/boards/${id}`);

// Column API
export const createColumn = (boardId: number, title: string) =>
  request(`/boards/${boardId}/columns`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });

export const deleteColumn = (id: number) =>
  request(`/columns/${id}`, { method: "DELETE" });

// Task API
export const createTask = (columnId: number, title: string, description: string) =>
  request(`/columns/${columnId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });

export const updateTask = (id: number, data: { title?: string; description?: string; column_id?: number; position?: number }) =>
  request(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteTask = (id: number) =>
  request(`/tasks/${id}`, { method: "DELETE" });