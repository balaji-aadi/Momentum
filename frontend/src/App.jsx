import React, { useEffect, useState } from "react";
import "./App.style.css";
import moment from "moment";
import { FocusApi } from "./services/api/Focus.api";
import { TaskApi } from "./services/api/Task.api";
import { IoTimeOutline } from "react-icons/io5";


import {
  Route,
  Navigate,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { Toaster, toast } from "react-hot-toast";
import CreateProject from "./pages/project-childrens/CreateProject";
import Project from "./pages/Project";
import Teams from "./pages/project-childrens/Teams";
import Tasks from "./pages/Tasks";
import MyTask from "./pages/task-childrens/MyTask";
import CreateTask from "./pages/task-childrens/CreateTask";
import UpdateTask from "./pages/task-childrens/UpdateTask";
import Dashboard from "./pages/Dashboard";
import Status from "./pages/project-childrens/Status";
import User from "./pages/User";
import CreateUser from "./pages/user-childrens/CreateUser";
import Profile from "./pages/Profile";
import TaskLogs from "./pages/task-childrens/TaskLogs";
import Notification from "./components/Notification";
import Testing from "./pages/Testing";
import TestCaseManagement from "./pages/testing-childrens/TestCaseManagement";
import BugReporting from "./pages/testing-childrens/BugReportingPage";
import TestingProgressOverview from "./pages/testing-childrens/Dashboard";
import TestLogUpdate from "./pages/testing-childrens/TestLogUpdates";
import MyTasks from "./pages/testing-childrens/MyTasks";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ZohoCallback from "./pages/auth/ZohoCallback";

// DSA Management imports
import ProblemList from "./pages/dsa-management/ProblemList";
import CreateProblem from "./pages/dsa-management/CreateProblem";
import CompanyManagement from "./pages/dsa-management/CompanyManagement";
import TopicManagement from "./pages/dsa-management/TopicManagement";
import PatternManagement from "./pages/dsa-management/PatternManagement";
import LanguageManagement from "./pages/dsa-management/LanguageManagement";
import ProtectedRoute, { PublicRoute } from "./ProtectedRoute";
import Forget from "./pages/auth/Forget";
import Verification from "./pages/auth/Verification";
import ResetPasswaord from "./pages/auth/ResetPassword";
import TaskBugs from "./pages/task-childrens/TaskBugs";
import MilestoneLists from "./pages/project-childrens/MilestoneLists";
import UserTypeMaster from "./pages/UserTypeMaster";
import PerformanceDashboard from "./pages/Analytics/PerformanceDashboard";
import DailyAccountability from "./pages/daily-accountability/DailyAccountability";
import FocusTimer from "./pages/focus-timer/FocusTimer";
import Revision from "./pages/task-childrens/Revision";
import SettingsGlobal from "./pages/SettingsGlobal";
import BranchDashboard from "./pages/BranchDashboard";
import PricingPage from "./pages/subscription/PricingPage";

import ProjectList from "./pages/project-childrens/ProjectList";
import TeamList from "./pages/user-childrens/TeamList";
import ProjectLayout from "./components/layout/ProjectLayout";
import ProjectOverview from "./pages/project-childrens/ProjectOverview";
import ProjectConsistencyPage from "./pages/project-childrens/ProjectConsistencyPage";
import Milestones from "./pages/project-childrens/Milestones";
import DsaProblemPage from "./pages/dsa/DsaProblemPage";

import ProjectBoard from "./pages/project-childrens/ProjectBoard";
import Backlog from "./pages/project-childrens/Backlog";
import Sprints from "./pages/project-childrens/Sprints";
import Settings from "./pages/project-childrens/Settings";

import { useDispatch, useSelector } from "react-redux";
import { BranchApi } from "./services/api/Branch.api";
import { setGlobalSettings } from "./store/slices/storeSlice";

function App() {
  const dispatch = useDispatch();
  const { currentUser, globalSettings } = useSelector((state) => state.store);
  const [showGlobalBacklogModal, setShowGlobalBacklogModal] = useState(false);
  const [expiredTaskData, setExpiredTaskData] = useState(null);
  const [backlogHoursInput, setBacklogHoursInput] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await BranchApi.getGlobalSettings();
        dispatch(setGlobalSettings(res.data?.data));
      } catch (e) {
        console.error("Failed to fetch global settings", e);
      }
    };
    fetchSettings();
  }, [dispatch]);

  // Global Background Focus Timer Watcher
  useEffect(() => {
    const handleBackgroundFocusCheck = async () => {
       // If we are already on the Focus Timer page, let it handle its own logic
       if (window.location.pathname === '/focus-timer') return;

       const timerStateStr = localStorage.getItem("focus_timer_state");
       const bindingObjStr = localStorage.getItem("focus_timer_task_binding");
       const activeBranchStr = localStorage.getItem("activeBranch");
       if (!timerStateStr || !bindingObjStr || !activeBranchStr) return;
       
       try {
           const timerState = JSON.parse(timerStateStr);
           const bindingObj = JSON.parse(bindingObjStr);
           if (bindingObj.isRevision) return; // Do not auto-complete revision tasks in background
           
           if (timerState.isActive && timerState.startTime) {
               const durationSetting = timerState.selectedDuration * 60;
               const startTimeMs = new Date(timerState.startTime).getTime();
               const nowMs = Date.now();
               const sessionSeconds = Math.floor((nowMs - startTimeMs) / 1000);
               const totalSpent = (timerState.accumulatedTime || 0) + sessionSeconds;
               
                if (totalSpent >= durationSetting) {
                    if (bindingObj.taskType === "AI Challenge") {
                        // AI Challenge Auto-extend:
                        // 1. Log the elapsed block (durationSetting minutes)
                        const actualDuration = Math.round(durationSetting / 60);
                        const start = moment(timerState.startTime);
                        const end = moment(nowMs);
                        
                        const sessionData = {
                            date: start.format("YYYY-MM-DD"),
                            startTime: start.toISOString(),
                            endTime: end.toISOString(),
                            duration: actualDuration,
                            type: "Focus",
                            task: bindingObj.taskId,
                            taskName: bindingObj.taskName,
                            taskIdString: bindingObj.taskIdString,
                            statusAtCompletion: "inprogress",
                            completionState: "incompleted",
                            estimatedTimeAtStart: timerState.selectedDuration,
                            isBacklog: false,
                            originalDueDate: bindingObj.dueDate
                        };
                        
                        await FocusApi.createSession(sessionData);
                        
                        // 2. Auto-extend: reset timer state to active, 20 minutes
                        const newTimerState = {
                            ...timerState,
                            timeLeft: 20 * 60,
                            isActive: true,
                            startTime: new Date().toISOString(),
                            accumulatedTime: 0,
                            selectedDuration: 20
                        };
                        localStorage.setItem("focus_timer_state", JSON.stringify(newTimerState));
                        toast.success("AI Challenge block completed. Automatically extended by 20 minutes.");
                        return;
                    }

                     // Expiration Reached completely in the background: Check auto-extensions
                     const extensions = timerState.autoExtensions || 0;
                     if (extensions < 2) {
                         const newTimerState = {
                             ...timerState,
                             selectedDuration: timerState.selectedDuration + 30,
                             autoExtensions: extensions + 1
                         };
                         localStorage.setItem("focus_timer_state", JSON.stringify(newTimerState));
                         toast.success("Background focus block ended. Automatically extended by 30 minutes.");
                         return;
                     }

                     // Expiration Reached completely in the background after extensions
                     const actualDuration = Math.max(Math.round(durationSetting / 60), 1);
                     const start = moment(timerState.startTime);
                     const end = moment(nowMs);
                     
                     const sessionData = {
                         date: start.format("YYYY-MM-DD"),
                         startTime: start.toISOString(),
                         endTime: end.toISOString(),
                         duration: actualDuration,
                         type: "Focus",
                         task: bindingObj.taskId,
                         taskName: bindingObj.taskName,
                         taskIdString: bindingObj.taskIdString,
                         statusAtCompletion: "backlog",
                         completionState: "incompleted",
                         estimatedTimeAtStart: timerState.selectedDuration
                     };
                     
                     await FocusApi.createSession(sessionData);
                     await TaskApi.taskLogs(bindingObj.taskId, { status: "backlog" });
                     
                     localStorage.removeItem("focus_timer_task_binding");
                     localStorage.removeItem("focus_timer_state");
                     localStorage.removeItem("focus_timer_retrievable");
                     
                     // setShowGlobalBacklogModal(true); // Disabled to prevent user disturbance
                 }
            }
        } catch (e) { console.error("Global timer monitor err", e); }
    };
    
    const interval = setInterval(handleBackgroundFocusCheck, 15000); // Check every 15s to be accurate
    return () => clearInterval(interval);
  }, []);

  const handleGlobalSubmitBacklog = async () => {
    if (!backlogHoursInput || isNaN(backlogHoursInput)) return;
    try {
      await TaskApi.updateTask(expiredTaskData.taskId, { backlogEstimatedHours: parseFloat(backlogHoursInput) });
      setShowGlobalBacklogModal(false);
      setExpiredTaskData(null);
      setBacklogHoursInput("");
    } catch(e) {
      console.error("Failed to save backlog estimate", e);
    }
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Athentication routes start here */}
        <Route
          path="/reset"
          element={<PublicRoute element={<ResetPasswaord />} />}
        />

        <Route path="/forget" element={<PublicRoute element={<Forget />} />} />

        <Route
          path="/verification"
          element={<PublicRoute element={<Verification />} />}
        />
        <Route path="/login" element={<PublicRoute element={<Login />} />} />
        <Route path="/register" element={<PublicRoute element={<Register />} />} />
        <Route path="/auth/zoho/callback" element={<PublicRoute element={<ZohoCallback />} />} />
        {/* Athentication routes end here */}

        <Route path="/" element={<MainLayout />}>
          <Route
            path="/"
            element={<ProtectedRoute element={<Dashboard />} />}
          />
          <Route
            path="/branch"
            element={<ProtectedRoute element={<BranchDashboard />} />}
          />
          <Route
            path="arena/dsa/problem/:problemId"
            element={<ProtectedRoute element={<DsaProblemPage />} />}
          />
          <Route
            path="arena/dsa/problem"
            element={<ProtectedRoute element={<DsaProblemPage />} />}
          />
          <Route
            path="arena/:slug"
            element={<ProtectedRoute element={<Dashboard />} />}
          />

          {/* project routes start here */}
          <Route
            path="arenas"
            element={<ProtectedRoute element={<Project />} />}
          >
            <Route index element={<ProtectedRoute element={<ProjectList />} />} />
            <Route
              path="create-project"
              element={<ProtectedRoute element={<CreateProject />} />}
            />

            <Route
              path="milestones"
              element={<ProtectedRoute element={<MilestoneLists />} />}
            />
            <Route
              path="team"
              element={<ProtectedRoute element={<Teams />} />}
            />
            <Route
              path="status"
              element={<ProtectedRoute element={<Status />} />}
            />
          </Route>
          {/* project routes end here */}

          {/* task routes start here */}
          <Route path="task" element={<ProtectedRoute element={<Tasks />} />}>
            <Route
              path="dashboard"
              element={<ProtectedRoute element={<MyTask />} />}
            />
            <Route
              path="create-task"
              element={<ProtectedRoute element={<CreateTask />} />}
            />
            <Route
              path="bug-dashboard"
              element={<ProtectedRoute element={<TaskBugs />} />}
            />
            <Route
              path="update-task"
              element={<ProtectedRoute element={<UpdateTask />} />}
            />
            <Route
              path="task-logs"
              element={<ProtectedRoute element={<TaskLogs />} />}
            />
          </Route>
          {/* task routes end here */}

          {/* user routes start here */}
          <Route path="user" element={<ProtectedRoute element={<User />} />}>
             <Route index element={<ProtectedRoute element={<TeamList />} />} />
            <Route
              path="create"
              element={<ProtectedRoute element={<CreateUser />} />}
            />
          </Route>
          {/* user routes end here */}

          {/* Testing routes start here */}
          <Route
            path="testing"
            element={<ProtectedRoute element={<Testing />} />}
          >
            <Route
              path="dashboard"
              element={<ProtectedRoute element={<TestingProgressOverview />} />}
            />
            <Route
              path="test-case-management"
              element={<ProtectedRoute element={<TestCaseManagement />} />}
            />
            <Route
              path="bug-reporting"
              element={<ProtectedRoute element={<BugReporting />} />}
            />
            <Route
              path="test-logs/:taskId"
              element={<ProtectedRoute element={<TestLogUpdate />} />}
            />
            <Route
              path="my-task"
              element={<ProtectedRoute element={<MyTasks />} />}
            />
          </Route>
          {/* Testing routes end here */}

          <Route
            path="user-type-master"
            element={<ProtectedRoute element={<UserTypeMaster />} />}
          />

          <Route
            path="profile"
            element={<ProtectedRoute element={<Profile />} />}
          />
          <Route
            path="notification"
            element={<ProtectedRoute element={<Notification />} />}
          />
          <Route
            path="performance"
            element={<Navigate to="/?view=analytics" replace />}
          />
          <Route
            path="daily-accountability"
            element={<ProtectedRoute element={<DailyAccountability />} />}
          />
          <Route
            path="focus-timer"
            element={<ProtectedRoute element={<FocusTimer />} />}
          />
          <Route
            path="revision"
            element={<ProtectedRoute element={<Revision />} />}
          />
          <Route
            path="settings"
            element={<ProtectedRoute element={<SettingsGlobal />} />}
          />
          {/* DSA Management routes */}
          <Route path="dsa-management">
            <Route path="problems" element={<ProtectedRoute element={<ProblemList />} />} />
            <Route path="create-problem" element={<ProtectedRoute element={<CreateProblem />} />} />
            <Route path="companies" element={<ProtectedRoute element={<CompanyManagement />} />} />
            <Route path="topics" element={<ProtectedRoute element={<TopicManagement />} />} />
            <Route path="patterns" element={<ProtectedRoute element={<PatternManagement />} />} />
            <Route path="languages" element={<ProtectedRoute element={<LanguageManagement />} />} />
          </Route>

          <Route
            path="pricing"
            element={currentUser?.email === "balajiaadi2000@gmail.com" ? <Dashboard /> : <ProtectedRoute element={<PricingPage />} />}
          />
        </Route>

        {/* Project Specific Routes (Separate Layout) */}
        <Route path="project/:projectId" element={<ProtectedRoute element={<ProjectLayout />} />}>
            <Route path="overview" element={<ProtectedRoute element={<ProjectOverview />} />} />
            <Route path="consistency" element={<ProtectedRoute element={<ProjectConsistencyPage />} />} />
            <Route path="milestones" element={<ProtectedRoute element={<Milestones />} />} />
            <Route path="board" element={<ProtectedRoute element={<ProjectBoard />} />} />
            <Route path="backlog" element={<ProtectedRoute element={<Backlog />} />} />
            <Route path="sprints" element={<ProtectedRoute element={<Sprints />} />} />
            <Route path="settings" element={<ProtectedRoute element={<Settings />} />} />
        </Route>

      </>
    )
  );
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-bgLight">
      <div className="flex-1 relative overflow-hidden">
        <Toaster
          containerStyle={{
            top: "4rem",
            zIndex: "9999999999999",
          }}
        />
        <RouterProvider router={router} />

        {/* Global Backlog Estimator Modal for Background Expiration */}
        {showGlobalBacklogModal && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-red-900/60 backdrop-blur-sm"></div>
             <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="flex items-center gap-3 text-rose-500">
                   <IoTimeOutline size={28} />
                   <h3 className="text-xl font-bold text-slate-800">Background Timer Completed!</h3>
                </div>
                <p className="text-slate-600 text-sm font-medium">Your global focus timer has fully elapsed for <strong className="text-slate-800">{expiredTaskData?.taskName}</strong>! The task has automatically been transitioned to the <strong>Backlog</strong>.</p>
                <p className="text-slate-600 text-sm font-medium mt-2">Please provide a new time estimate (in hours) to resume work on this item later.</p>
                
                <div className="mt-4">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">New Backlog Estimate (Hours)</label>
                   <input 
                      type="number" 
                      step="0.5" 
                      placeholder="e.g. 1.5"
                      value={backlogHoursInput}
                      onChange={(e) => setBacklogHoursInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                   />
                </div>

                <div className="flex items-center gap-3 mt-4 justify-end">
                  <button 
                    onClick={handleGlobalSubmitBacklog}
                    disabled={!backlogHoursInput}
                    className="w-full px-4 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 bg-rose-500 hover:bg-rose-600"
                  >
                    Submit Backlog Estimate
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
