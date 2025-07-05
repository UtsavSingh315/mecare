// Test script to verify daily log with new fields
const testDailyLog = async () => {
  const baseUrl = "http://localhost:3000";

  try {
    // First try to sign up a new test user
    const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: "password123",
        name: "Test User",
      }),
    });

    let token, userId;

    if (signupResponse.ok) {
      const signupData = await signupResponse.json();
      token = signupData.token;
      userId = signupData.user.id;
      console.log("✅ Signup successful");
    } else {
      // If signup fails, try login with alice@example.com
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "alice@example.com",
          password: "password123",
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(
          `Both signup and login failed: ${loginResponse.status}`
        );
      }

      const loginData = await loginResponse.json();
      token = loginData.token;
      userId = loginData.user.id;
      console.log("✅ Login successful");
    }

    // Create a daily log with all fields including new ones
    const today = new Date().toISOString().split("T")[0];
    const logData = {
      userId: userId,
      date: today,
      mood: "happy",
      painLevel: 3,
      energyLevel: 8,
      waterIntake: 10,
      sleepHours: "7.5",
      exerciseMinutes: 45,
      weight: "65.5",
      isOnPeriod: false,
      notes: "Test log with all new fields",
      symptoms: ["cramps", "headache"],
    };

    console.log("🔐 Using token:", token.substring(0, 20) + "...");
    console.log("👤 User ID:", userId);
    console.log("📅 Date:", today);

    const logResponse = await fetch(`${baseUrl}/api/daily-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(logData),
    });

    if (!logResponse.ok) {
      const errorData = await logResponse.json();
      throw new Error(
        `Daily log creation failed: ${logResponse.status} - ${errorData.error}`
      );
    }

    const createdLog = await logResponse.json();
    console.log("✅ Daily log created successfully");
    console.log("📊 Created log data:", {
      mood: createdLog.mood,
      painLevel: createdLog.painLevel,
      energyLevel: createdLog.energyLevel,
      waterIntake: createdLog.waterIntake,
      sleepHours: createdLog.sleepHours,
      exerciseMinutes: createdLog.exerciseMinutes,
      weight: createdLog.weight,
      isOnPeriod: createdLog.isOnPeriod,
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

testDailyLog();
