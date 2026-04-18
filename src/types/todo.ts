export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  order: number;
}
