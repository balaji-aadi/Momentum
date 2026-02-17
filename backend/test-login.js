import axios from "axios";

// Configuration
const BASE_URL = "http://localhost:5003/api/v1";
const EMAIL = "balajiaadi2000@gmail.com"; // Default user from previous context
const PASSWORD = "India@123";

async function testLogin() {
  console.log("Testing Login...");
  try {
    const response = await axios.post(`${BASE_URL}/user/login`, {
      email: EMAIL,
      password: PASSWORD,
    });

    console.log("Login Successful!");
    console.log("Status:", response.status);
    console.log("Access Token:", response.data.data.accessToken ? "Present" : "Missing");
    console.log("User:", response.data.data.user.email);
    return response.data.data.accessToken;

  } catch (error) {
    console.error("Login Failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }
}

async function testProtectedEndpoint(token) {
  if (!token) return;

  console.log("\nTesting Protected Endpoint (Current User)...");
  try {
    const response = await axios.get(`${BASE_URL}/user/current-user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("User Fetch Successful!");
    console.log("User ID:", response.data.data._id);
  } catch (error) {
    console.error("Protected Endpoint Failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

// Run tests
(async () => {
  // Wait a bit for server to restart if running via nodemon
  console.log("Waiting 2s for server restart...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const token = await testLogin();
  if (token) {
    await testProtectedEndpoint(token);
  }
})();
