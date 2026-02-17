import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import InputField from "../../components/InputField";
import { taskValidationSchema } from "../../validationSchema";
import { MdLooksOne } from "react-icons/md";
import { PiNumberThreeFill, PiNumberTwoFill } from "react-icons/pi";
import { ProjectApi } from "../../services/api/Project.api";
import { useLoading } from "../../components/loader/LoaderContext";
import { TaskApi } from "../../services/api/Task.api";
import toast from "react-hot-toast";
import { UserApi } from "../../services/api/user.api";
import { useSelector } from "react-redux";
import Logs from "./Logs";
import Breadcrumbs from "../../components/Breadcrumbs";
import { CommonApi } from "../../services/api/Common.api";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate()
  const handleClose = () => {
    setId();
    setTask([]);
  };

  const breadcrumbs = [
    id
      ? { label: "My Task", handleClicked: handleClose }
      : { label: "My Task", path: "/task/dashboard" },
    id
      ? {
        label: "Update Task",
        path: "/task/dashboard",
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
        console.log(res.data);
        setProjectTasks(res.data?.data);
      } catch (err) {
        console.log(err);
      }
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
      attachments: null,
      additionalNotes: "",
      assignee: "",
      taskStartDate: "",
      taskDueDate: "",
      dependentTasks: [],
      dependencyType: "",
    },
    validationSchema: taskValidationSchema,
    onSubmit: async (values) => {
      handleLoading(true);
      console.log("Form Values:", values);
      const { milestone, ...restValues } = values;
      const payload = milestone ? { ...values } : { ...restValues };
      
      // Remove empty projectName to avoid ObjectId CastError
      if (!payload.projectName) {
        delete payload.projectName;
      }
      
      try {
        const res = id
          ? await TaskApi.updateTask(id, payload)
          : await TaskApi.createTask(payload);

        toast.success(
          id ? "Task updated successfully" : "Task created successfully"
        );

        setSelectedProject("");
        if (values.projectName) {
            navigate(`/task/dashboard?projectId=${values.projectName}`);
        } else {
            navigate(`/task/dashboard`);
        }
        formik.resetForm();

        if (id) {
          fetchTasks();
          handleClose();
        }

        if (selectedFile) {
          const fileFormData = new FormData();
          fileFormData.append("file", selectedFile);
          const fileRes = await CommonApi.uploadFile(fileFormData);
          console.log(fileRes.data?.data);
        }
      } catch (err) {
        console.log(err);
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

      setSelectedProject(task.projectName?._id || "");
      setSelectedProject(task.projectName?._id || "");
      if (typeof setTaskProject === "function") {
        setTaskProject(task.projectName?._id || "")
      }
      handleMilestone(task.projectName?._id)
      formik.setFieldValue("milestone", task.milestone)

      formik.setValues({
        projectName: task.projectName?._id || "",
        milestone: task.milestone || "",
        taskName: task.taskName || "",
        taskDescription: task.taskDescription || "",
        taskPriority: task.taskPriority || "",
        estimatedHours: task.estimatedHours || "",
        additionalNotes: task?.additionalNotes || "",
        taskType: task.taskType || "",
        attachments: task.attachments || null,
        assignee: task.assignee?._id || "",
        taskStartDate: formatDate(task.taskStartDate),
        taskDueDate: formatDate(task.taskDueDate),
        dependentTasks: task.dependentTasks || [],
        dependencyType: task.dependencyType || "",
      });

    }
  }, [task]);
  console.log("milestone data", formik.values.milestone)

  const handleProjectChange = async (e) => {
    setSelectedProject(e.target.value);
    const projectId = e.target.value;

    formik.setFieldValue("projectName", e.target.value);
    try {
      const milestones = await ProjectApi.getAllmileStones(projectId);
      setMilestones(milestones?.data?.data?.milestones)
    }
    catch (err) {
      console.log(err)
    }
  };

  const milestoneOptions = milestones.map((item) => {
    return { value: item?._id, label: item.milestoneName };
  });


  const handleFileChange = (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      formik.setFieldValue("attachments", file.name);
      setSelectedFile(file);
    }
  };

  return (
    <main className="flex">
      <div
        className={`w-full p-6 dark:text-themeText mb-10 ${!selectedProject ? "h-[100vh]" : ""
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
