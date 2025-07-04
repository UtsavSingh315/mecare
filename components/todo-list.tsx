"use client";

import { useState, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  isDefault: boolean;
  category: string | null;
  priority: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewTodo {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  dueDate?: string;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();

  // Default todos for new users
  const defaultTodos = [
    { title: "Pack period pads", description: "Remember to pack extra pads for the day", category: "period" },
    { title: "Get comfort snacks", description: "Stock up on favorite munchies for PMS days", category: "self-care" },
    { title: "Track mood today", description: "Log today's mood and energy levels", category: "tracking" },
  ];

  // Fetch todos from API
  const fetchTodos = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.log("No auth token found");
        setLoading(false);
        return;
      }

      console.log("Fetching todos for user:", user.id);
      const response = await fetch("/api/todos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Todos API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Todos API response data:", data);
        const todosList = data.todos || data; // Handle both response formats
        setTodos(todosList);
        
        // If no todos exist, create default ones
        if (todosList.length === 0) {
          console.log("No todos found, creating default todos");
          await createDefaultTodos();
        }
      } else {
        const errorData = await response.text();
        console.error("Failed to fetch todos:", response.status, errorData);
        // Set empty todos array on error so component still renders
        setTodos([]);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create default todos for new users
  const createDefaultTodos = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      
      console.log("Creating default todos...");
      for (const defaultTodo of defaultTodos) {
        console.log("Creating todo:", defaultTodo.title);
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...defaultTodo,
            isDefault: true,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Failed to create default todo:", defaultTodo.title, errorData);
        } else {
          console.log("Created default todo:", defaultTodo.title);
        }
      }
      
      // Refresh the todos list
      console.log("Refreshing todos list after creating defaults");
      fetchTodos();
    } catch (error) {
      console.error("Error creating default todos:", error);
    }
  };

  // Add a new todo
  const addTodo = async () => {
    if (!newTodoTitle.trim() || !user) return;

    setIsAdding(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTodoTitle.trim(),
          category: "personal",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTodo = data.todo || data; // Handle both response formats
        setTodos((prev) => [...prev, newTodo]);
        setNewTodoTitle("");
      } else {
        console.error("Failed to add todo");
      }
    } catch (error) {
      console.error("Error adding todo:", error);
    } finally {
      setIsAdding(false);
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todoId: string, isCompleted: boolean) => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/todos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: todoId,
          isCompleted: !isCompleted,
        }),
      });

      if (response.ok) {
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === todoId ? { ...todo, isCompleted: !isCompleted } : todo
          )
        );
      } else {
        console.error("Failed to toggle todo");
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  // Delete a todo
  const deleteTodo = async (todoId: string) => {
    if (!user) return;

    console.log("Attempting to delete todo with ID:", todoId, "Type:", typeof todoId);

    try {
      const token = localStorage.getItem("auth_token");
      const requestBody = { id: todoId };
      console.log("DELETE request body:", requestBody);
      
      const response = await fetch("/api/todos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("DELETE response status:", response.status);
      
      if (response.ok) {
        console.log("Todo deleted successfully");
        setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
      } else {
        const errorText = await response.text();
        console.error("Failed to delete todo. Status:", response.status, "Error:", errorText);
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTodos();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Check className="w-5 h-5 text-rose-500" />
            My Todos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading todos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Check className="w-5 h-5 text-rose-500" />
            My Todos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600 text-sm">Please log in to see your todos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <Check className="w-5 h-5 text-rose-500" />
          My Todos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new todo */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a new todo..."
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addTodo();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={addTodo}
            disabled={!newTodoTitle.trim() || isAdding}
            size="sm"
            className="bg-rose-500 hover:bg-rose-600"
          >
            {isAdding ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Todo list */}
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                todo.isCompleted
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Checkbox
                checked={todo.isCompleted}
                onCheckedChange={() => toggleTodo(todo.id, todo.isCompleted)}
                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    todo.isCompleted
                      ? "text-green-700 line-through"
                      : "text-gray-800"
                  }`}
                >
                  {todo.title}
                </p>
                {todo.description && (
                  <p
                    className={`text-xs ${
                      todo.isCompleted ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {todo.description}
                  </p>
                )}
                {todo.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-rose-100 text-rose-700 rounded-full">
                    {todo.category}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTodo(todo.id)}
                className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {todos.length === 0 && (
          <div className="text-center py-6">
            <Check className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No todos yet.</p>
            <p className="text-gray-400 text-xs">Add your first todo above!</p>
          </div>
        )}

        {/* Show completed count */}
        {todos.length > 0 && (
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-gray-500">
              {todos.filter((todo) => todo.isCompleted).length} of {todos.length} completed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
