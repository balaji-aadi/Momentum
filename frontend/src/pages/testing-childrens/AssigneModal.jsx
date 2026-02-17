import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useLoading } from "../../components/loader/LoaderContext";
import { UserApi } from "../../services/api/user.api";
import InputField from "../../components/InputField";

const AssigneModal = ({ isOpen, onClose, taskDetails }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const { handleLoading } = useLoading();

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

  const formik = useFormik({
    initialValues: {
      reason: "",
      attachment: "",
      assignee: "",
    },
    validationSchema: Yup.object({
      reason: Yup.string().required("Reason for failure is required"),
      assignee: Yup.string().required("Assign a developer is required"),
    }),
    onSubmit: (values) => {
      console.log(values);
      // Submit logic (e.g., API call)
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const teamMemberOptions = teamMembers.map((item) => {
    return {
      value: item?._id,
      label: `${item?.firstName} ${" "} ${item?.lastName} `,
    };
  });

  useEffect(() => {
    handleTeamMemberOption();
  }, []);

  return (
    <div className="fixed inset-0 bg-black  bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-themeBG dark:text-themeText p-6 rounded-lg shadow-lg w-1/2 ">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">Task Failure Details</h2>
        <form onSubmit={formik.handleSubmit}>
          <InputField
            label="Reason for Failure"
            name="reason"
            type="textarea"
            value={formik.values.reason}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.errors.reason && formik.touched.reason
                ? formik.errors.reason
                : ""
            }
            isRequired
          />
          <InputField
            label="Attachment"
            name="attachment"
            type="file"
            value={formik.values.attachment}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.errors.attachment && formik.touched.attachment
                ? formik.errors.attachment
                : ""
            }
          />
          <div className="mb-4">
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
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssigneModal;
