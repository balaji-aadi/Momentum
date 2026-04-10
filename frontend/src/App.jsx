import React from "react";
import "./App.style.css";

import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import GlobalTopBar from "./components/layout/GlobalTopBar";
import { Toaster } from "react-hot-toast";
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
import ProtectedRoute, { PublicRoute } from "./ProtectedRoute";
import Forget from "./pages/auth/Forget";
import Verification from "./pages/auth/Verification";
import ResetPasswaord from "./pages/auth/ResetPassword";
import TaskBugs from "./pages/task-childrens/TaskBugs";
import MilestoneLists from "./pages/project-childrens/MilestoneLists";
import UserTypeMaster from "./pages/UserTypeMaster";
import PerformanceDashboard from "./pages/Analytics/PerformanceDashboard";
import DailyAccountability from "./pages/daily-accountability/DailyAccountability";

import ProjectList from "./pages/project-childrens/ProjectList";
import TeamList from "./pages/user-childrens/TeamList";
import ProjectLayout from "./components/layout/ProjectLayout";
import ProjectOverview from "./pages/project-childrens/ProjectOverview";
import Milestones from "./pages/project-childrens/Milestones";
import ProjectBoard from "./pages/project-childrens/ProjectBoard";
import Backlog from "./pages/project-childrens/Backlog";
import Sprints from "./pages/project-childrens/Sprints";
import Settings from "./pages/project-childrens/Settings";

function App() {
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
        {/* Athentication routes end here */}

        <Route path="/" element={<MainLayout />}>
          <Route
            path="/"
            element={<ProtectedRoute element={<Dashboard />} />}
          />

          {/* project routes start here */}
          <Route
            path="project"
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
            element={<ProtectedRoute element={<PerformanceDashboard />} />}
          />
          <Route
            path="daily-accountability"
            element={<ProtectedRoute element={<DailyAccountability />} />}
          />
        </Route>

        {/* Project Specific Routes (Separate Layout) */}
        <Route path="project/:projectId" element={<ProtectedRoute element={<ProjectLayout />} />}>
            <Route path="overview" element={<ProtectedRoute element={<ProjectOverview />} />} />
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
      <GlobalTopBar />
      <div className="flex-1 relative overflow-hidden">
        <Toaster
          containerStyle={{
            top: "4rem",
            zIndex: "9999999999999",
          }}
        />
        <RouterProvider router={router} />
      </div>
    </div>
  );
}

export default App;
