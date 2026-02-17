import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import InputField from "../../components/InputField";
import Board from "./Board";
import { useFormik } from "formik";
import { useLoading } from "../../components/loader/LoaderContext";
import { ProjectApi } from "../../services/api/Project.api";
import { TaskApi } from "../../services/api/Task.api";
import { FaPlus } from "react-icons/fa6";
import CreateTask from "./CreateTask";
import { UserApi } from "../../services/api/user.api";
import { useSelector } from "react-redux";
import { CiViewList } from "react-icons/ci";
import Breadcrumbs from "../../components/Breadcrumbs";
import toast from "react-hot-toast";
import { TestApi } from "../../services/api/Test.api";
import TBoard from "../testing-childrens/Board";
import TestCaseManagement from "../testing-childrens/TestCaseManagement";
import BugReporting from "../testing-childrens/BugReportingPage";
import { MdFilterAltOff } from "react-icons/md";

const MyTask = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [teamMember, setTeamMember] = useState([]);
  const [projectTasks, setProjectTasks] = useState(null);
  const { handleLoading } = useLoading();
  const [projects, setProjects] = useState([]);
  const [id, setId] = useState();
  const [tasks, setTasks] = useState([]);
  const { currentUser } = useSelector((state) => state.store);
  const isManager = currentUser?.userRole?.name === "projectmanager";
  console.log("isManager>>>>", isManager)
  const [isTesting, setIsTesting] = useState(false);
  const location = useLocation();
  const [updated, setUpdated] = useState(false);
  const [milestones, setMilestones] = useState([])
  const page = location.pathname.split("/")[1];
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type");
  const [milestoneId, setMilestoneId] = useState("")


  const config = {
    testing: {
      breadcrumbs: [{ label: "My Task", path: "/testing/my-task" }],
      toastMessage: "You are watching testers task section",
    },
    task: {
      breadcrumbs: [{ label: "My Task", path: "/task/dashboard" }],
      toastMessage: "You are watching developers task section",
    },
  };

  const fetchAllTasks = async () => {
    try {
      const res = await TaskApi.getAllTasks();
      setTasks(res.data?.data);
      setProjectTasks(res.data?.data);
    }
    catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
      fetchAllTasks()
  }, [])

  const { breadcrumbs, toastMessage } = config[page] || config["task"];

  useEffect(() => {
    setIsTesting(page === "testing");
    if (isManager) toast.success(toastMessage);
  }, [page, isManager]);

  const handleNavigate = () => {
    navigate("/task/update-task");
  };

  const handleReset = async () => {
    setSelectedMember("");
    setMilestoneId("");
    setSelectedProject("")
    fetchAllTasks()
  }

  const fetchTasks = async () => {

    if (selectedProject && !milestoneId) {
      const filter = {
        projectId: selectedProject,
        ...(selectedMember && { assignee: selectedMember }),
      };
      try {
        const res = await TestApi.getAllTesting(filter);
        console.log(res.data);
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
      console.log(res.data);
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
      console.log(res.data);
      setTasks(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

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
      setTeamMember(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const projectOptions = projects.map((item) => {
    return { value: item._id, label: item.name };
  });

  const taskTypeOptions = [
    {
      value: "Test Case",
      label: "Test Case",
    },
    {
      value: "Bug Reporting",
      label: "Bug Reporting",
    },
  ];

  const handleTaskTypeChange = (e) => {
    const type = e.target.value;
    setSelectedTaskType(type);
    setSelectedMember("");
    setSelectedProject("");
    setMilestones([])
  };

  const teamMemberOptions = [
    { value: "all", label: "All" },
    ...teamMember.map((item) => ({
      value: item._id,
      label: `${item.firstName} ${item.lastName}`,
    })),
  ];

  const milestoneOptions = milestones.map((item) => {
    return { value: item._id, label: item.milestoneName };
  });

  useEffect(() => {
    handleProjectOption();
    handleTeamMemberOption();
  }, []);

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

  const handleCreateTask = () => {
    if (isTesting) {
      navigate("/testing/test-case-management");
    } else {
      navigate("/task/create-task");
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetchProjectTasks(projectId, selectedMember, milestoneId);
        setProjectTasks(res.data?.data);
      } catch (err) {
        console.error("Error fetching project tasks:", err);
      } finally {
        handleLoading(false);
      }
    };
    if (type && projectId) {
      setSelectedTaskType(type);
      setSelectedProject(projectId);

      const fetchTesting = async () => {
        const filter = { projectId };

        if (selectedMember && selectedMember !== "all") {
          filter.assignee = selectedMember;
        }

        let res;
        if (type === "Test Case") {
          res = await TestApi.getAllTesting({ filter: { ...filter } });
        } else {
          res = await TestApi.getAllBugs({ filter });
        }

        setProjectTasks(res.data?.data);
      };

      fetchTesting();
    } else if (projectId) {
      setSelectedProject(projectId);
      formik.setFieldValue("projectName", projectId);
      fetchProject();
    }
  }, []);

  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    formik.setFieldValue("projectName", projectId);

    if (!projectId) return;

    handleLoading(true);

    try {
      const res = await fetchProjectTasks(projectId, selectedMember, milestoneId);
      setProjectTasks(res.data?.data);
      const milestones = await ProjectApi.getAllmileStones(projectId);
      console.log(milestones?.data)
      setMilestones(milestones?.data?.data?.milestones)
    } catch (err) {
      console.error("Error fetching project tasks:", err);
    } finally {
      handleLoading(false);
    }
  };

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
        // filter: {
        //   projectId,
        //   ...(selectedMember !== "all" && assignee && { assignee: assignee }),
        // },
      })
      : TestApi.getAllBugs({ filter: milestoneId ? filter2 : filter });
  };

  const handleTeamMemberChange = async (e) => {
    const memberId = e.target.value;

    setSelectedMember(memberId);
    formik.setFieldValue("memberId", memberId);

    if (!memberId) return;

    handleLoading(true);

    try {
      const res = await fetchTasksByMember(memberId, selectedProject);
      setProjectTasks(res.data?.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      handleLoading(false);
    }
  };

  const handleMilestoneChange = async (e) => {
    const milestoneId = e.target.value
    setMilestoneId(milestoneId)
    try {
      const res = await fetchProjectTasks(selectedProject, selectedMember !== "all" ? selectedMember : null, milestoneId)
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
        <div className="dark:bg-themeBG dark:text-themeText min-h-screen p-6">
          <Breadcrumbs breadcrumbs={breadcrumbs} />
          <header className="flex justify-between items-center mb-5 border-b-2 pb-4 dark:bg-themeBG dark:text-themeText">
            <h1 className="text-2xl font-bold uppercase">
              {selectedProject
                ? projects.find((project) => project.value === selectedProject)
                  ?.label
                : "All Projects"}
            </h1>
            <div className="flex items-center space-x-4 gap-3">

              <div className="flex items-center mt-4 cursor-pointer" onClick={handleReset}>
                <MdFilterAltOff title="Remove filter" className="text-2xl text-gray-800 dark:text-themeText" />
              </div>

              {!isTesting && (
                <button className="flex items-center mt-4" title="list view">
                  <CiViewList
                    className="text-4xl text-gray-800 dark:text-themeText"
                    onClick={handleNavigate}
                  />
                </button>
              )}
              {isTesting && (
                <InputField
                  label="Task Type"
                  name="taskType"
                  type="select"
                  value={selectedTaskType}
                  onChange={handleTaskTypeChange}
                  options={taskTypeOptions}
                  isRequired
                />
              )}

              {selectedTaskType !== "Bug Reporting" && milestones.length > 0 &&
                <InputField
                  label="Select Milestone"
                  name="milestone"
                  type="select"
                  value={milestoneId}
                  onChange={handleMilestoneChange}
                  style={"min-w-72"}
                  options={milestoneOptions}

                />}

              {isTesting ? (
                selectedTaskType ? (
                  <>
                    {isManager && selectedProject && (
                      <InputField
                        label="Team member"
                        name="teamMember"
                        type="select"
                        value={selectedMember}
                        onChange={handleTeamMemberChange}
                        options={teamMemberOptions}
                        style={"min-w-72"}
                        isRequired
                      />
                    )}
                    <InputField
                      label="Project"
                      name="projectName"
                      type="select"
                      value={selectedProject}
                      onChange={handleProjectChange}
                      options={projectOptions}
                      style={"min-w-72"}
                    />
                  </>
                ) : null
              ) : (
                <>
                  {isManager && selectedProject && (
                    <InputField
                      label="Select Team member"
                      name="teamMember"
                      type="select"
                      value={selectedMember}
                      onChange={handleTeamMemberChange}
                      options={teamMemberOptions}
                      style={"min-w-72"}
                      isRequired
                    />
                  )}
                  <InputField
                    label="Select Project"
                    name="projectName"
                    type="select"
                    value={selectedProject}
                    onChange={handleProjectChange}
                    options={projectOptions}
                    style={"min-w-72"}
                  />
                </>
              )}
              <button
                className={`${isManager ? 'bg-blue-500' : 'bg-blue-300'}  text-white px-4 py-2 rounded-lg font-semibold -mb-4 flex items-center gap-2`}
                onClick={handleCreateTask}
                disabled={!isManager}
              >
                Create Task
                <FaPlus />
              </button>
            </div>
          </header>

          <div className="mb-6 ">
            {projectTasks ? (
              isTesting ? (
                <TBoard
                  tasks={projectTasks}
                  setTasks={setProjectTasks}
                  selectedProject={selectedProject}
                  handleClick={handleClickTesting}
                  selectedMember={selectedMember}
                  selectedTaskType={selectedTaskType}
                  milestoneId={milestoneId}
                />
              ) : (
                <Board
                  tasks={projectTasks}
                  setTasks={setProjectTasks}
                  selectedProject={selectedProject}
                  handleClick={handleClick}
                  selectedMember={selectedMember}
                  milestoneId={milestoneId}
                />
              )
            ) : (
              <div>No tasks available for this project.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MyTask;
