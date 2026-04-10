import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import InputField from "../../components/InputField";
import { taskValidationSchema } from "../../validationSchema";
import moment from "moment";
import { MdLooksOne } from "react-icons/md";
import { PiNumberThreeFill, PiNumberTwoFill } from "react-icons/pi";
import { ProjectApi } from "../../services/api/Project.api";
import { useLoading } from "../../components/loader/LoaderContext";
import { TaskApi } from "../../services/api/Task.api";
import { SprintApi } from "../../services/api/Sprint.api"; // Imported SprintApi
import toast from "react-hot-toast";
import { UserApi } from "../../services/api/user.api";
import { useSelector } from "react-redux";
import Logs from "./Logs";
import Breadcrumbs from "../../components/Breadcrumbs";
import { CommonApi } from "../../services/api/Common.api";
import { useNavigate, useLocation } from "react-router-dom";
import ConfirmationModal from "../../components/ConfirmationModal";

// expose moment globally for legacy scripts/components that expect it
window.moment = moment; // Polyfill for any loose scripts/components

const dependencyTypes = [
  { value: "Finish-to-Start", label: "Finish-to-Start" },
  { value: "Start-to-Start", label: "Start-to-Start" },
  { value: "Finish-to-Finish", label: "Finish-to-Finish" },
  { value: "Start-to-Finish", label: "Start-to-Finish" },
];

