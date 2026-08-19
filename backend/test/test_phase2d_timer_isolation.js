import mongoose from "mongoose";
import { FocusController } from "../services/focus-service/focus.controller.js";
import { FocusSession } from "../models/focusSession.model.js";

// Helper for Mock Response
function createMockRes() {
    let _resolve;
    const promise = new Promise((resolve) => {
        _resolve = resolve;
    });
    return {
        promise,
        statusCode: 200,
        data: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            _resolve(this);
            return this;
        }
    };
}

// Helper for Query Chaining
function createQueryChain(result) {
    const query = {
        select: () => query,
        populate: () => query,
        sort: () => query,
        limit: () => query,
        lean: () => Promise.resolve(result),
        then: (resolve) => resolve(result)
    };
    return query;
}

// Mock localStorage for node.js test environment
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] !== undefined ? this.store[key] : null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

// Simulated Client Storage utility matching frontend/src/utils/userStorage.js
function createUserStorage(mockStorage) {
    return {
        getActiveUserId: () => {
            const userStr = mockStorage.getItem("currentUser");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    return user?._id || user?.id || null;
                } catch (e) {}
            }
            return null;
        },
        getScopedKey(key, userId = null) {
            const uid = userId || this.getActiveUserId();
            return uid ? `${key}_${uid}` : key;
        },
        getScopedItem(key, userId = null) {
            const scopedKey = this.getScopedKey(key, userId);
            return mockStorage.getItem(scopedKey);
        },
        setScopedItem(key, value, userId = null) {
            const scopedKey = this.getScopedKey(key, userId);
            const valStr = typeof value === "string" ? value : JSON.stringify(value);
            mockStorage.setItem(scopedKey, valStr);
        },
        removeScopedItem(key, userId = null) {
            const scopedKey = this.getScopedKey(key, userId);
            mockStorage.removeItem(scopedKey);
        }
    };
}

