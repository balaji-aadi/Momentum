import React, { useCallback, useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../components/InputField";
import { FiPaperclip } from "react-icons/fi";
import { Table } from "../../components/Table/Table";
import { useLoading } from "../../components/loader/LoaderContext";
import { ProjectApi } from "../../services/api/Project.api";
import { MdDelete } from "react-icons/md";
import { TestApi } from "../../services/api/Test.api";
import toast from "react-hot-toast";
import Breadcrumbs from "../../components/Breadcrumbs";
import { UserApi } from "../../services/api/user.api";
import Logs from "../task-childrens/Logs";
import { useNavigate } from "react-router-dom";

const TestCaseTable = React.memo(({ testCase, onDelete }) => {
  const columns = [
    {
      headerName: "S.No.",
      field: "sno",
      minWidth: 100,
      cellRenderer: (params) => {
        return params.node.rowIndex + 1;
      },
    },

    {
      headerName: "Description",
      field: "description",
    },
    {
      headerName: "Expected Outcome",
      field: "expectedOutcome",
    },
    {
      headerName: "Actions",
      field: "actions",
      cellRenderer: (params) => (
        <>
          <button
            className="px-4 text-red-500 hover:text-red-700 rounded cursor-pointer"
            onClick={() => onDelete(params.node.rowIndex)}
          >
            <MdDelete />
          </button>
        </>
      ),
    },
  ];

  return (
    <Table
      column={columns}
      internalRowData={testCase}
      searchLabel="Search Test Cases"
      isExport={false}
    />
  );
});

const TestCaseManagement = ({ task, id, setId, setTask, setUpdated }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([])
  const { handleLoading } = useLoading();
  const navigate = useNavigate()

  const handleClose = () => {
    setId();
    setTask([]);
  };

  const breadcrumbs = [
    id
      ? { label: "My Task", handleClicked: handleClose }
      : { label: "My Task", path: "/testing/my-task" },
    id
      ? {
        label: "Test Case Management",
        path: "/testing/my-task",
      }
      : {
        label: "Test Case Management",
        path: "/testing/test-case-management",
      },
  ];

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

  const teamMemberOptions = teamMembers.map((item) => {
    return {
      value: item?._id,
      label: `${item?.firstName} ${" "} ${item?.lastName} `,
    };
  });

  const projectOptions = projects.map((item) => {
    return { value: item._id, label: item.name };
  });

  useEffect(() => {
    handleProjectOption();
    handleTeamMemberOption();
  }, []);

  const formik = useFormik({
    initialValues: {
      projectId: "",
      testCaseName: "",
      milestone: "",
      testScenarioDescription: "",
      preconditions: "",
      assignee: "",
      testSteps: [],
      testStatus: "",
      attachImage: null,
    },
    validationSchema: Yup.object({
      testCaseName: Yup.string().required("Test case name is required"),
      testScenarioDescription: Yup.string().required(
        "Test scenario description is required"
      ),
      testStatus: Yup.string().required("Test status is required"),
    }),
    onSubmit: async (values) => {
      handleLoading(true);

      const { description, expectedOutcome, ...payload } = values;
      try {
        const res = id
          ? await TestApi.updateTask(id, payload)
          : await TestApi.createTestcase(payload);
        console.log(res.data);
        toast.success(
          id
            ? "Test case updated successfully"
            : "Test case created successfully"
        );
        console.log(values);
        formik.resetForm();
        setSelectedProject("");
        setUpdated(true);
        navigate("/testing/my-task")
        if (id) {
          setId();
          setTask([]);
        }
      } catch (err) {
        console.log(err);
      }

      handleLoading(false);
    },
  });

  useEffect(() => {
    if (task) {
      setSelectedProject(task.projectId?._id || "");

      handleMilestone(task.projectId?._id)
      formik.setFieldValue("milestone", task.milestone)

      formik.setValues({
        projectId: task.projectId?._id || "",
        milestone: task.milestone || "",
        testCaseName: task.testCaseName || "",
        testScenarioDescription: task.testScenarioDescription || "",
        preconditions: task.preconditions || "",
        testStatus: task.testStatus || "",
        testSteps: task.testSteps || [],
        assignee: task.assignee?._id || "",
        // attachImage: task.image || null,
      });
    }
  }, [task]);

  const handleDeleteMilestone = useCallback(
    (index) => {
      const updatedTestCase = formik.values.testSteps.filter(
        (_, i) => i !== index
      );
      formik.setFieldValue("testSteps", updatedTestCase);
    },
    [formik]
  );

  const handleProjectChange = async (selectedOption) => {
    const project = selectedOption?.value;
    setSelectedProject(project);
    formik.setFieldValue("projectId", project);
    try {
      const milestones = await ProjectApi.getAllmileStones(project);
      setMilestones(milestones?.data?.data?.milestones)
    }
    catch (err) {
      console.log(err)
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAttachment(URL.createObjectURL(file));
    }
    formik.setFieldValue("attachImage", file);
  };

  const handleAddStep = useCallback(() => {
    const { description, expectedOutcome } = formik.values;
    if (description && expectedOutcome) {
      const newStep = {
        description,
        expectedOutcome,
      };
      formik.setFieldValue("testSteps", [...formik.values.testSteps, newStep]);
      formik.setFieldValue("description", "");
      formik.setFieldValue("expectedOutcome", "");
    }
  }, [formik]);

  const handleMilestone = async (projectId) => {
    try {
      const milestones = await ProjectApi.getAllmileStones(projectId);
      setMilestones(milestones?.data?.data?.milestones)
    }
    catch (err) {
      console.log(err)
    }
  }

  const milestoneOptions = milestones.map((item) => {
    return { value: item?._id, label: item.milestoneName };
  });

  return (
    <main className="flex">
      <div className="p-8 mb-20 w-full">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <h1 className="text-3xl dark:text-themeText font-bold mb-6">
          Test Case Management
        </h1>

        <div className="mb-6">
          <InputField
            label="Select Project"
            name="project"
            value={selectedProject}
            onChange={(e) => handleProjectChange(e.target)}
            type="select"
            options={projectOptions}
            placeholder="Select a project"
            isRequired
          />
        </div>

        {selectedProject && (
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <section className="h-[60vh] overflow-auto pr-5 ">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField
                  label="Test Case Name"
                  name="testCaseName"
                  type="text"
                  value={formik.values.testCaseName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.testCaseName && formik.errors.testCaseName
                  }
                  isRequired={true}
                />

                <InputField
                  label="Test Status"
                  name="testStatus"
                  type="select"
                  value={formik.values.testStatus}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  options={[
                    { value: "Not Executed", label: "Not Executed" },
                    { value: "Pass", label: "Pass" },
                    { value: "Fail", label: "Fail" },
                  ]}
                  error={formik.touched.testStatus && formik.errors.testStatus}
                  isRequired={true}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                label="Preconditions"
                name="preconditions"
                type="textarea"
                value={formik.values.preconditions}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />

              <InputField
                label="Test Scenario Description"
                name="testScenarioDescription"
                type="textarea"
                value={formik.values.testScenarioDescription}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.testScenarioDescription &&
                  formik.errors.testScenarioDescription
                }
                isRequired={true}
              />

              <div className="mb-4">
                <label
                  htmlFor="attachment"
                  className="block text-lg font-medium dark:text-themeText"
                >
                  Attach Image
                </label>
                <div className="mt-2 flex items-center space-x-4">
                  <label
                    htmlFor="attachment"
                    className="flex items-center space-x-2 bg-blue-600 text-white rounded-lg px-4 py-2 cursor-pointer hover:bg-blue-700"
                  >
                    <FiPaperclip size={20} />
                    <span>Upload Image</span>
                  </label>
                  <input
                    type="file"
                    id="attachment"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                {attachment && (
                  <div className="mt-4">
                    <img
                      src={attachment}
                      alt="Attachment Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Test Steps */}
              <div className="mb-4">
                <h2 className="text-2xl dark:text-themeText font-semibold py-8">
                  Add Test Steps
                </h2>
                <div className="space-y-4">
                  <InputField
                    label="Description"
                    name="description"
                    type="text"
                    value={formik.values.description || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <InputField
                    label="Expected Outcome"
                    name="expectedOutcome"
                    type="text"
                    value={formik.values.expectedOutcome || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Add Step
                </button>

                <div className="mt-4 -ml-2">
                  <TestCaseTable
                    testCase={formik.values.testSteps}
                    onDelete={handleDeleteMilestone}
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center gap-4 justify-end space-x-4">
              {id && (
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none"
                  onClick={handleClose}
                >
                  close
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg"
              >
                Save Test Case
              </button>
            </div>
          </form>
        )}
      </div>

      {id && <Logs task={task} type={"Testcase"} />}
    </main>
  );
};

export default TestCaseManagement;
