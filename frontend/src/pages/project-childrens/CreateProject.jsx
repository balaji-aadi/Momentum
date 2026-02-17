import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import InputField from "../../components/InputField";
import { LuArrowRight, LuArrowLeft } from "react-icons/lu";
import TeamAssignment from "./TeamAssignment";
import { useLoading } from "../../components/loader/LoaderContext";
import { ProjectApi } from "../../services/api/Project.api";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

const CreateProject = ({
  data,
  isUpdating,
  id,
  setIsUpdating,
  setProjectData,
}) => {
  const [isSubmit, setIsSubmit] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [isTeamAssign, setIsTeamAssign] = useState(false);
  const [rolesAndResponsibilities, setRolesAndResponsibilities] = useState([
    { teamMember: "", role: "", responsibility: "" },
  ]);

  const { handleLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();

  const initialValues = {
    name: "",
    access: "",
    key: "",
    description: "",
    startDate: "",
    endDate: "",
    priority: "",
    clientName: "",
    budget: "",
    status: "",
    projectManager: "",
    teamMembers: [],
    rolesAndResponsibilities: [],
    milestones: [],
  };

  const formik = useFormik({
    initialValues,
    onSubmit: async (values) => {
      const { milestoneName, deliverables, commenceDate, expectedDate, summary, ...payload } = values;
      handleLoading(true);
      try {
        // Prepare ID: either from prop 'id', or from location state if available
        const projectId = id || location.state?.project?._id;
        // Determine mode: isUpdating prop OR presence of projectId implies update
        const isUpdateMode = isUpdating || !!projectId;

        const res = isUpdateMode
          ? await ProjectApi.updateProject(projectId, payload)
          : await ProjectApi.createProject(payload);
        console.log(res.data);
        toast.success(
          isUpdateMode
            ? "Project updated successfully"
            : "Project created successfully"
        );
        navigate("/project/status");
        setMilestones([...milestones, values]);
        setIsTeamAssign(false);
        if(setIsUpdating) setIsUpdating(false);
        if(setProjectData) setProjectData();
        formik.resetForm();
      } catch (err) {
        console.log(err);
        toast.error("An error occurred");
      }
      handleLoading(false);
    },
  });

  useEffect(() => {
    const projectData = data || location.state?.project;
    
    if (projectData) {
      if(setIsUpdating) setIsUpdating(true); // If prop function exists

      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      formik.setValues({
        name: projectData.name || "",
        projectId: projectData._id || "",
        access: projectData.access || "",
        key: projectData.key || "",
        description: projectData.description || "",
        startDate: formatDate(projectData.startDate),
        endDate: formatDate(projectData.endDate),
        priority: projectData.priority || "",
        clientName: projectData.clientName || "",
        budget: projectData.budget || "",
        status: projectData.status || "",
        projectManager: projectData.projectManager?._id,
        teamMembers: projectData.teamMembers?.map((member) => member._id) || [],
        rolesAndResponsibilities: setRolesAndResponsibilities(
          projectData.rolesAndResponsibilities || []
        ),
        milestones: projectData.milestones?.map((milestone) => ({
          _id: milestone?._id,
          milestoneName: milestone.milestoneName,
          summary: milestone.summary,
          commenceDate: milestone.commenceDate,
          expectedDate: milestone.expectedDate,
          deliverables: milestone.deliverables,
        })) || [],
      });
    }
  }, [data, location.state]);

  useEffect(() => {
    const requiredFields = [
      "name",
      "access",
      "key",
      "priority",
      "startDate",
      "endDate",
    ];

    const isAllFilled = requiredFields.every((field) => !!formik.values[field]);

    setIsSubmit(isAllFilled);
  }, [formik.values]);

  const handleNext = (e) => {
    e.preventDefault();
    setIsTeamAssign(true);
  };

  const accessOptions = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ];

  const priorityOptions = [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "In active" },
    { value: "hold", label: "Hold" },
    { value: "closed", label: "Closed" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <>
      {!isTeamAssign ? (
        <div className=" flex justify-center items-start p-2  relative pt-5 dark:bg-themeBG dark:text-themeText">
          <div className="w-full p-8 ">
            <div className="sticky top-0 flex items-center gap-4 mb-6">
              <button 
                onClick={() => navigate('/project')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Back to Projects"
              >
                <LuArrowLeft className="text-2xl text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-themeText mb-1 uppercase">
                    {data ? "Update" : "Add"} project details
                </h1>
                <p className="text-gray-600 dark:text-themeText text-sm">
                    Explore what's possible when you collaborate with your team.
                </p>
              </div>
            </div>

            <form onSubmit={formik.handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-4">
                <InputField
                  label="Name"
                  name="name"
                  type="text"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter project name..."
                  error={formik.touched.name && formik.errors.name}
                  isRequired={true}
                />

                <InputField
                  label="Key"
                  name="key"
                  type="text"
                  value={formik.values.key}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter a unique key..."
                  error={formik.touched.key && formik.errors.key}
                  isRequired={true}
                />

                <InputField
                  label="Project Priority"
                  name="priority"
                  type="select"
                  value={formik.values.priority}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Choose a priority level"
                  error={formik.touched.priority && formik.errors.priority}
                  options={priorityOptions}
                  isRequired={true}
                />

                <InputField
                  label="Access"
                  name="access"
                  type="select"
                  value={formik.values.access}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Choose access level..."
                  error={formik.touched.access && formik.errors.access}
                  options={accessOptions}
                  isRequired={true}
                />

                <InputField
                  label="Client Name"
                  name="clientName"
                  type="text"
                  value={formik.values.clientName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter client name..."
                  error={formik.touched.clientName && formik.errors.clientName}
                  isRequired={false}
                />

                <InputField
                  label="Budget"
                  name="budget"
                  type="number"
                  value={formik.values.budget}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter budget amount..."
                  error={formik.touched.budget && formik.errors.budget}
                  isRequired={false}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pr-4 mt-4">
                <InputField
                  label="Status"
                  name="status"
                  type="select"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Choose a Status"
                  error={formik.touched.status && formik.errors.status}
                  options={statusOptions}
                  isRequired={true}
                />
                <InputField
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formik.values.startDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  min={new Date().toISOString().split("T")[0]}
                  error={formik.touched.startDate && formik.errors.startDate}
                  isRequired={true}
                />

                <InputField
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formik.values.endDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  min={formik.values.startDate}
                  error={formik.touched.endDate && formik.errors.endDate}
                  isRequired={true}
                />
              </div>

              <div className="w-full mt-4">
                <InputField
                  label="Description"
                  name="description"
                  type="textarea"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Provide a brief description of the project..."
                  error={
                    formik.touched.description && formik.errors.description
                  }
                  isRequired={false}
                />
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                {data && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                    onClick={() => {
                      setIsUpdating(false);
                      setProjectData();
                    }}
                  >
                    Close
                  </button>
                )}
                <button
                  disabled={!isSubmit ? true : false}
                  type="button"
                  className={`px-4 py-2 flex ${isSubmit
                    ? "bg-blue-500 hover:bg-blue-600  cursor-pointer"
                    : "bg-blue-200 cursor-not-allowed"
                    } items-center gap-1  text-white rounded-lg transition`}
                  onClick={handleNext}
                >
                  Next
                  <i>
                    <LuArrowRight />
                  </i>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <TeamAssignment
          formik={formik}
          setIsTeamAssign={setIsTeamAssign}
          rolesAndResponsibilities={rolesAndResponsibilities}
          setRolesAndResponsibilities={setRolesAndResponsibilities}
        />
      )}
    </>
  );
};

export default CreateProject;
