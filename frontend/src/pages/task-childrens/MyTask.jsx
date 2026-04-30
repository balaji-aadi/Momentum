import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import InputField from "../../components/InputField";
import Board from "./Board";
import { useFormik } from "formik";
import { useLoading } from "../../components/loader/LoaderContext";
import { ProjectApi } from "../../services/api/Project.api";
import { TaskApi } from "../../services/api/Task.api";
import CreateTask from "./CreateTask";
import { UserApi } from "../../services/api/user.api";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { TestApi } from "../../services/api/Test.api";
import TBoard from "../testing-childrens/Board";
import TestCaseManagement from "../testing-childrens/TestCaseManagement";
import BugReporting from "../testing-childrens/BugReportingPage";
import { MdFilterAltOff } from "react-icons/md";
import TaskTable from "../../components/tasks/TaskTable";
import moment from "moment";

const MyTask = ({ viewMode, setViewMode, externalProjectId, externalMemberId, externalSearch, externalSort, externalParentId, onEditStateChange, externalTasks, externalLoading }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get("projectId");
  const urlType = searchParams.get("type");

  // State from original file
  const [selectedProject, setSelectedProject] = useState(externalProjectId || urlProjectId || "");
  const [selectedMember, setSelectedMember] = useState(externalMemberId || "");
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [teamMember, setTeamMember] = useState([]);
  const [projectTasks, setProjectTasks] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { handleLoading } = useLoading();
  const [projects, setProjects] = useState([]);
  const [id, setId] = useState();
  const [tasks, setTasks] = useState([]);
  const [selectedTaskData, setSelectedTaskData] = useState(null);
  const { currentUser } = useSelector((state) => state.store);
  const isManager = currentUser?.userRole?.name === "projectmanager";
  
  const [isTesting, setIsTesting] = useState(false);
  const location = useLocation();
  const [updated, setUpdated] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const page = location.pathname.split("/")[1];
  const [milestoneId, setMilestoneId] = useState("");
  const [internalViewMode, setInternalViewMode] = useState('board');
  
  const currentViewMode = viewMode || internalViewMode;
  const currentSetViewMode = setViewMode || setInternalViewMode;

  // Formik for internal state if needed (kept from original)
  const initialValues = {
    projectName: "",
    memberId: "",
  };

  const formik = useFormik({
    initialValues,
    onSubmit: (values) => {
      console.log(values);
    },
  });

  // Consolidated reactive fetcher to prevent race conditions and redundant calls
  useEffect(() => {
    let isMounted = true;
    const currentProjectId = externalProjectId || selectedProject;
    const currentMemberId = externalMemberId || selectedMember;

    // Reset tasks when switching context to prevent data leak
    setProjectTasks(null);
    setTasks([]);

    const loadData = async () => {
        // Use tasks passed from Dashboard ONLY if they have been fetched (not null)
        if (externalTasks !== null && !milestoneId) {
            // Fail-safe: Filter external tasks to ensure they belong to the current project context
            const filteredTasks = currentProjectId 
                ? externalTasks.filter(t => {
                    const pId = typeof t.projectName === 'object' ? t.projectName?._id : t.projectName;
                    return pId === currentProjectId;
                })
                : externalTasks;
                
            setProjectTasks(filteredTasks);
            setTasks(filteredTasks);
            setIsInitialLoading(externalLoading);
            handleLoading(externalLoading);
            return;
        }

        // Show global loader during fetch
        handleLoading(true);
        
        try {
            if (currentProjectId) {
                // Fetch filtered project tasks
                const res = await fetchProjectTasks(currentProjectId, currentMemberId, milestoneId);
                if (isMounted) {
                    setProjectTasks(res.data?.data || []);
                    setTasks(res.data?.data || []);
                }
                
                // Fetch milestones
                const mRes = await ProjectApi.getAllmileStones(currentProjectId);
                if (isMounted) setMilestones(mRes?.data?.data?.milestones || []);
            } else {
                // Fetch all tasks if no project selected (Dashboard view)
                // Avoid fetching all tasks if we are in a project context but ID is briefly missing
                if (!currentProjectId && (externalProjectId || urlProjectId)) {
                    setTasks([]);
                    handleLoading(false);
                    return;
                }
            
                const res = await TaskApi.getAllTasks();
                if (isMounted) {
                    setTasks(res.data?.data || []);
                    setProjectTasks(res.data?.data || []);
                }
            }
        } catch (err) {
            console.error("Failed to fetch tasks in MyTask:", err);
            if (isMounted) {
                setProjectTasks([]);
                setTasks([]);
            }
        } finally {
            if (isMounted) {
                handleLoading(false);
                setIsInitialLoading(false);
            }
        }
    };

    loadData();

    return () => { isMounted = false; };
  }, [externalProjectId, externalMemberId, milestoneId, selectedTaskType, isTesting, updated, selectedProject, selectedMember, externalTasks, externalLoading]);

  // Sync internal selected states with external props for secondary UI components
  useEffect(() => {
    setSelectedProject(externalProjectId || urlProjectId || "");
    setSelectedMember(externalMemberId || "");
  }, [externalProjectId, externalMemberId, urlProjectId]);

  // Notify parent if we are editing
  useEffect(() => {
    if (typeof onEditStateChange === 'function') {
      onEditStateChange(!!id);
    }
  }, [id, onEditStateChange]);


  const config = {
    testing: {
      breadcrumbs: [{ label: "My Task", path: "/testing/my-task" }],
      toastMessage: "You are watching testers task section",
    },
    task: {
      breadcrumbs: [{ label: "My Task", path: "/" }],
      toastMessage: "You are watching developers task section",
    },
  };

  // Redundant initial fetch removed in favor of consolidated useEffect above

  const { breadcrumbs, toastMessage } = config[page] || config["task"];

  useEffect(() => {
    setIsTesting(page === "testing");
    // if (isManager) toast.success(toastMessage); // Commenting out toast to reduce noise
  }, [page, isManager]);

  const handleReset = () => {
    setSelectedMember("");
    setMilestoneId("");
    setSelectedProject("");
    // Clearing selectedProject will trigger the consolidated useEffect to fetch all tasks
    setMilestones([]);
  }



  const handleClick = async (task) => {
    handleLoading(true);
    setId(task?._id);
    setSelectedTaskData(null);
    try {
      const res = await TaskApi.task(task?._id);
      setSelectedTaskData(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const handleClickTesting = async (task) => {
    handleLoading(true);
    setId(task?._id);
    setSelectedTaskData(null);
    try {
      const res =
        selectedTaskType === "Test Case"
          ? await TestApi.testing(task?._id)
          : await TestApi.bugs(task?._id);
      setSelectedTaskData(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const handleTaskTypeChange = (e) => {
    const type = e.target.value;
    setSelectedTaskType(type);
    setSelectedMember("");
    setSelectedProject("");
    setMilestones([])
  };

  const taskTypeOptions = [
    { value: "Test Case", label: "Test Case" },
    { value: "Bug Reporting", label: "Bug Reporting" },
  ];

  const milestoneOptions = milestones.map((item) => {
    return { value: item._id, label: item.milestoneName };
  });

  // Initial Data Load (URL Params)
  // Redundant project fetch removed in favor of consolidated useEffect above


  const handleProjectChange = async (e) => {
      // Logic handled via props now, but if used internally:
      const pid = e.target.value;
      setSelectedProject(pid);
  }

  const fetchProjectTasks = (projectId, assignee, milestoneId) => {
    const filter = { projectId, ...(assignee && { assignee }) };
    const filter2 = milestoneId && { projectId, ...(assignee && { assignee }), "milestone": milestoneId };

    if (!isTesting && !milestoneId) {
      return TaskApi.getAllTasks({
        filter: { projectName: projectId, ...(assignee && { assignee }) },
      });
    }

    if (!isTesting && milestoneId) {
      return TaskApi.getAllTasks({
        filter: { projectName: projectId, ...(assignee && { assignee }), "milestone": milestoneId },
      });
    }

    return selectedTaskType === "Test Case"
      ? TestApi.getAllTesting({
        filter: milestoneId ? filter2 : filter
      })
      : TestApi.getAllBugs({ filter: milestoneId ? filter2 : filter });
  };

  const handleMilestoneChange = async (e) => {
    const mId = e.target.value
    setMilestoneId(mId)
    try {
      const res = await fetchProjectTasks(selectedProject, selectedMember !== "all" ? selectedMember : null, mId)
      setProjectTasks(res.data?.data);
    }
    catch (err) {
      console.log(err)
    }
  }

  const fetchTasksByMember = (memberId, projectName) => {
    const filter =
      memberId === "all" && !milestoneId
        ? { projectName }
        : memberId === "all"
          ? { projectName, "milestone": milestoneId }
          : milestoneId
            ? { projectName, assignee: memberId, "milestone": milestoneId }
            : { projectName, assignee: memberId };

    if (!isTesting) {
      return TaskApi.getAllTasks({ filter });
    }

    return selectedTaskType === "Test Case"
      ? TestApi.getAllTesting({
        filter: {
          projectId: projectName,
          ...(memberId !== "all" && { assignee: memberId }),
        },
      })
      : TestApi.getAllBugs({
        filter: {
          projectId: projectName,
          ...(memberId !== "all" && { assignee: memberId }),
        },
      });
  };

  return (
    <>
      {id ? (
        selectedTaskType === "Test Case" ? (
          <TestCaseManagement
            task={selectedTaskData}
            id={id}
            setId={setId}
            setTask={setSelectedTaskData}
            setUpdated={setUpdated}
          />
        ) : selectedTaskType === "Bug Reporting" ? (
          <BugReporting
            task={selectedTaskData}
            id={id}
            setId={setId}
            setTask={setSelectedTaskData}
            setProjectTasks={setProjectTasks}
            selectedMember={selectedMember}
          />
        ) : (
          <CreateTask
            task={selectedTaskData}
            id={id}
            setId={setId}
            setTask={setSelectedTaskData}
            setProjectTasks={setProjectTasks}
            selectedMember={selectedMember}
            milestoneId={milestoneId}
            setTaskProject={setSelectedProject}
          />
        )
      ) : (
        <div className="h-full flex flex-col bg-bgLight overflow-hidden">
          {/* Sub-Toolbar for Testing/Milestones Only */}
          {(isTesting || milestones.length > 0) && (
              <div className="px-6 py-2 flex items-center gap-3 bg-surface border-b border-borderLight">
                  {isTesting && (
                    <div className="w-48">
                        <InputField
                        label=""
                        name="taskType"
                        type="select"
                        value={selectedTaskType}
                        onChange={handleTaskTypeChange}
                        options={taskTypeOptions}
                        placeholder="Task Type"
                        />
                    </div>
                  )}

                  {selectedTaskType !== "Bug Reporting" && milestones.length > 0 && (
                    <div className="w-48">
                        <InputField
                        label=""
                        name="milestone"
                        type="select"
                        value={milestoneId}
                        onChange={handleMilestoneChange}
                        options={milestoneOptions}
                        placeholder="Select Milestone"
                        />
                    </div>
                  )}
                  
                  <div 
                    className="p-2 rounded-lg hover:bg-slate-100 text-textSub hover:text-primary transition-colors cursor-pointer" 
                    onClick={handleReset}
                    title="Clear Filters"
                  >
                    <MdFilterAltOff className="text-xl" />
                  </div>

                  {/* View Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg ml-auto">
                      {['board', 'spreadsheet', 'timeline'].map(view => (
                          <button
                              key={view}
                              onClick={() => currentSetViewMode(view)}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${currentViewMode === view ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                              {view}
                          </button>
                      ))}
                  </div>
              </div>
          )}

          {/* Board Content */}
          <div className={`flex-1 ${currentViewMode === 'board' ? 'p-2 sm:p-4' : 'p-6'} ${currentViewMode === 'spreadsheet' ? 'overflow-x-auto' : 'flex flex-col min-h-0'}`}>
             {currentViewMode === 'spreadsheet' ? (
                <TaskTable 
                    tasks={(() => {
                        let filtered = projectTasks || [];
                        if (externalSearch) filtered = filtered.filter(t => t.taskName?.toLowerCase().includes(externalSearch.toLowerCase()));
                        if (externalParentId) {
                            filtered = filtered.filter(t => t.parentTask?._id === externalParentId || t.parentTask === externalParentId);
                        }

                        if (externalSort) {
                            filtered = [...filtered].sort((a, b) => {
                                if (externalSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
                                if (externalSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
                                if (externalSort === 'deadlineSoon') {
                                    const dateA = new Date(a.taskDueDate || a.dueDate || '9999-12-31');
                                    const dateB = new Date(b.taskDueDate || b.dueDate || '9999-12-31');
                                    return dateA - dateB;
                                }
                                if (externalSort === 'deadlineLate') {
                                    const dateA = new Date(a.taskDueDate || a.dueDate || '1970-01-01');
                                    const dateB = new Date(b.taskDueDate || b.dueDate || '1970-01-01');
                                    return dateB - dateA;
                                }
                                return 0;
                            });
                        }
                        return filtered;
                    })()}
                    isLoading={false}
                    projects={projects}
                    members={teamMember}
                    selectedProject={selectedProject}
                    selectedMember={selectedMember}
                    onProjectChange={(id) => setSelectedProject(id)}
                    onMemberChange={(id) => setSelectedMember(id)}
                />
             ) : projectTasks ? (
               isTesting ? (
                 <TBoard
                   tasks={(() => {
                        let filtered = projectTasks || [];
                        if (externalSearch) filtered = filtered.filter(t => t.taskName?.toLowerCase().includes(externalSearch.toLowerCase()));
                        if (externalParentId) {
                            filtered = filtered.filter(t => t.parentTask?._id === externalParentId || t.parentTask === externalParentId);
                        }

                        if (externalSort) {
                            filtered = [...filtered].sort((a, b) => {
                                if (externalSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
                                if (externalSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
                                if (externalSort === 'deadlineSoon') {
                                    const dateA = new Date(a.taskDueDate || a.dueDate || '9999-12-31');
                                    const dateB = new Date(b.taskDueDate || b.dueDate || '9999-12-31');
                                    return dateA - dateB;
                                }
                                if (externalSort === 'deadlineLate') {
                                    const dateA = new Date(a.taskDueDate || a.dueDate || '1970-01-01');
                                    const dateB = new Date(b.taskDueDate || b.dueDate || '1970-01-01');
                                    return dateB - dateA;
                                }
                                return 0;
                            });
                        }
                        return filtered;
                   })()}
                   setTasks={setProjectTasks}
                   selectedProject={selectedProject}
                   handleClick={handleClickTesting}
                   selectedMember={selectedMember}
                   selectedTaskType={selectedTaskType}
                   milestoneId={milestoneId}
                 />
               ) : (
                 <Board
                   tasks={(() => {
                        let filtered = projectTasks || [];
                        if (externalSearch) filtered = filtered.filter(t => t.taskName?.toLowerCase().includes(externalSearch.toLowerCase()));
                        if (externalParentId) {
                            filtered = filtered.filter(t => t.parentTask?._id === externalParentId || t.parentTask === externalParentId);
                        }

                        if (externalSort) {
                            filtered = [...filtered].sort((a, b) => {
                                if (externalSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
                                if (externalSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
                                if (externalSort === 'deadlineSoon') {
                                    const dateA = new Date(a.taskDueDate || a.dueDate || '9999-12-31');
                                    const dateB = new Date(b.taskDueDate || b.dueDate || '9999-12-31');
                                    return dateA - dateB;
                                }
                                if (externalSort === 'deadlineLate') {
                                    const dateA = new Date(a.taskDueDate || a.dueDate || '1970-01-01');
                                    const dateB = new Date(b.taskDueDate || b.dueDate || '1970-01-01');
                                    return dateB - dateA;
                                }
                                return 0;
                            });
                        }
                        return filtered;
                   })()}
                   setTasks={setProjectTasks}
                   selectedProject={selectedProject}
                   handleClick={handleClick}
                   selectedMember={selectedMember}
                   milestoneId={milestoneId}
                 />
               )
              ) : isInitialLoading ? (
                 <div className="flex flex-col items-center justify-center h-64 text-textSub opacity-0">
                   {/* Hidden to avoid double loading with global loader */}
                 </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-textSub">
                  <p className="text-lg font-medium">No tasks available for this project.</p>
                  <button onClick={handleReset} className="text-primary hover:underline mt-2">Clear filters</button>
                </div>
             )}
          </div>
        </div>
      )}
    </>
  );
};

export default MyTask;
