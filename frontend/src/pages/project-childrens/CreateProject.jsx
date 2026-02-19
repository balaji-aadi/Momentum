import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import InputField from "../../components/InputField";
import { LuSave, LuX, LuPlus, LuTrash2, LuUsers, LuLayoutDashboard, LuFlag } from "react-icons/lu";
import { useLoading } from "../../components/loader/LoaderContext";
import { ProjectApi } from "../../services/api/Project.api";
import { UserApi } from "../../services/api/user.api";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

const CreateProject = ({
  data,
  isUpdating,
  id,
  setIsUpdating,
  setProjectData,
}) => {
  const [teamMembersList, setTeamMembersList] = useState([]);
  const [rolesAndResponsibilities, setRolesAndResponsibilities] = useState([
    { teamMember: "", role: "", responsibility: "" },
  ]);
  const [milestones, setMilestones] = useState([]);

  const { handleLoading } = useLoading();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch Users for Dropdowns
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await UserApi.users();
        setTeamMembersList(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  const managerOptions = teamMembersList
    .filter(({ userRole }) => userRole?.name === "projectmanager" || userRole?.name === "admin") // Assuming admins can also be PMs
    .map(({ _id, firstName, lastName }) => ({
      value: _id,
      label: `${firstName} ${lastName}`,
    }));

  const teamOptions = teamMembersList.map(({ _id, firstName, lastName }) => ({
    value: _id,
    label: `${firstName} ${lastName}`,
  }));

  const initialValues = {
    name: "",
    key: "",
    priority: "",
    access: "private",
    clientName: "",
    budget: "",
    githubRepository: "",
    status: "active",
    startDate: "",
    endDate: "",
    description: "",
    projectManager: "",
    teamMembers: [],
    rolesAndResponsibilities: [],
    milestones: [],
  };

  const formik = useFormik({
    initialValues,
    onSubmit: async (values) => {
      handleLoading(true);
      try {
        const { milestones, ...projectPayload } = values;
        
        const projectId = id || location.state?.project?._id;
        const isUpdateMode = isUpdating || !!projectId;

        let res;
        if (isUpdateMode) {
          res = await ProjectApi.updateProject(projectId, projectPayload);
        } else {
          res = await ProjectApi.createProject(projectPayload);
        }

        const activeProjectId = isUpdateMode ? projectId : res.data?.data?._id; // Adjust based on actual API response

        // Handle Milestones
        if (milestones && milestones.length > 0 && activeProjectId) {
            await Promise.all(milestones.map(async (m) => {
                // Format payload for milestone
                const milestonePayload = {
                    milestoneName: m.milestoneName,
                    summary: m.summary,
                    deliverables: m.deliverables,
                    commenceDate: m.commenceDate,
                    expectedDate: m.expectedDate
                };

                if (m._id) {
                    // Update existing milestone
                    return ProjectApi.updateMileStones(m._id, milestonePayload);
                } else {
                    // Create new milestone
                    return ProjectApi.createMileStone(activeProjectId, milestonePayload);
                }
            }));
        }

        toast.success(
          isUpdateMode
            ? "Project and milestones updated successfully"
            : "Project and milestones created successfully"
        );
        
        if (setIsUpdating) {
            setIsUpdating(false);
            if (setProjectData) setProjectData();
        } else {
            navigate("/project");
        }
        formik.resetForm();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "An error occurred");
      } finally {
        handleLoading(false);
      }
    },
  });

  // Populate Data for Edit Mode
  useEffect(() => {
    const projectData = data || location.state?.project;
    
    if (projectData) {
      if(setIsUpdating) setIsUpdating(true);

      const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split("T")[0];
      };

      // Safely map roles to ensure teamMember is an ID
      const mappedRoles = (projectData.rolesAndResponsibilities || []).map(r => ({
          ...r,
          teamMember: r.teamMember?._id || r.teamMember || ""
      }));

      formik.setValues({
        name: projectData.name || "",
        key: projectData.key || "",
        priority: projectData.priority || "",
        access: projectData.access || "private",
        clientName: projectData.clientName || "",
        budget: projectData.budget || "",
        githubRepository: projectData.githubRepository || "",
        status: projectData.status || "active",
        startDate: formatDate(projectData.startDate),
        endDate: formatDate(projectData.endDate),
        description: projectData.description || "",
        projectManager: projectData.projectManager?._id || projectData.projectManager || "",
        teamMembers: projectData.teamMembers?.map((m) => m._id || m) || [],
        rolesAndResponsibilities: mappedRoles,
        milestones: projectData.milestones || [] // Keep original objects for _id reference
      });
      setRolesAndResponsibilities(mappedRoles);
      
      // Map Milestones with formatted dates for local state (UI)
      const mappedMilestones = (projectData.milestones || []).map(m => ({
          ...m,
          commenceDate: formatDate(m.commenceDate),
          expectedDate: formatDate(m.expectedDate)
      }));
      setMilestones(mappedMilestones);
    }
  }, [data, location.state]);

  // Roles Logic
  const handleAddRow = () => {
    const newRoles = [...rolesAndResponsibilities, { teamMember: "", role: "", responsibility: "" }];
    setRolesAndResponsibilities(newRoles);
    formik.setFieldValue("rolesAndResponsibilities", newRoles);
  };

  const handleRemoveRow = (index) => {
    const updated = [...rolesAndResponsibilities];
    updated.splice(index, 1);
    setRolesAndResponsibilities(updated);
    formik.setFieldValue("rolesAndResponsibilities", updated);
  };

  const handleRoleChange = (e, index, field) => {
    const updated = [...rolesAndResponsibilities];
    const val = e.target ? e.target.value : e; 
    
    updated[index][field] = val;

    setRolesAndResponsibilities(updated);
    formik.setFieldValue("rolesAndResponsibilities", updated);
  };

  // Milestones Logic
  const handleAddMilestone = () => {
      const newMilestones = [...milestones, { milestoneName: "", commenceDate: "", expectedDate: "", deliverables: "", summary: "" }];
      setMilestones(newMilestones);
      formik.setFieldValue("milestones", newMilestones);
  };

  const handleRemoveMilestone = (index) => {
      const updated = [...milestones];
      updated.splice(index, 1);
      setMilestones(updated);
      formik.setFieldValue("milestones", updated);
  };

  const handleMilestoneChange = (val, index, field) => {
      const updated = [...milestones];
      updated[index][field] = val;
      setMilestones(updated);
      formik.setFieldValue("milestones", updated);
  };

  return (
    <div className="min-h-screen bg-bgLight p-6 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div>
           <div className="flex items-center gap-3 text-textSub text-sm mb-2">
              <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/project')}>Projects</span>
              <span>/</span>
              <span className="text-textMain font-medium">{data || location.state?.project ? "Update Project" : "New Project"}</span>
           </div>
           <h1 className="text-3xl font-bold text-textMain flex items-center gap-3">
              <LuLayoutDashboard className="text-primary" />
              {data || location.state?.project ? "Update Project Details" : "Create New Project"}
           </h1>
           <p className="text-textSub mt-1">Configure project settings, assign teams, and define milestones.</p>
        </div>
        <div className="flex gap-3">
            <button
                type="button"
                onClick={() => navigate('/project')}
                className="px-4 py-2 border border-borderLight text-textSub rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
                <LuX /> Cancel
            </button>
            <button
                type="button"
                onClick={formik.handleSubmit}
                className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primaryHover shadow-lg shadow-primary/30 transition-all flex items-center gap-2 font-medium"
            >
                <LuSave /> {data || location.state?.project ? "Save Changes" : "Create Project"}
            </button>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Project Details */}
        <div className="lg:col-span-2 space-y-6">
            {/* General Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-borderLight p-6">
                <h3 className="text-lg font-bold text-textMain mb-6 border-b border-borderLight pb-4">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                        label="Project Name"
                        name="name"
                        type="text"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="e.g. Website Redesign"
                        error={formik.touched.name && formik.errors.name}
                        isRequired
                    />
                    <InputField
                        label="Project Key"
                        name="key"
                        type="text"
                        value={formik.values.key}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="e.g. WEB-24"
                        error={formik.touched.key && formik.errors.key}
                        isRequired
                    />
                    <div className="md:col-span-2">
                        <InputField
                            label="Description"
                            name="description"
                            type="textarea"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Describe the project goals and scope..."
                            error={formik.touched.description && formik.errors.description}
                            style="h-32"
                        />
                    </div>
                </div>
            </div>

            {/* Timeline & Budget Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-borderLight p-6">
                <h3 className="text-lg font-bold text-textMain mb-6 border-b border-borderLight pb-4">Timeline & Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                        label="Start Date"
                        name="startDate"
                        type="date"
                        value={formik.values.startDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.startDate && formik.errors.startDate}
                        isRequired
                    />
                    <InputField
                        label="End Date"
                        name="endDate"
                        type="date"
                        value={formik.values.endDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.endDate && formik.errors.endDate}
                        isRequired
                    />
                    <InputField
                        label="Budget (Optional)"
                        name="budget"
                        type="number"
                        value={formik.values.budget}
                        onChange={formik.handleChange}
                        placeholder="0.00"
                        error={formik.touched.budget && formik.errors.budget}
                    />
                    <InputField
                        label="Client Name"
                        name="clientName"
                        type="text"
                        value={formik.values.clientName}
                        onChange={formik.handleChange}
                        placeholder="Client Company"
                        error={formik.touched.clientName && formik.errors.clientName}
                    />
                </div>
            </div>

            {/* Milestones Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-borderLight p-6">
                <div className="flex justify-between items-center mb-6 border-b border-borderLight pb-4">
                    <h3 className="text-lg font-bold text-textMain flex items-center gap-2">
                        <LuFlag className="text-primary" /> Milestones
                    </h3>
                    <button type="button" onClick={handleAddMilestone} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                        <LuPlus /> Add Milestone
                    </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {milestones.map((milestone, index) => (
                        <div key={index} className="p-4 rounded-xl border border-borderLight bg-slate-50 relative group">
                             <button 
                                type="button" 
                                onClick={() => handleRemoveMilestone(index)} 
                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <LuTrash2 size={16} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField
                                    label="Milestone Name"
                                    name={`milestones[${index}].milestoneName`}
                                    type="text"
                                    value={milestone.milestoneName}
                                    onChange={(e) => handleMilestoneChange(e.target.value, index, "milestoneName")}
                                    placeholder="e.g. Alpha Release"
                                    style="mb-2"
                                />
                                <InputField
                                    label="Deliverables"
                                    name={`milestones[${index}].deliverables`}
                                    type="text"
                                    value={milestone.deliverables}
                                    onChange={(e) => handleMilestoneChange(e.target.value, index, "deliverables")}
                                    placeholder="Comma separated..."
                                    style="mb-2"
                                />
                                <InputField
                                    label="Start Date"
                                    name={`milestones[${index}].commenceDate`}
                                    type="date"
                                    value={milestone.commenceDate}
                                    onChange={(e) => handleMilestoneChange(e.target.value, index, "commenceDate")}
                                    style="mb-2"
                                />
                                <InputField
                                    label="Due Date"
                                    name={`milestones[${index}].expectedDate`}
                                    type="date"
                                    value={milestone.expectedDate}
                                    onChange={(e) => handleMilestoneChange(e.target.value, index, "expectedDate")}
                                    style="mb-2"
                                />
                            </div>
                        </div>
                    ))}
                    {milestones.length === 0 && (
                        <div className="text-center py-6 text-textSub italic border border-dashed border-borderLight rounded-xl">
                            No milestones defined. Add key project milestones here.
                        </div>
                    )}
                </div>
            </div>
            
             {/* Roles & Responsibilities Card */}
             <div className="bg-white rounded-2xl shadow-sm border border-borderLight p-6">
                <div className="flex justify-between items-center mb-6 border-b border-borderLight pb-4">
                    <h3 className="text-lg font-bold text-textMain">Roles & Responsibilities</h3>
                    <button type="button" onClick={handleAddRow} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                        <LuPlus /> Add Role
                    </button>
                </div>
                
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-textSub uppercase font-semibold text-xs sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg bg-slate-50">Team Member</th>
                                <th className="px-4 py-3 bg-slate-50">Role</th>
                                <th className="px-4 py-3 bg-slate-50">Responsibility</th>
                                <th className="px-4 py-3 rounded-r-lg w-10 bg-slate-50"></th>
                            </tr>
                        </thead>
                        <tbody className="space-y-2">
                            {rolesAndResponsibilities.map((row, index) => (
                                <tr key={index} className="border-b border-borderLight/50 last:border-0">
                                    <td className="p-2 min-w-[200px]">
                                        <InputField
                                            name={`rolesAndResponsibilities[${index}].teamMember`}
                                            type="select"
                                            options={teamOptions}
                                            value={row.teamMember}
                                            onChange={(e) => handleRoleChange(e, index, "teamMember")} 
                                            placeholder="Select Member"
                                            style="mb-0"
                                        />
                                    </td>
                                    <td className="p-2 min-w-[150px]">
                                        <input
                                            type="text"
                                            value={row.role}
                                            onChange={(e) => handleRoleChange(e.target.value, index, "role")}
                                            placeholder="e.g. Lead Dev"
                                            className="w-full p-2 border border-borderLight rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </td>
                                    <td className="p-2 min-w-[200px]">
                                        <input
                                            type="text"
                                            value={row.responsibility}
                                            onChange={(e) => handleRoleChange(e.target.value, index, "responsibility")}
                                            placeholder="Key task..."
                                            className="w-full p-2 border border-borderLight rounded-lg text-sm bg-transparent focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button type="button" onClick={() => handleRemoveRow(index)} className="text-red-400 hover:text-red-600 p-2">
                                            <LuTrash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rolesAndResponsibilities.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-6 text-textSub italic">
                                        No specific roles assigned yet. Click "Add Role" to define responsibilities.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>


        {/* Right Column: Settings & Team */}
        <div className="space-y-6">
            {/* Settings Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-borderLight p-6">
                <h3 className="text-lg font-bold text-textMain mb-6 border-b border-borderLight pb-4">Settings</h3>
                <div className="space-y-4">
                    <InputField
                        label="Status"
                        name="status"
                        type="select"
                        value={formik.values.status}
                        onChange={formik.handleChange}
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'hold', label: 'On Hold' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'closed', label: 'Closed' }
                        ]}
                        isRequired
                    />
                    <InputField
                        label="Priority"
                        name="priority"
                        type="select"
                        value={formik.values.priority}
                        onChange={formik.handleChange}
                        options={[
                            { value: 'high', label: 'High' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'low', label: 'Low' }
                        ]}
                        isRequired
                    />
                    <InputField
                        label="Access Level"
                        name="access"
                        type="select"
                        value={formik.values.access}
                        onChange={formik.handleChange}
                        options={[
                            { value: 'private', label: 'Private (Team Only)' },
                            { value: 'public', label: 'Public (Organization)' }
                        ]}
                        isRequired
                    />
                    <InputField
                        label="Repository URL"
                        name="githubRepository"
                        type="text"
                        value={formik.values.githubRepository}
                        onChange={formik.handleChange}
                        placeholder="GitHub / GitLab URL"
                    />
                </div>
            </div>

            {/* Team Assignment Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-borderLight p-6">
                <h3 className="text-lg font-bold text-textMain mb-6 border-b border-borderLight pb-4 flex items-center gap-2">
                    <LuUsers className="text-primary" /> Team Formation
                </h3>
                <div className="space-y-4">
                    <InputField
                        label="Project Manager"
                        name="projectManager"
                        type="select"
                        value={formik.values.projectManager}
                        onChange={formik.handleChange}
                        options={managerOptions}
                        placeholder="Select Manager"
                        isRequired
                    />
                    <InputField
                        label="Team Members"
                        name="teamMembers"
                        type="select"
                        isMulti
                        value={formik.values.teamMembers}
                        onChange={(selectedOptions) => {
                            // React-Select returns array of objects for multi, or null
                            // InputField wrapper might be sending {target: {name, value: []}}
                            // Let's rely on InputField's standard behavior which likely maps to value array
                            // But wait, InputField handleSelectChange maps to [value1, value2]
                            // So here we get {target: {name, value: [...]}}
                            formik.handleChange(selectedOptions); 
                        }}
                        options={teamOptions}
                        placeholder="Assign Members"
                        isRequired
                    />
                </div>
                <div className="mt-4 bg-blue-50 text-blue-800 text-xs p-3 rounded-lg">
                    <p><strong>Note:</strong> Selected members will strictly have access to this project if "Private" is selected.</p>
                </div>
            </div>
        </div>

      </form>
    </div>
  );
};

export default CreateProject;