const CreateTask = ({
  task,
  id,
  setId,
  setTask,
  setProjectTasks,
  selectedMember,
  milestoneId,
  setTaskProject,
  modalMode = false,
}) => {
  const [selectedProject, setSelectedProject] = useState("");
  const [validProjectMembers, setValidProjectMembers] = useState([]); // Array of User IDs
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { handleLoading } = useLoading();
  const { currentUser } = useSelector((state) => state.store);
  const [manager, setManager] = useState(
    currentUser?.userRole?.name === "projectmanager" ? true : false
  );


  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state || {}; // { parentTask: { _id, name, projectId ... }, project: ... }
  const handleClose = () => {
    setId();
    setTask([]);
  };

  const breadcrumbs = [
    id
      ? { label: "My Task", handleClicked: handleClose }
      : { label: "My Task", path: "/" },
    id
      ? {
        label: "Update Task",
        path: "/",
      }
      : {
        label: "Create Task",
        path: "/task/create-task",
      },
  ];

  const [teamMembers, setTeamMembers] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([])
  const [sprints, setSprints] = useState([]); // State for sprints
  const [parentTaskOptions, setParentTaskOptions] = useState([]); // State for potential parent tasks

  const handleProjectOption = async () => {
    handleLoading(true);
    try {
      const res = await ProjectApi.getAllProjects();
      setProjects(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const [parentTaskData, setParentTaskData] = useState(null);

  const fetchParentTaskDetails = async (parentId) => {
    if (!parentId) {
      setParentTaskData(null);
      return;
    }
    try {
        const res = await TaskApi.getTaskById(parentId);
        setParentTaskData(res.data?.data || null);
    } catch (error) {
        console.error("Failed to fetch parent task details", error);
    }
  };

  const handleTeamMemberOption = async () => {
    handleLoading(true);
    try {
      const res = await UserApi.users();
      setTeamMembers(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const handleTaskList = async () => {
    handleLoading(true);
    try {
      const res = await TaskApi.getDependencies();
      setTasksList(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const projectOptions = projects.map((item) => {
    return { value: item._id, label: item.name };
  });

  const teamMemberOptions = teamMembers.map((item) => {
    // Check if user is in validProjectMembers OR is the project manager (if applicable, but PM is usually in teamMembers or handled separately)
    // Actually, let's strictly check validProjectMembers if project is selected.
    // If no project selected, all are valid (or invalid? usually project is required first).
    // Assuming if no project selected, we don't enforce yet, or we enforce when project selected.
    
    // Check if user is valid (exists in project team or is PM)
    // We'll need to check against the *currently selected project* details.
    // Since we store validProjectMembers IDs:
    const isMember = !selectedProject || validProjectMembers.includes(item._id);

    return {
      value: item?._id,
      label: `${item?.firstName} ${" "} ${item?.lastName} ${!isMember ? "(Not in Project)" : ""}`,
      isMember: isMember,
      // For visual styling, we might need to pass this data to InputField -> ReactSelect
      // React-Select uses `data` prop in styles.
    };
  });

  const tasksOptions = tasksList.map((item) => {
    return {
      value: item?._id,
      label: item?.taskName,
    };
  });

  useEffect(() => {
    handleProjectOption();
    handleTeamMemberOption();
    handleTaskList();
  }, []);

  // Effect to update validProjectMembers whenever project or projects list changes
  useEffect(() => {
    if (selectedProject && projects.length > 0) {
        const proj = projects.find(p => p._id === selectedProject);
        if (proj) {
            const members = new Set();
            if (proj.projectManager?._id) members.add(proj.projectManager._id);
            if (proj.projectManager && typeof proj.projectManager === 'string') members.add(proj.projectManager);
            
            proj.teamMembers?.forEach(m => {
                if (m._id) members.add(m._id);
                else members.add(m);
            });
            proj.rolesAndResponsibilities?.forEach(r => {
                 if (r.teamMember?._id) members.add(r.teamMember._id);
                 else if (r.teamMember) members.add(r.teamMember);
            });
            setValidProjectMembers(Array.from(members));
        }
    } else {
        setValidProjectMembers([]);
    }
  }, [selectedProject, projects]);

  const fetchTasks = async () => {
    if (selectedProject) {
      const filter = {
        projectName: selectedProject,
        ...(selectedMember && { assignee: selectedMember }),
        ...(milestoneId && { "milestone": milestoneId })
      };
      try {
        const res = await TaskApi.getAllTasks({ filter });
        console.log("Projects Tasks", res.data);
        setProjectTasks(res.data?.data);
        
        // Populate parent task options from project tasks
        // Filter out current task if editing to avoid circular dependency
        const potentialParents = res.data?.data.filter(t => t._id !== id).map(t => ({
            value: t._id,
            label: t.taskName
        }));
        setParentTaskOptions(potentialParents);

      } catch (err) {
        console.log(err);
      }
    }
  };
  
  // Fetch sprints when project changes
  const fetchSprints = async (projectId) => {
      if (!projectId) {
          setSprints([]);
          return;
      }
      try {
          const res = await SprintApi.getSprintsByProject(projectId);
          setSprints(res.data?.data || []);
      } catch (err) {
          console.log("Error fetching sprints", err);
          setSprints([]);
      }
  };

  const formik = useFormik({
    initialValues: {
      projectName: "",
      taskName: "",
      taskDescription: "",
      taskPriority: "",
      estimatedHours: "",
      taskType: "",
      milestone: "",
      sprint: "", // New Field
      parentTask: "", // New Field
      attachments: null,
      additionalNotes: "",
      assignee: "",
      taskStartDate: "",
      taskDueDate: "",
      dependentTasks: [],
      dependencyType: "",
      progress: 0,
    },
    validationSchema: taskValidationSchema,
    validate: (values) => {
        const errors = {};
        if (parentTaskData) {
            const start = values.taskStartDate ? new Date(values.taskStartDate) : null;
            const due = values.taskDueDate ? new Date(values.taskDueDate) : null;
            const pStart = parentTaskData.taskStartDate ? new Date(parentTaskData.taskStartDate) : null;
            const pDue = parentTaskData.taskDueDate ? new Date(parentTaskData.taskDueDate) : null;

            if (pStart && start && start < pStart) {
                errors.taskStartDate = `Cannot be before parent start date (${moment(pStart).format("ll")})`;
            }
            if (pDue && due && due > pDue) {
                errors.taskDueDate = `Cannot be after parent due date (${moment(pDue).format("ll")})`;
            }
        }
        
        if (values.sprint) {
            const selectedSprint = sprints.find(s => s._id === values.sprint);
            if (selectedSprint) {
                const sEnd = selectedSprint.endDate ? new Date(selectedSprint.endDate) : null;
                const due = values.taskDueDate ? new Date(values.taskDueDate) : null;
                if (sEnd && due && due > sEnd) {
                    errors.taskDueDate = `Cannot be after sprint end date (${moment(sEnd).format("ll")})`;
                }
            }
        }

        return errors;
    },
    onSubmit: async (values) => {
      handleLoading(true);
      console.log("Form Values:", values);
      const { milestone, sprint, parentTask, ...restValues } = values;
      
      // Construct payload dynamically
      const payload = { ...restValues };
      if (milestone) payload.milestone = milestone;
      if (sprint) payload.sprint = sprint;
      if (parentTask) payload.parentTask = parentTask;

      // Remove empty projectName to avoid ObjectId CastError
      if (!payload.projectName) {
        delete payload.projectName;
      }
      
      try {
        // Handle File Upload First
        if (selectedFile) {
            const fileFormData = new FormData();
            fileFormData.append("file", selectedFile);
            try {
                const fileRes = await CommonApi.uploadFile(fileFormData);
                console.log("File Upload Res:", fileRes.data);
                
                // Backend returns { filenames: ["file.png"] }
                const filename = fileRes.data?.data?.filenames?.[0]; 
                
                if (filename) {
                     // Construct full URL. 
                     // Assuming API base is logic from axiosConfig which usually proxies or is absolute.
                     // IMPORTANT: The backend `getFile` route expects just the filename if served via API.
                     // But if we want to store a full URL for the frontend to use in `href`, we need the full path.
                     // Let's assume relative path for now if the frontend appends base, OR full URL.
                     // Given the error 404 on `.../get-file/`, it seems the previous code wasn't appending filename.
                     
                     // We need the BASE_URL from axios config or env. 
                     // unique approach: store the relative path and let frontend component handle domain?
                     // Or store full URL. Let's try to construct a relative API path that the frontend can use.
                     // The previous error was `http://192.168.1.14:5003/api/v1/file/get-file/` (missing filename).
                     
                     // Let's hardcode the base for now based on the error screenshot domain, or better, use a relative path if possible.
                     // Actually, looking at the error `http://192.168.1.14:5003/api/v1/file/get-file/`, it seems `axios` might have been used with a full URL?
                     // No, the `href` in the anchor tag likely caused the browser to navigate there.
                     
                     // Let's store the full API URL.
                     const apiBase = "http://localhost:5003/api/v1"; // TODO: Should be from env
                     const fileUrl = `${apiBase}/file/get-file/${filename}`;
                     payload.attachments = fileUrl;
                }
            } catch (fileErr) {
                console.error("File upload failed", fileErr);
                toast.error("File upload failed, saving task without attachment.");
            }
        }

        const res = id
          ? await TaskApi.updateTask(id, payload)
          : await TaskApi.createTask(payload);

        toast.success(
          id ? "Task updated successfully" : "Task created successfully"
        );

        if (!id) {
            navigate(`/`);
        }
        formik.resetForm();
        setSelectedFile(null); 

        if (id) {
          fetchTasks(); // Refresh tasks
          handleClose();
        }

        // Removed potential duplicate upload code that was here before
        
      } catch (err) {
        console.log(err);
        toast.error(err.response?.data?.message || "An error occurred");
      }
      handleLoading(false);
    },
  });

  const handleMilestone = async (projectId) => {
    try {
      const milestones = await ProjectApi.getAllmileStones(projectId);
      setMilestones(milestones?.data?.data?.milestones)
    }
    catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (task) {
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      }

      const pId = task.projectName?._id || "";
      setSelectedProject(pId);
      
      if (typeof setTaskProject === "function") {
        setTaskProject(pId)
      }
      
      formik.setValues({
        projectName: pId,
        milestone: task.milestone?._id || task.milestone || "",
        sprint: task.sprint?._id || task.sprint || "", 
        // Set parentTask initially, but it might be reset if options aren't ready. 
        // The fetch logic below will handle robust setting.
        parentTask: task.parentTask?._id || task.parentTask || "", 
        taskName: task.taskName || "",
        taskDescription: task.taskDescription || "",
        taskPriority: task.taskPriority || "",
        estimatedHours: task.estimatedHours || "",
        progress: task.progress || 0,
        additionalNotes: task?.additionalNotes || "",
        taskType: task.taskType || "",
        attachments: task.attachments || "",
        assignee: task.assignee?._id || task.assignee || "",
        taskStartDate: formatDate(task.taskStartDate),
        taskDueDate: formatDate(task.taskDueDate),
        dependentTasks: task.dependentTasks || [],
        dependencyType: task.dependencyType || "",
      });
      
      if (pId) {
          handleMilestone(pId);
          fetchSprints(pId);
          // Fetch tasks for parent options
          const fetchProjectTasksForOptions = async () => {
             try {
                const res = await TaskApi.getAllTasks({ filter: { projectName: pId } });
                const potentialParents = res.data?.data.filter(t => t._id !== task._id).map(t => ({
                    value: t._id,
                    label: t.taskName
                }));
                
                console.log("DEBUG: task.parentTask", task.parentTask);
                console.log("DEBUG: potentialParents", potentialParents);

                // Robustly ensure parent task is in options if executing an edit
                if (task.parentTask) {
                   const parentId = task.parentTask._id || task.parentTask;
                   console.log("DEBUG: parentId extracted", parentId);
                   
                   // If parent is not in options (e.g. unlisted/archived?), add it manually if we have details
                   const exists = potentialParents.some(p => p.value === parentId);
                   console.log("DEBUG: exists in options?", exists);

                   if (!exists && task.parentTask.taskName) {
                       potentialParents.push({ value: parentId, label: task.parentTask.taskName });
                   }

                   // Update state options
                   setParentTaskOptions(potentialParents);

                   // Explicitly set value AFTER options are updated.
                   // Using setTimeout to allow React to process state update (rendering options)
                   setTimeout(() => {
                        console.log("DEBUG: Setting parentTask to", parentId);
                        formik.setFieldValue("parentTask", parentId);
                   }, 0);
                } else {
                   setParentTaskOptions(potentialParents);
                }

             } catch(err) { console.log(err); }
          };
          fetchProjectTasksForOptions();
      }

    } else if (locationState?.parentTask || locationState?.project || location.search) {
        console.log("CreateTask: Inheriting Context", locationState); 
        
        // Handle URL Params (e.g. from Sprint Board "Create Task" button)
        const params = new URLSearchParams(location.search);
        const urlProject = params.get("projectId");
        const urlSprint = params.get("sprintId");

        // Handle Pre-fill from Navigation state (e.g. "Add Subtask")
        const prefillProject = urlProject || locationState.project?._id || locationState.parentTask?.projectName || "";
        const prefillParent = locationState.parentTask?._id || "";
        const prefillSprint = urlSprint || "";

        if (prefillProject) {
            setSelectedProject(prefillProject);
            handleMilestone(prefillProject);
            fetchSprints(prefillProject);
            
             // Fetch tasks for parent options (async)
             const fetchProjectTasksForOptions = async () => {
                try {
                    const res = await TaskApi.getAllTasks({ filter: { projectName: prefillProject } });
                    const potentialParents = res.data?.data.map(t => ({
                        value: t._id,
                        label: t.taskName
                    }));
                    setParentTaskOptions(potentialParents);
                } catch(err) { console.log(err); }
             };
             fetchProjectTasksForOptions();
        }

        if (prefillParent) {
            fetchParentTaskDetails(prefillParent);
        }

        formik.setValues({
            ...formik.initialValues, // Keep defaults
            projectName: prefillProject,
            parentTask: prefillParent,
            sprint: prefillSprint,
        });
    } else if (!id) {
        // Autofill from last created task
        const fetchLastTask = async () => {
            try {
                const res = await TaskApi.getLastCreatedTask();
                const lastTask = res.data?.data;
                if (lastTask) {
                    const formatDate = (dateString) => {
                        if (!dateString) return "";
                        const date = new Date(dateString);
                        return date.toISOString().split("T")[0];
                    }

                    const pId = lastTask.projectName?._id || lastTask.projectName || "";
                    setSelectedProject(pId);
                    
                    formik.setValues({
                        ...formik.initialValues,
                        projectName: pId,
                        milestone: lastTask.milestone?._id || lastTask.milestone || "",
                        sprint: lastTask.sprint?._id || lastTask.sprint || "",
                        parentTask: lastTask.parentTask?._id || lastTask.parentTask || "",
                        estimatedHours: lastTask.estimatedHours || "",
                        assignee: lastTask.assignee?._id || lastTask.assignee || "",
                        taskStartDate: formatDate(lastTask.taskStartDate),
                        taskDueDate: formatDate(lastTask.taskDueDate),
                        taskPriority: lastTask.taskPriority || "",
                        taskType: lastTask.taskType || "",
                    });

                    if (pId) {
                        handleMilestone(pId);
                        fetchSprints(pId);
                        // Fetch Tasks for Parent Options
                        const resTasks = await TaskApi.getAllTasks({ filter: { projectName: pId } });
                        const potentialParents = resTasks.data?.data.map(t => ({
                            value: t._id,
                            label: t.taskName
                        }));
                        setParentTaskOptions(potentialParents);
                    }
                }
            } catch (err) {
                console.log("Error fetching last task for autofill", err);
            }
        };
        fetchLastTask();
    }
  }, [task, location.state, location.search, id]);
  
  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);

    formik.setFieldValue("projectName", projectId);
    
    // Reset dependent fields
    formik.setFieldValue("milestone", "");
    formik.setFieldValue("sprint", "");
    formik.setFieldValue("parentTask", "");
    
    try {
      if (projectId) {
          const milestones = await ProjectApi.getAllmileStones(projectId);
          setMilestones(milestones?.data?.data?.milestones);
          fetchSprints(projectId);
          
          // Fetch Tasks for Parent Options
          const res = await TaskApi.getAllTasks({ filter: { projectName: projectId } });
          const potentialParents = res.data?.data.map(t => ({
                value: t._id,
                label: t.taskName
          }));
          setParentTaskOptions(potentialParents);
      } else {
          setMilestones([]);
          setSprints([]);
          setParentTaskOptions([]);
      }
    }
    catch (err) {
      console.log(err)
    }
  };

  const handleAssigneeChange = (e) => {
      const selectedUserId = e.target.value;
      const selectedOption = teamMemberOptions.find(opt => opt.value === selectedUserId);

      if (selectedOption && !selectedOption.isMember && selectedProject) {
          setIsConfirmModalOpen(true);
          return;
      }

      // Proceed with normal change
      formik.handleChange(e);
  };

  const handleConfirmAddMember = () => {
      setIsConfirmModalOpen(false);
      navigate(`/project/${selectedProject}/settings`);
  };

  const milestoneOptions = milestones.map((item) => {
    return { value: item?._id, label: item.milestoneName };
  });
  
  const sprintOptions = sprints.map((item) => {
      return { value: item._id, label: `${item.name} (${item.status})` };
  });


  const handleFileChange = (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      formik.setFieldValue("attachments", file.name);
      setSelectedFile(file);
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      {/* update logic here */}
  <div className={`flex-1 p-6 dark:text-themeText overflow-y-auto pb-72 w-full`}>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <h2 className="text-3xl font-bold text-gray-800 dark:text-themeText mb-6 text-center md:text-left">
          {id ? "Update New Task" : "Create New Task"}
        </h2>

        <div className={`max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6 items-start ${id ? 'h-[calc(100vh-40vh)] overflow-auto pr-[2rem]' : ''} `}>
          {/* Left: Form */}
          <div className="w-full md:flex-1">
            <div className="bg-white dark:bg-themeBG rounded-2xl shadow-md p-6">
              <div className="mb-6 w-full">
              <InputField
                label="Project"
                name="projectName"
                type="select"
                value={selectedProject}
                onChange={handleProjectChange}
                options={projectOptions}
                error={formik.touched.projectName && formik.errors.projectName}
              />
            </div>

            <form id="create-task-form" onSubmit={formik.handleSubmit} className="w-full">
            {/* Task Details Section */}
            <div className="space-y-6">
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="text-2xl font-semibold text-gray-700 dark:text-themeText">
                    Task Details
                  </h3>
                  <i>
                    <MdLooksOne className="text-3xl text-red-500" />
                  </i>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Task Name"
                    name="taskName"
                    type="text"
                    value={formik.values.taskName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter task name..."
                    error={formik.touched.taskName && formik.errors.taskName}
                    isRequired
                  />
                  <InputField
                    label="Estimated Hours"
                    name="estimatedHours"
                    type="number"
                    value={formik.values.estimatedHours}
                    onChange={formik.handleChange}
                    readOnly={!manager && id ? true : false}
                    onBlur={formik.handleBlur}
                    placeholder="Enter estimated hours..."
                    error={
                      formik.touched.estimatedHours &&
                      formik.errors.estimatedHours
                    }
                    isRequired
                  />
                  <InputField
                    label="Progress (%)"
                    name="progress"
                    type="number"
                    value={formik.values.progress}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    error={
                      formik.touched.progress &&
                      formik.errors.progress
                    }
                  />

                  <div className="mb-4">
                    <label className="block text-gray-700  dark:text-themeText font-medium mb-2">
                      Attachments
                    </label>
                    <input
                      type="file"
                      name="attachments"
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* Show Existing Attachment */}
                    {task?.attachments && Array.isArray(task.attachments) ? (
                        <div className="mt-2 text-sm flex flex-col gap-1">
                            {task.attachments.filter(f => f).map((fileUrl, i) => (
                                <div key={i} className="flex items-center gap-2">
                                     <span className="font-semibold text-gray-600 dark:text-gray-400">Current {i + 1}: </span>
                                     <a 
                                        href={fileUrl.startsWith('http') ? fileUrl : `${server}file/get-file/${fileUrl}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline break-all"
                                     >
                                        {fileUrl.split('/').pop() || `Attachment ${i + 1}`}
                                     </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        task?.attachments && typeof task.attachments === 'string' && !selectedFile && (
                            <div className="mt-2 text-sm">
                                <span className="font-semibold text-gray-600 dark:text-gray-400">Current: </span>
                                <a 
                                    href={task.attachments} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                >
                                    {task.attachments.split('/').pop() || "View Attachment"}
                                </a>
                            </div>
                        )
                    )}
                     {selectedFile && (
                        <div className="mt-2 text-sm text-green-600">
                            Selected: {selectedFile.name}
                        </div>
                    )}
                  </div>


                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Priority"
                    name="taskPriority"
                    type="select"
                    value={formik.values.taskPriority}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    options={[
                      { value: "high", label: "High" },
                      { value: "medium", label: "Medium" },
                      { value: "low", label: "Low" },
                    ]}
                    error={
                      formik.touched.taskPriority && formik.errors.taskPriority
                    }
                    isRequired
                  />

                  <InputField
                    label="Task Type"
                    name="taskType"
                    type="select"
                    value={formik.values.taskType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    options={[
                      { value: "Development", label: "Development" },
                      { value: "Testing", label: "Testing" },
                      { value: "Design", label: "Design" },
                      { value: "Documentation", label: "Documentation" },
                      { value: "Preparation", label: "Preparation" },
                      { value: "Other", label: "Other" },
                    ]}
                    error={formik.touched.taskType && formik.errors.taskType}
                    isRequired
                  />

                  <InputField
                    label="Select Milestone"
                    name="milestone"
                    type="select"
                    value={formik.values.milestone}
                    onChange={formik.handleChange}
                    options={milestoneOptions}
                    onBlur={formik.handleBlur}
                    placeholder="Select Milestone..."
                    error={
                      formik.touched.milestone && formik.errors.milestone
                    }

                  />
                  
                  {/* Sprint Selector */}
                  <InputField
                    label="Select Sprint"
                    name="sprint"
                    type="select"
                    value={formik.values.sprint}
                    onChange={formik.handleChange}
                    options={sprintOptions}
                    onBlur={formik.handleBlur}
                    placeholder="Select Sprint..."
                    error={formik.touched.sprint && formik.errors.sprint}
                  />

                  {/* Parent Task Selector */}
                  <div className="md:col-span-1">
                    <InputField
                        label="Parent Task (Optional)"
                        name="parentTask"
                        type="select"
                        value={formik.values.parentTask}
                        onChange={(e) => {
                            formik.handleChange(e);
                            fetchParentTaskDetails(e.target.value);
                        }}
                        options={parentTaskOptions}
                        onBlur={formik.handleBlur}
                        placeholder="Select Parent Task..."
                        error={formik.touched.parentTask && formik.errors.parentTask}
                    />
                    {parentTaskData && (
                        <div className="mt-1 flex flex-col gap-1 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg shadow-inner">
                            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Parent Constraints</p>
                            <div className="flex justify-between text-[11px] font-semibold text-textMain">
                                <span>Start: {moment(parentTaskData.taskStartDate).format("MMM DD, YYYY")}</span>
                                <span>Due: {moment(parentTaskData.taskDueDate).format("MMM DD, YYYY")}</span>
                            </div>
                        </div>
                    )}
                  </div>

                </div>

                <InputField
                  label="Task Description"
                  name="taskDescription"
                  type="quill"
                  value={formik.values.taskDescription}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Provide a detailed description of the task..."
                  error={
                    formik.touched.taskDescription &&
                    formik.errors.taskDescription
                  }
                  isRequired
                />

              </div>

              {/* Assignment Details Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-semibold text-gray-700 dark:text-themeText ">
                    Assignment Details
                  </h3>
                  <i>
                    <PiNumberTwoFill className="text-3xl text-red-500" />
                  </i>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Assignee"
                    name="assignee"
                    type="select"
                    value={formik.values.assignee}
                    onChange={handleAssigneeChange}
                    onBlur={formik.handleBlur}
                    options={teamMemberOptions}
                    error={formik.touched.assignee && formik.errors.assignee}
                    isRequired
                  />
                  <InputField
                    label="Task Start Date"
                    name="taskStartDate"
                    type="date"
                    value={formik.values.taskStartDate}
                    onChange={formik.handleChange}
                    readOnly={!manager && id ? true : false}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.taskStartDate &&
                      formik.errors.taskStartDate
                    }
                    isRequired
                  />
                  <InputField
                    label="Task Due Date"
                    name="taskDueDate"
                    type="date"
                    value={formik.values.taskDueDate}
                    onChange={formik.handleChange}
                    readOnly={!manager && id ? true : false}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.taskDueDate && formik.errors.taskDueDate
                    }
                    isRequired
                  />
                </div>
                <InputField
                  label="Additional Notes for Assignee"
                  name="additionalNotes"
                  type="quill"
                  value={formik.values.additionalNotes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter specific instructions or notes..."
                />
              </div>


            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
              {id && (
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none"
                  onClick={handleClose}
                >
                  Close
                </button>
              )}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => formik.resetForm()}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                >
                  {id ? "Update" : "Create"} Task
                </button>
              </div>
            </div>
            </form>
            </div>
          </div>

          {/* Right: Logs / Activity (sticky on desktop) */}
          <div className="w-full md:w-[36%] flex flex-col gap-4">
            <div className="bg-white dark:bg-themeBG rounded-2xl shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-700">Summary</h4>
                  <p className="text-[11px] text-slate-500">Quick task info</p>
                </div>
                <div className="text-sm font-black px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">{formik.values.progress}%</div>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <div className="text-[11px] text-slate-500 font-bold">Parent Task</div>
                  <div className="mt-1">{parentTaskData?.taskName || (formik.values.parentTask ? parentTaskOptions.find(p => p.value === formik.values.parentTask)?.label : '—')}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 font-bold">Milestone</div>
                  <div className="mt-1">{milestoneOptions.find(m => m.value === formik.values.milestone)?.label || '—'}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 font-bold">Sprint</div>
                  <div className="mt-1">{sprintOptions.find(s => s.value === formik.values.sprint)?.label || '—'}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 font-bold">Attachments</div>
                  <div className="mt-1 break-words">{selectedFile ? selectedFile.name : (
                      Array.isArray(task?.attachments) 
                          ? `${task.attachments.length} attachment(s)` 
                          : (task?.attachments && typeof task.attachments === 'string' ? task.attachments.split('/').pop() : 'No attachments')
                  )}</div>
                </div>
              </div>
            </div>

            {id && (
              <div
                className="sticky"
                style={{
                  top: modalMode ? '3.5rem' : '5rem',
                  maxHeight: modalMode ? 'calc(90vh - 10rem)' : 'calc(100vh - 12rem)',
                  overflow: 'auto',
                }}
              >
                <Logs task={task} type={"Task"} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile fixed action bar */}
      {!modalMode && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t shadow md:hidden">
        <div className="max-w-7xl mx-auto w-full flex justify-between">
          <button
            type="button"
            onClick={() => formik.resetForm()}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => document.getElementById('create-task-form')?.requestSubmit()}
            disabled={formik.isSubmitting}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {id ? "Update" : "Create"} Task
          </button>
        </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAddMember}
        title="Member Not in Project"
        message="This user is not a member of the selected project. Do you want to go to Project Settings to add them?"
        confirmText="Go to Settings"
      />
    </main>
  );
};

export default CreateTask;