async function runPhase2DTests() {
    console.log("==================================================");
    console.log("    STARTING PHASE 2D TIMER ISOLATION TESTS       ");
    console.log("==================================================");

    const userA_Id = new mongoose.Types.ObjectId("660000000000000000000001");
    const userB_Id = new mongoose.Types.ObjectId("660000000000000000000002");
    const branchId1 = new mongoose.Types.ObjectId("660000000000000000000010");
    const branchId2 = new mongoose.Types.ObjectId("660000000000000000000011");
    const taskIdA = new mongoose.Types.ObjectId("660000000000000000000101");
    const sessionIdA = new mongoose.Types.ObjectId("660000000000000000000201");

    const mockStorage = new MockLocalStorage();
    const userStorage = createUserStorage(mockStorage);

    // -------------------------------------------------------------
    // TEST A: Browser Account Switching (User A -> Logout -> User B)
    // -------------------------------------------------------------
    console.log("\n--- TEST A: Browser Account Switching Isolation ---");
    {
        // 1. User A logs in
        mockStorage.setItem("currentUser", JSON.stringify({ _id: userA_Id.toString(), email: "userA@sarthi.com" }));
        mockStorage.setItem("accessToken", "tokenA");

        // 2. User A starts timer bound to Task A
        const timerStateA = {
            timeLeft: 1200,
            isActive: true,
            startTime: new Date().toISOString(),
            accumulatedTime: 300,
            selectedDuration: 25
        };
        const bindingA = {
            taskId: taskIdA.toString(),
            taskName: "DSA Problem 1",
            taskIdString: "DSA-1"
        };
        userStorage.setScopedItem("focus_timer_state", timerStateA);
        userStorage.setScopedItem("focus_timer_task_binding", bindingA);

        // Verify User A stored with scoped key
        if (!mockStorage.getItem(`focus_timer_state_${userA_Id}`)) {
            throw new Error("Test A Failed: Timer state was not saved under userA scoped key");
        }

        // 3. User A logs out
        mockStorage.removeItem("accessToken");
        mockStorage.removeItem("refreshToken");
        mockStorage.removeItem("currentUser");
        mockStorage.removeItem("activeBranch");

        // 4. User B logs in
        mockStorage.setItem("currentUser", JSON.stringify({ _id: userB_Id.toString(), email: "userB@sarthi.com" }));
        mockStorage.setItem("accessToken", "tokenB");

        // 5. User B reads timer & binding
        const userB_timer = userStorage.getScopedItem("focus_timer_state");
        const userB_binding = userStorage.getScopedItem("focus_timer_task_binding");

        if (userB_timer !== null || userB_binding !== null) {
            throw new Error(`Test A Failed: User B leaked User A's timer state! Got timer=${userB_timer}, binding=${userB_binding}`);
        }
        console.log("✅ Test A Passed: User B login receives clean timer and zero User A execution state.");
    }

    // -------------------------------------------------------------
    // TEST B: User A Timer Restoration on Re-login
    // -------------------------------------------------------------
    console.log("\n--- TEST B: User A Legitimate State Restoration ---");
    {
        // 1. User B logs out
        mockStorage.removeItem("currentUser");
        mockStorage.removeItem("accessToken");

        // 2. User A logs back in
        mockStorage.setItem("currentUser", JSON.stringify({ _id: userA_Id.toString(), email: "userA@sarthi.com" }));
        mockStorage.setItem("accessToken", "tokenA_new");

        // 3. User A reads timer state
        const restoredTimer = JSON.parse(userStorage.getScopedItem("focus_timer_state"));
        const restoredBinding = JSON.parse(userStorage.getScopedItem("focus_timer_task_binding"));

        if (!restoredTimer || restoredTimer.selectedDuration !== 25 || restoredBinding.taskName !== "DSA Problem 1") {
            throw new Error(`Test B Failed: User A state was not properly restored! Got ${JSON.stringify(restoredTimer)}`);
        }
        console.log("✅ Test B Passed: User A re-login successfully restores User A's legitimate timer & task binding.");
    }

    // -------------------------------------------------------------
    // TEST C: Backend Ownership & Cross-User Protection
    // -------------------------------------------------------------
    console.log("\n--- TEST C: Backend FocusSession Ownership & Cross-User Protection ---");
    {
        const origFind = FocusSession.find;
        const origFindOneAndDelete = FocusSession.findOneAndDelete;

        const mockSessionsDb = [
            {
                _id: sessionIdA,
                user: userA_Id,
                duration: 25,
                task: taskIdA,
                taskName: "DSA Problem 1",
                branchId: branchId1
            }
        ];

        // User A reads sessions
        FocusSession.find = (query) => {
            const matches = mockSessionsDb.filter(s => 
                s.user.toString() === query.user.toString() &&
                s.branchId.toString() === query.branchId.toString()
            );
            return createQueryChain(matches);
        };

        const reqUserA = {
            user: { _id: userA_Id, id: userA_Id.toString() },
            branchId: branchId1.toString(),
            query: {}
        };
        const resUserA = createMockRes();
        await FocusController.getSessions(reqUserA, resUserA);
        await resUserA.promise;

        if (resUserA.data.data.length !== 1 || resUserA.data.data[0].taskName !== "DSA Problem 1") {
            throw new Error("Test C1 Failed: User A could not retrieve own session");
        }
        console.log("✅ Test C1 Passed: User A successfully retrieves own FocusSession.");

        // User B attempts to read User A's session in the same branch
        const reqUserB = {
            user: { _id: userB_Id, id: userB_Id.toString() },
            branchId: branchId1.toString(),
            query: { userId: userA_Id.toString() } // Client attempting ID injection
        };
        const resUserB = createMockRes();
        await FocusController.getSessions(reqUserB, resUserB);
        await resUserB.promise;

        if (resUserB.data.data.length !== 0) {
            throw new Error("Test C2 Failed: User B was able to read User A's FocusSession via ID injection!");
        }
        console.log("✅ Test C2 Passed: User B is blocked from reading User A's sessions (ID injection ignored).");

        // User B attempts to delete User A's session
        FocusSession.findOneAndDelete = (query) => {
            const index = mockSessionsDb.findIndex(s =>
                s._id.toString() === query._id.toString() &&
                s.user.toString() === query.user.toString()
            );
            if (index !== -1) {
                return Promise.resolve(mockSessionsDb.splice(index, 1)[0]);
            }
            return Promise.resolve(null);
        };

        const reqDeleteB = {
            params: { id: sessionIdA.toString() },
            user: { _id: userB_Id, id: userB_Id.toString() }
        };
        const resDeleteB = createMockRes();
        await FocusController.deleteSession(reqDeleteB, resDeleteB);
        await resDeleteB.promise;

        if (resDeleteB.statusCode !== 404 || mockSessionsDb.length !== 1) {
            throw new Error("Test C3 Failed: User B deleted User A's FocusSession!");
        }
        console.log("✅ Test C3 Passed: User B delete attempt on User A's session returns 404 and leaves session untouched.");

        FocusSession.find = origFind;
        FocusSession.findOneAndDelete = origFindOneAndDelete;
    }

    // -------------------------------------------------------------
    // TEST D: Branch Switching Non-Destruction
    // -------------------------------------------------------------
    console.log("\n--- TEST D: Branch Switching Non-Destruction ---");
    {
        // User A switches from Branch 1 to Branch 2
        mockStorage.setItem("activeBranch", JSON.stringify({ _id: branchId2.toString(), name: "DSA" }));

        // Check User A timer state
        const timerInBranch2 = userStorage.getScopedItem("focus_timer_state");
        const bindingInBranch2 = userStorage.getScopedItem("focus_timer_task_binding");

        if (!timerInBranch2 || !bindingInBranch2) {
            throw new Error("Test D Failed: Branch switch purged User A's timer execution state!");
        }

        // Switch back to Branch 1
        mockStorage.setItem("activeBranch", JSON.stringify({ _id: branchId1.toString(), name: "Software Development" }));
        const timerBackInBranch1 = userStorage.getScopedItem("focus_timer_state");
        if (!timerBackInBranch1) {
            throw new Error("Test D Failed: Timer missing after switching back to Branch 1");
        }
        console.log("✅ Test D Passed: Switching Active Branch preserves User A's personal execution state.");
    }

    console.log("\n==================================================");
    console.log("    ALL PHASE 2D TIMER ISOLATION TESTS PASSED (4/4)");
    console.log("==================================================");
}

runPhase2DTests().catch(err => {
    console.error("\n❌ Phase 2D Test Failure:", err);
    process.exit(1);
});
