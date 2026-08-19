import axios from "axios";

const BASE_URL = "http://localhost:5003/api/v1";

async function runTrace() {
    console.log("==================================================");
    console.log("   REAL RUNTIME HTTP NETWORK TRACE (PORT 5003)    ");
    console.log("==================================================");

    // Step 1: Login as Balaji Aadi (Admin)
    console.log("\n1. Logging in as balajiaadi2000@gmail.com...");
    const loginRes1 = await axios.post(`${BASE_URL}/user/login`, {
        email: "balajiaadi2000@gmail.com",
        password: "India@123"
    });
    const token1 = loginRes1.data.data.accessToken;
    const user1 = loginRes1.data.data.user;
    console.log("   Login 1 Success! User ID:", user1._id, "Role:", user1.userRole?.name);

    // Step 2: Fetch Projects
    const branchId = "6a081b6e111c99b633b00d76";
    console.log("\n2. Fetching Projects via POST /api/v1/project/get-all-projects...");
    const projectsRes = await axios.post(`${BASE_URL}/project/get-all-projects`, {}, {
        headers: {
            Authorization: `Bearer ${token1}`,
            "x-branch-id": branchId
        }
    });

    console.log("   Projects Response Status:", projectsRes.status);
    console.log("   Projects Response Root Keys:", Object.keys(projectsRes.data));
    const projects = projectsRes.data?.data || [];
    console.log("   Projects Count:", projects.length);
    projects.forEach(p => {
        const slug = p.key?.toLowerCase() || p.name.toLowerCase().replace(/\s+/g, '-');
        console.log(`   - Project: "${p.name}", Key: "${p.key}", ID: ${p._id}, Slug: "${slug}", Branch: ${p.branchId}`);
    });

    // Step 3: Slug resolution matching for "/arena/dsa"
    const targetSlug = "dsa";
    console.log(`\n3. Resolving slug "/arena/${targetSlug}" against projects...`);
    const matched = projects.find(p => {
        const pSlug = p.key?.toLowerCase() || p.name.toLowerCase().replace(/\s+/g, '-');
        return pSlug === targetSlug || p._id === targetSlug || p.key?.toLowerCase() === targetSlug;
    });

    if (!matched) {
        console.error("   ❌ ERROR: No project matched slug 'dsa'!");
    } else {
        console.log(`   ✅ Matched Project: "${matched.name}", _id: "${matched._id}", key: "${matched.key}"`);
    }

    const targetProjectId = matched ? matched._id : null;

    // Step 4: Call POST /api/v1/task/get-all-tasks as User 1 (Admin)
    console.log(`\n4. Calling POST /api/v1/task/get-all-tasks for project ${targetProjectId}...`);
    const tasksRes1 = await axios.post(`${BASE_URL}/task/get-all-tasks`, {
        filter: {
            projectName: targetProjectId
        }
    }, {
        headers: {
            Authorization: `Bearer ${token1}`,
            "x-branch-id": branchId
        }
    });

    console.log("   HTTP Status:", tasksRes1.status);
    console.log("   Response Success:", tasksRes1.data?.success);
    console.log("   Response Keys:", Object.keys(tasksRes1.data));
    console.log("   Array.isArray(res.data.data):", Array.isArray(tasksRes1.data?.data));
    const tasks1 = tasksRes1.data?.data || [];
    console.log("   Tasks returned count:", tasks1.length);
    
    const parents1 = tasks1.filter(t => !t.parentTask);
    const children1 = tasks1.filter(t => t.parentTask);
    console.log(`   Parent Topics: ${parents1.length}, Child Subtasks: ${children1.length}`);

    // Step 5: Test login as User 2 (Member / test@gmail.com)
    console.log("\n5. Testing Member Login (test@gmail.com)...");
    let token2 = null;
    try {
        const loginRes2 = await axios.post(`${BASE_URL}/user/login`, {
            email: "test@gmail.com",
            password: "India@123" // Or whatever password
        });
        token2 = loginRes2.data.data.accessToken;
        console.log("   Login 2 Success! User ID:", loginRes2.data.data.user._id);
    } catch (err) {
        console.log("   Login test@gmail.com with password 'India@123' failed:", err.response?.data?.message || err.message);
    }

    if (token2) {
        console.log(`\n6. Calling POST /api/v1/task/get-all-tasks as Member (test@gmail.com)...`);
        const tasksRes2 = await axios.post(`${BASE_URL}/task/get-all-tasks`, {
            filter: {
                projectName: targetProjectId
            }
        }, {
            headers: {
                Authorization: `Bearer ${token2}`,
                "x-branch-id": branchId
            }
        });
        const tasks2 = tasksRes2.data?.data || [];
        console.log("   Member Tasks Count:", tasks2.length);
        const nonTodo = tasks2.filter(t => t.status !== "todo");
        console.log("   Member Non-todo tasks count:", nonTodo.length);
    }

    console.log("\n==================================================");
    console.log("             NETWORK TRACE COMPLETE               ");
    console.log("==================================================");
}

runTrace().catch(err => {
    console.error("Fatal Trace Error:", err.response?.data || err.message);
});
