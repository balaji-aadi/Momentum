import React, { useEffect, useState } from "react";
import InputField from "../../components/InputField";
import { LuArrowRight } from "react-icons/lu";
import MilestonePage from "./Milestones";
import { MdDelete } from "react-icons/md";
import { UserApi } from "../../services/api/user.api";

const projectManagers = [
  { value: "1", label: "Rajesh Rao " },
  { value: "2", label: "Balaji Aadesh" },
  { value: "3", label: "Yashwant kumar Sahu" },
  { value: "4", label: "Aman Shrivas" },
];

// const teamMembers = [
//   { value: "1", label: "Nilesh " },
//   { value: "2", label: "Alok" },
//   { value: "3", label: "Pradeep" },
//   { value: "4", label: "Abhjit" },
//   { value: "5", label: "Seema" },
//   { value: "6", label: "Himanshu" },
//   { value: "7", label: "Balaji Aadesh" },
//   { value: "8", label: "Yashwant kumar Sahu" },
//   { value: "9", label: "Aman Shrivas" },
// ];

const TeamAssignment = ({
  formik,
  setIsTeamAssign,
  rolesAndResponsibilities,
  setRolesAndResponsibilities,
}) => {
  const [isSubmit, setIsSubmit] = useState(false);
  const [isMileStone, setIsMileStone] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  const getTeamMembers = async () => {
    try {
      const res = await UserApi.users();
      setTeamMembers(res.data?.data);
      console.log(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const managerOptions = teamMembers
    .filter(({ userRole }) => userRole?.name === "projectmanager")
    .map(({ _id, firstName, lastName }) => ({
      value: _id,
      label: `${firstName} ${lastName}`,
    }));

  const teamOptions = teamMembers.map(({ _id, firstName, lastName }) => ({
      value: _id,
      label: `${firstName} ${lastName}`,
    }));

  useEffect(() => {
    getTeamMembers();
  }, []);

  useEffect(() => {
    const isAllRolesFilled = rolesAndResponsibilities.every(
      (item) =>
        item.teamMember && item.teamMember && item.role.trim() && item.responsibility.trim()
    );

    const isAllFilled =
      !!formik.values.projectManager &&
      Array.isArray(formik.values.teamMembers) &&
      formik.values.teamMembers.length > 0 &&
      isAllRolesFilled;

    setIsSubmit(isAllFilled);
  }, [formik.values, rolesAndResponsibilities]);

  const handleNext = () => {
    setIsMileStone(true);
  };

  const handleAddRow = () => {
    const newRoles = [
      ...rolesAndResponsibilities,
      { teamMember: "", role: "", responsibility: "" },
    ];
    setRolesAndResponsibilities(newRoles);
    formik.setFieldValue("rolesAndResponsibilities", newRoles);
  };

  const handleRemoveRow = (index) => {
    const updatedRoles = [...rolesAndResponsibilities];
    updatedRoles.splice(index, 1);
    setRolesAndResponsibilities(updatedRoles);
    formik.setFieldValue("rolesAndResponsibilities", updatedRoles);
  };

  const handleRoleChange = (selectedOption, index, field) => {
    const updatedRoles = [...rolesAndResponsibilities];
    if (field === "teamMember") {
      updatedRoles[index].teamMember = selectedOption
        ? selectedOption?.target?.value
        : "";
    } else {
      updatedRoles[index][field] = selectedOption.target.value;
    }
    setRolesAndResponsibilities(updatedRoles);
    formik.setFieldValue("rolesAndResponsibilities", updatedRoles);
  };

  const handleCancel = () => {
    setRolesAndResponsibilities([
      { teamMember: "", role: "", responsibility: "" },
    ]);
  };

  return (
    <>
      {!isMileStone ? (
        <div className="p-8 relative">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-themeText mb-4">
            Team Assignment
          </h1>
          <p className="text-gray-600 dark:text-themeText mb-6">
            Assign team members to roles and responsibilities for the project.
          </p>

          <form onSubmit={formik.handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Project Manager"
                name="projectManager"
                type="select"
                options={managerOptions}
                value={formik.values.projectManager}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Select Project Manager"
                error={
                  formik.touched.projectManager && formik.errors.projectManager
                }
                isRequired={true}
              />

              <InputField
                label="Assigned Team Members"
                name="teamMembers"
                type="select"
                isMulti
                options={teamOptions}
                value={formik.values.teamMembers}
                onChange={(selectedOptions) => {
                    const newMembers = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                    formik.setFieldValue("teamMembers", newMembers);

                    // Sync Roles Table
                    // 1. Filter out rows for members that were removed
                    const filteredRoles = rolesAndResponsibilities.filter(row => 
                        !row.teamMember || newMembers.includes(row.teamMember)
                    );

                    // 2. Add new rows for members that were added (and don't have a row yet)
                    const existingMemberIds = filteredRoles.map(r => r.teamMember);
                    const membersToAdd = newMembers.filter(mId => !existingMemberIds.includes(mId));
                    
                    const newRoles = membersToAdd.map(mId => ({
                        teamMember: mId,
                        role: "",
                        responsibility: ""
                    }));

                    const finalRoles = [...filteredRoles, ...newRoles];
                    setRolesAndResponsibilities(finalRoles);
                    formik.setFieldValue("rolesAndResponsibilities", finalRoles);
                }}
                onBlur={formik.handleBlur}
                placeholder="Select Team Members"
                error={formik.touched.teamMembers && formik.errors.teamMembers}
                isRequired={true}
              />
            </div>

            <div className="my-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4 dark:text-themeText">
                Roles and Responsibilities
              </h3>
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 dark:bg-themeBG dark:text-themeText">
                  <tr className="text-left">
                    <th className="border py-2 px-3">Team Member</th>
                    <th className="border py-2 px-3">Role</th>
                    <th className="border py-2 px-3">Responsibility</th>
                    <th className="border py-2 px-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rolesAndResponsibilities.map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-1 px-3">
                        <InputField
                          name={`rolesAndResponsibilities[${index}].teamMember`}
                          type="select"
                          options={teamOptions}
                          value={rolesAndResponsibilities[index].teamMember}
                          onChange={(selectedOption) =>
                            handleRoleChange(
                              selectedOption,
                              index,
                              "teamMember"
                            )
                          }
                          placeholder="Select"
                          error={
                            formik.touched.rolesAndResponsibilities?.[index]
                              ?.teamMember &&
                            formik.errors.rolesAndResponsibilities?.[index]
                              ?.teamMember
                          }
                          className="w-full "
                        />
                      </td>
                      <td className="py-1 px-3">
                        <InputField
                          name={`rolesAndResponsibilities[${index}].role`}
                          type="text"
                          value={rolesAndResponsibilities[index].role}
                          onChange={(e) => handleRoleChange(e, index, "role")}
                          placeholder="Enter Role"
                          error={
                            formik.touched.rolesAndResponsibilities?.[index]
                              ?.role &&
                            formik.errors.rolesAndResponsibilities?.[index]
                              ?.role
                          }
                          className="w-full outline-none p-2 dark:bg-themeBG dark:text-themeText"
                        />
                      </td>
                      <td className="py-1 px-3">
                        <InputField
                          name={`rolesAndResponsibilities[${index}].responsibility`}
                          type="textarea"
                          value={rolesAndResponsibilities[index].responsibility}
                          onChange={(e) =>
                            handleRoleChange(e, index, "responsibility")
                          }
                          placeholder="Enter Responsibility"
                          error={
                            formik.touched.rolesAndResponsibilities?.[index]
                              ?.responsibility &&
                            formik.errors.rolesAndResponsibilities?.[index]
                              ?.responsibility
                          }
                          className="w-full outline-none p-1 pl-3 dark:bg-themeBG dark:text-themeText"
                        />
                      </td>
                      <td className="py-1 px-3 text-center">
                        {rolesAndResponsibilities.length > 1 && (
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleRemoveRow(index)}
                          >
                            <MdDelete size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                onClick={handleAddRow}
              >
                Add Row
              </button>
            </div>

            <div className="flex justify-end space-x-4 mt-10 pb-12">
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                onClick={() => setIsTeamAssign(false)}
              >
                Back
              </button>
              {/* <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                onClick={() => {
                  formik.handleReset();
                  handleCancel();
                }}
              >
                Cancel
              </button> */}

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
      ) : (
        <MilestonePage
          formik={formik}
          setIsMileStone={setIsMileStone}
          setRolesAndResponsibilities={setRolesAndResponsibilities}
        />
      )}
    </>
  );
};

export default TeamAssignment;
