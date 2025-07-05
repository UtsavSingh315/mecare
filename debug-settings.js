// Debug script for settings page issue
const testSettingsAPI = async () => {
  const baseUrl = "http://localhost:3000";

  try {
    // Sign up a new user to test
    const email = `test${Date.now()}@example.com`;
    const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: "password123",
        name: "Test User",
      }),
    });

    if (!signupResponse.ok) {
      const errorData = await signupResponse.json();
      throw new Error(
        `Signup failed: ${signupResponse.status} - ${errorData.error}`
      );
    }

    const signupData = await signupResponse.json();
    const token = signupData.token;
    const userId = signupData.user.id;

    console.log("✅ Signup successful");
    console.log("👤 User ID:", userId);

    // Test the profile API
    const profileResponse = await fetch(
      `${baseUrl}/api/users/${userId}/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("📊 Profile API Response Status:", profileResponse.status);

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.log("❌ Profile API Error:", errorData);
    } else {
      const profileData = await profileResponse.json();
      console.log("✅ Profile API Success:", profileData);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

testSettingsAPI();
