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

const MyTask = ({ viewMode, setViewMode, externalProjectId, externalMemberId, externalSearch, externalDateFilter }) => {
  const navigate = useNavigate();
  // State from original file
  const [selectedProject, setSelectedProject] = useState(externalProjectId || "");
  const [selectedMember, setSelectedMember] = useState(externalMemberId || "");
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [teamMember, setTeamMember] = useState([]);
  const [projectTasks, setProjectTasks] = useState(null);
  const { handleLoading } = useLoading();
  const [projects, setProjects] = useState([]);
  const [id, setId] = useState();
  const [tasks, setTasks] = useState([]);
  const { currentUser } = useSelector((state) => state.store);
  const isManager = currentUser?.userRole?.name === "projectmanager";
  
  const [isTesting, setIsTesting] = useState(false);
  const location = useLocation();
  const [updated, setUpdated] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const page = location.pathname.split("/")[1];
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get("projectId");
  const urlType = searchParams.get("type");
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

  // Sync external props
  useEffect(() => {
      setSelectedProject(externalProjectId || "");
      formik.setFieldValue("projectName", externalProjectId || "");
      
      // If project changes externally, fetch its tasks
      if (externalProjectId) {
         fetchProjectTasks(externalProjectId, selectedMember, milestoneId)
            .then(res => setProjectTasks(res.data?.data))
            .catch(err => console.error(err));
         
         // Also fetch milestones
          ProjectApi.getAllmileStones(externalProjectId).then(res => {
             setMilestones(res?.data?.data?.milestones || []);
          }).catch(err => console.error(err));
      } else if (!externalProjectId && !isTesting) {
          // If cleared, fetch all? Or let dashboard handle?
          // Dashboard handles "All Projects" by passing empty string.
          // We can fetch all tasks.
          fetchAllTasks();
      }

  }, [externalProjectId]);

  useEffect(() => {
      setSelectedMember(externalMemberId || "");
      formik.setFieldValue("memberId", externalMemberId || "");
      // Trigger fetch logic based on new member
      if (externalProjectId && externalMemberId) {
          fetchProjectTasks(externalProjectId, externalMemberId, milestoneId)
            .then(res => setProjectTasks(res.data?.data));
      } else if (externalMemberId) {
          fetchTasksByMember(externalMemberId, selectedProject)
            .then(res => setProjectTasks(res.data?.data));
      }
  }, [externalMemberId]);


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

  const fetchAllTasks = async () => {
    try {
      const res = await TaskApi.getAllTasks();
      setTasks(res.data?.data);
      if (!externalProjectId) setProjectTasks(res.data?.data);
    }
    catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
      if(!externalProjectId) fetchAllTasks();
  }, []);

  const { breadcrumbs, toastMessage } = config[page] || config["task"];

  useEffect(() => {
    setIsTesting(page === "testing");
    // if (isManager) toast.success(toastMessage); // Commenting out toast to reduce noise
  }, [page, isManager]);

  const handleReset = async () => {
    setSelectedMember("");
    setMilestoneId("");
    setSelectedProject("");
    setSelectedTaskType("");
    setMilestones([]);
    fetchAllTasks();
  }

  const fetchTasks = async () => {
    if (selectedProject && !milestoneId) {
      const filter = {
        projectId: selectedProject,
        ...(selectedMember && { assignee: selectedMember }),
      };
      try {
        const res = await TestApi.getAllTesting(filter);
        setTasks(res.data?.data);
        setProjectTasks(res.data?.data);
      } catch (err) {
        console.log(err);
      }
    }
  };

  useEffect(() => {
    if (updated) {
      fetchTasks();
      setUpdated(false);
    }
  }, [updated]);

  const handleClick = async (task) => {
    handleLoading(true);
    setId(task?._id);
    try {
      const res = await TaskApi.task(task?._id);
      setTasks(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const handleClickTesting = async (task) => {
    handleLoading(true);
    setId(task?._id);
    try {
      const res =
        selectedTaskType === "Test Case"
          ? await TestApi.testing(task?._id)
          : await TestApi.bugs(task?._id);
      setTasks(res.data?.data);
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
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetchProjectTasks(urlProjectId, selectedMember, milestoneId);
        setProjectTasks(res.data?.data);
      } catch (err) {
        console.error("Error fetching project tasks:", err);
      } finally {
        handleLoading(false);
      }
    };

    if (urlType && urlProjectId) {
      setSelectedTaskType(urlType);
      setSelectedProject(urlProjectId);

      const fetchTesting = async () => {
        const filter = { projectId: urlProjectId };
        if (selectedMember && selectedMember !== "all") {
          filter.assignee = selectedMember;
        }
        let res;
        if (urlType === "Test Case") {
          res = await TestApi.getAllTesting({ filter: { ...filter } });
        } else {
          res = await TestApi.getAllBugs({ filter });
        }
        setProjectTasks(res.data?.data);
      };

      fetchTesting();
    } else if (urlProjectId) {
      setSelectedProject(urlProjectId);
      formik.setFieldValue("projectName", urlProjectId);
      fetchProject();
    }
  }, []);


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
            task={tasks}
            id={id}
            setId={setId}
            setTask={setTasks}
            setUpdated={setUpdated}
          />
        ) : selectedTaskType === "Bug Reporting" ? (
          <BugReporting
            task={tasks}
            id={id}
            setId={setId}
            setTask={setTasks}
            setProjectTasks={setProjectTasks}
            selectedMember={selectedMember}
          />
        ) : (
          <CreateTask
            task={tasks}
            id={id}
            setId={setId}
            setTask={setTasks}
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
                        if (externalDateFilter) {
                            const now = moment().startOf('day');
                            filtered = filtered.filter(t => {
                                // Task might have startDate, endDate, or createdAt. We'll check if the current date filter overlaps with the task's active period.
                                // Or simply check if the task's startDate falls within the filter. Let's use startDate as primary.
                                const taskDateStr = t.startDate || t.taskStartDate || t.createdAt;
                                if (!taskDateStr) return true;
                                
                                const taskDate = moment(taskDateStr);
                                if (!taskDate.isValid()) return true;

                                if (externalDateFilter === 'today') {
                                    return taskDate.isSame(now, 'day');
                                }
                                if (externalDateFilter === 'week') {
                                    return taskDate.isSame(now, 'week');
                                }
                                if (externalDateFilter === 'month') {
                                    return taskDate.isSame(now, 'month');
                                }
                                return true;
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
                        if (externalDateFilter) {
                            const now = moment().startOf('day');
                            filtered = filtered.filter(t => {
                                const taskDateStr = t.startDate || t.taskStartDate || t.createdAt;
                                if (!taskDateStr) return true;
                                
                                const taskDate = moment(taskDateStr);
                                if (!taskDate.isValid()) return true;

                                if (externalDateFilter === 'today') {
                                    return taskDate.isSame(now, 'day');
                                }
                                if (externalDateFilter === 'week') {
                                    return taskDate.isSame(now, 'week');
                                }
                                if (externalDateFilter === 'month') {
                                    return taskDate.isSame(now, 'month');
                                }
                                return true;
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
                        if (externalDateFilter) {
                            const now = moment().startOf('day');
                            filtered = filtered.filter(t => {
                                const taskDateStr = t.startDate || t.taskStartDate || t.createdAt;
                                if (!taskDateStr) return true;
                                
                                const taskDate = moment(taskDateStr);
                                if (!taskDate.isValid()) return true;

                                if (externalDateFilter === 'today') {
                                    return taskDate.isSame(now, 'day');
                                }
                                if (externalDateFilter === 'week') {
                                    return taskDate.isSame(now, 'week');
                                }
                                if (externalDateFilter === 'month') {
                                    return taskDate.isSame(now, 'month');
                                }
                                return true;
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
