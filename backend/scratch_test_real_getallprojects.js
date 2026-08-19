import "dotenv/config";
import connectDB from "./config/db.config.js";
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

async function testGetAllProjects() {
    await connectDB();
    const user = await User.findOne({ email: "test@gmail.com" });
    const branchId = "6a081b6e111c99b633b00d76";

    const req = {
        user: user,
        branchId: branchId,
        body: { filter: {} },
        query: {}
    };

    const res = createMockRes();
    await pc.getAllProject(req, res);
    await res.promise;

    console.log("Projects returned count:", res.data?.data?.length);
    (res.data?.data || []).forEach(p => {
        console.log(`  _id: ${p._id}, name: "${p.name}", key: "${p.key}", status: "${p.status}", branchId: ${p.branchId}`);
    });

    process.exit(0);
}

testGetAllProjects().catch(err => {
    console.error(err);
    process.exit(1);
});
