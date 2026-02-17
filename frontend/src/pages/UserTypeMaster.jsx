import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import axios from "axios";
import { serverUrl as API_URL } from "../services/config";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";

const UserTypeMaster = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/role/get-all-role`);
        // Filter out if needed or just show all
      setRoles(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch roles");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: "",
      active: true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Role Name is required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editingRole) {
          await axios.put(`${API_URL}/api/v1/role/update-role/${editingRole._id}`, values);
          toast.success("Role updated successfully");
        } else {
          await axios.post(`${API_URL}/api/v1/role/create-role`, values);
          toast.success("Role created successfully");
        }
        fetchRoles();
        handleCloseModal();
      } catch (error) {
        toast.error(error.response?.data?.message || "Operation failed");
      }
    },
  });

  const handleEdit = (role) => {
    setEditingRole(role);
    formik.setValues({
      name: role.name,
      active: role.active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    formik.resetForm();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Type Master</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Add New Role
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Role Name</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-gray-500">
                  No roles found
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 capitalize">{role.name}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        role.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {role.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleEdit(role)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <FiEdit size={18} />
                    </button>
                    {/* Add delete if needed, but not requested */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingRole ? "Edit Role" : "Create New Role"}
            </h2>
            <form onSubmit={formik.handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Role Name</label>
                <input
                  type="text"
                  name="name"
                  onChange={formik.handleChange}
                  value={formik.values.name}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Developer"
                />
                {formik.touched.name && formik.errors.name && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.name}</div>
                )}
              </div>

              <div className="mb-6 flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  onChange={formik.handleChange}
                  checked={formik.values.active}
                  className="w-4 h-4"
                />
                <label htmlFor="active" className="text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRole ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTypeMaster;
