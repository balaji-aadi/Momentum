import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../components/InputField";
import { useLoading } from "../../components/loader/LoaderContext";
import { ProjectApi } from "../../services/api/Project.api";
import { UserApi } from "../../services/api/user.api";
import { TestApi } from "../../services/api/Test.api";
import toast from "react-hot-toast";
import Breadcrumbs from "../../components/Breadcrumbs";
import Logs from "../task-childrens/Logs";
// import { FileUploadApi } from "../../services/api/FileUpload.api";

const BugReporting = ({
  task,
  id,
  setId,
  setTask,
  setProjectTasks,
  selectedMember,
}) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [attachmentUrl, setAttachmentUrl] = useState(null);
  const { handleLoading } = useLoading();
  const [teamMembers, setTeamMembers] = useState([]);

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
          label: "Bug Reporting",
          path: "/testing/my-task",
        }
      : {
          label: "Bug Reporting",
          path: "/testing/bug-reporting",
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

  const projectOptions = projects.map((item) => {
    return { value: item._id, label: item.name };
  });

  useEffect(() => {
    handleProjectOption();
    handleTeamMemberOption();
  }, []);

  const teamMemberOptions = teamMembers.map((item) => {
    return {
      value: item?._id,
      label: `${item?.firstName} ${" "} ${item?.lastName} `,
    };
  });

  const fetchTasks = async () => {
    if (selectedProject) {
      const filter = {
        projectId: selectedProject,
        ...(selectedMember && { assignee: selectedMember }),
      };
      try {
        const res = await TestApi.getAllBugs(filter);
        console.log(res.data);
        setProjectTasks(res.data?.data);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      projectId: "",
      bugTitle: "",
      bugDescription: "",
      severity: "",
      reproducibility: "",
      stepsToReproduce: "",
      assignee: "",
      bugStatus: "Open",
      attachmentUrl: "",
    },
    validationSchema: Yup.object({
      bugTitle: Yup.string().required("Bug title is required"),
      bugDescription: Yup.string().required("Bug description is required"),
      severity: Yup.string().required("Severity is required"),
      reproducibility: Yup.string().required("Reproducibility is required"),
      assignee: Yup.string().required("Assign to developer is required"),
    }),
    onSubmit: async (values) => {
      const payload = {
        projectId: values.projectId,
        bugTitle: values.bugTitle,
        bugDescription: values.bugDescription,
        severity: values.severity,
        reproducibility: values.reproducibility,
        stepsToReproduce: values.stepsToReproduce,
        assignee: values.assignee,
        bugStatus: values.bugStatus,
        // attachmentUrl,
      };

      handleLoading(true);

      try {
        const res = id
          ? await TestApi.updateBug(id, payload)
          : await TestApi.createBug(payload);
        console.log(res.data);
        toast.success(
          id
            ? "Bug report updated successfully"
            : "Bug report created successfully"
        );
        formik.resetForm();
        setSelectedProject("");
        if (id) {
          fetchTasks();
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

      formik.setValues({
        projectId: task.projectId?._id || "",
        bugTitle: task.bugTitle || "",
        bugDescription: task.bugDescription || "",
        severity: task.severity || "",
        reproducibility: task.reproducibility || "",
        stepsToReproduce: task.stepsToReproduce || [],
        assignee: task.assignee?._id || "",
        bugStatus: task.bugStatus || "",
        // attachImage: task.image || null,
      });
    }
  }, [task]);

  const handleProjectChange = (selectedOption) => {
    const project = selectedOption?.value;
    formik.setFieldValue("projectId", project);
    setSelectedProject(project);
  };

  const handleAttachmentChange = async (e) => {
    const file = e.target.files[0];
    setAttachment(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    try {
      handleLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      // const res = await FileUploadApi.uploadAttachment(formData);

      // if (res.data?.url) {
      //   setAttachmentUrl(res.data?.url);
      //   console.log("File uploaded successfully:", res.data?.url);
      // }
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      handleLoading(false);
    }
  };

  return (
    <main className="flex">
      <div className="p-8 mb-20 w-full">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <h1 className="text-3xl dark:text-themeText font-bold mb-6">
          Bug Reporting
        </h1>

        {/* Project Selection */}
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

        {/* Only show the bug report form if a project is selected */}
        {selectedProject && (
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                label="Bug Title"
                name="bugTitle"
                type="text"
                value={formik.values.bugTitle}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bugTitle && formik.errors.bugTitle}
                isRequired={true}
              />

              <InputField
                label="Severity"
                name="severity"
                type="select"
                value={formik.values.severity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                options={[
                  { value: "Critical", label: "Critical" },
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" },
                ]}
                error={formik.touched.severity && formik.errors.severity}
                isRequired={true}
              />

              <InputField
                label="Reproducibility"
                name="reproducibility"
                type="select"
                value={formik.values.reproducibility}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                options={[
                  { value: "Always", label: "Always" },
                  { value: "Sometimes", label: "Sometimes" },
                  { value: "Rarely", label: "Rarely" },
                  {
                    value: "Unable to Reproduce",
                    label: "Unable to Reproduce",
                  },
                ]}
                error={
                  formik.touched.reproducibility &&
                  formik.errors.reproducibility
                }
                isRequired={true}
              />

              <InputField
                label="Bug Description"
                name="bugDescription"
                type="textarea"
                value={formik.values.bugDescription}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.bugDescription && formik.errors.bugDescription
                }
                isRequired={true}
              />
            </div>

            <InputField
              label="Steps to Reproduce"
              name="stepsToReproduce"
              type="textarea"
              value={formik.values.stepsToReproduce}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                label="Assign to Developer"
                name="assignee"
                type="select"
                value={formik.values.assignee}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                options={teamMemberOptions}
                error={formik.touched.assignee && formik.errors.assignee}
                isRequired={true}
              />

              <InputField
                label="Bug Status"
                name="bugStatus"
                type="select"
                value={formik.values.bugStatus}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                options={[
                  { value: "Open", label: "Open" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "Resolved", label: "Resolved" },
                  { value: "Closed", label: "Closed" },
                ]}
              />
            </div>

            {/* Attachment Field */}
            <div className="mb-6">
              <label
                htmlFor="attachment"
                className="block text-sm font-semibold dark:text-themeText "
              >
                Attachment
              </label>
              <input
                id="attachment"
                name="attachment"
                type="file"
                onChange={handleAttachmentChange}
                accept="image/*, .pdf, .docx"
                className="mt-2 block w-full border p-2 rounded"
              />
              {attachmentPreview && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium dark:text-themeText">
                    Preview:
                  </h3>
                  <img
                    src={attachmentPreview}
                    alt="attachment preview"
                    className="mt-2 max-w-full h-auto rounded-md"
                  />
                </div>
              )}
            </div>

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
                className="px-6 py-2 bg-red-600 text-white rounded-lg"
              >
                Submit Bug Report
              </button>
            </div>
          </form>
        )}
      </div>

      {id && <Logs task={task} type={"Bug"} />}
    </main>
  );
};

export default BugReporting;
