import "dotenv/config";
import connectDB from "./config/db.config.js";
import tc from "./services/task-service/task.controller.js";
import pc from "./services/project-service/project.controller.js";
import { User } from "./models/user.model.js";

const createMockRes = () => {
    const res = {
        statusCode: 200,
        headers: {},
        data: null,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(payload) {
            this.data = payload;
            if (this.resolve) this.resolve(this);
            return this;
        }
    };
    res.promise = new Promise((resolve) => {
        res.resolve = resolve;
    });
    return res;
};

async function testRealRequest() {
    await connectDB();
    const user = await User.findOne({ email: "test@gmail.com" });
    const branchId = "6a081b6e111c99b633b00d76";
    const targetProjectId = "69d7788e6d3910f342f371d9"; // DSA phase 1

    console.log("Testing REAL getallTasks request for user:", user.email, "branchId:", branchId, "projectId:", targetProjectId);

    const req = {
        user: user,
        branchId: branchId,
        body: {
            filter: {
                projectName: targetProjectId
            }
        },
        query: {}
    };

    const res = createMockRes();
    await tc.getallTasks(req, res);
    await res.promise;

    console.log("HTTP Status Code:", res.statusCode);
    console.log("Response Success:", res.data?.success);
    console.log("Response Message:", res.data?.message);
    const tasks = res.data?.data || [];
    console.log("Tasks returned count:", tasks.length);

    if (tasks.length > 0) {
        console.log("First 3 tasks:");
        tasks.slice(0, 3).forEach((t, i) => {
            console.log(`  [${i+1}] _id: ${t._id}, taskId: "${t.taskId}", name: "${t.taskName}", parentTask: ${t.parentTask ? (t.parentTask._id || t.parentTask) : null}, status: "${t.status}", progress: ${t.progress}, dates: ${t.taskStartDate} - ${t.taskDueDate}`);
        });
    }

    process.exit(0);
}

testRealRequest().catch(err => {
    console.error("Test real request error:", err);
    process.exit(1);
});
