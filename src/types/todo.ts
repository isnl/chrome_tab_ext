export type TodoImportance = "low" | "medium" | "high";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  dueTime?: string;
  importance: TodoImportance;
  order: number;
}

export interface TodoTimeGroup {
  key: "within1" | "within3" | "within7" | "later";
  label: string;
  todos: TodoItem[];
}
