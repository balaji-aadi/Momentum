import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import InputField from "../../components/InputField";
import { taskValidationSchema } from "../../validationSchema";
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
  setTaskProject
}) => {
  const [selectedProject, setSelectedProject] = useState("");
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
    return {
      value: item?._id,
      label: `${item?.firstName} ${" "} ${item?.lastName} `,
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
             if (values.projectName) {
                navigate(`/task/dashboard?projectId=${values.projectName}`);
            } else {
                navigate(`/task/dashboard`);
            }
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
                
                // Robustly ensure parent task is in options if executing an edit
                if (task.parentTask) {
                   const parentId = task.parentTask._id || task.parentTask;
                   // If parent is not in options (e.g. unlisted/archived?), add it manually if we have details
                   const exists = potentialParents.some(p => p.value === parentId);
                   if (!exists && task.parentTask.taskName) {
                       potentialParents.push({ value: parentId, label: task.parentTask.taskName });
                   }

                   // Update state with potentially augmented options
                   setParentTaskOptions(potentialParents);

                   // Explicitly set parent task value again to be safe
                   setTimeout(() => formik.setFieldValue("parentTask", parentId), 100);
                } else {
                   setParentTaskOptions(potentialParents);
                }

             } catch(err) { console.log(err); }
          };
          fetchProjectTasksForOptions();
      }

      formik.setValues({
        projectName: pId,
        milestone: task.milestone?._id || task.milestone || "",
        sprint: task.sprint?._id || task.sprint || "", 
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

    } else if (locationState?.parentTask || locationState?.project) {
        console.log("CreateTask: Inheriting Context", locationState); 
        // Handle Pre-fill from Navigation (e.g. "Add Subtask" or "Add Task from Project")
        const prefillProject = locationState.project?._id || locationState.parentTask?.projectName || "";
        const prefillParent = locationState.parentTask?._id || "";

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

        formik.setValues({
            ...formik.initialValues, // Keep defaults
            projectName: prefillProject,
            parentTask: prefillParent,
        });
    }
  }, [task, location.state]);
  
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
    <main className="flex h-screen overflow-hidden">
      {" "}
      {/* update logic here */}
      <div
        className={`flex-1 p-6 dark:text-themeText overflow-y-auto pb-40 ${
          !selectedProject ? "h-[80vh]" : "h-[80vh]"
        }`}
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-themeText mb-8">
          {id ? "Update New Task" : "Create New Task"}
        </h2>

        <div className="mb-6">
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

        <form onSubmit={formik.handleSubmit}>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    {task?.attachments && typeof task.attachments === 'string' && !selectedFile && (
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
                    )}
                     {selectedFile && (
                        <div className="mt-2 text-sm text-green-600">
                            Selected: {selectedFile.name}
                        </div>
                    )}
                  </div>


                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <InputField
                    label="Parent Task (Optional)"
                    name="parentTask"
                    type="select"
                    value={formik.values.parentTask}
                    onChange={formik.handleChange}
                    options={parentTaskOptions}
                    onBlur={formik.handleBlur}
                    placeholder="Select Parent Task..."
                    error={formik.touched.parentTask && formik.errors.parentTask}
                  />

                </div>

                <InputField
                  label="Task Description"
                  name="taskDescription"
                  type="textarea"
                  value={formik.values.taskDescription}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Provide a brief description of the task..."
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Assignee"
                    name="assignee"
                    type="select"
                    value={formik.values.assignee}
                    onChange={formik.handleChange}
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
                  type="textarea"
                  value={formik.values.additionalNotes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter specific instructions or notes..."
                />
              </div>


            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              {id && (
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none"
                  onClick={handleClose}
                >
                  Close
                </button>
              )}
              <button
                type="button"
                onClick={() => formik.resetForm()}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none"
              >
                {id ? "Update" : "Create"} Task
              </button>
            </div>
          </form>
      </div>

      {id && <Logs task={task} type={"Task"} />}
    </main>
  );
};

export default CreateTask;
