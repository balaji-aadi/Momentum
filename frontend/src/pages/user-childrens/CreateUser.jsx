import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import Select from "react-select";
import InputField from "../../components/InputField";
import { Table } from "../../components/Table/Table";
import { UserApi } from "../../services/api/user.api";
import { AuthApi } from "../../services/api/Auth.api";
import { userValidationSchema } from "../../validationSchema";
import { useLoading } from "../../components/loader/LoaderContext";
import toast from "react-hot-toast";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";

const CreateUser = ({ type }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [id, setId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [userTypeOptions, setUserTypeOptions] = useState([]);
  const { handleLoading } = useLoading();
  const location = useLocation();

  const openModal = () => setIsModalOpen(true);
  
  const closeModal = () => {
    setIsModalOpen(false);
    setIsUpdating(false);
    setId(null);
    setImagePreview(null);
    formik.resetForm();
    // Clear location state to prevent reopening on generic re-renders if needed, 
    // though navigating away or closing modal doesn't clear history state automatically.
    // It's fine for now as useEffect dependency is [] or [location.state].
  };

  const getAllUsers = async () => {
    return await UserApi.users({});
  };

  const getAllTeam = async () => {
    return await UserApi.getAllTesters(); // Assuming this exists based on context or similar call
  };

  const fetchUserRoles = async () => {
    try {
      const res = await AuthApi.roleType();
      if (res.data?.data) {
        const options = res.data.data.map((role) => ({
          value: role._id,
          label: role.name,
        }));
        setUserTypeOptions(options);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      toast.error("Failed to load user roles");
    }
  };

  useEffect(() => {
    fetchUserRoles();
    
    // Check for user data in navigation state (from TeamList edit)
    if (location.state?.user) {
        getSinglUser(location.state.user);
        // Clean up state prevents re-triggering if we were to add location.state to dependecy array, 
        // but with empty array it runs once on mount. 
        // However, react-router history state persists. 
        // We can replace history to clear it, but let's see if it's needed.
        window.history.replaceState({}, document.title);
    }
  }, []);

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      userRole: "", // Keep for compatibility if needed, but mainly use userRoles
      userRoles: [], // New array field
      address: "",
      profileImage: "",
      confirmPassword: "",
    },
    validationSchema: userValidationSchema(isUpdating),

    onSubmit: async (values) => {
      console.log(values);
      const { confirmPassword, ...payload } = values;
      
      // Map userRoles select options to array of IDs
      if (payload.userRoles && Array.isArray(payload.userRoles)) {
          payload.userRoles = payload.userRoles.map(opt => opt.value);
      }
      
      const { password, ...updatedPayload } = payload;
      handleLoading(true);
      try {
        const res = isUpdating
          ? await UserApi.updateUser(id, updatedPayload)
          : await AuthApi.register(payload);
        console.log(res.data);
        toast.success(
          isUpdating ? "User updated successfully" : "User created successfully"
        );
        closeModal();
        // Trigger table refresh somehow? The Table component handles data fetching internally via getTableFunction prop
        // We might need to force update if Table doesn't auto-refresh. The original code didn't show how Table refreshes.
        // Assuming Table refetches if getTableFunction changes or via some other mechanism. 
        // For now, we'll reload the page as a fallback or rely on Table's internal behavior if updated properly.
        window.location.reload(); 
      } catch (err) {
        console.log(err);
        toast.error(err.response?.data?.message || "Operation failed");
      }
      handleLoading(false);
    },
  });

  const getSinglUser = async (user) => {
    handleLoading(true);
    openModal();
    setIsUpdating(true);
    setId(user._id);

    try {
      // If we already have the user object, we can use it directly, 
      // but fetching fresh data is safer.
      const res = await UserApi.singleUser(user._id);
      const userData = res.data?.data;
      console.log("Fetched user:", userData);
      
      // Map existing roles to select options
      let selectedRoles = [];
      if (userData.userRoles && userData.userRoles.length > 0) {
          selectedRoles = userData.userRoles.map(r => ({ value: r._id, label: r.name }));
      } else if (userData.userRole) {
          // If populated object
          if (typeof userData.userRole === 'object') {
             selectedRoles = [{ value: userData.userRole._id, label: userData.userRole.name }];
          } else {
             // If ID string, we might need to find the label from options
             const roleOption = userTypeOptions.find(opt => opt.value === userData.userRole);
             if (roleOption) selectedRoles = [roleOption];
          }
      }

      formik.setValues({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        userRole: userData.userRole?._id || (typeof userData.userRole === 'string' ? userData.userRole : ""),
        userRoles: selectedRoles,
        address: userData.address || "",
        profileImage: "",
        password: "", // Password shouldn't be populated
        confirmPassword: ""
      });
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch user details");
    }
    handleLoading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    formik.setFieldValue("profileImage", file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const columnDefs = [
    { headerName: "First Name", field: "firstName" },
    { headerName: "Last Name", field: "lastName" },
    { headerName: "Email", field: "email" },
    { 
      headerName: "Role", 
      field: "userRole.name",
      valueGetter: (params) => {
        if (params.data.userRoles && params.data.userRoles.length > 0) {
            return params.data.userRoles.map(r => r.name).join(", ");
        }
        return params.data.userRole?.name || "N/A";
      }
    },
    {
      headerName: "Actions",
      field: "actions",
      cellRenderer: (params) => (
        <div className="flex gap-2 mt-[0.5rem] ">
          <button onClick={() => getSinglUser(params.data)} className="text-blue-500">
            <FaEdit />
          </button>
          {/* <button className="text-red-500">
            <MdDelete />
          </button> */}
        </div>
      ),
    },
  ];

   const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/user')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Back to Team Cards"
            >
                <LuArrowLeft className="text-2xl text-gray-600 dark:text-themeText" />
            </button>
            <h1 className="text-3xl font-semibold text-gray-800  dark:text-themeText">
            User Management
            </h1>
        </div>

        <button
          onClick={openModal}
          className=" bg-[#2a3140] text-white py-2 px-4 mr-5 rounded-full "
        >
          Add User
        </button>
      </div>

      <Table
        column={columnDefs}
        getTableFunction={type ? getAllTeam : getAllUsers}
        searchLabel={"User"}
        totalCount={true}
      />

      {isModalOpen && (
        <Modal closeModal={closeModal}>
          {isUpdating ? (
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-themeText">
              Update User
            </h2>
          ) : (
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-themeText">
              Create User
            </h2>
          )}

          <form
            onSubmit={formik.handleSubmit}
            className="space-y-4 h-[80vh] overflow-auto p-4"
          >
            <div className="mb-6 flex justify-center">
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full max-w-xs text-gray-600 border-2 border-gray-300 rounded-xl py-2 px-4 "
              />
            </div>

            {imagePreview && (
              <div className="flex justify-center mb-6">
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="w-32 h-32 rounded-full object-cover border-2"
                />
              </div>
            )}

            <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">User Type</label>
                <Select
                    isMulti
                    name="userRoles"
                    options={userTypeOptions}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    value={formik.values.userRoles}
                    onChange={(selectedOptions) => {
                        formik.setFieldValue("userRoles", selectedOptions);
                        // Also set single userRole for backward compatibility logic if needed
                        if (selectedOptions && selectedOptions.length > 0) {
                            formik.setFieldValue("userRole", selectedOptions[0].value);
                        } else {
                            formik.setFieldValue("userRole", "");
                        }
                    }}
                    onBlur={formik.handleBlur}
                />
                {formik.touched.userRole && formik.errors.userRole && (
                    <div className="text-red-500 text-sm mt-1">{typeof formik.errors.userRole === 'string' ? formik.errors.userRole : "Role is required"}</div>
                )}
            </div>

            {/* First Name */}
            <InputField
              label="First Name"
              name="firstName"
              type="text"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.errors.firstName &&
                formik.touched.firstName &&
                formik.errors.firstName
              }
              isRequired={true}
            />

            {/* Last Name */}
            <InputField
              label="Last Name"
              name="lastName"
              type="text"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.errors.lastName &&
                formik.touched.lastName &&
                formik.errors.lastName
              }
              isRequired={true}
            />

            {/* Email */}
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.errors.email &&
                formik.touched.email &&
                formik.errors.email
              }
              isRequired={true}
            />

            {/* Phone Number */}
            <InputField
              label="Phone Number"
              name="phoneNumber"
              type="text"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.errors.phoneNumber &&
                formik.touched.phoneNumber &&
                formik.errors.phoneNumber
              }
              isRequired={true}
            />

            {/* text area */}

            <InputField
              label="Address"
              name="address"
              type="textarea"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.errors.address &&
                formik.touched.address &&
                formik.errors.address
              }
            />

            {/* Password */}
            {!isUpdating && (
              <>
                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.errors.password &&
                    formik.touched.password &&
                    formik.errors.password
                  }
                  isRequired={true}
                />

                {/* Confirm Password */}
                <InputField
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.errors.confirmPassword &&
                    formik.touched.confirmPassword &&
                    formik.errors.confirmPassword
                  }
                  isRequired={true}
                />
              </>
            )}

            {/* Submit Button */}
            <div className="mt-4 flex justify-center sticky bottom-0 ">
              <button
                type="submit"
                className="px-6 py-3 bg-[#2a3140] text-white rounded-full"
              >
                {isUpdating ? "Update User" : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CreateUser;

const Modal = ({ closeModal, children }) => {
  return (
    <div className="fixed inset-0  flex justify-center items-center z-50 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-themeBG dark:text-themeText p-6 rounded-lg shadow-lg relative w-1/2">
        <button
          onClick={closeModal}
          className="absolute top-7 right-10 text-2xl text-gray-600"
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
};
