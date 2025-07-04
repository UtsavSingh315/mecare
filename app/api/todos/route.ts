import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { todos } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - Fetch user's todos
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = tokenData.id;

    // Fetch user's todos
    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(desc(todos.createdAt));

    return NextResponse.json({
      todos: userTodos,
      stats: {
        total: userTodos.length,
        completed: userTodos.filter(t => t.isCompleted).length,
        pending: userTodos.filter(t => !t.isCompleted).length,
      }
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new todo
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = tokenData.id;
    const body = await request.json();
    const { title, description, category, priority, dueDate, isDefault } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Create new todo
    const newTodo = await db
      .insert(todos)
      .values({
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || null,
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        isCompleted: false,
        isDefault: Boolean(isDefault),
      })
      .returning();

    return NextResponse.json({
      todo: newTodo[0],
      message: "Todo created successfully"
    });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update todo (toggle completion, edit details)
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = tokenData.id;
    const body = await request.json();
    const { id, isCompleted, title, description, category, priority } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Todo ID is required" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (typeof isCompleted === "boolean") {
      updateData.isCompleted = isCompleted;
    }
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (category !== undefined) {
      updateData.category = category;
    }
    if (priority !== undefined) {
      updateData.priority = priority;
    }

    // Update todo (ensure user owns the todo)
    const updatedTodo = await db
      .update(todos)
      .set(updateData)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();

    if (updatedTodo.length === 0) {
      return NextResponse.json(
        { error: "Todo not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      todo: updatedTodo[0],
      message: "Todo updated successfully"
    });
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete todo
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = tokenData.id;
    const body = await request.json();
    const { id: todoId } = body;

    if (!todoId) {
      return NextResponse.json(
        { error: "Todo ID is required" },
        { status: 400 }
      );
    }

    // Delete todo (ensure user owns the todo)
    const deletedTodo = await db
      .delete(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .returning();

    if (deletedTodo.length === 0) {
      return NextResponse.json(
        { error: "Todo not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Todo deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
