const fetch = require("node-fetch");

async function testDelete() {
  try {
    // First, login to get a valid token
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "sarah@example.com",
        password: "password123",
      }),
    });

    if (!loginResponse.ok) {
      console.error("Login failed:", await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log("Login successful, got token");

    // Now get todos to see what's available
    const todosResponse = await fetch("http://localhost:3000/api/todos", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!todosResponse.ok) {
      console.error("Failed to fetch todos:", await todosResponse.text());
      return;
    }

    const todosData = await todosResponse.json();
    console.log(
      "Current todos:",
      todosData.todos.map((t) => ({ id: t.id, title: t.title }))
    );

    if (todosData.todos.length === 0) {
      console.log("No todos to delete");
      return;
    }

    // Try to delete the first todo
    const todoToDelete = todosData.todos[0];
    console.log(
      "Attempting to delete todo:",
      todoToDelete.id,
      todoToDelete.title
    );

    const deleteResponse = await fetch("http://localhost:3000/api/todos", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: todoToDelete.id,
      }),
    });

    console.log("Delete response status:", deleteResponse.status);
    const deleteResult = await deleteResponse.text();
    console.log("Delete response:", deleteResult);
  } catch (error) {
    console.error("Error:", error);
  }
}

testDelete();
